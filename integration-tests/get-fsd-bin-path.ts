import { promises as fs } from "node:fs";
import * as process from "node:process";
import { getBinPath } from "get-bin-path";

/**
 * Resolve the full path to the built JS file of the CLI.
 *
 * Rejects if the file doesn't exist.
 */
export async function getFsdBinPath() {
  const fsd = (await getBinPath())!;
  try {
    await fs.stat(fsd);
  } catch {
    console.error("Run `npm run build` before running integration tests");
    process.exit(1);
  }

  return fsd;
}
