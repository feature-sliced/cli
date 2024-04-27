import execSh from "exec-sh";
import path from "path";

export async function executeCommand(
  command: string,
): Promise<{ stdout: string; stderr: string }> {
  return await execSh.promise(command, {
    cwd: process.cwd(),
    stdio: null,
  });
}

export async function getIgnoredFolders(paths: string[]): Promise<string[]> {
  const { stdout } = await executeCommand(
    `git check-ignore ${paths.join(" ")}`,
  ).catch((error) => {
    // Git check-ignore returns code 1 if no ignored files are found
    if (error.code === 1) {
      return {
        stdout: "",
      };
    } else {
      throw error;
    }
  });

  // Git check-ignore for absolute path return path in double quotes, so we need remove `"` from start and end, and normalize path
  return stdout
    .trim()
    .split("\n")
    .map((folder) => path.normalize(folder).slice(1, -1));
}

export async function isGitRepo(): Promise<boolean> {
  try {
    const { stdout } = await executeCommand(
      "git rev-parse --is-inside-work-tree",
    );

    return stdout.trim() === "true";
  } catch {
    return false;
  }
}
