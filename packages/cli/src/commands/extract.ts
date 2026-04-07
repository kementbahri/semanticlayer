import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { writeFile } from "node:fs/promises";
import { SemanticLayer, type ContentMode, type OutputFormat } from "@semanticlayer/core";
import { printResult, printError } from "../utils/output.js";

export const extractCommand = new Command("extract")
  .description("Extract AI-optimized content from a URL")
  .argument("<url>", "Target URL to extract content from")
  .option("-m, --mode <mode>", "Extraction mode: content | structured | full | raw", "content")
  .option("-f, --format <format>", "Output format: markdown | slml | json | text", "markdown")
  .option("-o, --output <file>", "Write output to a file instead of stdout")
  .option("--no-images", "Exclude image references from output")
  .option("--no-links", "Exclude link references from output")
  .option("-t, --timeout <ms>", "Navigation timeout in milliseconds", "30000")
  .option("-w, --wait <strategy>", "Wait strategy: load | domcontentloaded | networkidle", "networkidle")
  .option("--meta", "Print metadata summary to stderr")
  .option("--headful", "Run browser in headful mode (visible window)")
  .action(async (url: string, opts) => {
    const mode = opts.mode as ContentMode;
    const format = opts.format as OutputFormat;

    const spinner = ora({
      text: chalk.cyan("Initializing SemanticLayer..."),
      color: "cyan",
    }).start();

    const sl = new SemanticLayer({
      browser: { headless: !opts.headful },
    });

    try {
      spinner.text = chalk.cyan("Checking protocol support...");
      spinner.text = chalk.cyan(`Rendering & extracting ${chalk.bold(url)}...`);

      const result = await sl.extract({
        url,
        mode,
        format,
        includeImages: opts.images,
        includeLinks: opts.links,
        timeout: parseInt(opts.timeout as string, 10),
        waitFor: opts.wait,
      });

      if (!result.success) {
        spinner.fail(chalk.red("Extraction failed"));
        printError(result.errors);
        process.exitCode = 1;
        return;
      }

      const savingsLabel = result.metadata.tokenSavingsPercent > 0
        ? chalk.green(` (${result.metadata.tokenSavingsPercent}% token savings)`)
        : "";

      spinner.succeed(
        chalk.green(`Done in ${result.timing.totalMs}ms`) + savingsLabel,
      );

      if (opts.meta) {
        printResult(result);
      }

      if (opts.output) {
        await writeFile(opts.output, result.content, "utf-8");
        console.error(chalk.dim(`Written to ${opts.output}`));
      } else {
        console.log(result.content);
      }
    } catch (err) {
      spinner.fail(chalk.red("Fatal error"));
      const message = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(message));
      process.exitCode = 1;
    } finally {
      await sl.close();
    }
  });
