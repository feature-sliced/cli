import { Command, Option } from "commander";
import terminalLink from "terminal-link";

import { type CreationRequest, slicelessLayers } from "./generate-files";
import pkg from "../package.json";
import { examples } from "./usage-examples";

function cleanUpMultipleValues(values: Array<string>) {
  return values.flatMap((value) => value.split(",").filter(Boolean));
}

export function parseArguments(args: Array<string>) {
  return new Promise<CreationRequest>((resolve) => {
    const program = new Command();

    program
      .name(Object.keys(pkg.bin)[0])
      .description(
        pkg.description.replace(
          "Feature-Sliced Design",
          terminalLink(
            "Feature-Sliced Design",
            "https://feature-sliced.design",
          ),
        ),
      )
      .version(pkg.version)
      .usage("[command] [options]")
      .addHelpText(
        "after",
        `\nExamples:\n${examples
          .map(
            ({ description, commands }) =>
              `  ${description}:\n${commands
                .map((command) => `    $ ${command}`)
                .join("\n")}`,
          )
          .join("\n\n")}`,
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
