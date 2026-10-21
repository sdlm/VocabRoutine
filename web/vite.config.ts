import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
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
	test: { include: ['src/**/*.test.ts'] }
});
