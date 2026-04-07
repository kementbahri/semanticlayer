import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { SemanticLayer } from "@semanticlayer/core";

export const discoverCommand = new Command("discover")
  .description("Discover pages and protocol support for a website")
  .argument("<url>", "Target website URL")
  .action(async (url: string) => {
    const spinner = ora(chalk.cyan("Discovering site structure...")).start();
    const sl = new SemanticLayer();

    try {
      const result = await sl.discover(url);
      spinner.succeed(chalk.green(`Discovery complete in ${result.timing.totalMs}ms`));

      console.log();
      console.log(chalk.bold("Protocol Support:"), result.protocolSupported ? chalk.green("✓ Yes") : chalk.yellow("✗ No"));
      console.log(chalk.bold("Sitemap Found:"), result.sitemapFound ? chalk.green("✓ Yes") : chalk.yellow("✗ No"));
      console.log(chalk.bold("Pages Found:"), result.pages.length);

      if (result.pages.length > 0) {
        console.log();
        console.log(chalk.bold("Pages:"));
        const display = result.pages.slice(0, 25);
        for (const page of display) {
          console.log(chalk.dim("  →"), page.url);
        }
        if (result.pages.length > 25) {
          console.log(chalk.dim(`  ... and ${result.pages.length - 25} more`));
        }
      }
    } catch (err) {
      spinner.fail(chalk.red("Discovery failed"));
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exitCode = 1;
    } finally {
      await sl.close();
    }
  });
