import { promises as fs } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { getBinPath } from "get-bin-path";
import { expect, test } from "vitest";

const temporaryDirectory = await fs.realpath(os.tmpdir());
const fsd = (await getBinPath())!;

test("basic functionality in a TypeScript project", async () => {
  const project = join(temporaryDirectory, "smoke-typescript");
  await execa("rm", ["-rf", project]);
  await execa(
    "pnpm",
    ["create", "vite", "smoke-typescript", "--template", "vanilla-ts"],
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
    fs.stat(join(project, "src/features/auth/index.ts")),
  ).resolves.toBeTruthy();
  await expect(
    fs.stat(join(project, "src/entities/client/index.ts")),
  ).resolves.toBeTruthy();
  await expect(
    fs.stat(join(project, "src/entities/client/api")),
  ).resolves.toBeTruthy();
  await expect(
    fs.stat(join(project, "src/entities/client/ui")),
  ).resolves.toBeTruthy();
  await expect(
    fs.stat(join(project, "src/pages/login/index.ts")),
  ).resolves.toBeTruthy();
});
