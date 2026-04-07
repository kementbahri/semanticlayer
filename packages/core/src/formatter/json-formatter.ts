import type { ExtractedContent, ContentMode, ContentMetadata } from "../types.js";
import { estimateTokens, estimateHtmlTokens, calculateSavings } from "../utils/token-estimator.js";
import { MarkdownFormatter } from "./markdown-formatter.js";

export class JsonFormatter {
  private mdFormatter: MarkdownFormatter;

  constructor() {
    this.mdFormatter = new MarkdownFormatter();
  }

  format(
    extracted: ExtractedContent,
    mode: ContentMode,
    _url: string,
    originalHtmlLength: number,
  ): string {
    const markdown = this.mdFormatter.format(extracted, mode);
    const estimatedTokens = estimateTokens(markdown);
    const originalTokens = estimateHtmlTokens(
      extracted.mainHtml.length > originalHtmlLength
        ? extracted.mainHtml
        : " ".repeat(originalHtmlLength),
    );

    const metadata: ContentMetadata = {
      title: extracted.title,
      description: extracted.description,
      language: extracted.language,
      wordCount: extracted.textContent.split(/\s+/).filter(Boolean).length,
      estimatedTokens,
      originalTokensEstimate: originalTokens,
      tokenSavingsPercent: calculateSavings(originalTokens, estimatedTokens),
      headings: extracted.headings,
      linksCount: extracted.links.length,
      imagesCount: extracted.images.length,
      codeBlocksCount: extracted.codeBlocks.length,
      frameworkDetected: null,
      spaRendered: false,
    };

    const output = {
      content: markdown,
      metadata,
      links: extracted.links,
      navigation: mode === "structured" ? extracted.navigation : undefined,
      meta: mode !== "content" ? extracted.meta : undefined,
    };

    return JSON.stringify(output, null, 2);
  }
}
