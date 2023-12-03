# @feature-sliced/cli

![npm version](https://img.shields.io/npm/v/@feature-sliced/cli)

A command-line utility to quickly generate layers, slices, and segments.

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

If you have more than two slices in your project already, the CLI will know where to generate everything else. Otherwise, it will generate in the current folder, or you can specify the location yourself with the `--root` or `-r` option.

<details><summary>Other examples</summary>

- Generate the Shared layer with a `ui` segment and an index file in the `src/` folder:

  ```bash
  fsd shared ui -r src
  ```

- Generate the Entities layer with slices `user` and `city`, each with an `api` segment:

  ```bash
  fsd e user city -s api
  ```

- Generate the Features layer with an `auth` slice containing segments `api` and `model`:

  ```bash
  fsd feature auth -s api,model
  ```

- Generate the Widgets layer with an index file in the ../fsd/ folder:

  ```bash
  fsd widgets header --root ../fsd/
  ```

- Generate the Pages layer with slices home and about, each with an ui segment

  ```bash
  fsd pages home,about -s ui
  ```

- Generate the App layer:
  ```
  fsd app
  ```

</details>

## Credits

Big thanks to a community member [`Agent_RBY_`](https://github.com/AgentRBY) for implementing most of the generating and detecting logic.

## License

The source code of this project is distributed under the terms of the ISC license. It's like MIT, but better. [Click here](https://choosealicense.com/licenses/isc/) to learn what that means.
