import fs from "fs/promises";
import path from "path";

const layers = new Set([
  "app",
  "pages",
  "widgets",
  "features",
  "entities",
  "shared",
]);

export async function getLayersCountInFolder(
  folderPath: string,
): Promise<number> {
  const files = await fs.readdir(folderPath);

  return files.filter((file) => layers.has(file)).length;
}

export async function detectFsdRoot(): Promise<string | Array<string>> {
  const cwd = path.resolve(
    "E:\\Repositories\\Frontend\\fsd_cli1\\shared\\features\\app\\pages\\app",
  );
  const cwdLayersCount = await getLayersCountInFolder(cwd);

  if (cwdLayersCount >= 2) {
    return cwd;
  }

  let currentPath = path.resolve(cwd, "..");
  let maxLayersCount = 0;
  let maxLayersPaths: string[] = [];

  while (currentPath !== path.resolve(currentPath, "..")) {
    const layersCount = await getLayersCountInFolder(currentPath);

    if (layersCount > 0) {
      if (layersCount > maxLayersCount) {
        maxLayersCount = layersCount;
        maxLayersPaths = [currentPath];
      } else if (layersCount === maxLayersCount) {
        maxLayersPaths.push(currentPath);
      }
    }

    currentPath = path.resolve(currentPath, "..");
  }

  if (maxLayersCount === 0) {
    return cwd;
  }

  if (maxLayersPaths.length === 1) {
    return maxLayersPaths[0];
  }

  return maxLayersPaths;
}
