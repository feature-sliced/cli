import { afterEach, beforeEach, describe, expect, test } from "vitest";
import mockFs from "mock-fs";
import path from "path";
import { generateFiles } from "../generate-files";
import fs from "fs/promises";

describe("generateFiles", () => {
  const pathExists = async (path: string) => {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  };

  beforeEach(() => {
    mockFs(
      {
        "/": {},
      },
      { createCwd: false, createTmp: false },
    );
  });

  test("create layer", async () => {
    await generateFiles(
      {
        layer: "features",
        slices: [],
        segments: [],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features"))).toBe(true);
  });

  test("create exists layer", async () => {
    mockFs(
      {
        "/features": {},
      },
      {
        createCwd: false,
        createTmp: false,
      },
    );

    await generateFiles(
      {
        layer: "features",
        slices: [],
        segments: [],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features"))).toBe(true);
  });

  test("create slice", async () => {
    await generateFiles(
      {
        layer: "features",
        slices: ["user"],
        segments: [],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features/user"))).toBe(true);
    expect(await pathExists(path.resolve("/features/user/index.js"))).toBe(
      true,
    );
  });

  test("create exists slice", async () => {
    mockFs(
      {
        "/features/user/index.js": "",
      },
      {
        createCwd: false,
        createTmp: false,
      },
    );

    await generateFiles(
      {
        layer: "features",
        slices: ["user"],
        segments: [],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features/user"))).toBe(true);
    expect(await pathExists(path.resolve("/features/user/index.js"))).toBe(
      true,
    );
  });

  test("create slice with typescript", async () => {
    await generateFiles(
      {
        layer: "features",
        slices: ["user"],
        segments: [],
        rootOverride: null,
      },
      path.resolve("/"),
      true,
    );

    expect(await pathExists(path.resolve("/features/user"))).toBe(true);
    expect(await pathExists(path.resolve("/features/user/index.ts"))).toBe(
      true,
    );
  });

  test("create multiple slices", async () => {
    await generateFiles(
      {
        layer: "features",
        slices: ["user", "auth"],
        segments: [],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features/user"))).toBe(true);
    expect(await pathExists(path.resolve("/features/auth"))).toBe(true);
    expect(await pathExists(path.resolve("/features/user/index.js"))).toBe(
      true,
    );
    expect(await pathExists(path.resolve("/features/auth/index.js"))).toBe(
      true,
    );
  });

  test("create grouped slices", async () => {
    await generateFiles(
      {
        layer: "features",
        slices: ["auth/sign-in", "auth/sign-out"],
        segments: [],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features/auth/sign-in"))).toBe(true);
    expect(await pathExists(path.resolve("/features/auth/sign-out"))).toBe(
      true,
    );
    expect(
      await pathExists(path.resolve("/features/auth/sign-in/index.js")),
    ).toBe(true);
    expect(
      await pathExists(path.resolve("/features/auth/sign-out/index.js")),
    ).toBe(true);
  });

  test("create segment", async () => {
    await generateFiles(
      {
        layer: "features",
        slices: ["user"],
        segments: ["ui"],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features/user/ui"))).toBe(true);
    expect(await pathExists(path.resolve("/features/user/index.js"))).toBe(
      true,
    );
  });

  test("create exists segment", async () => {
    mockFs(
      {
        "/features/user/": {
          ui: {},
          "index.js": "",
        },
      },
      {
        createCwd: false,
        createTmp: false,
      },
    );

    await generateFiles(
      {
        layer: "features",
        slices: ["user"],
        segments: ["ui"],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features/user/ui"))).toBe(true);
    expect(await pathExists(path.resolve("/features/user/index.js"))).toBe(
      true,
    );
  });

  test("create segment with typescript", async () => {
    await generateFiles(
      {
        layer: "features",
        slices: ["user"],
        segments: ["ui"],
        rootOverride: null,
      },
      path.resolve("/"),
      true,
    );

    expect(await pathExists(path.resolve("/features/user/ui"))).toBe(true);
    expect(await pathExists(path.resolve("/features/user/index.ts"))).toBe(
      true,
    );
  });

  test("create multiple segments", async () => {
    mockFs(
      {
        "/": {},
      },
      { createCwd: false, createTmp: false },
    );

    await generateFiles(
      {
        layer: "features",
        slices: ["user", "auth"],
        segments: ["ui"],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features/user/ui"))).toBe(true);
    expect(await pathExists(path.resolve("/features/auth/ui"))).toBe(true);
    expect(await pathExists(path.resolve("/features/user/index.js"))).toBe(
      true,
    );
    expect(await pathExists(path.resolve("/features/auth/index.js"))).toBe(
      true,
    );
  });

  test("create grouped segments", async () => {
    mockFs(
      {
        "/": {},
      },
      { createCwd: false, createTmp: false },
    );

    await generateFiles(
      {
        layer: "features",
        slices: ["user"],
        segments: ["ui/forms", "ui/buttons"],
        rootOverride: null,
      },
      path.resolve("/"),
    );

    expect(await pathExists(path.resolve("/features/user/ui/forms"))).toBe(
      true,
    );
    expect(await pathExists(path.resolve("/features/user/ui/buttons"))).toBe(
      true,
    );
    expect(await pathExists(path.resolve("/features/user/index.js"))).toBe(
      true,
    );
  });

  afterEach(() => {
    mockFs.restore();
  });
});
