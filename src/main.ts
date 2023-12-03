#!/usr/bin/env node
import { relative, resolve } from "node:path";
import process from "node:process";
import Enquirer from "enquirer";

import { generateFiles, slicelessLayers } from "./generate-files";
import { isTypeScriptInProject } from "./is-typescript-in-project";
import { detectFsdRoot } from "./detect-fsd-root";
import { parseArguments } from "./parse-arguments";

async function main() {
  const request = await parseArguments(process.argv);
  let fsdRoot =
    request.rootOverride !== null
      ? resolve(request.rootOverride)
      : await detectFsdRoot();

  if (Array.isArray(fsdRoot)) {
    ({ root: fsdRoot } = (await Enquirer.prompt({
      name: "root",
      type: "select",
      message: "Pick a folder to generate in",
      choices: fsdRoot.map((path) => ({
        message: relative(process.cwd(), path),
        value: path,
        name: path,
      })),
    })) as { root: string });
  }

  if (
    !slicelessLayers.includes(request.layer) &&
    request.slices.length === 0 &&
    request.segments.length > 0
  ) {
    console.error("You can't create segments without specifying slices");
    process.exit(1);
  }

  await generateFiles(request, fsdRoot, await isTypeScriptInProject());
}

await main();
