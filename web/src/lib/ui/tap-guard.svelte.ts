/**
 * After «Дальше» or a grade, the next screen's buttons appear under the finger,
 * so a double tap would answer the next word too. Returns a check that is true
 * for 400 ms after `key()` changes. Not on mount: coming back from a card or the
 * settings leaves nothing under the finger. Call during component init.
 */
export function tapGuard(key: () => unknown, ms = 400): () => boolean {
	let stamp = 0;
	let mounted = false;
	$effect(() => {
		key();
		if (mounted) stamp = Date.now();
		mounted = true;
	});
	return () => Date.now() - stamp < ms;
}
