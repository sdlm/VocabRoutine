import { goto } from '$app/navigation';

/** Hash-router link: href('/settings') → '#/settings'. */
export function href(path: string): string {
	return `#${path}`;
}

/** `state` rides on the history entry: Back and Forward bring it back with the page. */
export function go(path: string, opts: { replaceState?: boolean; state?: App.PageState } = {}): Promise<void> {
	return goto(href(path), opts);
}

/** «‹» buttons: return where the user came from; deep links fall back to `fallback`. */
export function back(fallback: string): void {
	if (history.length > 1) history.back();
	else void go(fallback, { replaceState: true });
}
