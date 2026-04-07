import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { SemanticLayer } from "@semanticlayer/core";

export const checkCommand = new Command("check")
  .description("Check if a website supports the SemanticLayer protocol")
  .argument("<url>", "Target website URL")
  .action(async (url: string) => {
    const spinner = ora(chalk.cyan("Checking protocol support...")).start();
    const sl = new SemanticLayer();

    try {
      const result = await sl.checkProtocol(url);

      if (result.supported && result.discovery) {
        spinner.succeed(chalk.green(`Protocol supported (${result.responseTimeMs}ms)`));
        console.log();
        console.log(chalk.bold("Name:"), result.discovery.name);
        console.log(chalk.bold("Version:"), result.discovery.version);
        console.log(chalk.bold("Description:"), result.discovery.description);
        console.log(chalk.bold("Modes:"), result.discovery.supportedModes.join(", "));
        console.log(chalk.bold("Languages:"), result.discovery.languages.join(", "));
        console.log(chalk.bold("Content Endpoint:"), result.discovery.endpoints.content);
      } else {
        spinner.info(chalk.yellow(`Protocol not supported (checked in ${result.responseTimeMs}ms)`));
        console.log(chalk.dim("This site does not publish /.well-known/semanticlayer.json"));
        console.log(chalk.dim("SemanticLayer will use the renderer path for content extraction."));
      }
    } catch (err) {
      spinner.fail(chalk.red("Check failed"));
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exitCode = 1;
    } finally {
      await sl.close();
    }
  });
