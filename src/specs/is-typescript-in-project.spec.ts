import { afterEach, describe, expect, test, vi } from "vitest";
import mockFs from "mock-fs";
import {
  isPathContainsItem,
  isTypeScriptInProject,
} from "../is-typescript-in-project";
import path from "path";

describe("isPathContainsItem", () => {
  test("item exists in path", async () => {
    mockFs({
      "/someFile.json": "{}",
    });

    const result = await isPathContainsItem("/", "someFile.json");

    expect(result).toBe(true);
  });

  test("item doesn't exists in path", async () => {
    mockFs({
      "/someOtherFile.json": "{}",
    });

    const result = await isPathContainsItem("/", "someFile.json");

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

    const result = await isTypeScriptInProject();

    expect(result).toBe(true);
  });

  test("package.json and tsconfig.json exists in parent dir", async () => {
    mockFs({
      "/package.json": "{}",
      "/tsconfig.json": "{}",
      "/test": {},
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/test"));

    const result = await isTypeScriptInProject();

    expect(result).toBe(true);
  });

  test("package.json exists, tsconfig.json doesn't exists in current dir", async () => {
    mockFs({
      "/package.json": "{}",
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/"));

    const result = await isTypeScriptInProject();

    expect(result).toBe(false);
  });

  test("package.json exists, tsconfig.json doesn't exists in parent dir", async () => {
    mockFs({
      "/package.json": "{}",
      "/test": {},
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/test"));

    const result = await isTypeScriptInProject();

    expect(result).toBe(false);
  });

  test("package.json and tsconfig.json doesn't exists in current dir", async () => {
    mockFs({
      "/someOtherFile.json": "{}",
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/"));

    const result = await isTypeScriptInProject();

    expect(result).toBe(false);
  });

  test("package.json and tsconfig.json doesn't exists in parent dir", async () => {
    mockFs({
      "/someOtherFile.json": "{}",
      "/test": {},
    });

    vi.spyOn(process, "cwd").mockReturnValueOnce(path.resolve("/test"));

    const result = await isTypeScriptInProject();

    expect(result).toBe(false);
  });

  afterEach(() => {
    mockFs.restore();
    vi.resetAllMocks();
  });
});
