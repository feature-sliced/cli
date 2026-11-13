import { afterEach, describe, expect, test, vi } from "vitest";
import { lstatSync } from "node:fs";
import path from "path";
import type { ProjectSettings } from "../detect-project-packages";
import type { CreationRequest } from "../generate-files";
import { getNextRules, getRules, mergeRuleOverrides } from "../rules";

const cliArguments: CreationRequest = {
  layer: "features",
  slices: [],
  segments: [],
  rootOverride: null,
  useNumbering: false,
};

vi.mock("node:fs", () => ({
  lstatSync: vi.fn(),
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("getRules", () => {
  const projectRoot = path.resolve("/project");

  test.each([
    { isTypeScriptProject: true, indexExtension: "ts" },
    { isTypeScriptProject: false, indexExtension: "js" },
  ])(
    "selects $indexExtension based on isTypeScriptProject",
    async ({ isTypeScriptProject, indexExtension }) => {
      const rules = await getRules(
        {
          projectRoot,
          packages: ["typescript"],
          isTypeScriptProject,
        },
        cliArguments,
      );

      expect(rules).toEqual({
        search: {
          searchRoot: projectRoot,
          excludedDirectories: [],
        },
        generation: {
          indexExtension,
          useNumbering: false,
          underscoreLayers: [],
        },
      });
    },
  );

  test("leaves searchRoot undefined when projectRoot is missing", async () => {
    const rules = await getRules(
      {
        packages: [],
        isTypeScriptProject: false,
      },
      cliArguments,
    );

    expect(rules.search.searchRoot).toBeUndefined();
  });

  test("keeps base rules unchanged when packages includes or duplicates the framework", async () => {
    const projectSettings: ProjectSettings = {
      framework: "next",
      packages: ["typescript"],
      isTypeScriptProject: true,
    };
    const expectedRules = await getRules(projectSettings, cliArguments);

    for (const packages of [
      ["next", "typescript"],
      ["next", "typescript", "next"],
    ] as const) {
      const rules = await getRules(
        {
          ...projectSettings,
          packages: [...packages],
        },
        cliArguments,
      );

      expect(rules).toEqual(expectedRules);
    }
  });

  test.each([false, true])(
    "takes useNumbering=%s from CLI arguments after selecting the FSD root",
    async (useNumbering) => {
      const rules = await getRules(
        {
          projectRoot,
          framework: "next",
          packages: ["next"],
          isTypeScriptProject: true,
        },
        { ...cliArguments, useNumbering },
        path.resolve(projectRoot, "src"),
      );

      expect(rules.generation.useNumbering).toBe(useNumbering);
    },
  );
});

describe("mergeRuleOverrides", () => {
  const baseRules: Awaited<ReturnType<typeof getRules>> = {
    search: {
      searchRoot: "/project",
      excludedDirectories: ["node_modules"],
    },
    generation: {
      indexExtension: "ts",
      useNumbering: false,
      underscoreLayers: ["app"],
    },
  };

  test("merges arrays without duplicates in order of first occurrence", () => {
    const overrides = [
      {
        search: {
          excludedDirectories: ["node_modules", "app", "app"],
        },
        generation: { underscoreLayers: ["pages", "app", "pages"] },
      },
      {
        search: { excludedDirectories: ["pages", "app"] },
        generation: { underscoreLayers: ["pages", "shared"] },
      },
    ] as const;

    const result = mergeRuleOverrides(baseRules, overrides);

    expect(result.search.excludedDirectories).toEqual([
      "node_modules",
      "app",
      "pages",
    ]);
    expect(result.generation.underscoreLayers).toEqual([
      "app",
      "pages",
      "shared",
    ]);
    expect(baseRules.search.excludedDirectories).toEqual(["node_modules"]);
    expect(baseRules.generation.underscoreLayers).toEqual(["app"]);
    expect(overrides[0].search.excludedDirectories).toEqual([
      "node_modules",
      "app",
      "app",
    ]);
    expect(overrides[0].generation.underscoreLayers).toEqual([
      "pages",
      "app",
      "pages",
    ]);
  });

  test("accepts missing sections and empty arrays", () => {
    const result = mergeRuleOverrides(baseRules, [
      {},
      { search: {} },
      { generation: {} },
      { search: { excludedDirectories: [] } },
      { generation: { underscoreLayers: [] } },
    ]);

    expect(result).toEqual(baseRules);
    expect(mergeRuleOverrides(baseRules, [])).toEqual(baseRules);
  });

  test("ignores unrelated scalar fields returned by handlers", () => {
    const override = {
      search: {
        searchRoot: "/other-project",
        excludedDirectories: ["app"],
      },
      generation: {
        indexExtension: "js",
        useNumbering: true,
        underscoreLayers: ["pages"],
      },
    } as const;

    const result = mergeRuleOverrides(baseRules, [override]);

    expect(result).toEqual({
      search: {
        searchRoot: "/project",
        excludedDirectories: ["node_modules", "app"],
      },
      generation: {
        indexExtension: "ts",
        useNumbering: false,
        underscoreLayers: ["app", "pages"],
      },
    });
  });
});

describe("Rule handlers", () => {
  describe("getNextRules", () => {
    const projectRoot = path.resolve("/project");
    const projectSettings: ProjectSettings = {
      projectRoot,
      framework: "next",
      packages: ["next", "typescript"],
      isTypeScriptProject: true,
    };

    test("returns no overrides when projectRoot is missing", async () => {
      const rules = await getNextRules(
        {
          framework: "next",
          packages: ["next"],
          isTypeScriptProject: false,
        },
        cliArguments,
      );

      expect(rules).toEqual({});
      expect(lstatSync).not.toHaveBeenCalled();
    });

    describe("Search rules", () => {
      test.each([
        {
          description: "without router directories in the project root",
          routers: [],
          excludedDirectories: ["app", "pages", "src/app", "src/pages"],
        },
        {
          description: "with only an app directory in the project root",
          routers: ["app"],
          excludedDirectories: ["app", "pages", "src/app", "src/pages"],
        },
        {
          description: "with only a pages directory in the project root",
          routers: ["pages"],
          excludedDirectories: ["app", "pages", "src/app", "src/pages"],
        },
        {
          description: "with both router directories in the project root",
          routers: ["app", "pages"],
          excludedDirectories: ["app", "pages"],
        },
      ] as const)(
        "excludes router paths $description",
        async ({ routers, excludedDirectories }) => {
          vi.mocked(lstatSync, { partial: true }).mockImplementation(
            (filePath) => {
              if (
                !routers.some(
                  (router) => filePath === path.resolve(projectRoot, router),
                )
              ) {
                throw Object.assign(new Error("Directory not found"), {
                  code: "ENOENT",
                });
              }

              return { isDirectory: () => true };
            },
          );

          const rules = await getNextRules(projectSettings, cliArguments);

          expect(rules.search).toEqual({
            excludedDirectories: excludedDirectories.map((directory) =>
              path.resolve(projectRoot, directory),
            ),
          });
        },
      );
    });

    describe("Generation rules", () => {
      test.each([
        {
          description: "without a selected FSD root or root routers",
          fsdRoot: undefined,
          routers: [],
          underscoreLayers: [],
        },
        {
          description: "without a selected FSD root and with both root routers",
          fsdRoot: undefined,
          routers: ["app", "pages"],
          underscoreLayers: [],
        },
        {
          description: "in the project root without root routers",
          fsdRoot: projectRoot,
          routers: [],
          underscoreLayers: ["app", "pages"],
        },
        {
          description: "in the project root with both root routers",
          fsdRoot: projectRoot,
          routers: ["app", "pages"],
          underscoreLayers: ["app", "pages"],
        },
        {
          description: "in src without root routers",
          fsdRoot: path.resolve(projectRoot, "src"),
          routers: [],
          underscoreLayers: ["app", "pages"],
        },
        {
          description: "in src with only a root app directory",
          fsdRoot: path.resolve(projectRoot, "src"),
          routers: ["app"],
          underscoreLayers: ["app", "pages"],
        },
        {
          description: "in src with only a root pages directory",
          fsdRoot: path.resolve(projectRoot, "src"),
          routers: ["pages"],
          underscoreLayers: ["app", "pages"],
        },
        {
          description: "in src with both root routers",
          fsdRoot: path.resolve(projectRoot, "src"),
          routers: ["app", "pages"],
          underscoreLayers: [],
        },
        {
          description: "in another directory without root routers",
          fsdRoot: path.resolve(projectRoot, "fsd"),
          routers: [],
          underscoreLayers: [],
        },
        {
          description: "in another directory with both root routers",
          fsdRoot: path.resolve(projectRoot, "fsd"),
          routers: ["app", "pages"],
          underscoreLayers: [],
        },
      ] as const)(
        "selects underscoreLayers $description",
        async ({ fsdRoot, routers, underscoreLayers }) => {
          vi.mocked(lstatSync, { partial: true }).mockImplementation(
            (filePath) => {
              if (
                !routers.some(
                  (router) => filePath === path.resolve(projectRoot, router),
                )
              ) {
                throw Object.assign(new Error("Directory not found"), {
                  code: "ENOENT",
                });
              }

              return { isDirectory: () => true };
            },
          );

          const rules = await getNextRules(
            projectSettings,
            cliArguments,
            fsdRoot,
          );

          expect(rules.generation).toEqual({ underscoreLayers });
        },
      );
    });
  });
});
