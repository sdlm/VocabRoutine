<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let {
		title,
		subtitle,
		onClose,
		onReset,
		children
	}: {
		title: string;
		subtitle?: string;
		onClose: () => void;
		/** Shows «Сбросить» next to the title. */
		onReset?: () => void;
		children: Snippet;
	} = $props();

	// Swipe down on the header closes the sheet. Listeners sit on window, like the template editor's drag.
	let drag: { pointerId: number; startY: number; dy: number } | null = $state(null);
	const dragging = $derived(drag !== null);

	function onDown(e: PointerEvent) {
		if (!e.isPrimary || e.button !== 0) return;
		drag = { pointerId: e.pointerId, startY: e.clientY, dy: 0 };
	}

	function onMove(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.pointerId) return;
		drag.dy = Math.max(0, e.clientY - drag.startY);
	}

	function onUp(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.pointerId) return;
		// Closing keeps the offset, so the slide-out starts where the finger left the sheet.
		if (drag.dy > 80) onClose();
		else drag = null;
	}

	$effect(() => {
		if (!dragging) return;
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		return () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
		};
	});

	// The page under the sheet does not scroll; Escape closes.
	$effect(() => {
		const root = document.documentElement;
		const prev = root.style.overflow;
		root.style.overflow = 'hidden';
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => {
			root.style.overflow = prev;
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<div class="dim" role="presentation" onclick={onClose} transition:fade={{ duration: 180 }}></div>
<div
	class="sheet"
	class:dragging
	role="dialog"
	aria-modal="true"
	aria-label={title}
	style:transform={drag ? `translateY(${drag.dy}px)` : undefined}
	transition:fly={{ y: 400, duration: 220 }}
>
	<div class="head" role="presentation" onpointerdown={onDown}>
		<div class="grab"></div>
		<div class="title">
			<b>{title}</b>
			{#if onReset}<button type="button" class="reset" onclick={onReset}>Сбросить</button>{/if}
		</div>
		{#if subtitle}<p class="sub">{subtitle}</p>{/if}
	</div>
	<div class="body">{@render children()}</div>
</div>

<style>
	.dim {
		position: fixed;
		inset: 0;
		z-index: 30;
		background: rgba(0, 0, 0, 0.35);
	}
	.sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 31;
		display: flex;
		flex-direction: column;
		max-height: 85dvh;
		border-radius: 18px 18px 0 0;
		background: var(--surface);
		transition: transform 0.2s;
	}
	.sheet.dragging {
		transition: none;
	}
	.head {
		padding: 8px 16px 4px;
		touch-action: none;
	}
	.grab {
		width: 36px;
		height: 5px;
		margin: 0 auto 10px;
		border-radius: 3px;
		background: var(--border);
	}
	.title {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 17px;
	}
	.reset {
		color: var(--accent);
		font-size: 15px;
	}
	.sub {
		margin-top: 2px;
		font-size: 13px;
		color: var(--text-3);
	}
	.body {
		overflow-y: auto;
		padding: 4px 16px calc(var(--safe-bottom) + 16px);
	}
</style>
