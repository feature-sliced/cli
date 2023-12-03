import { promises as fs } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { getBinPath } from "get-bin-path";
import { it, describe, expect } from "vitest";

const temporaryDirectory = await fs.realpath(os.tmpdir());
const fsd = (await getBinPath())!;

describe("root detection algorithm", () => {
  it("respects the .gitignore file", async () => {
    const project = join(temporaryDirectory, "gitignore");
    await execa("rm", ["-rf", project]);
    await execa(
      "pnpm",
      ["create", "vite", "gitignore", "--template", "vanilla-ts"],
      { cwd: temporaryDirectory },
    );
    await fs.mkdir(join(project, "src/features"), { recursive: true });
    await fs.mkdir(join(project, "dist/features"), { recursive: true });
    await fs.mkdir(join(project, "dist/app"), { recursive: true });

    await execa("node", [fsd, "f", "auth"], { cwd: project });
    await execa("node", [fsd, "w", "header"], { cwd: project });

    await expect(
      fs.stat(join(project, "src/features/auth/index.ts")),
    ).resolves.toBeTruthy();
    await expect(
      fs.stat(join(project, "src/widgets/header/index.ts")),
    ).resolves.toBeTruthy();
    await expect(
      fs.stat(join(project, "dist/widgets/header")),
    ).rejects.toBeTruthy();
  });
});
