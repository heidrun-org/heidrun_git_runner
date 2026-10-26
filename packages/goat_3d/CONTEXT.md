# Directory Context: `/packages/goat_3d`

## Purpose
The game Heidrun 3D: a static web page in 3D with Three.js, with a goat as the hero. The player makes a low poly goat climb a low poly mountain to the flag at the top, with the arrow keys to walk, the shift key to run, and the space key to jump.

## Key Exports & Entry Points
- `web/index.html`: the page, which loads `web/src/goat_page.ts`.
- `web/src/`: the TypeScript code of the page. `goat_model.ts` builds the low poly goat from simple Three.js shapes and puts it in a pose, `goat_jump.ts` moves the goat in a jump and gives the pose of each moment of the jump, `goat_keyboard.ts` knows which arrow keys, which space key, and which shift key the player holds down, `mountain_terrain.ts` builds the ground with the mountain and gives the height of the ground at each point, `gothic_trees.ts` puts dark, twisted trees with dark leaves on the grass, `goat_screens.ts` shows the start screen and the help window of the keys, whose markup is in `web/index.html`, `goat_sound_player.ts` makes the sounds of the footsteps, the jump, and the landing, and remembers if the sound and the music are on, `goat_music.ts` plays the 8-bit lo-fi music in the background, `goat_toggle_button.ts` makes the speaker button and the music button at the top right, `dust_puffs.ts` makes the cartoon puffs of dust when the goat lands, `summit_fire.ts` makes the campfire at the top of the mountain, with a WebGL look-alike of the Three.js example `webgpu_volume_fire`, `comic_bursts.ts` shows comic words like "POW!" for the sounds, `toon_style.ts` makes the cartoon materials, `tuning_pane.ts` makes the Tweakpane panel that tunes the cartoon look and the lights, and `goat_page.ts` moves the goat and the camera and draws the scene with black outlines and with cascaded shadow maps, with a frame counter at the bottom left.
- Command to play: `pnpm --filter goat_3d dev`
- Command to build the static folder `dist`: `pnpm --filter goat_3d build`
- Command to check the types: `pnpm --filter goat_3d typecheck`

## Rules
- The package imports no other package of the repository. Its only libraries for the page are Three.js and Tweakpane.
- The code makes every sound with the Web Audio API, so the package has no sound file. The sound and the music are off on the first visit, and the page remembers the choice of the player for the next visit.
- The drawing of the ground and the height under the goat both come from `MountainTerrain.heightAt`, so the goat always stands on the drawn ground.
- Every material comes from `ToonStyle.createMaterial`, so that the whole scene has the same cartoon look as the Three.js example `webgl_materials_toon`.
- One unit of Three.js is one meter. Every size, distance, and speed is in meters, meters per second, or meters per second per second. The goat is about 1 meter high at the top of the head (`GoatModel.SCALE`).
- The page is static files only, and every address of the build is relative (`base: './'` in `vite.config.ts`).

## Background
- The package starts as a test of a 3D game with a goat as the hero.
