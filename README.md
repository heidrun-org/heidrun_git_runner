# Git Runner

A small game. A dinosaur runs through the history of a Git repository. Each commit is a rock or a cactus in front of the dinosaur. A big commit is a big rock. A merge commit is a purple rock with a gold diamond. The player jumps, changes lane, and shoots.

The game is static files only. It needs no server code and no network. You can make it for any Git repository, and put it anywhere that serves static files, for example on GitHub Pages.

## Install

You need Node.js, pnpm, and Git.

```bash
git clone https://github.com/heidrun-org/heidrun_git_runner.git
cd heidrun_git_runner
pnpm install
```

## Play on any Git repository

```bash
pnpm commits --git-folder /absolute/path/to/your/repository
pnpm dev
```

The first command reads the Git history of the repository and writes the file `packages/git_runner/public/commits.json`. Without the option `--git-folder`, the command reads the history of this repository. The second command builds the website and opens its homepage in the browser. The homepage has a link to Git Runner, at the path `/2d/`, and a link to the 3D game Goat 3D, at the path `/3d/`. To play Git Runner alone, with a reload of the page at each change of the code, run `pnpm --filter git_runner dev`. Without the file `commits.json`, the game plays with fake commits.

Add `?seed=42` to the address of the page to play the same world again.

## Put the game on a server of static files

1. Write the file of commits for your repository: `pnpm commits --git-folder /absolute/path/to/your/repository`
2. Build the static folder: `pnpm --filter git_runner build`
3. Copy the folder `packages/git_runner/dist` to your server, or to the branch of your GitHub Pages.

To build the full website, with the homepage and the two games, run `pnpm build`. The website is in the folder `packages/website/dist`.

To publish the website of this repository on GitHub Pages, run `pnpm deploy:ghpages`. The command writes the file of commits of this repository, builds the folder `packages/website/dist`, and pushes it to the branch `gh-pages` with the npm package `gh-pages`. The homepage is at https://heidrun-org.github.io/heidrun_git_runner/, and Git Runner is at https://heidrun-org.github.io/heidrun_git_runner/2d/.

The folder `dist` holds `index.html`, one script, and `commits.json`. Every address is relative, so the folder works in any place. A browser blocks a page that you open as a file, so use a server of static files, or the command `pnpm --filter git_runner exec vite preview`.

## Keys

- Space: jump
- Arrow up and arrow down: change lane
- F: shoot
- P: pause, and continue
- Enter: start, or play again
- M: sound on and off. The game starts with the sound off.

## Tests

```bash
pnpm test
pnpm typecheck
```

## History

The game started as the package Parallax Dino Runner in [Heidrun Code](https://github.com/heidrun-org/heidrun_code). See https://github.com/heidrun-org/heidrun_code/issues/887.
