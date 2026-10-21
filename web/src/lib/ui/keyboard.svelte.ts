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
			px = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
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
