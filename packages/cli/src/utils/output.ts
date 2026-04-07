import chalk from "chalk";
import type { ExtractResult } from "@semanticlayer/core";

export function printResult(result: ExtractResult): void {
  const m = result.metadata;

  console.error();
  console.error(chalk.bold.underline("Extraction Metadata"));
  console.error(chalk.dim("─".repeat(45)));
  console.error(formatRow("Title", m.title || "(none)"));
  console.error(formatRow("Language", m.language || "unknown"));
  console.error(formatRow("Framework", m.frameworkDetected ?? "static"));
  console.error(formatRow("SPA Rendered", m.spaRendered ? "yes" : "no"));
  console.error(formatRow("Word Count", String(m.wordCount)));
  console.error(formatRow("Headings", String(m.headings.length)));
  console.error(formatRow("Links", String(m.linksCount)));
  console.error(formatRow("Images", String(m.imagesCount)));
  console.error(formatRow("Code Blocks", String(m.codeBlocksCount)));
  console.error(chalk.dim("─".repeat(45)));
  console.error(formatRow("Est. Tokens", String(m.estimatedTokens)));
  console.error(formatRow("Original Tokens", String(m.originalTokensEstimate)));
  console.error(
    formatRow(
      "Token Savings",
      chalk.green.bold(`${m.tokenSavingsPercent}%`),
    ),
  );
  console.error(chalk.dim("─".repeat(45)));
  console.error(formatRow("Render", `${result.timing.renderMs}ms`));
  console.error(formatRow("Extract", `${result.timing.extractMs}ms`));
  console.error(formatRow("Format", `${result.timing.formatMs}ms`));
  console.error(formatRow("Total", chalk.bold(`${result.timing.totalMs}ms`)));
  console.error();
}

export function printError(errors: string[]): void {
  for (const err of errors) {
    console.error(chalk.red(`  ✗ ${err}`));
  }
}

function formatRow(label: string, value: string): string {
  return `  ${chalk.cyan(label.padEnd(18))} ${value}`;
}
