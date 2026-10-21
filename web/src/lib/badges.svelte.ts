import { clozeQueue, forwardQueue } from '$lib/domain/queue';
import { app } from '$lib/state/store.svelte';

/** Tab badges: words in today's queue. Recomputed every minute so due words appear. */
export const badges = $state({ forward: 0, cloze: 0 });

export function startBadges(): void {
	let tick = $state(Date.now());
	$effect(() => {
		const t = setInterval(() => (tick = Date.now()), 60_000);
		return () => clearInterval(t);
	});
	$effect(() => {
		const entries = Object.values(app.learning);
		badges.forward = forwardQueue(entries, app.settings.queue, tick).length;
		badges.cloze = clozeQueue(entries, tick).length;
	});
}
