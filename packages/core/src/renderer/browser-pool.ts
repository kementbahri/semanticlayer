import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { BrowserPoolOptions } from "../types.js";
import { Logger } from "../utils/logger.js";
import { LogLevel } from "../types.js";

const DEFAULT_USER_AGENT =
  "SemanticLayer/0.1.0 (+https://github.com/kementbahri/semanticlayer)";

export class BrowserPool {
  private browser: Browser | null = null;
  private launching: Promise<Browser> | null = null;
  private activeContexts = new Set<BrowserContext>();
  private readonly options: Required<BrowserPoolOptions>;
  private readonly logger: Logger;

  constructor(options?: BrowserPoolOptions, logLevel?: LogLevel) {
    this.options = {
      maxInstances: options?.maxInstances ?? 5,
      idleTimeoutMs: options?.idleTimeoutMs ?? 30_000,
      headless: options?.headless ?? true,
    };
    this.logger = new Logger(logLevel ?? LogLevel.WARN);
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;

    if (this.launching) return this.launching;

    this.launching = chromium.launch({
      headless: this.options.headless,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    this.browser = await this.launching;
    this.launching = null;
    this.logger.debug("Browser launched");

    this.browser.on("disconnected", () => {
      this.browser = null;
      this.launching = null;
    });

    return this.browser;
  }

  async acquire(): Promise<{ page: Page; context: BrowserContext }> {
    if (this.activeContexts.size >= this.options.maxInstances) {
      throw new Error(
        `Browser pool exhausted (max ${this.options.maxInstances} concurrent contexts)`,
      );
    }

    const browser = await this.getBrowser();

    const context = await browser.newContext({
      userAgent: DEFAULT_USER_AGENT,
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
    });

    this.activeContexts.add(context);
    const page = await context.newPage();

    await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2,ttf,eot}", (route) =>
      route.abort(),
    );

    return { page, context };
  }

  async release(context: BrowserContext): Promise<void> {
    this.activeContexts.delete(context);
    try {
      await context.close();
    } catch {
      this.logger.debug("Context already closed during release");
    }
  }

  async close(): Promise<void> {
    const closePromises = [...this.activeContexts].map((ctx) =>
      ctx.close().catch(() => { }),
    );
    await Promise.all(closePromises);
    this.activeContexts.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.launching = null;
    this.logger.debug("Browser pool closed");
  }

  get activeCount(): number {
    return this.activeContexts.size;
  }
}
