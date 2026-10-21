import { untrack } from 'svelte';

export type TabId = 'add' | 'forward' | 'cloze' | 'settings';

let hiders = $state(0);

export const ui = $state({
	/** Highlighted tab; screens outside any tab (word card) keep the last one. */
	lastTab: 'add' as TabId
});

/** Tab bar is visible unless some mounted screen hides it. */
export function tabBarVisible(): boolean {
	return hiders === 0;
}

/**
 * Hide the tab bar while `hidden()` is true. Call during component init.
 * Sessions hide it; «На сегодня всё» on the same route shows it.
 * Counter-based, so the result does not depend on page teardown order.
 */
export function hideTabBarWhile(hidden: () => boolean = () => true): void {
	$effect(() => {
		if (!hidden()) return;
		untrack(() => hiders++);
		return () => untrack(() => hiders--);
	});
}
