export type TabId = 'add' | 'forward' | 'cloze' | 'settings';

export const ui = $state({
	tabBar: true,
	/** Highlighted tab; screens outside any tab (word card) keep the last one. */
	lastTab: 'add' as TabId
});

/**
 * Hide the tab bar while `hidden()` is true. Call during component init.
 * Sessions hide it; «На сегодня всё» on the same route shows it.
 */
export function hideTabBarWhile(hidden: () => boolean = () => true): void {
	$effect(() => {
		ui.tabBar = !hidden();
		return () => {
			ui.tabBar = true;
		};
	});
}
