/**
 * Height of the on-screen keyboard, from visualViewport. Bars that must sit on
 * top of the keyboard use it as `bottom`. Call during component init.
 */
export function keyboardInset(): { readonly px: number } {
	let px = $state(0);
	$effect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const update = () => {
			const raw = Math.round(window.innerHeight - vv.height - vv.offsetTop);
			// Small values come from Safari toolbar transitions, and pinch zoom changes the visual viewport.
			px = raw < 80 || vv.scale > 1 ? 0 : raw;
		};
		update();
		vv.addEventListener('resize', update);
		vv.addEventListener('scroll', update);
		return () => {
			vv.removeEventListener('resize', update);
			vv.removeEventListener('scroll', update);
		};
	});
	return {
		get px() {
			return px;
		}
	};
}

/**
 * Whether the on-screen keyboard is up. iOS overlays it, so the visual viewport shrinks (keyboardInset).
 * Android with `interactive-widget=resizes-content` shrinks the window itself, so there it means
 * "a text field has focus and the window got much shorter". Call during component init.
 */
export function keyboardOpen(): { readonly open: boolean } {
	const kb = keyboardInset();
	let shrunk = $state(false);
	$effect(() => {
		// Tallest window height seen per width: rotation changes the width, the keyboard does not.
		const tallest = new Map<number, number>();
		const update = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;
			const max = Math.max(tallest.get(w) ?? 0, h);
			tallest.set(w, max);
			const el = document.activeElement;
			const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
			shrunk = typing && max - h > 150;
		};
		// Focus moves after focusin/focusout fire, so read activeElement on the next tick.
		const later = () => setTimeout(update);
		update();
		window.addEventListener('resize', update);
		document.addEventListener('focusin', later);
		document.addEventListener('focusout', later);
		return () => {
			window.removeEventListener('resize', update);
			document.removeEventListener('focusin', later);
			document.removeEventListener('focusout', later);
		};
	});
	return {
		get open() {
			return kb.px > 0 || shrunk;
		}
	};
}
