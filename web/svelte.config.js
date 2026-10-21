import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// URLs like /#/settings/queue: no server fallback needed, every screen opens offline.
		// Page options (ssr, prerender) are not allowed with the hash router.
		router: { type: 'hash' }
	}
};

export default config;
