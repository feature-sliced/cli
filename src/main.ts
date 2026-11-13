#!/usr/bin/env node
import { relative, resolve } from "node:path";
import process from "node:process";
import Enquirer from "enquirer";

import { generateFiles, slicelessLayers } from "./generate-files";
import { detectFsdRoot } from "./detect-fsd-root";
import { parseArguments } from "./parse-arguments";
import { getProjectSettings, ProjectSettings } from "./detect-project-packages";
import { getRules } from "./rules";

async function main() {
  const request = await parseArguments(process.argv);

  let projectSettings: ProjectSettings;
  let fsdRoot: string | Array<string>;
  let rules;

  if (request.rootOverride !== null) {
    fsdRoot = resolve(request.rootOverride);

    projectSettings = await getProjectSettings(request.rootOverride);
    rules = await getRules(projectSettings, request);
  } else {
    projectSettings = await getProjectSettings(request.rootOverride);
    rules = await getRules(projectSettings, request);

    fsdRoot = await detectFsdRoot(rules.search);
  }

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

  rules = await getRules(projectSettings, request, fsdRoot);

  await generateFiles(request, fsdRoot, rules);
}

await main();
