import { afterEach, describe, expect, test, vi } from "vitest";
import mockFs from "mock-fs";
import path from "path";
import { detectFsdRoot, getLayersCountInFolder } from "../detect-fsd-root";

describe("getLayersCountInFolder", () => {
  test("only 2 layers", async () => {
    mockFs(
      {
        "/app": {},
        "/features": {},
      },
      { createCwd: false, createTmp: false },
    );

    const result = await getLayersCountInFolder(path.resolve("/"));

    expect(result).toBe(2);
  });

  test("layer should be folder", async () => {
    mockFs(
      {
        "/app": "some file content",
      },
      { createCwd: false, createTmp: false },
    );

    const result = await getLayersCountInFolder(path.resolve("/"));

    expect(result).toBe(0);
  });

  test("2 wrong layers", async () => {
    mockFs(
      {
        "/test-app": {},
        "/flat-pages": {},
      },
      { createCwd: false, createTmp: false },
    );

    const result = await getLayersCountInFolder(path.resolve("/"));

    expect(result).toBe(0);
  });

  test("2 layers and other folder", async () => {
    mockFs(
      {
        "/app": {},
        "/features": {},
        "/someOtherFolder": {},
      },
      { createCwd: false, createTmp: false },
    );

    const result = await getLayersCountInFolder(path.resolve("/"));

    expect(result).toBe(2);
  });

  afterEach(() => {
    mockFs.restore();
  });
});

describe("detectFsdRoot", () => {
  test("2 layers in current dir", async () => {
    mockFs(
      {
        "/app": {},
        "/features": {},
      },
      { createCwd: false, createTmp: false },
    );

    vi.spyOn(process, "cwd").mockReturnValue(path.resolve("/"));

    const result = await detectFsdRoot();

    expect(result).toBe(path.resolve("/"));
  });

  test("2 layers in child dir", async () => {
    mockFs(
      {
        "/src/app": {},
        "/src/features": {},
      },
      { createCwd: false, createTmp: false },
    );

    vi.spyOn(process, "cwd").mockReturnValue(path.resolve("/"));

    const result = await detectFsdRoot();

    expect(result).toBe(path.resolve("/src"));
  });

  test("2 layers in current dir, 2 layers in child dir", async () => {
    mockFs(
      {
        "/app": {},
        "/features": {},
        "/src/app": {},
        "/src/features": {},
      },
      { createCwd: false, createTmp: false },
    );

    vi.spyOn(process, "cwd").mockReturnValue(path.resolve("/"));

    const result = await detectFsdRoot();

    expect(result).toStrictEqual(path.resolve("/"));
  });

  test("2 layers in first child dir, 3 layers in second child dir", async () => {
    mockFs(
      {
        "/src/app": {},
        "/src/features": {},
        "/src2/app": {},
        "/src2/features": {},
        "/src2/pages": {},
      },
      { createCwd: false, createTmp: false },
    );

    vi.spyOn(process, "cwd").mockReturnValue(path.resolve("/"));

    const result = await detectFsdRoot();

    expect(result).toBe(path.resolve("/src2"));
  });

  test("2 layers in first child dir, 2 layers in second child dir", async () => {
    mockFs(
      {
        "/src/app": {},
        "/src/features": {},
        "/src2/app": {},
        "/src2/features": {},
      },
      { createCwd: false, createTmp: false },
    );

    vi.spyOn(process, "cwd").mockReturnValue(path.resolve("/"));

    const result = await detectFsdRoot();

    expect(result).toStrictEqual([path.resolve("/src"), path.resolve("/src2")]);
  });

  test("2 layers in child dir, 2 layers in second child dir, should ignore second folder", async () => {
    mockFs(
      {
        "/src/app": {},
        "/src/features": {},
        "/dist/app": {},
        "/dist/features": {},
      },
      { createCwd: false, createTmp: false },
    );

    vi.spyOn(process, "cwd").mockReturnValue(path.resolve("/"));

    const result = await detectFsdRoot();

    expect(result).toBe(path.resolve("/src"));
  });

  afterEach(() => {
    mockFs.restore();
    vi.resetAllMocks();
  });
});
