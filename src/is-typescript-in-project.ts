import * as process from "process";

import * as path from "path";
import fs from "fs/promises";

export async function isPathContainsItem(
  path: string,
  itemName: string,
): Promise<boolean> {
  const files = await fs.readdir(path);

  return files.includes(itemName);
}

export async function isTypeScriptInProject(): Promise<boolean> {
  let currentPath = process.cwd();

  while (currentPath !== path.resolve(currentPath, "..")) {
    if (await isPathContainsItem(currentPath, "package.json")) {
      return await isPathContainsItem(currentPath, "tsconfig.json");
    }

    currentPath = path.resolve(currentPath, "..");
  }

  return false;
}
