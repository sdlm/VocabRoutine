import { availableWords } from '$lib/domain/queue';
import { app, newShownToday } from '$lib/state/store.svelte';

/** Tab badges: words in today's queue. Recomputed every minute so due words appear. */
export const badges = $state({ forward: 0, cloze: 0 });

export function startBadges(): void {
	let tick = $state(Date.now());
	$effect(() => {
		const refresh = () => (tick = Date.now());
		const onVisibility = () => {
			if (document.visibilityState === 'visible') refresh();
		};
		const t = setInterval(refresh, 60_000);
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			clearInterval(t);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
	$effect(() => {
		const entries = Object.values(app.learning);
		const used = newShownToday(tick);
		badges.forward = availableWords('forward', entries, app.settings.queue, tick, used).length;
		badges.cloze = availableWords('cloze', entries, app.settings.queue, tick, used).length;
	});
}
