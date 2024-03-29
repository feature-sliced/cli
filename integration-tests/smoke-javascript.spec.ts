import { promises as fs } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { deleteAsync } from "del";
import { expect, test } from "vitest";

import { TIMEOUT } from "./timeout";
import { getFsdBinPath } from "./get-fsd-bin-path";

const temporaryDirectory = await fs.realpath(os.tmpdir());
const fsd = await getFsdBinPath();

test(
  "basic functionality in a JavaScript project",
  async () => {
    const project = join(temporaryDirectory, "smoke-javascript");
    await deleteAsync(project, { force: true });
    await execa(
      "pnpm",
      ["create", "vite", "smoke-javascript", "--template", "vanilla"],
      { cwd: temporaryDirectory },
    );
    await execa("node", [fsd, "f", "auth", "-r", "src"], { cwd: project });
    await execa(
      "node",
      [fsd, "entities", "client", "-s", "api,ui", "--root", "src"],
      {
        cwd: project,
      },
    );
    await execa("node", [fsd, "pages", "login"], {
      cwd: project,
    });

    await expect(
      fs.stat(join(project, "src/features/auth/index.js")),
    ).resolves.toBeTruthy();
    await expect(
      fs.stat(join(project, "src/entities/client/index.js")),
    ).resolves.toBeTruthy();
    await expect(
      fs.stat(join(project, "src/entities/client/api")),
    ).resolves.toBeTruthy();
    await expect(
      fs.stat(join(project, "src/entities/client/ui")),
    ).resolves.toBeTruthy();
    await expect(
      fs.stat(join(project, "src/pages/login/index.js")),
    ).resolves.toBeTruthy();
  },
  TIMEOUT,
);
