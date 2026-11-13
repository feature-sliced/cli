import { promises as fs } from "node:fs";
import os from "node:os";
import { basename, dirname, join } from "node:path";
import { execa } from "execa";
import { afterEach, describe, expect, test } from "vitest";

import { getFsdBinPath } from "./get-fsd-bin-path";
import { TIMEOUT } from "./timeout";

const temporaryDirectory = await fs.realpath(os.tmpdir());
const fsd = await getFsdBinPath();
const projects: string[] = [];
const routerContent = "export default function Page() { return null; }\n";
const srcRouterFiles = {
  "src/app/page.tsx": routerContent,
  "src/pages/index.tsx": routerContent,
};

interface ProjectOptions {
  directories?: readonly string[];
  files?: Readonly<Record<string, string>>;
  typescript?: boolean;
}

async function createProject({
  directories = [],
  files = {},
  typescript = true,
}: ProjectOptions = {}) {
  const project = await fs.mkdtemp(join(temporaryDirectory, "fsd-next-"));
  projects.push(project);

  // Test the CLI against a Next.js project without running Next.js itself.
  await fs.writeFile(
    join(project, "package.json"),
    JSON.stringify({
      private: true,
      dependencies: { next: "*" },
      devDependencies: typescript ? { typescript: "*" } : {},
    }),
  );
  if (typescript) {
    await fs.writeFile(join(project, "tsconfig.json"), "{}");
  }

  for (const directory of directories) {
    await fs.mkdir(join(project, directory), { recursive: true });
  }
  for (const [file, content] of Object.entries(files)) {
    const filePath = join(project, file);
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }

  return project;
}

function runFsd(cwd: string, args: readonly string[]) {
  return execa(process.execPath, [fsd, ...args], {
    cwd,
    stdin: "ignore",
    timeout: TIMEOUT / 4,
  });
}

async function expectEmptyFiles(root: string, files: readonly string[]) {
  for (const file of files) {
    await expect(fs.readFile(join(root, file), "utf8")).resolves.toBe("");
  }
}

async function expectDirectories(root: string, directories: readonly string[]) {
  for (const directory of directories) {
    expect((await fs.stat(join(root, directory))).isDirectory()).toBe(true);
  }
}

async function expectMissing(root: string, paths: readonly string[]) {
  for (const path of paths) {
    await expect(fs.stat(join(root, path))).rejects.toMatchObject({
      code: "ENOENT",
    });
  }
}

afterEach(async () => {
  for (const project of projects) {
    if (
      dirname(project) !== temporaryDirectory ||
      !basename(project).startsWith("fsd-next-")
    ) {
      throw new Error(`Refusing to delete an unrelated directory: ${project}`);
    }
    await fs.rm(project, { recursive: true, force: true });
  }
  projects.length = 0;
});

