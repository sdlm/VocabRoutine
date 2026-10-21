<script lang="ts">
	import type { Word } from '$lib/content/types';
	import { BLOCK_LABEL } from '$lib/content/labels';
	import { app } from '$lib/state/store.svelte';
	import { forwardBlocks } from '$lib/state/template';
	import CardBlocks from '$lib/ui/card/CardBlocks.svelte';

	let { word, revealed, onReveal }: { word: Word; revealed: string[]; onReveal: () => void } = $props();

	const blocks = $derived(forwardBlocks(app.settings.template, revealed));
</script>

<!-- A tap anywhere on the card opens the next block. The dashed hint is a real button for the keyboard; its click bubbles here. -->
<div class="card" role="presentation" onclick={onReveal}>
	<h1 class="word" class:alone={blocks.visible.length === 0}>{word.word}</h1>
	<CardBlocks {word} blocks={blocks.visible} />
	{#if blocks.next}
		<button type="button" class="ghost">
			тап — показать {BLOCK_LABEL[blocks.next.id].toLowerCase()} ({blocks.opened + 1} / {blocks.tapCount})
		</button>
	{/if}
</div>

<style>
	.card {
		min-height: calc(100dvh - 240px);
		padding-bottom: 16px;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}
	.word {
		margin: 32px 0 16px;
		font-size: 36px;
		text-align: center;
	}
	.word.alone {
		margin-top: 96px;
	}
	.ghost {
		display: block;
		width: 100%;
		margin-top: 16px;
		padding: 12px;
		border: 1.5px dashed var(--border);
		border-radius: var(--radius);
		color: var(--text-3);
		font-size: 14px;
	}
</style>
