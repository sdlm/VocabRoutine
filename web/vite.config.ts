import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** `--mode data` swaps the 30 mock words for the assembled ../data/words.json. */
function wordsSource(mode: string): Plugin {
	const file = new URL('../data/words.json', import.meta.url).pathname;
	return {
		name: 'words-source',
		enforce: 'pre',
		resolveId(id, importer) {
			if (mode === 'data' && id === './words.json' && importer?.endsWith('/lib/content/index.ts'))
				return file;
		}
	};
}

export default defineConfig(({ mode }) => ({
	plugins: [
		wordsSource(mode),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			// Registered manually in +layout.svelte: with the hash router there is no SSR to inject it.
			injectRegister: false,
			manifest: {
				name: 'VocabRoutine',
				short_name: 'VocabRoutine',
				lang: 'ru',
				start_url: './',
				scope: './',
				display: 'standalone',
				background_color: '#ffffff',
				theme_color: '#ffffff',
				icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
			},
			workbox: { globPatterns: ['**/*.{js,css,html,svg,json,webmanifest}'] },
			devOptions: { enabled: false }
		})
	],
	server: { fs: { allow: ['../data'] } },
	test: { include: ['src/**/*.test.ts'] }
}));
