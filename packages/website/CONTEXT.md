# Directory Context: `/packages/website`

## Purpose
The website that hosts the two games: a homepage at `/`, the game Git Runner of `packages/git_runner` at `/2d/`, and the game Heidrun 3D of `packages/goat_3d` at `/3d/`.

## Key Exports & Entry Points
- `web/index.html`: the homepage, with a link to each game.
- `vite.config.ts`: the build of the homepage, and the plugin `GameFoldersPlugin`, which copies the folder `dist` of each game into `dist/2d` and `dist/3d`.
- Command to build the static folder `dist`: `pnpm --filter website build`. The command builds the two games first.
- Command to build and serve the website: `pnpm --filter website dev`
- Command to publish the website on GitHub Pages: `pnpm --filter website deploy:ghpages`. The command writes `packages/git_runner/public/commits.json`, builds `dist`, and pushes `dist` to the branch `gh-pages` with the npm package `gh-pages`.
- Command to check the types: `pnpm --filter website typecheck`

## Rules
- The package imports no code of another package. It only copies the folder `dist` of each game.
- The website is static files only, and every address of the build is relative (`base: './'` in `vite.config.ts`), so the folder `dist` works in any place of a server of static files.
- Every link to a game ends with `/` (`./2d/` and `./3d/`), because each game loads its files with relative addresses.
- The homepage uses only the images of `data/images` and the colors of [docs/branding.md](../../docs/branding.md).

## Background
- The package comes from https://github.com/heidrun-org/heidrun_git_runner/issues/3.
