# Directory Context: `/`

## Purpose
The pnpm monorepo of the game Git Runner: a static web page where a dinosaur runs through the commits of a Git repository.

## Key Exports & Entry Points
- `packages/git_runner/`: the game Git Runner, its script that reads the Git history, and its tests — see its own CONTEXT.md.
- `packages/goat_3d/`: the game Goat 3D, a goat that climbs a mountain in 3D — see its own CONTEXT.md.
- `packages/website/`: the website with the homepage, Git Runner at `/2d/`, and Goat 3D at `/3d/` — see its own CONTEXT.md.
- `AGENTS.md`: the instructions and the skill values for every coding agent. `CLAUDE.md` loads it.
- `data/`: the branding images — see its own CONTEXT.md.
- `docs/`: the documentation that the coding agents write and read, with the agent rules in `docs/agents_rules`.
- Command to build and serve the website: `pnpm dev`
- Command to write the commits of a repository: `pnpm commits --git-folder <absolute path>`
- Command to build the static folder of the website: `pnpm build`
- Command to publish the website on GitHub Pages: `pnpm deploy:ghpages`
- Command to run the tests: `pnpm test`
- Command to check the types: `pnpm typecheck`

## Rules
- Every package sits in `packages/<name>`, and `pnpm-workspace.yaml` lists `packages/*`.
- The root scripts only call the scripts of a package with `pnpm --filter <name>`.

## Background
- The game comes from the package Parallax Dino Runner of Heidrun Code: https://github.com/heidrun-org/heidrun_code/issues/887.
