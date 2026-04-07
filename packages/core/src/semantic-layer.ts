import type {
  ExtractOptions,
  ExtractResult,
  SemanticLayerOptions,
  ContentMode,
  OutputFormat,
  SiteDiscoveryResult,
  DiscoveredPage,
} from "./types.js";
import { BrowserPool } from "./renderer/browser-pool.js";
import { waitForHydration } from "./renderer/hydration-detector.js";
import { ContentExtractor } from "./extractor/content-extractor.js";
import { detectFramework } from "./extractor/framework-detector.js";
import { MarkdownFormatter } from "./formatter/markdown-formatter.js";
import { SLMLFormatter } from "./formatter/slml-formatter.js";
import { JsonFormatter } from "./formatter/json-formatter.js";
import { ProtocolChecker } from "./protocol/protocol-checker.js";
import {
  estimateTokens,
  estimateHtmlTokens,
  calculateSavings,
} from "./utils/token-estimator.js";
import { Logger } from "./utils/logger.js";
import { LogLevel } from "./types.js";

export class SemanticLayer {
  private readonly pool: BrowserPool;
  private readonly extractor: ContentExtractor;
  private readonly protocolChecker: ProtocolChecker;
  private readonly mdFormatter: MarkdownFormatter;
  private readonly slmlFormatter: SLMLFormatter;
  private readonly jsonFormatter: JsonFormatter;
  private readonly logger: Logger;

  constructor(options?: SemanticLayerOptions) {
    const logLevel = options?.logLevel ?? LogLevel.WARN;
    this.pool = new BrowserPool(options?.browser, logLevel);
    this.extractor = new ContentExtractor();
    this.protocolChecker = new ProtocolChecker();
    this.mdFormatter = new MarkdownFormatter();
    this.slmlFormatter = new SLMLFormatter();
    this.jsonFormatter = new JsonFormatter();
    this.logger = new Logger(logLevel);
  }

