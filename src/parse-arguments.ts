import { Command, Option } from "commander";
import chalk from "chalk";

import { type CreationRequest, slicelessLayers } from "./generate-files";
import pkg from "../package.json";

function cleanUpMultipleValues(values: Array<string>) {
  return values.flatMap((value) => value.split(",").filter(Boolean));
}

export function parseArguments(args: Array<string>) {
  return new Promise<CreationRequest>((resolve) => {
    const program = new Command();

    program
      .name(Object.keys(pkg.bin)[0])
      .description(pkg.description)
      .version(pkg.version)
      .usage("[command] [options]")
      .addHelpText(
        "after",
        `
Examples:
  Generate the ${chalk.blue("Shared")} layer with a ${chalk.green(
    "ui",
  )} segment and an index file in the ${chalk.magenta("src/")} folder:
  $ fsd ${chalk.blue("shared")} ${chalk.green("ui")} -r ${chalk.magenta("src")}

  Generate the ${chalk.blue("Entities")} layer with slices ${chalk.red(
    "user",
  )} and ${chalk.red("city")}, each with an ${chalk.green("api")} segment:
  $ fsd ${chalk.blue("e")} ${chalk.red("user city")} -s ${chalk.green("api")}

  Generate the ${chalk.blue("Features")} layer with an ${chalk.red(
    "auth",
  )} slice containing segments ${chalk.green("api")} and ${chalk.green(
    "model",
  )}:
  $ fsd ${chalk.blue("feature")} ${chalk.red("auth")} -s ${chalk.green(
    "api",
  )},${chalk.green("model")}

  Generate the ${chalk.blue(
    "Widgets",
  )} layer with an index file in the ${chalk.magenta("../fsd/")} folder:
  $ fsd ${chalk.blue("widgets")} ${chalk.red("header")} --root ${chalk.magenta(
    "../fsd/",
  )}

  Generate the ${chalk.blue("Pages")} layer with slices ${chalk.red(
    "home",
  )} and ${chalk.red("about")}, each with an ${chalk.green("ui")} segment
  $ fsd ${chalk.blue("pages")} ${chalk.red("home")},${chalk.red(
    "about",
  )} -s ${chalk.green("ui")}

  Generate the ${chalk.blue("App")} layer:
  $ fsd ${chalk.blue("app")}`,
      );

    function resolveCommand(
      segmentsOrSlices: Array<string>,
      options: { segments: Array<string> | null; root: string | null },
      command: Command,
    ) {
      const layer = command.name() as CreationRequest["layer"];

      if (slicelessLayers.includes(layer)) {
        const segments = segmentsOrSlices.concat(options.segments ?? []);

        resolve({
          layer,
          slices: [],
          segments: cleanUpMultipleValues(segments),
          rootOverride: options.root ?? null,
        });
      } else {
        const slices = segmentsOrSlices;

        resolve({
          layer,
          slices: cleanUpMultipleValues(slices),
          segments: cleanUpMultipleValues(options.segments ?? []),
          rootOverride: options.root ?? null,
        });
      }
    }

    const segmentsOption = new Option(
      "-s, --segments <segments...>",
      "segments to generate",
    );
    const rootOption = new Option("-r, --root <root>", "FSD root folder");

    program
      .command("shared")
      .alias("s")
      .description("Generate the Shared layer")
      .argument("[segments...]", "segments to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program
      .command("entities")
      .aliases(["e", "entity"])
      .description("Generate the Entities layer")
      .argument("[slices...]", "slices to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program
      .command("features")
      .aliases(["f", "feature", "feat"])
      .description("Generate the Features layer")
      .argument("[slices...]", "slices to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program
      .command("widgets")
      .aliases(["w", "widget"])
      .description("Generate the Widgets layer")
      .argument("[slices...]", "slices to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program
      .command("pages")
      .aliases(["p", "page"])
      .description("Generate the Pages layer")
      .argument("[slices...]", "slices to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program
      .command("app")
      .alias("a")
      .description("Generate the App layer")
      .argument("[segments...]", "segments to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program.parse(args);
  });
}
