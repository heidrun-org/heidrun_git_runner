import Fs from 'node:fs';
import Path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GameFoldersPlugin — copies the build of each game into a folder of the website
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * A Vite plugin that copies the folder `dist` of each game into the folder `dist` of the website, after the build
 * of the homepage. The folder `dist/2d` holds the game Git Runner, and the folder `dist/3d` holds the game Goat 3D.
 */
class GameFoldersPlugin {
	/**
	 * The folder `dist` of each game, by the name of its folder in the website.
	 */
	static readonly GAME_FOLDERS: Record<string, string> = {
		'2d': Path.resolve(__dirname, '../git_runner/dist'),
		'3d': Path.resolve(__dirname, '../goat_3d/dist'),
	};

	/**
	 * Makes the plugin.
	 *
	 * @param outDir the absolute path of the folder `dist` of the website.
	 * @returns the Vite plugin.
	 */
	static create(outDir: string): Plugin {
		const plugin: Plugin = {
			name: 'game-folders',
			apply: 'build',
			closeBundle() {
				GameFoldersPlugin._copyGameFolders(outDir);
			},
		};
		return plugin;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Copies the folder `dist` of each game into the folder `dist` of the website.
	 *
	 * @param outDir the absolute path of the folder `dist` of the website.
	 * @returns nothing.
	 */
	static _copyGameFolders(outDir: string): void {
		for (const [folderName, gameDistFolder] of Object.entries(GameFoldersPlugin.GAME_FOLDERS)) {
			if (Fs.existsSync(Path.join(gameDistFolder, 'index.html')) === false) {
				throw new Error(`${__filename}: the build of the game is missing in ${gameDistFolder}`);
			}
			Fs.cpSync(gameDistFolder, Path.join(outDir, folderName), {
				recursive: true,
			});
		}
	}
}

// The homepage is web/index.html. The base "./" makes every address of the build relative, so the folder dist
// works in any place of a server of static files. Each game is already built with relative addresses.
const outDir = Path.resolve(__dirname, 'dist');

export default defineConfig({
	root: 'web',
	base: './',
	build: {
		outDir: outDir,
		emptyOutDir: true,
	},
	preview: {
		port: 5180,
	},
	plugins: [
		GameFoldersPlugin.create(outDir),
	],
});
