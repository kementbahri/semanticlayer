#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  SemanticLayer,
  type ContentMode,
  type OutputFormat,
} from "@semanticlayer/core";

const sl = new SemanticLayer({ logLevel: 4 });

const server = new McpServer({
  name: "semanticlayer",
  version: "0.1.0",
});

server.tool(
  "extract_web_content",
  "Extract clean, AI-optimized content from any web page. Handles SPAs (React, Vue, Angular, Svelte) automatically via headless browser rendering.",
  {
    url: z.string().url().describe("The URL to extract content from"),
    mode: z
      .enum(["content", "structured", "full", "raw"])
      .default("content")
      .describe("Extraction mode. 'content' = main content only, 'structured' = content + metadata, 'full' = entire page, 'raw' = rendered HTML"),
    format: z
      .enum(["markdown", "slml", "json", "text"])
      .default("markdown")
      .describe("Output format"),
  },
  async ({ url, mode, format }) => {
    const result = await sl.extract({
      url,
      mode: mode as ContentMode,
      format: format as OutputFormat,
    });

    if (!result.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Extraction failed: ${result.errors.join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    const meta = [
      `Title: ${result.metadata.title}`,
      `Tokens: ~${result.metadata.estimatedTokens} (${result.metadata.tokenSavingsPercent}% savings)`,
      `Framework: ${result.metadata.frameworkDetected ?? "static"}`,
      `Rendered in: ${result.timing.totalMs}ms`,
    ].join(" | ");

    return {
      content: [
        { type: "text" as const, text: meta },
        { type: "text" as const, text: result.content },
      ],
    };
  },
);

server.tool(
  "discover_site",
  "Discover the structure of a website — checks for SemanticLayer protocol support and parses the sitemap.",
  {
    url: z.string().url().describe("The website URL to discover"),
  },
  async ({ url }) => {
    const result = await sl.discover(url);

    const lines = [
      `Protocol Support: ${result.protocolSupported ? "Yes" : "No"}`,
      `Sitemap Found: ${result.sitemapFound ? "Yes" : "No"}`,
      `Pages Found: ${result.pages.length}`,
      "",
      ...result.pages.slice(0, 50).map((p) => `- ${p.url}`),
    ];

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  },
);

server.tool(
  "check_protocol",
  "Check if a website supports the SemanticLayer protocol (/.well-known/semanticlayer.json).",
  {
    url: z.string().url().describe("The website URL to check"),
  },
  async ({ url }) => {
    const result = await sl.checkProtocol(url);

    if (!result.supported) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Protocol not supported (checked in ${result.responseTimeMs}ms). SemanticLayer will use the renderer path.`,
          },
        ],
      };
    }

    const d = result.discovery!;
    const info = [
      `Protocol Supported: Yes (${result.responseTimeMs}ms)`,
      `Name: ${d.name}`,
      `Version: ${d.version}`,
      `Modes: ${d.supportedModes.join(", ")}`,
      `Languages: ${d.languages.join(", ")}`,
    ].join("\n");

    return {
      content: [{ type: "text" as const, text: info }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server crashed:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await sl.close();
  process.exit(0);
});
