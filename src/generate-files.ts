import path from "path";
import fs from "fs/promises";

type Layers = "shared" | "entities" | "features" | "widgets" | "pages" | "app";

interface CreationRequest {
  layer: Layers;
  slices: Array<string>;
  segments: Array<string>;
  rootOverride: string | null;
}

export async function generateFiles(
  request: CreationRequest,
  fsdRoot: string,
  isTypeScript = false,
): Promise<void> {
  const workingDirectory = path.resolve(fsdRoot);
  const workingDirectoryFiles = await fs.readdir(workingDirectory);

  if (!workingDirectoryFiles.includes(request.layer)) {
    await fs.mkdir(path.resolve(workingDirectory, request.layer), {
      recursive: true,
    });
  }

  if (request.slices.length > 0) {
    const layerPath = path.resolve(workingDirectory, request.layer);
    const layerFiles = await fs.readdir(layerPath);

    for (const slice of request.slices) {
      const slicePath = path.resolve(workingDirectory, request.layer, slice);

      if (!layerFiles.includes(slice)) {
        await fs.mkdir(slicePath, { recursive: true });
      }

      const sliceFiles = await fs.readdir(slicePath);

      const indexFile = `index.${isTypeScript ? "ts" : "js"}`;

      if (!sliceFiles.includes(indexFile)) {
        const indexFilePath = path.resolve(slicePath, indexFile);

        await fs.writeFile(indexFilePath, ``);
      }

      if (request.segments.length > 0) {
        for (const segment of request.segments) {
          const segmentPath = path.resolve(slicePath, segment);

          if (!sliceFiles.includes(segment)) {
            await fs.mkdir(segmentPath, { recursive: true });
          }
        }
      }
    }
  }
}
