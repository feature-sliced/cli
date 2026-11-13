import { LayerName } from "@feature-sliced/filesystem";
import {
  ProjectSettings,
  SupportedFrameworkPackage,
  SupportedNonFrameworkPackage,
} from "./detect-project-packages";
import { lstatSync } from "node:fs";
import { resolve } from "path";
import type { CreationRequest } from "./generate-files";

export interface SearchRules {
  searchRoot?: string;
  excludedDirectories: readonly string[];
}

export interface GenerationRules {
  indexExtension: "ts" | "js";
  useNumbering: boolean;
  underscoreLayers: readonly LayerName[];
}

export interface FsdRules {
  search: SearchRules;
  generation: GenerationRules;
}

interface RuleOverrides {
  search?: Partial<Pick<SearchRules, "excludedDirectories">>;
  generation?: Partial<Pick<GenerationRules, "underscoreLayers">>;
}

type Handler = (
  projectSettings: ProjectSettings,
  cliArguments: CreationRequest,
  fsdRoot?: string,
) => Promise<RuleOverrides>;

type RuleHandlerMap<T extends PropertyKey> = Partial<Record<T, Handler>>;

const handlersFramework: RuleHandlerMap<SupportedFrameworkPackage> = {
  next: getNextRules,
};

const handlersPackage: RuleHandlerMap<SupportedNonFrameworkPackage> = {};

export async function getRules(
  projectSettings: ProjectSettings,
  cliArguments: CreationRequest,
  fsdRoot?: string,
): Promise<FsdRules> {
  const frameworkRules = projectSettings.framework
    ? await handlersFramework[projectSettings.framework]?.(
        projectSettings,
        cliArguments,
        fsdRoot,
      )
    : undefined;
  const overrides: RuleOverrides[] = frameworkRules ? [frameworkRules] : [];

  for (const [packageName, handler] of Object.entries(handlersPackage)) {
    if (
      handler &&
      projectSettings.packages.some((pkg) => pkg === packageName)
    ) {
      overrides.push(await handler(projectSettings, cliArguments, fsdRoot));
    }
  }

  const rules: FsdRules = {
    search: {
      searchRoot: projectSettings.projectRoot,
      excludedDirectories: [],
    },
    generation: {
      indexExtension: projectSettings.isTypeScriptProject ? "ts" : "js",
      useNumbering: cliArguments.useNumbering ?? false,
      underscoreLayers: [],
    },
  };

  return mergeRuleOverrides(rules, overrides);
}

export function mergeRuleOverrides(
  rules: FsdRules,
  overrides: readonly RuleOverrides[],
): FsdRules {
  return {
    search: {
      ...rules.search,
      excludedDirectories: [
        ...new Set([
          ...rules.search.excludedDirectories,
          ...overrides.flatMap(
            (rule) => rule.search?.excludedDirectories ?? [],
          ),
        ]),
      ],
    },
    generation: {
      ...rules.generation,
      underscoreLayers: [
        ...new Set([
          ...rules.generation.underscoreLayers,
          ...overrides.flatMap(
            (rule) => rule.generation?.underscoreLayers ?? [],
          ),
        ]),
      ],
    },
  };
}

export async function getNextRules(
  projectSettings: ProjectSettings,
  cliArguments: CreationRequest,
  fsdRoot?: string,
): Promise<RuleOverrides> {
  if (!projectSettings.projectRoot) return {};

  const appRouterInRootProjectPath = resolve(
    projectSettings.projectRoot,
    "app",
  );
  const pagesRouterInRootProjectPath = resolve(
    projectSettings.projectRoot,
    "pages",
  );

  const hasAppRouterInRootProject = isDirectory(appRouterInRootProjectPath);
  const hasPagesRouterInRootProject = isDirectory(pagesRouterInRootProjectPath);

  const hasBothRoutersInRootProject =
    hasAppRouterInRootProject && hasPagesRouterInRootProject;

  const underscoreLayers: LayerName[] = [];
  const excludedDirectories = [
    appRouterInRootProjectPath,
    pagesRouterInRootProjectPath,
  ];

  if (!hasBothRoutersInRootProject) {
    excludedDirectories.push(
      resolve(projectSettings.projectRoot, "src", "app"),
    );
    excludedDirectories.push(
      resolve(projectSettings.projectRoot, "src", "pages"),
    );
  }

  if (fsdRoot && !cliArguments.useNumbering) {
    const fsdRootInRootProjectPath = fsdRoot === projectSettings.projectRoot;
    const fsdRootInSrcPath =
      fsdRoot === resolve(projectSettings.projectRoot, "src");

    if (
      fsdRootInRootProjectPath ||
      (fsdRootInSrcPath && !hasBothRoutersInRootProject)
    ) {
      underscoreLayers.push("app");
      underscoreLayers.push("pages");
    }
  }

  return {
    search: {
      excludedDirectories,
    },
    generation: {
      underscoreLayers,
    },
  };
}

function isDirectory(path: string): boolean {
  try {
    const stats = lstatSync(path);
    return stats.isDirectory();
  } catch (e) {
    return false;
  }
}
