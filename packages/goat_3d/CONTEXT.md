# Directory Context: `/packages/goat_3d`

## Purpose
The game Goat 3D: a static web page in 3D with Three.js, with a goat as the hero. The player makes a low poly goat climb a low poly mountain to the flag at the top, with the arrow keys to walk and the space key to jump.

## Key Exports & Entry Points
- `web/index.html`: the page, which loads `web/src/goat_page.ts`.
- `web/src/`: the TypeScript code of the page. `goat_model.ts` builds the low poly goat from simple Three.js shapes and puts it in a pose, `goat_jump.ts` moves the goat in a jump and gives the pose of each moment of the jump, `goat_keyboard.ts` knows which arrow keys and which space key the player holds down, `mountain_terrain.ts` builds the ground with the mountain and gives the height of the ground at each point, `gothic_trees.ts` puts dark, twisted trees with no leaves on the grass, and `goat_page.ts` moves the goat and the camera.
- Command to play: `pnpm --filter goat_3d dev`
- Command to build the static folder `dist`: `pnpm --filter goat_3d build`
- Command to check the types: `pnpm --filter goat_3d typecheck`

## Rules
- The package imports no other package of the repository.
- The drawing of the ground and the height under the goat both come from `MountainTerrain.heightAt`, so the goat always stands on the drawn ground.
- The page is static files only, and every address of the build is relative (`base: './'` in `vite.config.ts`).

## Background
- The package starts as a test of a 3D game with a goat as the hero.
