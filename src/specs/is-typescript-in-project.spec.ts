import { afterEach, describe, expect, test, vi } from "vitest";
import mockFs from "mock-fs";
import path from "path";
import {
  pathContainsItem,
  hasTypeScriptConfig,
} from "../detect-project-packages";

describe("isPathContainsItem", () => {
  test("item exists in path", async () => {
    mockFs({
      "/someFile.json": "{}",
    });

    const result = await pathContainsItem("/", "someFile.json");

    expect(result).toBe(true);
  });

  test("item doesn't exists in path", async () => {
    mockFs({
      "/someOtherFile.json": "{}",
    });

    const result = await pathContainsItem("/", "someFile.json");

    expect(result).toBe(false);
  });

  afterEach(() => {
    mockFs.restore();
  });
});

describe("isTypeScriptInProject", () => {
  test("package.json and tsconfig.json exists in current dir", async () => {
    mockFs({
      "/package.json": "{}",
      "/tsconfig.json": "{}",
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce("/");

    const result = await hasTypeScriptConfig();

    expect(result).toBe(true);
  });

  test("package.json and tsconfig.json exists in parent dir", async () => {
    mockFs({
      "/package.json": "{}",
      "/tsconfig.json": "{}",
      "/test": {},
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/test"));

    const result = await hasTypeScriptConfig();

    expect(result).toBe(true);
  });

  test("package.json exists, tsconfig.json doesn't exists in current dir", async () => {
    mockFs({
      "/package.json": "{}",
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/"));

    const result = await hasTypeScriptConfig();

    expect(result).toBe(false);
  });

  test("package.json exists, tsconfig.json doesn't exists in parent dir", async () => {
    mockFs({
      "/package.json": "{}",
      "/test": {},
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/test"));

    const result = await hasTypeScriptConfig();

    expect(result).toBe(false);
  });

  test("package.json and tsconfig.json doesn't exists in current dir", async () => {
    mockFs({
      "/someOtherFile.json": "{}",
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/"));

    const result = await hasTypeScriptConfig();

    expect(result).toBe(false);
  });

  test("package.json and tsconfig.json doesn't exists in parent dir", async () => {
    mockFs({
      "/someOtherFile.json": "{}",
      "/test": {},
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/test"));

    const result = await hasTypeScriptConfig();

    expect(result).toBe(false);
  });

  afterEach(() => {
    mockFs.restore();
    vi.resetAllMocks();
  });
});
