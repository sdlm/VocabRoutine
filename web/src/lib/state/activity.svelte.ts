import { addSeconds } from './store.svelte';

const FLUSH_MS = 15_000;

/** Count seconds while the page is visible. Called once from the root layout. */
export function startActivityTracking(): void {
	$effect(() => {
		let since = document.visibilityState === 'visible' ? Date.now() : null;
		const flush = () => {
			if (since === null) return;
			const now = Date.now();
			const seconds = Math.round((now - since) / 1000);
			if (seconds > 0) {
				addSeconds(seconds);
				since = now;
			}
		};
		const onVisibility = () => {
			if (document.visibilityState === 'visible') since = Date.now();
			else {
				flush();
				since = null;
			}
		};
		const timer = setInterval(flush, FLUSH_MS);
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			flush();
			clearInterval(timer);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
}
