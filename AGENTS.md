# AGENTS.md

This file gives the instructions that every coding agent obeys in the repository heidrun_git_runner.

## Issue Fix Workflow

Every issue fix in this repository follows the skill [issue_fix_workflow](.agents/skills/issue_fix_workflow/SKILL.md). Read the skill before you start an issue fix, each time that the developer asks to fix an issue.
The skill names no detail of this repository: it reads the values of this repository in the section "Issue Fix Workflow values" below.

### Issue Fix Workflow values

- Target branch: `main`
- Worktree creation command: `git fetch && git worktree add .agents/worktrees/<branch name> -b <branch name> origin/main`, run at the root of the main checkout.
- Worktree folder: `.agents/worktrees/<branch name>`, inside the main checkout. Git ignores the folder `.agents/worktrees`.
- Launch command: `cd .agents/worktrees/<branch name> && pnpm install && pnpm dev`
- Issue tracker commands: this repository is on GitHub (`heidrun-org/heidrun_git_runner`), so use the `gh` command.
  - Read an issue: `gh issue view <number> --comments`
  - Comment on an issue: `gh issue comment <number> --body-file <file>`
  - Create an issue: `gh issue create --title <title> --body-file <file>`
  - Create a pull request: first `git push -u origin <branch name>`, because the worktree creation command makes the new branch track `origin/main`, so a plain `git push` fails. Then `gh pr create --base main --head <branch name> --title <title> --body-file <file>`
  - Merge a pull request: `gh pr merge <number> --merge`
  - Close an issue: `gh issue close <number>`
- Chat rename: not available; the developer renames the chat with `/rename`

## Docs folder

Every file and every folder in the folder `docs` follows the skill [docs_folder_system](.agents/skills/docs_folder_system/SKILL.md). Read the skill before you add, change, rename, move, or delete a file or a folder in the folder `docs`.
The skill names no detail of this repository: it reads the values of this repository in the section "Docs folder system values" below.

### Docs folder system values

- Documentation folder: `docs`
- Files with no metadata header: none

## Agent rules

The folder `docs/agents_rules` holds all the rules that every coding agent obeys. Before you change the code, read the glossary and the rule files that match the part that you change, as the skill [docs_folder_agents_rules_system](.agents/skills/docs_folder_agents_rules_system/SKILL.md) says. This skill needs the skill [docs_folder_system](.agents/skills/docs_folder_system/SKILL.md).
The skill names no detail of this repository: it reads the values of this repository in the section "Docs folder agents rules system values" below.

### Docs folder agents rules system values

- Agent rules folder: `docs/agents_rules`
- Glossary folder: `docs/agents_rules/glossary`
- Maximum size of a file: 10000 bytes.
- Size test command: `pnpm test`. The test file is `packages/git_runner/tests/agents_rules_size.test.ts`.