  async extract(options: ExtractOptions): Promise<ExtractResult> {
    const mode: ContentMode = options.mode ?? "content";
    const format: OutputFormat = options.format ?? "markdown";
    const timeout = options.timeout ?? 30_000;
    const start = Date.now();

    this.logger.info(`Extracting ${options.url} [mode=${mode}, format=${format}]`);

    const protocolResult = await this.protocolChecker.check(options.url);

    if (protocolResult.supported && protocolResult.discovery) {
      this.logger.info("Protocol supported — using fast path");
      return this.extractViaProtocol(options, mode, format, start);
    }

    const { page, context } = await this.pool.acquire();

    try {
      const renderStart = Date.now();

      await page.goto(options.url, {
        waitUntil: options.waitFor === "networkidle" ? "networkidle" : "load",
        timeout,
      });

      await waitForHydration(page);

      const html = await page.content();
      const resolvedUrl = page.url();
      const renderMs = Date.now() - renderStart;

      const extractStart = Date.now();
      const framework = detectFramework(html);
      const extracted = this.extractor.extract(html, resolvedUrl, mode);
      const extractMs = Date.now() - extractStart;

      const formatStart = Date.now();
      const content = this.formatContent(extracted, mode, format, resolvedUrl, html.length);
      const formatMs = Date.now() - formatStart;

      const contentTokens = estimateTokens(content);
      const originalTokens = estimateHtmlTokens(html);

      return {
        success: true,
        url: options.url,
        resolvedUrl,
        protocolNative: false,
        mode,
        format,
        renderEngine: "playwright-chromium",
        timing: {
          totalMs: Date.now() - start,
          renderMs,
          extractMs,
          formatMs,
        },
        content,
        metadata: {
          title: extracted.title,
          description: extracted.description,
          language: extracted.language,
          wordCount: extracted.textContent.split(/\s+/).filter(Boolean).length,
          estimatedTokens: contentTokens,
          originalTokensEstimate: originalTokens,
          tokenSavingsPercent: calculateSavings(originalTokens, contentTokens),
          headings: extracted.headings,
          linksCount: extracted.links.length,
          imagesCount: extracted.images.length,
          codeBlocksCount: extracted.codeBlocks.length,
          frameworkDetected: framework,
          spaRendered: framework !== null,
        },
        links: options.includeLinks !== false ? extracted.links : [],
        errors: [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Extraction failed: ${message}`);
      return {
        success: false,
        url: options.url,
        resolvedUrl: options.url,
        protocolNative: false,
        mode,
        format,
        renderEngine: "playwright-chromium",
        timing: { totalMs: Date.now() - start, renderMs: 0, extractMs: 0, formatMs: 0 },
        content: "",
        metadata: {
          title: "",
          description: "",
          language: "",
          wordCount: 0,
          estimatedTokens: 0,
          originalTokensEstimate: 0,
          tokenSavingsPercent: 0,
          headings: [],
          linksCount: 0,
          imagesCount: 0,
          codeBlocksCount: 0,
          frameworkDetected: null,
          spaRendered: false,
        },
        links: [],
        errors: [message],
      };
    } finally {
      await this.pool.release(context);
    }
  }

  async discover(url: string): Promise<SiteDiscoveryResult> {
    const start = Date.now();
    const pages: DiscoveredPage[] = [];

    const protocolResult = await this.protocolChecker.check(url);

    try {
      const origin = new URL(url).origin;
      const sitemapUrl = `${origin}/sitemap.xml`;

      const resp = await fetch(sitemapUrl, {
        headers: { "User-Agent": "SemanticLayer/0.1.0" },
        signal: AbortSignal.timeout(10_000),
      });

      if (resp.ok) {
        const text = await resp.text();
        const locMatches = text.matchAll(/<loc>([^<]+)<\/loc>/g);
        for (const match of locMatches) {
          if (match[1]) {
            pages.push({ url: match[1] });
          }
        }
      }
    } catch {
      this.logger.debug("Sitemap fetch failed");
    }

    return {
      url,
      pages,
      sitemapFound: pages.length > 0,
      protocolSupported: protocolResult.supported,
      timing: { totalMs: Date.now() - start },
    };
  }

  async checkProtocol(url: string) {
    return this.protocolChecker.check(url);
  }

  async close(): Promise<void> {
    await this.pool.close();
  }

  private async extractViaProtocol(
    options: ExtractOptions,
    mode: ContentMode,
    format: OutputFormat,
    startTime: number,
  ): Promise<ExtractResult> {
    const protocolResult = await this.protocolChecker.check(options.url);
    const discovery = protocolResult.discovery!;

    try {
      const origin = new URL(options.url).origin;
      const pathname = new URL(options.url).pathname;
      const contentUrl = `${origin}${discovery.endpoints.content}?path=${encodeURIComponent(pathname)}&mode=${mode}&format=${format}`;

      const resp = await fetch(contentUrl, {
        headers: { Accept: "application/json", "User-Agent": "SemanticLayer/0.1.0" },
        signal: AbortSignal.timeout(options.timeout ?? 30_000),
      });

      if (!resp.ok) throw new Error(`Protocol endpoint returned ${resp.status}`);

      const data = (await resp.json()) as Record<string, unknown>;
      const content = (data["content"] as string) ?? "";

      return {
        success: true,
        url: options.url,
        resolvedUrl: options.url,
        protocolNative: true,
        mode,
        format,
        renderEngine: "protocol-native",
        timing: { totalMs: Date.now() - startTime, renderMs: 0, extractMs: 0, formatMs: 0 },
        content,
        metadata: (data["metadata"] as ExtractResult["metadata"]) ?? {
          title: "",
          description: "",
          language: "",
          wordCount: 0,
          estimatedTokens: estimateTokens(content),
          originalTokensEstimate: 0,
          tokenSavingsPercent: 0,
          headings: [],
          linksCount: 0,
          imagesCount: 0,
          codeBlocksCount: 0,
          frameworkDetected: null,
          spaRendered: false,
        },
        links: [],
        errors: [],
      };
    } catch (err) {
      this.logger.warn("Protocol fetch failed, falling back to renderer");
      return this.extract({ ...options, mode, format });
    }
  }

  private formatContent(
    extracted: import("./types.js").ExtractedContent,
    mode: ContentMode,
    format: OutputFormat,
    url: string,
    originalHtmlLength: number,
  ): string {
    switch (format) {
      case "markdown":
        return this.mdFormatter.format(extracted, mode);
      case "slml":
        return this.slmlFormatter.format(extracted, mode, url);
      case "json":
        return this.jsonFormatter.format(extracted, mode, url, originalHtmlLength);
      case "text":
        return extracted.textContent;
    }
  }
}
