import chalk from "chalk";

const layer = chalk.blue;
const slice = chalk.red;
const segment = chalk.green;
const root = chalk.magenta;

export const examples = [
  {
    description: `Generate the ${layer("Widgets")} layer with a ${slice(
      "bottom-bar",
    )} slice that has an index file and segments ${segment("ui")} and ${segment(
      "api",
    )} in the ${root("src/")} folder`,
    commands: [
      `fsd ${layer("w")} ${slice("bottom-bar")} -s ${segment("ui")} ${segment(
        "api",
      )} -r ${root("src")}`,
      `fsd ${layer("widget")} ${slice("bottom-bar")} -s ${segment(
        "ui",
      )},${segment("api")} -r ${root("src")}`,
      `fsd ${layer("widgets")} ${slice("bottom-bar")} --segments ${segment(
        "ui",
      )},${segment("api")} -r ${root("src")}`,
    ],
  },

  {
    description: `Generate the ${layer("Features")} layer with a slice ${slice(
      "employee/employee-record",
    )} inside a slice group ${slice("employee")}`,
    commands: [
      `fsd ${layer("f")} ${slice("employee/employee-record")}`,
      `fsd ${layer("feat")} ${slice("employee/employee-record")}`,
    ],
  },

  {
    description: `Generate the ${layer("Entities")} layer with a ${slice(
      "user",
    )} slice inside the ${root("src/lib")} folder, creating it if necessary`,
    commands: [
      `fsd ${layer("e")} ${slice("user")} -r ${root("./src/lib")}`,
      `fsd ${layer("entity")} ${slice("user")} --root ${root("./src/lib")}`,
    ],
  },

  {
    description: `Generate the ${layer("Pages")} layer with slices ${slice(
      "edit-note",
    )} and ${slice("note-list")}, each containing segments ${segment(
      "ui",
    )} and ${segment("api")}`,
    commands: [
      `fsd ${layer("p")} ${slice("edit-note")} ${slice(
        "note-list",
      )} -s ${segment("ui")}, ${segment("api")}`,
      `fsd ${layer("page")} ${slice("edit-note")}, ${slice(
        "note-list",
      )} -s ${segment("ui")} ${segment("api")}`,
    ],
  },

  {
    description: `Generate the ${layer("Shared")} layer with segments ${segment(
      "ui",
    )} and ${segment("api")} and an index file for each segment`,
    commands: [
      `fsd ${layer("s")} ${segment("ui")} ${segment("api")}`,
      `fsd ${layer("s")} -s ${segment("ui")} ${segment("api")}`,
      `fsd ${layer("shared")} ${segment("ui")} -s ${segment("api")}`,
    ],
  },
].map(({ description, commands }) => ({
  description: chalk.underline(description),
  commands,
}));
