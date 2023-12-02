import { relative, resolve } from "node:path";
import process from "node:process";
import { Command, Option } from "commander";
import Enquirer from "enquirer";

import { generateFiles, type CreationRequest, slicelessLayers } from "./generate-files";
import { isTypeScriptInProject } from "./is-typescript-in-project";
import { detectFsdRoot } from "./detect-fsd-root";

function cleanUpMultipleValues(values: Array<string>) {
  return values.flatMap((value) => value.split(",").filter(Boolean));
}

function parse(args: Array<string>) {
  return new Promise<CreationRequest>((resolve) => {
    const program = new Command();

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
      .argument("<slices...>", "slices to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program
      .command("features")
      .aliases(["f", "feature"])
      .description("Generate the Features layer")
      .argument("<slices...>", "slices to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program
      .command("widgets")
      .aliases(["w", "widget"])
      .description("Generate the Widgets layer")
      .argument("<slices...>", "slices to generate")
      .addOption(segmentsOption)
      .addOption(rootOption)
      .action(resolveCommand);

    program
      .command("pages")
      .aliases(["p", "page"])
      .description("Generate the Pages layer")
      .argument("<slices...>", "slices to generate")
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

async function main() {
  const request = await parse(process.argv);
  let fsdRoot =
    request.rootOverride !== null
      ? resolve(request.rootOverride)
      : await detectFsdRoot();

  if (Array.isArray(fsdRoot)) {
    ({ root: fsdRoot } = await Enquirer.prompt({
      name: "root",
      type: "select",
      message: "Pick a folder to generate in",
      choices: fsdRoot.map((path) => ({
        message: relative(process.cwd(), path),
        value: path,
        name: path,
      })),
    }) as { root: string });
  }

  await generateFiles(request, fsdRoot, await isTypeScriptInProject());
}

await main();
