import { promises as fs } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { getBinPath } from "get-bin-path";
import { deleteAsync } from "del";
import { expect, test, describe } from "vitest";

const temporaryDirectory = await fs.realpath(os.tmpdir());
const fsd = (await getBinPath())!;

describe.concurrent("the commands specified in usage examples", () => {
  for (const args of [
    "w bottom-bar -s ui api -r src",
    "widget bottom-bar -s ui,api -r src",
    "widgets bottom-bar --segments ui,api -r src",
  ]) {
    const argsSplit = args.split(" ");
    test(`widget with segments (${argsSplit[0]})`, async () => {
      const project = join(temporaryDirectory, `${argsSplit[0]}-with-segments`);
      await deleteAsync(project, { force: true });
      await execa(
        "pnpm",
        [
          "create",
          "vite",

          `${argsSplit[0]}-with-segments`,
          "--template",
          "react-ts",
        ],
        { cwd: temporaryDirectory },
      );
      await execa("node", [fsd, ...argsSplit], { cwd: project });

      await expect(
        fs.stat(join(project, "src/widgets/bottom-bar/index.ts")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "src/widgets/bottom-bar/api")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "src/widgets/bottom-bar/ui")),
      ).resolves.toBeTruthy();
      await expect(fs.stat(join(project, "src/entities"))).rejects.toBeTruthy();
    });
  }

  for (const args of [
    "f employee/employee-record",
    "feat employee/employee-record",
  ]) {
    const argsSplit = args.split(" ");
    test(`feature in a slice group (${argsSplit[0]})`, async () => {
      const project = join(
        temporaryDirectory,
        `${argsSplit[0]}-in-a-slice-group`,
      );
      await deleteAsync(project, { force: true });
      await execa(
        "pnpm",
        [
          "create",
          "vite",

          `${argsSplit[0]}-in-a-slice-group`,
          "--template",
          "svelte",
        ],
        { cwd: temporaryDirectory },
      );
      await execa("node", [fsd, ...argsSplit], {
        cwd: project,
      });

      await expect(
        fs.stat(join(project, "features/employee/employee-record/index.js")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "features/employee/employee-record/index.ts")),
      ).rejects.toBeTruthy();
    });
  }

  for (const args of ["e user -r ./src/lib", "entity user --root ./src/lib"]) {
    const argsSplit = args.split(" ");
    test(`entity in a relative non-existent root (${argsSplit[0]})`, async () => {
      const project = join(
        temporaryDirectory,
        `${argsSplit[0]}-in-a-relative-root`,
      );
      await deleteAsync(project, { force: true });
      await execa(
        "pnpm",
        [
          "create",
          "vite",

          `${argsSplit[0]}-in-a-relative-root`,
          "--template",
          "vue-ts",
        ],
        { cwd: temporaryDirectory },
      );
      await execa("node", [fsd, ...argsSplit], {
        cwd: project,
      });

      await expect(
        fs.stat(join(project, "src/lib/entities/user/index.ts")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "entities/user/index.ts")),
      ).rejects.toBeTruthy();
    });
  }

  for (const args of [
    "p edit-note note-list -s ui, api",
    "page edit-note, note-list -s ui api",
  ]) {
    const argsSplit = args.split(" ");
    test(`several pages with several segments (${argsSplit[0]})`, async () => {
      const project = join(
        temporaryDirectory,
        `several-pages-with-segments-${argsSplit[0]}`,
      );
      await deleteAsync(project, { force: true });
      await execa(
        "pnpm",
        [
          "create",
          "vite",

          `several-pages-with-segments-${argsSplit[0]}`,
          "--template",
          "qwik",
        ],
        { cwd: temporaryDirectory },
      );
      await execa("node", [fsd, ...argsSplit], { cwd: project });

      await expect(
        fs.stat(join(project, "pages/edit-note/index.js")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "pages/note-list/index.js")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "pages/edit-note/ui")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "pages/edit-note/api")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "pages/note-list/ui")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "pages/note-list/api")),
      ).resolves.toBeTruthy();
    });
  }

  for (const [args, index] of [
    "s ui api",
    "s -s ui api",
    "shared ui -s api",
  ].map((item, index) => [item, index] as const)) {
    const argsSplit = args.split(" ");
    test(`shared with different segment syntaxes (${index})`, async () => {
      const project = join(temporaryDirectory, `shared-with-segments-${index}`);
      await deleteAsync(project, { force: true });
      await execa(
        "pnpm",
        [
          "create",
          "vite",

          `shared-with-segments-${index}`,
          "--template",
          "preact-ts",
        ],
        { cwd: temporaryDirectory },
      );
      await execa("node", [fsd, ...argsSplit], { cwd: join(project, "src") });

      await expect(
        fs.stat(join(project, "src/shared/ui/index.ts")),
      ).resolves.toBeTruthy();
      await expect(
        fs.stat(join(project, "src/shared/api/index.ts")),
      ).resolves.toBeTruthy();
    });
  }
});