describe("Next.js: FSD root detection", () => {
  test.each([
    { name: "without src", directories: [] },
    { name: "with an empty src", directories: ["src"] },
  ])(
    "uses cwd when no FSD root is found: $name",
    async ({ directories }) => {
      const project = await createProject({ directories });

      await runFsd(project, ["features", "auth"]);

      await expectEmptyFiles(project, ["features/auth/index.ts"]);
      await expectMissing(project, ["fsd", "src/fsd", "src/features"]);
    },
    TIMEOUT,
  );

  test(
    "uses a nested cwd without underscores when no FSD root is found",
    async () => {
      const project = await createProject({
        directories: ["src", "tools/client"],
      });
      const cwd = join(project, "tools/client");

      await runFsd(cwd, ["pages", "home"]);
      await runFsd(cwd, ["app", "providers"]);

      await expectEmptyFiles(cwd, [
        "pages/home/index.ts",
        "app/providers/index.ts",
      ]);
      await expectMissing(project, ["pages", "app", "src/pages", "fsd"]);
      await expectMissing(cwd, ["_app", "_pages", "fsd"]);
    },
    TIMEOUT,
  );

  test.each([".", "src", "source/domain"])(
    "generates files in the detected FSD root %s",
    async (root) => {
      const project = await createProject({
        directories: [join(root, "features"), join(root, "shared")],
      });

      await runFsd(project, ["widgets", "header"]);

      await expectEmptyFiles(join(project, root), ["widgets/header/index.ts"]);
      if (root !== ".") {
        await expectMissing(project, ["widgets"]);
      }
    },
    TIMEOUT,
  );

  test(
    "does not treat root router directories as layers when searching for an existing FSD root",
    async () => {
      const project = await createProject({
        directories: ["src/features", "src/shared"],
        files: {
          "app/page.tsx": routerContent,
          "pages/index.tsx": routerContent,
        },
      });

      await runFsd(project, ["widgets", "header"]);

      await expectEmptyFiles(project, ["src/widgets/header/index.ts"]);
      await expectMissing(project, ["widgets", "app/widgets", "pages/widgets"]);
    },
    TIMEOUT,
  );

  test.each([
    { name: "there are no root routers", directories: [] },
    { name: "there is only a root app directory", directories: ["app"] },
    { name: "there is only a root pages directory", directories: ["pages"] },
  ])(
    "does not treat src/app and src/pages as layers when $name",
    async ({ directories }) => {
      const project = await createProject({
        directories: [...directories, "domain/features", "domain/shared"],
        files: {
          "src/app/page.tsx": routerContent,
          "src/pages/index.tsx": routerContent,
        },
      });

      await runFsd(project, ["widgets", "header"]);

      await expectEmptyFiles(project, ["domain/widgets/header/index.ts"]);
      await expectMissing(project, ["widgets", "src/widgets"]);
    },
    TIMEOUT,
  );

  test(
    "recognizes src/app and src/pages as FSD layers when both root routers exist",
    async () => {
      const project = await createProject({
        directories: ["app", "pages", "src/app", "src/pages"],
      });

      await runFsd(project, ["widgets", "header"]);

      await expectEmptyFiles(project, ["src/widgets/header/index.ts"]);
      await expectMissing(project, ["widgets"]);
    },
    TIMEOUT,
  );

  test.each([
    { app: "_app", pages: "_pages" },
    { app: "0_app", pages: "1_pages" },
  ])(
    "finds a nested FSD root using the $app and $pages layers",
    async ({ app, pages }) => {
      const project = await createProject({
        directories: [join("domain", app), join("domain", pages)],
      });

      await runFsd(project, ["widgets", "header"]);

      await expectEmptyFiles(project, ["domain/widgets/header/index.ts"]);
      await expectMissing(project, ["widgets"]);
    },
    TIMEOUT,
  );
});

interface NamingCase {
  name: string;
  root: string;
  directories: string[];
  files?: Record<string, string>;
  appLayer: string;
  pagesLayer: string;
}

const namingCases: NamingCase[] = [
  {
    name: "in the project root without src",
    root: ".",
    directories: [],
    appLayer: "_app",
    pagesLayer: "_pages",
  },
  {
    name: "in the project root without src and with both routers",
    root: ".",
    directories: ["app", "pages"],
    files: {
      "app/page.tsx": routerContent,
      "pages/index.tsx": routerContent,
    },
    appLayer: "_app",
    pagesLayer: "_pages",
  },
  {
    name: "in the project root with src and both root routers",
    root: ".",
    directories: ["src", "app", "pages"],
    appLayer: "_app",
    pagesLayer: "_pages",
  },
  {
    name: "in src with both root routers",
    root: "src",
    directories: ["app", "pages"],
    appLayer: "app",
    pagesLayer: "pages",
  },
  {
    name: "in src without root routers",
    root: "src",
    directories: [],
    files: srcRouterFiles,
    appLayer: "_app",
    pagesLayer: "_pages",
  },
  {
    name: "in src with only a root app directory",
    root: "src",
    directories: ["app"],
    files: srcRouterFiles,
    appLayer: "_app",
    pagesLayer: "_pages",
  },
  {
    name: "in src with only a root pages directory",
    root: "src",
    directories: ["pages"],
    files: srcRouterFiles,
    appLayer: "_app",
    pagesLayer: "_pages",
  },
  {
    name: "in src with an app file instead of a directory",
    root: "src",
    directories: ["pages"],
    files: {
      ...srcRouterFiles,
      app: "This is a file, not a routing directory.",
    },
    appLayer: "_app",
    pagesLayer: "_pages",
  },
  {
    name: "in src with a pages file instead of a directory",
    root: "src",
    directories: ["app"],
    files: {
      ...srcRouterFiles,
      pages: "This is a file, not a routing directory.",
    },
    appLayer: "_app",
    pagesLayer: "_pages",
  },
  {
    name: "in another directory without src",
    root: "domain",
    directories: ["app", "pages"],
    appLayer: "app",
    pagesLayer: "pages",
  },
  {
    name: "in a nested src directory",
    root: "src/domain",
    directories: ["app"],
    appLayer: "app",
    pagesLayer: "pages",
  },
];

