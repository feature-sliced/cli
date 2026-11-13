import { readdir, readFile } from "fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const supportedFrameworkPackages = ["next"] as const;
export type SupportedFrameworkPackage =
  (typeof supportedFrameworkPackages)[number];

const supportedPackages = [
  ...supportedFrameworkPackages,
  "typescript",
] as const;
export type SupportedPackage = (typeof supportedPackages)[number];
export type SupportedNonFrameworkPackage = Exclude<
  SupportedPackage,
  SupportedFrameworkPackage
>;

export type ProjectPackages = {
  framework?: SupportedFrameworkPackage;
  packages: SupportedPackage[];
};

export type ProjectSettings = {
  framework?: SupportedFrameworkPackage;
  packages: SupportedPackage[];
  isTypeScriptProject: boolean;
  projectRoot?: string;
};

export async function pathContainsItem(
  path: string,
  itemName: string,
  itemType?: "file" | "directory",
): Promise<boolean> {
  if (!existsSync(path)) return false;

  const files = await readdir(path, { withFileTypes: true });

  return files
    .filter((file) => {
      if (itemType === "file") return file.isFile();
      if (itemType === "directory") return file.isDirectory();
      return true;
    })
    .some((file) => file.name === itemName);
}

export async function findFileUpwards(
  fileName: string,
  startDirectory = process.cwd(),
): Promise<string | undefined> {
  let currentPath = resolve(startDirectory);
  let prevPath = "";

  while (currentPath !== prevPath) {
    if (await pathContainsItem(currentPath, fileName, "file")) {
      return resolve(currentPath, fileName);
    }

    prevPath = currentPath;
    currentPath = resolve(currentPath, "..");
  }

  return undefined;
}

export async function getProjectSettings(
  startDirectory?: string | null,
): Promise<ProjectSettings> {
  const packageJsonPath = await findFileUpwards(
    "package.json",
    startDirectory || undefined,
  );

  const projectPackages = await detectProjectPackages(packageJsonPath);
  const isTypeScriptProject = await hasTypeScriptConfig();

  return {
    framework: projectPackages.framework,
    packages: projectPackages.packages,
    isTypeScriptProject:
      isTypeScriptProject || projectPackages.packages.includes("typescript"),
    projectRoot: packageJsonPath ? dirname(packageJsonPath) : undefined,
  };
}

export async function detectProjectPackages(
  packageJsonPath?: string | null,
): Promise<ProjectPackages> {
  if (!packageJsonPath) return { packages: [] };

  const packageJson = await readFile(packageJsonPath, "utf-8");
  const json = JSON.parse(packageJson);

  const supportedPackagesInProject = supportedPackages.filter(
    (pkg) => json?.dependencies?.[pkg] || json?.devDependencies?.[pkg],
  );

  return {
    framework: detectProjectFramework(
      supportedPackagesInProject,
      packageJsonPath,
    ),
    packages: supportedPackagesInProject,
  };
}

export function detectProjectFramework(
  packages: SupportedPackage[],
  packageJsonPath: string,
): SupportedFrameworkPackage | undefined {
  const frameworks: SupportedFrameworkPackage[] =
    supportedFrameworkPackages.filter((pkg) => packages.includes(pkg));

  if (frameworks.length > 1) {
    throw new Error(
      `Multiple supported frameworks were found in ${packageJsonPath}: ${frameworks.join(
        ", ",
      )}. The framework cannot be selected automatically.`,
    );
  }

  return frameworks[0];
}

export async function hasTypeScriptConfig(): Promise<boolean> {
  const packageJsonPath = await findFileUpwards("package.json");

  return packageJsonPath
    ? await pathContainsItem(dirname(packageJsonPath), "tsconfig.json", "file")
    : false;
}
