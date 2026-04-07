import type { ExtractedContent, ContentMode } from "../types.js";
import { MarkdownFormatter } from "./markdown-formatter.js";
import { estimateTokens } from "../utils/token-estimator.js";

export class SLMLFormatter {
  private mdFormatter: MarkdownFormatter;

  constructor() {
    this.mdFormatter = new MarkdownFormatter();
  }

  format(
    extracted: ExtractedContent,
    mode: ContentMode,
    url: string,
  ): string {
    const bodyMd = this.mdFormatter.format(extracted, "content");
    const parts: string[] = [];

    parts.push("---slml");
    parts.push(`url: ${url}`);
    parts.push(`title: ${extracted.title}`);
    parts.push(`description: ${extracted.description}`);
    parts.push(`language: ${extracted.language}`);
    parts.push(`tokens: ~${estimateTokens(bodyMd)}`);
    parts.push("---");
    parts.push("");

    parts.push(bodyMd);

    if (mode === "structured" || mode === "full") {
      if (extracted.navigation.length > 0) {
        parts.push("");
        const visibility = mode === "structured" ? "visible" : "visible";
        parts.push(`@nav[${visibility}]`);
        for (const item of extracted.navigation) {
          parts.push(`- ${item.text} -> ${item.url}`);
        }
        parts.push("@/nav");
      }

      if (extracted.meta.keywords.length > 0) {
        parts.push("");
        parts.push("@meta");
        parts.push(`description: ${extracted.meta.description}`);
        parts.push(`keywords: ${extracted.meta.keywords.join(", ")}`);
        if (extracted.meta.canonical) {
          parts.push(`canonical: ${extracted.meta.canonical}`);
        }
        parts.push("@/meta");
      }
    }

    if (extracted.links.length > 0 && mode !== "raw") {
      const internal = extracted.links.filter((l) => l.type === "internal");
      if (internal.length > 0) {
        parts.push("");
        parts.push("@link-group[Internal Links]");
        for (const link of internal.slice(0, 20)) {
          parts.push(`- ${link.text || link.url} -> ${link.url}`);
        }
        parts.push("@/link-group");
      }
    }

    return parts.join("\n").trim();
  }
}
