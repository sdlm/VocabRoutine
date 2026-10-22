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

/** Input types that bring up the on-screen keyboard. Switches and checkboxes are inputs too, but do not. */
const TEXT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number']);

export function isTextField(el: Element | null): boolean {
	if (!el) return false;
	if (el.tagName === 'TEXTAREA') return true;
	return el.tagName === 'INPUT' && TEXT_TYPES.has((el as HTMLInputElement).type);
}

/**
 * Android: is the window squeezed by the keyboard? Remembers the tallest height per width:
 * rotation changes the width, the keyboard does not. Rotating with the keyboard up lands on a width
 * whose first height is already squeezed, so at that width the keyboard counts as open until the window
 * grows, shrinks further by the threshold, or typing stops. Returns `(width, height, typing) => squeezed`.
 */
export function windowSqueeze(threshold = 150): (width: number, height: number, typing: boolean) => boolean {
	const tallest = new Map<number, number>();
	/** Width where the keyboard is assumed open after rotating while typing. */
	let assumedAt: number | undefined;
	return (w, h, typing) => {
		const prev = tallest.get(w);
		if (!typing) assumedAt = undefined;
		else if (prev === undefined) assumedAt = w;
		else if (w !== assumedAt || h > prev || prev - h > threshold) assumedAt = undefined;
		const max = Math.max(prev ?? 0, h);
		tallest.set(w, max);
		return typing && (assumedAt === w || max - h > threshold);
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
	const squeezed = windowSqueeze();
	$effect(() => {
		const update = () => {
			shrunk = squeezed(window.innerWidth, window.innerHeight, isTextField(document.activeElement));
		};
		// Focus moves after focusin/focusout fire, so read activeElement on the next tick.
		let timer: ReturnType<typeof setTimeout> | undefined;
		const later = () => {
			clearTimeout(timer);
			timer = setTimeout(update);
		};
		update();
		window.addEventListener('resize', update);
		document.addEventListener('focusin', later);
		document.addEventListener('focusout', later);
		return () => {
			clearTimeout(timer);
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
