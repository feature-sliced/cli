import { Folder, File, getLayers } from "@feature-sliced/filesystem";
import { Dirent } from "fs";
import fs from "fs/promises";
import path from "path";
import simpleGit from "simple-git";
import { SearchRules } from "./rules";

const defaultIgnoredFolders = ["node_modules", ".git", "dist", "build"];

export async function getLayersCountInFolder(
  folderTree: Folder,
): Promise<number> {
  const layers = Object.keys(getLayers(folderTree));

  return layers.length;
}

export async function filterIgnoredFolders(
  folder: Folder,
  excludedDirectories?: string[],
): Promise<Folder> {
  if (folder.children.length === 0) {
    return folder;
  }

  return {
    ...folder,
    children: folder.children.filter(
      (item) =>
        item.type === "folder" &&
        !excludedDirectories?.includes(item.path) &&
        !defaultIgnoredFolders.includes(path.basename(item.path)),
    ),
  };
}

export async function getFsdTree(
  folderPath: string,
  searchRule?: SearchRules,
): Promise<Folder> {
  const files = await fs.readdir(folderPath, { withFileTypes: true });

  const folderTree: Folder = {
    type: "folder",
    path: path.resolve(folderPath),
    children: files
      .filter((file) => {
        return (
          (file.isDirectory() || file.isFile()) &&
          !searchRule?.excludedDirectories.includes(
            path.resolve(folderPath, file.name),
          )
        );
      })
      .map<Folder | File>((file: Dirent) => {
        const filePath = path.resolve(folderPath, file.name);

        if (file.isDirectory()) {
          return {
            type: "folder",
            path: filePath,
            children: [],
          };
        } else {
          return {
            type: "file",
            path: filePath,
          };
        }
      }),
  };

  return folderTree;
}

export async function detectFsdRoot(
  searchRule?: SearchRules,
): Promise<string | Array<string>> {
  const searchRootResolve = path.resolve(
    searchRule?.searchRoot || process.cwd(),
  );
  const folderTree = await getFsdTree(searchRootResolve, searchRule);
  const cwdLayersCount = await getLayersCountInFolder(folderTree);

  if (cwdLayersCount >= 2) {
    return searchRootResolve;
  }

  const git = simpleGit({
    config: ["core.quotePath=false"],
  });
  const isGitRepo = await git.checkIsRepo();

  const queue = [searchRootResolve];
  let maxLayersCount = 0;
  let foldersWithMaxLayers: string[] = [];

  while (queue.length > 0) {
    const currentDirectory = queue.shift()!;

    const directoryContent = await getFsdTree(currentDirectory, searchRule);

    const pathsForGit = directoryContent.children.map((item) => item.path);

    // git.checkIgnore() for absolute path return path in double quotes, so we need remove `"` from start and end, and normalize path
    const ignoredByGitPaths =
      isGitRepo && pathsForGit.length > 0
        ? (await git.checkIgnore(pathsForGit)).map((folder) =>
            path.normalize(folder.slice(1, -1)),
          )
        : [];

    const excludedDirectories = [
      ...ignoredByGitPaths,
      ...(searchRule?.excludedDirectories || []),
    ];

    const filteredDirectories = await filterIgnoredFolders(
      directoryContent,
      excludedDirectories,
    );

    const detectedLayers = getLayers(filteredDirectories);
    const layerCount = Object.keys(detectedLayers).length;

    for (const item of filteredDirectories.children) {
      queue.push(item.path);
    }

    if (layerCount > maxLayersCount) {
      maxLayersCount = layerCount;
      foldersWithMaxLayers = [currentDirectory];
    } else if (layerCount === maxLayersCount) {
      foldersWithMaxLayers.push(currentDirectory);
    }
  }

  if (maxLayersCount === 0) {
    return process.cwd();
  }

  if (foldersWithMaxLayers.length === 1) {
    return foldersWithMaxLayers[0];
  }

  return foldersWithMaxLayers;
}
