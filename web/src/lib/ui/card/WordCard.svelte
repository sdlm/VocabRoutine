<script lang="ts">
	import type { Component } from 'svelte';
	import type { Word } from '$lib/content/types';
	import { BLOCK_LABEL, metaTags } from '$lib/content/labels';
	import type { BlockId } from '$lib/state/schema';
	import { app } from '$lib/state/store.svelte';
	import Block from './Block.svelte';
	import CollocationsBlock from './CollocationsBlock.svelte';
	import DefinitionBlock from './DefinitionBlock.svelte';
	import ExamplesBlock from './ExamplesBlock.svelte';
	import SimilarBlock from './SimilarBlock.svelte';
	import TranslationsBlock from './TranslationsBlock.svelte';

	let {
		word,
		headerHidden = $bindable(false)
	}: {
		word: Word;
		/** True once the word heading scrolled under the navbar; the page then shows the word there. */
		headerHidden?: boolean;
	} = $props();

	const BLOCKS: Record<BlockId, Component<{ word: Word }>> = {
		translations: TranslationsBlock,
		definition: DefinitionBlock,
		examples: ExamplesBlock,
		collocations: CollocationsBlock,
		similar: SimilarBlock
	};

	// Outside the forward review every enabled block is expanded, in template order.
	const blocks = $derived(app.settings.template.filter((b) => b.mode !== 'off'));

	let heading: HTMLElement;
	$effect(() => {
		const io = new IntersectionObserver(([e]) => (headerHidden = !e.isIntersecting), { rootMargin: '-44px 0px 0px 0px' });
		io.observe(heading);
		return () => io.disconnect();
	});
</script>

<header>
	<h1 bind:this={heading}>
		{word.word}
		<a class="yg" href="https://youglish.com/pronounce/{encodeURIComponent(word.word)}/english" target="_blank" rel="noopener noreferrer">▶ YouGlish</a>
	</h1>
	<div class="tags">
		{#each metaTags(word) as t (t)}<span>{t}</span>{/each}
	</div>
</header>

{#each blocks as b (b.id)}
	{@const Body = BLOCKS[b.id]}
	<Block label={BLOCK_LABEL[b.id]}><Body {word} /></Block>
{/each}

<style>
	h1 {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 32px;
	}
	.yg {
		padding: 5px 10px;
		border-radius: 14px;
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 13px;
		font-weight: 600;
	}
	.tags {
		display: flex;
		gap: 6px;
		margin: 8px 0 12px;
	}
	.tags span {
		padding: 3px 9px;
		border-radius: 12px;
		background: var(--surface-2);
		color: var(--text-2);
		font-size: 13px;
	}
</style>
