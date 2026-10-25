import { defineConfig } from 'vite';

// The page of the game is web/index.html. The base "./" makes every address of the build relative.
export default defineConfig({
	root: 'web',
	base: './',
	build: {
		outDir: '../dist',
		emptyOutDir: true,
	},
	server: {
		port: 5182,
	},
});
