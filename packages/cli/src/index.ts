import { Command } from "commander";
import { extractCommand } from "./commands/extract.js";
import { discoverCommand } from "./commands/discover.js";
import { checkCommand } from "./commands/check.js";

const program = new Command()
  .name("semanticlayer")
  .description(
    "AI-optimized web content extraction. Renders SPAs, strips noise, outputs clean Markdown/SLML.",
  )
  .version("0.1.0")
  .alias("sl");

program.addCommand(extractCommand);
program.addCommand(discoverCommand);
program.addCommand(checkCommand);

program.parse();
