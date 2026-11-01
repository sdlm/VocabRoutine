import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { readFileSync } from 'node:fs';
import { brotliCompressSync, constants } from 'node:zlib';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Path prefix of the site: `/VocabRoutine` on GitHub Pages, empty at the root. Mirrors svelte.config.js. */
const base = process.env.BASE_PATH ?? '';

const WORDS_BR = '\0words-br';

/**
 * `--mode data` swaps the 30 mock words for the assembled ../data/words.json.
 * `vite dev` imports it as is; `vite build` ships it as one brotli file that the client fetches and decodes.
 */
function wordsSource(mode: string, command: 'build' | 'serve'): Plugin {
	const file = new URL('../data/words.json', import.meta.url).pathname;
	return {
		name: 'words-source',
		enforce: 'pre',
		resolveId(id, importer) {
			if (mode !== 'data' || id !== './words.json' || !importer?.endsWith('/lib/content/index.ts')) return;
			return command === 'serve' ? file : WORDS_BR;
		},
		load(id, options) {
			if (id !== WORDS_BR) return;
			// The hash router has no SSR: the server bundle never shows a word.
			if (options?.ssr) return 'export default [];';
			const json = Buffer.from(JSON.stringify(JSON.parse(readFileSync(file, 'utf8'))));
			const source = brotliCompressSync(json, {
				params: {
					[constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
					[constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
					// Keep 24: decodeWords in load.ts tells an already-decoded body by a leading `[`, which a 24-bit-window stream never starts with.
					[constants.BROTLI_PARAM_LGWIN]: constants.BROTLI_MAX_WINDOW_BITS,
					[constants.BROTLI_PARAM_SIZE_HINT]: json.length
				}
			});
			const ref = this.emitFile({ type: 'asset', name: 'words.br', source });
			return `import { loadWords } from '$lib/content/load';\nexport default await loadWords(import.meta.ROLLUP_FILE_URL_${ref});`;
		}
	};
}

export default defineConfig(({ mode, command }) => ({
	plugins: [
		wordsSource(mode, command),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			// Without it the precache lists `/`, which is outside the site under a path prefix, and the worker never installs.
			kit: { base: `${base}/` },
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
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,json,webmanifest,br}'],
				// words.<hash>.br is ~1.7 MB; the default 2 MiB cap is too close.
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
			},
			devOptions: { enabled: false }
		})
	],
	server: { fs: { allow: ['../data'] } },
	test: { include: ['src/**/*.test.ts'] }
}));