describe("Next.js: App and Pages names for the actual FSD root", () => {
  test.each(namingCases)(
    "$name: creates $appLayer and $pagesLayer",
    async ({ root, directories, files, appLayer, pagesLayer }) => {
      const project = await createProject({
        directories: [
          ...directories,
          join(root, "features"),
          join(root, "shared"),
        ],
        files,
      });
      const fsdRoot = join(project, root);

      await runFsd(project, ["app", "providers", "config"]);
      await runFsd(project, ["pages", "home", "--segments", "ui", "model"]);

      await expectEmptyFiles(fsdRoot, [
        `${appLayer}/providers/index.ts`,
        `${appLayer}/config/index.ts`,
        `${pagesLayer}/home/index.ts`,
      ]);
      await expectDirectories(fsdRoot, [
        `${pagesLayer}/home/ui`,
        `${pagesLayer}/home/model`,
      ]);
      await expectMissing(fsdRoot, [
        `${appLayer}/index.ts`,
        `${pagesLayer}/home/ui/index.ts`,
      ]);
      if (appLayer === "_app") {
        await expectMissing(fsdRoot, ["app/providers", "pages/home"]);
      } else {
        await expectMissing(fsdRoot, ["_app", "_pages"]);
      }
      for (const [file, content] of Object.entries(files ?? {})) {
        await expect(fs.readFile(join(project, file), "utf8")).resolves.toBe(
          content,
        );
      }
    },
    TIMEOUT,
  );
});

