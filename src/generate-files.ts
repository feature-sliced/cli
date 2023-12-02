import { basename, resolve } from "path";
import fs from "fs/promises";

export type Layers =
  | "shared"
  | "entities"
  | "features"
  | "widgets"
  | "pages"
  | "app";

export interface CreationRequest {
  layer: Layers;
  slices: Array<string>;
  segments: Array<string>;
  /** An absolute path resolved from user input and the current directory, if present. */
  rootOverride: string | null;
}

export const slicelessLayers = ["shared", "app"];

export async function generateFiles(
  request: CreationRequest,
  fsdRoot: string,
  isTypeScript = false,
): Promise<void> {
  const workingDirectory = fsdRoot;
  await fs.mkdir(workingDirectory, { recursive: true });
  const workingDirectoryFiles = await fs.readdir(workingDirectory);

  if (!workingDirectoryFiles.includes(request.layer)) {
    await fs.mkdir(resolve(workingDirectory, request.layer));
  }

  if (request.slices.length > 0) {
    for (const slice of request.slices) {
      const slicePath = await generateSlice(
        slice,
        resolve(workingDirectory, request.layer),
        { isTypeScript },
      );

      if (request.segments.length > 0) {
        await Promise.all(
          request.segments.map((segment) =>
            generateSegment(segment, slicePath, { isTypeScript }),
          ),
        );
      }
    }
  } else if (
    request.segments.length > 0 &&
    slicelessLayers.includes(request.layer)
  ) {
    await Promise.all(
      request.segments.map((segment) =>
        // For sliceless layers, segments should contain index files like slices
        generateSlice(segment, resolve(workingDirectory, request.layer), {
          isTypeScript,
        }),
      ),
    );
  }
}

async function generateSlice(
  name: string,
  path: string,
  { isTypeScript = false } = {},
) {
  const slicePath = resolve(path, name);
  await fs.mkdir(slicePath, { recursive: true });

  const sliceFiles = await fs.readdir(slicePath);

  const indexFile = `index.${isTypeScript ? "ts" : "js"}`;
  if (!sliceFiles.includes(indexFile)) {
    const indexFilePath = resolve(slicePath, indexFile);

    await fs.writeFile(indexFilePath, "");
  }

  return slicePath;
}

async function generateSegment(
  name: string,
  path: string,
  { isTypeScript = false } = {},
) {
  const sliceFiles = await fs.readdir(path);
  const existingSegment = sliceFiles.find(
    (fileOrFolder) =>
      basename(fileOrFolder, `.${isTypeScript ? "ts" : "js"}`) === name,
  );

  if (existingSegment !== undefined) {
    return resolve(path, existingSegment);
  }

  const segmentPath = resolve(path, name);
  await fs.mkdir(segmentPath, { recursive: true });

  return segmentPath;
}
