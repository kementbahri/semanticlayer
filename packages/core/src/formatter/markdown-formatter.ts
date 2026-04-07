import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import type { ExtractedContent, ContentMode } from "../types.js";

export class MarkdownFormatter {
  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*",
      strongDelimiter: "**",
    });

    this.turndown.use(gfm);

    this.turndown.addRule("preserveCodeLanguage", {
      filter: (node) =>
        node.nodeName === "CODE" && !!node.parentNode && node.parentNode.nodeName === "PRE",
      replacement: (content, node) => {
        const classAttr = (node as HTMLElement).getAttribute?.("class") ?? "";
        const langMatch = classAttr.match(/(?:language|lang)-(\w+)/);
        const lang = langMatch?.[1] ?? "";
        const code = (node as HTMLElement).textContent ?? content;
        return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
      },
    });
  }

  format(extracted: ExtractedContent, mode: ContentMode): string {
    const parts: string[] = [];
    const md = this.turndown.turndown(extracted.mainHtml);

    parts.push(md);

    if (mode === "structured" && extracted.navigation.length > 0) {
      parts.push("\n---\n");
      parts.push("## Navigation\n");
      for (const item of extracted.navigation) {
        parts.push(`- [${item.text}](${item.url})`);
      }
    }

    return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
}
