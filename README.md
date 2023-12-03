# @feature-sliced/cli

![npm version](https://img.shields.io/npm/v/@feature-sliced/cli)

Utility to quickly generate layers, slices, and segments from [Feature-Sliced Design](https://feature-sliced.design).

## Installation

```bash
npm add -g @feature-sliced/cli
```

This will create a global binary `fsd`. You can install this CLI locally as well, but then you will need to use `npx` to run it.

## Usage

Generate the Entities layer with a `client` slice that contains an index file and two segments, `ui` and `api`:

```bash
fsd entities client --segments ui api
```

Or, for short:

```bash
fsd e client -s ui,api
```

If you have at least one slice in your project already, the CLI will know where to generate. Otherwise, it will generate in the current folder, or you can specify the location yourself with the `--root` or `-r` option.

<details><summary>Other examples</summary>

- Generate the Widgets layer with a `bottom-bar` slice that has an index file and segments `ui` and `api` in the `src/` folder:

  ```bash
  fsd w bottom-bar -s ui api -r src
  fsd widget bottom-bar -s ui,api -r src
  fsd widgets bottom-bar --segments ui,api -r src
  ```

  Produces:

  - `src/widgets/bottom-bar/index.(js|ts)` (depending on your project)
  - `src/widgets/bottom-bar/ui/`
  - `src/widgets/bottom-bar/api/`

- Generate the Features layer with a slice `employee/employee-record` inside a slice group `employee`:

  ```bash
  fsd f employee/employee-record
  fsd feat employee/employee-record
  ```

  In a detected FSD root[^1] or current folder, produces:

  - `features/employee/employee-record/index.(js|ts)` (depending on your project)

- Generate the Entities layer with a `user` slice inside the `src/lib` folder, creating it if necessary:

  ```bash
  fsd e user -r ./src/lib
  fsd entity user --root ./src/lib
  ```

  Produces:

  - `src/lib/entities/user/index.(js|ts)` (depending on your project)

- Generate the Pages layer with slices `edit-note` and `note-list`, each containing segments `ui` and `api`:

  ```bash
  fsd p edit-note note-list -s ui, api
  fsd page edit-note, note-list -s ui api
  ```

  In a detected FSD root[^1] or current folder, produces:

  - `pages/edit-note/index.(js|ts)` (depending on your project)
  - `pages/edit-note/ui/`
  - `pages/edit-note/api/`
  - `pages/note-list/index.(js|ts)`
  - `pages/note-list/ui/`
  - `pages/note-list/api/`

- Generate the Shared layer with segments `ui` and `api` and an index file for each segment:

  ```
  fsd s ui api
  fsd s -s ui api
  fsd shared ui -s api
  ```

  In a detected FSD root[^1] or current folder, produces:

  - `shared/ui/index.(js|ts)`
  - `shared/api/index.(js|ts)`

</details>

## Credits

Big thanks to a community member [`Agent_RBY_`](https://github.com/AgentRBY) for implementing most of the generating and detecting logic.

## License

The source code of this project is distributed under the terms of the ISC license. It's like MIT, but better. [Click here](https://choosealicense.com/licenses/isc/) to learn what that means.

[^1]: An FSD root is the folder that contains slices in Feature-Sliced Design. There can be several independent roots in one project.
