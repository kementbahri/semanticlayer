import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import type {
  ContentMode,
  ExtractedContent,
  HeadingInfo,
  LinkInfo,
  ImageInfo,
  CodeBlockInfo,
  NavigationItem,
  MetaInfo,
} from "../types.js";
import { resolveUrl, isInternalLink } from "../utils/url-utils.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type LinkedomDocument = any;

export class ContentExtractor {
  extract(html: string, url: string, mode: ContentMode): ExtractedContent {
    const { document } = parseHTML(html) as { document: LinkedomDocument };
    const meta = this.extractMeta(document, url);
    const language = document.documentElement?.getAttribute("lang") ?? "en";

    if (mode === "raw") {
      return {
        title: meta.title,
        description: meta.description,
        language,
        mainHtml: html,
        textContent: document.body?.textContent?.trim() ?? "",
        headings: this.extractHeadings(document),
        links: this.extractLinks(document, url),
        images: this.extractImages(document, url),
        codeBlocks: this.extractCodeBlocks(document),
        navigation: [],
        meta,
      };
    }

    if (mode === "full") {
      const cleaned = this.cleanFullPage(document);
      return {
        title: meta.title,
        description: meta.description,
        language,
        mainHtml: cleaned,
        textContent: document.body?.textContent?.trim() ?? "",
        headings: this.extractHeadings(document),
        links: this.extractLinks(document, url),
        images: this.extractImages(document, url),
        codeBlocks: this.extractCodeBlocks(document),
        navigation: this.extractNavigation(document, url),
        meta,
      };
    }

    const reader = new Readability(document as unknown as Document, {
      charThreshold: 50,
    });
    const article = reader.parse();

    if (!article) {
      return {
        title: meta.title,
        description: meta.description,
        language,
        mainHtml: document.body?.innerHTML ?? "",
        textContent: document.body?.textContent?.trim() ?? "",
        headings: [],
        links: [],
        images: [],
        codeBlocks: [],
        navigation: [],
        meta,
      };
    }

    const { document: articleDoc } = parseHTML(article.content) as { document: LinkedomDocument };
    const headings = this.extractHeadings(articleDoc);
    const links = this.extractLinks(articleDoc, url);
    const images = this.extractImages(articleDoc, url);
    const codeBlocks = this.extractCodeBlocks(articleDoc);

    const result: ExtractedContent = {
      title: article.title || meta.title,
      description: article.excerpt || meta.description,
      language: article.lang || language,
      mainHtml: article.content,
      textContent: article.textContent,
      headings,
      links,
      images,
      codeBlocks,
      navigation: [],
      meta,
    };

    if (mode === "structured") {
      const { document: origDoc } = parseHTML(html) as { document: LinkedomDocument };
      result.navigation = this.extractNavigation(origDoc, url);
    }

    return result;
  }

  private extractMeta(doc: LinkedomDocument, _url: string): MetaInfo {
    const getContent = (selector: string): string =>
      doc.querySelector(selector)?.getAttribute("content") ?? "";

    const title = doc.querySelector("title")?.textContent?.trim() ?? "";

    return {
      title,
      description: getContent('meta[name="description"]'),
      keywords: (getContent('meta[name="keywords"]') || "")
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean),
      canonical:
        doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? undefined,
      ogTitle: getContent('meta[property="og:title"]'),
      ogDescription: getContent('meta[property="og:description"]'),
      ogImage: getContent('meta[property="og:image"]'),
    };
  }

  private extractHeadings(doc: LinkedomDocument): HeadingInfo[] {
    const headings: HeadingInfo[] = [];
    const elements = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

    for (const el of elements) {
      const text = el.textContent?.trim();
      if (!text) continue;
      headings.push({
        level: parseInt(el.tagName.charAt(1), 10),
        text,
        id: el.getAttribute("id") ?? undefined,
      });
    }

    return headings;
  }

  private extractLinks(doc: LinkedomDocument, baseUrl: string): LinkInfo[] {
    const links: LinkInfo[] = [];
    const seen = new Set<string>();

    for (const el of doc.querySelectorAll("a[href]")) {
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;

      const resolved = resolveUrl(baseUrl, href);
      if (seen.has(resolved)) continue;
      seen.add(resolved);

      links.push({
        text: el.textContent?.trim() ?? "",
        url: resolved,
        type: isInternalLink(baseUrl, resolved) ? "internal" : "external",
      });
    }

    return links;
  }

  private extractImages(doc: LinkedomDocument, baseUrl: string): ImageInfo[] {
    const images: ImageInfo[] = [];

    for (const el of doc.querySelectorAll("img[src]")) {
      const src = el.getAttribute("src");
      if (!src) continue;

      images.push({
        alt: el.getAttribute("alt") ?? "",
        src: resolveUrl(baseUrl, src),
        caption: el.getAttribute("title") ?? undefined,
      });
    }

    return images;
  }

  private extractCodeBlocks(doc: LinkedomDocument): CodeBlockInfo[] {
    const blocks: CodeBlockInfo[] = [];

    for (const el of doc.querySelectorAll("pre code, pre")) {
      const code = el.querySelector("code") ?? el;
      const content = code.textContent?.trim();
      if (!content) continue;

      const classAttr = code.getAttribute("class") ?? "";
      const langMatch = classAttr.match(/(?:language|lang)-(\w+)/);
      blocks.push({
        language: langMatch?.[1] ?? "",
        content,
      });
    }

    return blocks;
  }

  private extractNavigation(doc: LinkedomDocument, baseUrl: string): NavigationItem[] {
    const nav = doc.querySelector("nav");
    if (!nav) return [];

    const items: NavigationItem[] = [];
    for (const link of nav.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) continue;

      items.push({
        text: link.textContent?.trim() ?? "",
        url: resolveUrl(baseUrl, href),
      });
    }

    return items;
  }

  private cleanFullPage(doc: LinkedomDocument): string {
    const removeSelectors = [
      "script", "style", "noscript",
      "link[rel=stylesheet]", "link[rel=preload]", "link[rel=prefetch]",
      "iframe[src*=analytics]", "iframe[src*=tracking]",
      "[data-ad]", "[class*=cookie]", "[id*=cookie]",
      "[class*=banner]", "[class*=popup]", "[class*=modal]",
    ];

    for (const selector of removeSelectors) {
      for (const el of doc.querySelectorAll(selector)) {
        if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.tagName === 'MAIN') continue;
        el.remove();
      }
    }

    return doc.body?.innerHTML ?? "";
  }
}