describe("Next.js: layer and slice generation", () => {
  test.each([
    {
      flag: "--numbering",
      command: "widgets",
      root: "domain",
      explicitRoot: false,
      numberedLayer: "3_widgets",
    },
    {
      flag: "-n",
      command: "pages",
      root: "src",
      explicitRoot: true,
      numberedLayer: "2_pages",
    },
  ])(
    "creates $numberedLayer with $flag, explicit root: $explicitRoot",
    async ({ flag, command, root, explicitRoot, numberedLayer }) => {
      const project = await createProject({
        directories: [join(root, "features"), join(root, "shared")],
        files: srcRouterFiles,
      });
      const args = [command, "profile", flag];
      if (explicitRoot) args.push("--root", root);

      await runFsd(project, args);

      const fsdRoot = join(project, root);
      await expectEmptyFiles(fsdRoot, [`${numberedLayer}/profile/index.ts`]);
      await expectMissing(fsdRoot, [
        `${command}/profile`,
        `_${command}/profile`,
      ]);
      for (const [file, content] of Object.entries(srcRouterFiles)) {
        await expect(fs.readFile(join(project, file), "utf8")).resolves.toBe(
          content,
        );
      }
    },
    TIMEOUT,
  );

  test.each([
    { root: ".", absolute: false },
    { root: "src", absolute: false },
    { root: "custom/fsd", absolute: false },
    { root: "custom/fsd", absolute: true },
  ])(
    "uses an explicit --root=$root, absolute path: $absolute",
    async ({ root, absolute }) => {
      const project = await createProject({
        directories: ["existing/features", "existing/shared"],
      });
      const fsdRoot = join(project, root);

      await runFsd(project, [
        "entities",
        "user",
        "--root",
        absolute ? fsdRoot : root,
      ]);

      await expectEmptyFiles(fsdRoot, ["entities/user/index.ts"]);
      await expectMissing(project, ["existing/entities"]);
      if (root !== ".") {
        await expectMissing(project, ["entities"]);
      }
    },
    TIMEOUT,
  );

  test(
    "creates a layer without slices or an index file",
    async () => {
      const project = await createProject();

      await runFsd(project, ["features"]);

      await expect(fs.readdir(join(project, "features"))).resolves.toEqual([]);
    },
    TIMEOUT,
  );

  test.each([
    { typescript: true, extension: "ts", otherExtension: "js" },
    { typescript: false, extension: "js", otherExtension: "ts" },
  ])(
    "creates multiple slices with index.$extension and segments",
    async ({ typescript, extension, otherExtension }) => {
      const project = await createProject({ typescript });

      await runFsd(project, [
        "entities",
        "user",
        "organization",
        "--segments",
        "ui",
        "api",
      ]);

      await expectEmptyFiles(project, [
        `entities/user/index.${extension}`,
        `entities/organization/index.${extension}`,
      ]);
      await expectDirectories(project, [
        "entities/user/ui",
        "entities/user/api",
        "entities/organization/ui",
        "entities/organization/api",
      ]);
      await expectMissing(project, [
        `entities/user/index.${otherExtension}`,
        `entities/organization/index.${otherExtension}`,
        `entities/user/ui/index.${extension}`,
      ]);
    },
    TIMEOUT,
  );

  test(
    "creates Shared segments directly inside the layer",
    async () => {
      const project = await createProject();

      await runFsd(project, ["shared", "ui", "api"]);

      await expectEmptyFiles(project, [
        "shared/ui/index.ts",
        "shared/api/index.ts",
      ]);
      await expectMissing(project, ["shared/index.ts"]);
    },
    TIMEOUT,
  );

  test.each([
    { app: "_app", pages: "_pages", features: "features", shared: "shared" },
    {
      app: "0_app",
      pages: "1_pages",
      features: "3_features",
      shared: "5_shared",
    },
    {
      app: "1_app",
      pages: "2_pages",
      features: "4_features",
      shared: "6_shared",
    },
  ])(
    "reuses existing $app, $pages, $features and $shared without duplicates",
    async ({ app, pages, features, shared }) => {
      const existingIndex = "export const existing = true;\n";
      const project = await createProject({
        directories: [app, features, shared].map((layer) =>
          join("domain", layer),
        ),
        files: {
          [`domain/${pages}/existing/index.ts`]: existingIndex,
          "app/page.tsx": routerContent,
          "pages/index.tsx": routerContent,
        },
      });
      const fsdRoot = join(project, "domain");

      await runFsd(project, ["app", "providers"]);
      await runFsd(project, ["pages", "home"]);
      await runFsd(project, ["features", "auth"]);
      await runFsd(project, ["shared", "ui"]);

      await expectEmptyFiles(fsdRoot, [
        `${app}/providers/index.ts`,
        `${pages}/home/index.ts`,
        `${features}/auth/index.ts`,
        `${shared}/ui/index.ts`,
      ]);
      expect((await fs.readdir(fsdRoot)).sort()).toEqual(
        [app, pages, features, shared].sort(),
      );
      await expect(
        fs.readFile(join(fsdRoot, pages, "existing/index.ts"), "utf8"),
      ).resolves.toBe(existingIndex);
      await expectMissing(project, ["features", "shared", "_app", "_pages"]);
      await expect(
        fs.readFile(join(project, "app/page.tsx"), "utf8"),
      ).resolves.toBe(routerContent);
      await expect(
        fs.readFile(join(project, "pages/index.tsx"), "utf8"),
      ).resolves.toBe(routerContent);
    },
    TIMEOUT,
  );

  test(
    "preserves content and adds missing segments on repeated runs",
    async () => {
      const indexContent = 'export { SignIn } from "./ui/sign-in";\n';
      const componentContent = "export const SignIn = () => null;\n";
      const project = await createProject({
        directories: ["shared"],
        files: {
          "features/auth/index.ts": indexContent,
          "features/auth/ui/sign-in.tsx": componentContent,
        },
      });
      const args = ["features", "auth", "--segments", "ui", "model"];

      await runFsd(project, args);
      await runFsd(project, args);

      await expectDirectories(project, ["features/auth/model"]);
      await expect(
        fs.readFile(join(project, "features/auth/index.ts"), "utf8"),
      ).resolves.toBe(indexContent);
      await expect(
        fs.readFile(join(project, "features/auth/ui/sign-in.tsx"), "utf8"),
      ).resolves.toBe(componentContent);
      await expect(fs.readdir(join(project, "features"))).resolves.toEqual([
        "auth",
      ]);
      expect((await fs.readdir(join(project, "features/auth"))).sort()).toEqual(
        ["index.ts", "model", "ui"],
      );
    },
    TIMEOUT,
  );
});
