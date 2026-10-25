# Git Runner

A small game. A dinosaur runs through the history of a Git repository. Each commit is a rock or a cactus in front of the dinosaur. A big commit is a big rock. A merge commit is a purple rock with a gold diamond. The player jumps, changes lane, and shoots.

The game is static files only. It needs no server code and no network. You can make it for any Git repository, and put it anywhere that serves static files, for example on GitHub Pages.

## Install

You need Node.js, pnpm, and Git.

```bash
git clone https://github.com/heidrun-org/game_git_runner.git
cd game_git_runner
pnpm install
```

## Play on any Git repository

```bash
pnpm commits --git-folder /absolute/path/to/your/repository
pnpm dev
```

The first command reads the Git history of the repository and writes the file `packages/git_runner/public/commits.json`. Without the option `--git-folder`, the command reads the history of this repository. The second command opens the game in the browser. Without the file `commits.json`, the game plays with fake commits.

Add `?seed=42` to the address of the page to play the same world again.

## Put the game on a server of static files

1. Write the file of commits for your repository: `pnpm commits --git-folder /absolute/path/to/your/repository`
2. Build the static folder: `pnpm build`
3. Copy the folder `packages/git_runner/dist` to your server, or to the branch of your GitHub Pages.

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
