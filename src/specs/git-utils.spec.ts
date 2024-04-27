import { afterEach, describe, expect, test, vi } from "vitest";
import { getIgnoredFolders, isGitRepo } from "../git-utils";
import execSh from "exec-sh";

describe("getIgnoredFolders", async () => {
  test("should return single value", async () => {
    vi.spyOn(execSh, "promise").mockReturnValue(
      new Promise((resolve) =>
        resolve({ stdout: `"node_modules"\n`, stderr: "" }),
      ),
    );

    const ignoredFolders = await getIgnoredFolders([]);

    expect(ignoredFolders).toEqual(["node_modules"]);
  });

  test("should return multiple value", async () => {
    vi.spyOn(execSh, "promise").mockReturnValue(
      new Promise((resolve) =>
        resolve({ stdout: `"node_modules"\n"dist"\n".git"`, stderr: "" }),
      ),
    );

    const ignoredFolders = await getIgnoredFolders([]);

    expect(ignoredFolders).toEqual(["node_modules", "dist", ".git"]);
  });

  test("should return empty value on error code != 1", async () => {
    vi.spyOn(execSh, "promise").mockImplementation(() => {
      const error = new Error("Some random error");

      // @ts-expect-error exec-sh has custom Error
      error.code = 2;

      return Promise.reject(error);
    });

    expect(getIgnoredFolders([])).rejects.toThrow("Some random error");
  });

  test("should throw error on error code == 1", async () => {
    vi.spyOn(execSh, "promise").mockImplementation(() => {
      const error = new Error("error");

      // @ts-expect-error exec-sh has custom Error
      error.code = 1;

      return Promise.reject(error);
    });

    const ignoredFolders = await getIgnoredFolders([]);

    expect(ignoredFolders).toEqual([""]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
});

describe("isGitRepo", () => {
  test("should return true", async () => {
    vi.spyOn(execSh, "promise").mockReturnValue(
      new Promise((resolve) => resolve({ stdout: ` true `, stderr: "" })),
    );

    const result = await isGitRepo();

    expect(result).toBe(true);
  });

  test("should return false", async () => {
    vi.spyOn(execSh, "promise").mockReturnValue(
      new Promise((resolve) => resolve({ stdout: ` false `, stderr: "" })),
    );

    const result = await isGitRepo();

    expect(result).toBe(false);
  });

  test("should return false on error", async () => {
    vi.spyOn(execSh, "promise").mockReturnValue(
      Promise.reject(new Error("Is not a git repo!")),
    );

    const result = await isGitRepo();

    expect(result).toBe(false);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
});
