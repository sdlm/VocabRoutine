<script lang="ts">
	import { tick } from 'svelte';
	import { BLOCK_LABEL } from '$lib/content/labels';
	import type { BlockMode } from '$lib/state/schema';
	import { app } from '$lib/state/store.svelte';
	import { moveBlock, templatePreview } from '$lib/state/template';
	import Group from '$lib/ui/controls/Group.svelte';
	import Segmented from '$lib/ui/controls/Segmented.svelte';

	const MODES: { value: BlockMode; label: string }[] = [
		{ value: 'shown', label: 'Сразу' },
		{ value: 'tap', label: 'По тапу' },
		{ value: 'off', label: 'Выкл' }
	];

	function move(from: number, to: number) {
		const t = app.settings.template;
		if (to < 0 || to >= t.length || to === from) return;
		app.settings.template = moveBlock(t, from, to);
	}

	// Drag by ≡: the row follows the finger and swaps with a neighbour once it passes half a row.
	// Listeners sit on window, because reordering moves the row in the DOM and may drop pointer capture.
	let drag: { index: number; startY: number; dy: number; rowH: number; pointerId: number } | null = $state(null);
	const dragging = $derived(drag !== null);

	function onDown(e: PointerEvent, index: number) {
		if (!e.isPrimary || e.button !== 0) return;
		const row = (e.currentTarget as HTMLElement).closest('.row') as HTMLElement;
		drag = { index, startY: e.clientY, dy: 0, rowH: row.offsetHeight, pointerId: e.pointerId };
	}

	function onMove(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.pointerId) return;
		const max = app.settings.template.length - 1;
		const target = Math.min(max, Math.max(0, drag.index + Math.round((e.clientY - drag.startY) / drag.rowH)));
		if (target !== drag.index) {
			move(drag.index, target);
			drag.startY += (target - drag.index) * drag.rowH;
			drag.index = target;
		}
		drag.dy = e.clientY - drag.startY;
	}

	function onUp(e: PointerEvent) {
		if (drag && e.pointerId !== drag.pointerId) return;
		drag = null;
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

	async function onKey(e: KeyboardEvent, i: number) {
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			const handle = e.currentTarget as HTMLButtonElement;
			move(i, e.key === 'ArrowUp' ? i - 1 : i + 1);
			// Keyed reorder moves the row's DOM nodes and drops focus to body, so refocus the same handle.
			await tick();
			handle.focus();
		}
	}
</script>

<p class="screen-sub">Порядок блоков (≡ перетащить) и их поведение в прямом повторении. Вне повторения раскрыты все включённые блоки.</p>

<Group>
	{#each app.settings.template as b, i (b.id)}
		<div
			class="row"
			class:off={b.mode === 'off'}
			class:dragging={drag?.index === i}
			style:transform={drag?.index === i ? `translateY(${drag.dy}px)` : undefined}
		>
			<button
				type="button"
				class="handle"
				aria-label="Переместить «{BLOCK_LABEL[b.id]}» (стрелки вверх и вниз)"
				onpointerdown={(e) => onDown(e, i)}
				onkeydown={(e) => onKey(e, i)}>≡</button
			>
			<span class="name">{BLOCK_LABEL[b.id]}</span>
			<Segmented compact label={BLOCK_LABEL[b.id]} options={MODES} bind:value={b.mode} />
		</div>
	{/each}
</Group>

<div class="preview"><b>Как будет в повторении:</b><br />{templatePreview(app.settings.template)}</div>

<style>
	.screen-sub {
		margin-bottom: 16px;
	}
	.row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 10px 8px 4px;
		background: var(--surface);
		user-select: none;
		-webkit-user-select: none;
	}
	.row.dragging {
		z-index: 1;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
	}
	.handle {
		padding: 6px 8px;
		font-size: 20px;
		color: var(--text-3);
		touch-action: none;
		cursor: grab;
	}
	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.off .name {
		color: var(--text-3);
	}
	.preview {
		margin-top: 16px;
		padding: 12px;
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text-2);
		font-size: 14px;
		line-height: 1.5;
	}
</style>
