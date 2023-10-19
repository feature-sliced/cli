import fs from "fs/promises";
import path from "path";
import { simpleGit } from "simple-git";

const layers = ["app", "pages", "widgets", "features", "entities", "shared"];
const defaultIgnoredFolders = ["node_modules", ".git", "dist", "build"];

const git = simpleGit();

export async function getLayersCountInFolder(
  folderPath: string,
): Promise<number> {
  const files = await fs.readdir(folderPath);

  return files.filter((file) =>
    layers.some((ignored) => file.endsWith(ignored)),
  ).length;
}

export async function filterIgnoredFolders(
  folders: Array<string>,
): Promise<Array<string>> {
  if (folders.length === 0) {
    return [];
  }

  // git.checkIgnore() for absolute path return path in double quotes, so we need remove `"` from start and end, and normalize path
  const ignoredByGit = (await git.checkIgnore(folders)).map((folder) =>
    path.normalize(folder.slice(1, -1)),
  );

  const filteredByGit = folders.filter(
    (folder) => !ignoredByGit.includes(folder),
  );

  const filteredByDefaults = filteredByGit.filter(
    (folder) =>
      !defaultIgnoredFolders.some((ignored) => folder.endsWith(ignored)),
  );

  return filteredByDefaults;
}

export async function detectFsdRoot(): Promise<string | Array<string>> {
  const cwd = path.resolve(process.cwd());
  const cwdLayersCount = await getLayersCountInFolder(cwd);

  if (cwdLayersCount >= 2) {
    return cwd;
  }

  const isGitRepo = await git.checkIsRepo();

  const queue = [cwd];
  let maxLayersCount = 0;
  let foldersWithMaxLayers: string[] = [];

  while (queue.length > 0) {
    const currentDirectory = queue.shift()!;
    const directoryContent = await fs.readdir(currentDirectory, {
      withFileTypes: true,
    });
    const directories = directoryContent
      .filter((item) => item.isDirectory())
      .map((item) => path.join(currentDirectory, item.name));

    const filteredDirectories = isGitRepo
      ? await filterIgnoredFolders(directories)
      : directories.filter(
          (item) =>
            !defaultIgnoredFolders.some((ignored) => item.endsWith(ignored)),
        );

    let layerCount = 0;
    for (const item of filteredDirectories) {
      if (layers.some((layer) => item.endsWith(layer))) {
        layerCount++;
      }
    }

    if (layerCount > maxLayersCount) {
      maxLayersCount = layerCount;
      foldersWithMaxLayers = [currentDirectory];
    } else if (layerCount === maxLayersCount) {
      foldersWithMaxLayers.push(currentDirectory);
    }
  }

  if (maxLayersCount === 0) {
    return cwd;
  }

  if (foldersWithMaxLayers.length === 1) {
    return foldersWithMaxLayers[0];
  }

  return foldersWithMaxLayers;
}
