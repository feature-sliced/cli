import process from "node:process";
import { describe, expect, it, vi } from "vitest";
import { parseArguments } from "../parse-arguments";

vi.spyOn(process, "exit").mockImplementation((code) => {
  throw code;
});

describe("parseArguments", () => {
  it("should exit with an error when called without arguments", async () => {
    await expect(parseArguments([])).rejects.toEqual(1);
  });

  it("should recognize the Shared layer and its alias", async () => {
    const requestToCreateShared = {
      layer: "shared",
      rootOverride: null,
      useNumbering: false,
      segments: [],
      slices: [],
    };

    await expect(
      parseArguments(["node", "dist/main.js", "shared"]),
    ).resolves.toEqual(requestToCreateShared);
    await expect(
      parseArguments(["node", "dist/main.js", "s"]),
    ).resolves.toEqual(requestToCreateShared);
  });

  it("should recognize the Entities layer and its aliases", async () => {
    const requestToCreateEntities = {
      layer: "entities",
      rootOverride: null,
      useNumbering: false,
      segments: [],
      slices: ["slice"],
    };

    await expect(
      parseArguments(["node", "dist/main.js", "entities", "slice"]),
    ).resolves.toEqual(requestToCreateEntities);
    await expect(
      parseArguments(["node", "dist/main.js", "e", "slice"]),
    ).resolves.toEqual(requestToCreateEntities);
    await expect(
      parseArguments(["node", "dist/main.js", "entity", "slice"]),
    ).resolves.toEqual(requestToCreateEntities);
  });

  it("should recognize the Features layer and its aliases", async () => {
    const requestToCreateFeatures = {
      layer: "features",
      rootOverride: null,
      useNumbering: false,
      segments: [],
      slices: ["slice"],
    };

    await expect(
      parseArguments(["node", "dist/main.js", "features", "slice"]),
    ).resolves.toEqual(requestToCreateFeatures);
    await expect(
      parseArguments(["node", "dist/main.js", "f", "slice"]),
    ).resolves.toEqual(requestToCreateFeatures);
    await expect(
      parseArguments(["node", "dist/main.js", "feature", "slice"]),
    ).resolves.toEqual(requestToCreateFeatures);
    await expect(
      parseArguments(["node", "dist/main.js", "feat", "slice"]),
    ).resolves.toEqual(requestToCreateFeatures);
  });

  it("should recognize the Widgets layer and its aliases", async () => {
    const requestToCreateWidgets = {
      layer: "widgets",
      rootOverride: null,
      useNumbering: false,
      segments: [],
      slices: ["slice"],
    };

    await expect(
      parseArguments(["node", "dist/main.js", "widgets", "slice"]),
    ).resolves.toEqual(requestToCreateWidgets);
    await expect(
      parseArguments(["node", "dist/main.js", "w", "slice"]),
    ).resolves.toEqual(requestToCreateWidgets);
    await expect(
      parseArguments(["node", "dist/main.js", "widget", "slice"]),
    ).resolves.toEqual(requestToCreateWidgets);
  });

  it("should recognize the Pages layer and its aliases", async () => {
    const requestToCreatePages = {
      layer: "pages",
      rootOverride: null,
      useNumbering: false,
      segments: [],
      slices: ["slice"],
    };

    await expect(
      parseArguments(["node", "dist/main.js", "pages", "slice"]),
    ).resolves.toEqual(requestToCreatePages);
    await expect(
      parseArguments(["node", "dist/main.js", "p", "slice"]),
    ).resolves.toEqual(requestToCreatePages);
    await expect(
      parseArguments(["node", "dist/main.js", "page", "slice"]),
    ).resolves.toEqual(requestToCreatePages);
  });

  it("should recognize the App layer and its alias", async () => {
    const requestToCreateApp = {
      layer: "app",
      rootOverride: null,
      useNumbering: false,
      segments: [],
      slices: [],
    };

    await expect(
      parseArguments(["node", "dist/main.js", "app"]),
    ).resolves.toEqual(requestToCreateApp);
    await expect(
      parseArguments(["node", "dist/main.js", "a"]),
    ).resolves.toEqual(requestToCreateApp);
  });

  it("should not fail when sliceful layers are generated without a slice", async () => {
    await expect(
      parseArguments(["node", "dist/main.js", "entities"]),
    ).resolves.toHaveProperty("slices", []);
    await expect(
      parseArguments(["node", "dist/main.js", "features"]),
    ).resolves.toHaveProperty("slices", []);
    await expect(
      parseArguments(["node", "dist/main.js", "widgets"]),
    ).resolves.toHaveProperty("slices", []);
    await expect(
      parseArguments(["node", "dist/main.js", "pages"]),
    ).resolves.toHaveProperty("slices", []);
  });

  it("should treat slice names in sliceless layers as segments", async () => {
    await expect(
      parseArguments([
        "node",
        "dist/main.js",
        "shared",
        "segment1",
        "segment2",
      ]),
    ).resolves.toHaveProperty("segments", ["segment1", "segment2"]);
    await expect(
      parseArguments(["node", "dist/main.js", "app", "segment1", "segment2"]),
    ).resolves.toHaveProperty("segments", ["segment1", "segment2"]);
  });

  it("should allow generating multiple slices at the same time", async () => {
    await expect(
      parseArguments(["node", "dist/main.js", "entities", "slice1", "slice2"]),
    ).resolves.toMatchObject({
      slices: ["slice1", "slice2"],
      layer: "entities",
    });
    await expect(
      parseArguments(["node", "dist/main.js", "features", "slice1", "slice2"]),
    ).resolves.toMatchObject({
      slices: ["slice1", "slice2"],
      layer: "features",
    });
    await expect(
      parseArguments(["node", "dist/main.js", "widgets", "slice1", "slice2"]),
    ).resolves.toMatchObject({
      slices: ["slice1", "slice2"],
      layer: "widgets",
    });
    await expect(
      parseArguments(["node", "dist/main.js", "pages", "slice1", "slice2"]),
    ).resolves.toMatchObject({ slices: ["slice1", "slice2"], layer: "pages" });
  });

  it("should recognize the --segments option", async () => {
    await expect(
      parseArguments([
        "node",
        "dist/main.js",
        "shared",
        "--segments",
        "segment1",
        "segment2",
      ]),
    ).resolves.toEqual({
      layer: "shared",
      rootOverride: null,
      useNumbering: false,
      segments: ["segment1", "segment2"],
      slices: [],
    });

    await expect(
      parseArguments([
        "node",
        "dist/main.js",
        "entities",
        "-s",
        "segment1",
        "segment2",
      ]),
    ).resolves.toEqual({
      layer: "entities",
      rootOverride: null,
      useNumbering: false,
      segments: ["segment1", "segment2"],
      slices: [],
    });
  });

  it("should recognize the --root option", async () => {
    await expect(
      parseArguments(["node", "dist/main.js", "shared", "--root", "src/"]),
    ).resolves.toEqual({
      layer: "shared",
      rootOverride: "src/",
      useNumbering: false,
      segments: [],
      slices: [],
    });
  });

  it("should allow generating several slices and segments at the same time", async () => {
    await expect(
      parseArguments([
        "node",
        "dist/main.js",
        "entities",
        "slice1",
        "slice2",
        "-s",
        "segment1",
        "segment2",
      ]),
    ).resolves.toEqual({
      layer: "entities",
      rootOverride: null,
      useNumbering: false,
      segments: ["segment1", "segment2"],
      slices: ["slice1", "slice2"],
    });
  });

  it.each(["shared", "entities", "features", "widgets", "pages", "app"])(
    "should enable numbering with --numbering and -n for the %s command",
    async (layer) => {
      for (const flag of ["--numbering", "-n"]) {
        await expect(
          parseArguments(["node", "dist/main.js", layer, flag, "profile"]),
        ).resolves.toEqual({
          layer,
          rootOverride: null,
          useNumbering: true,
          slices: ["shared", "app"].includes(layer) ? [] : ["profile"],
          segments: ["shared", "app"].includes(layer) ? ["profile"] : [],
        });
      }
    },
  );

  it("should combine numbering with a command alias, root and segments", async () => {
    await expect(
      parseArguments([
        "node",
        "dist/main.js",
        "w",
        "profile",
        "--numbering",
        "--root",
        "src",
        "--segments",
        "ui",
        "api",
      ]),
    ).resolves.toEqual({
      layer: "widgets",
      slices: ["profile"],
      segments: ["ui", "api"],
      rootOverride: "src",
      useNumbering: true,
    });
  });
});
