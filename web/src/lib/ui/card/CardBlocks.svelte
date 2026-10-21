<script lang="ts">
	import type { Component } from 'svelte';
	import type { Word } from '$lib/content/types';
	import { BLOCK_LABEL } from '$lib/content/labels';
	import type { BlockId, TemplateBlock } from '$lib/state/schema';
	import Block from './Block.svelte';
	import CollocationsBlock from './CollocationsBlock.svelte';
	import DefinitionBlock from './DefinitionBlock.svelte';
	import ExamplesBlock from './ExamplesBlock.svelte';
	import SimilarBlock from './SimilarBlock.svelte';
	import TranslationsBlock from './TranslationsBlock.svelte';

	let { word, blocks }: { word: Word; blocks: TemplateBlock[] } = $props();

	const BODY: Record<BlockId, Component<{ word: Word }>> = {
		translations: TranslationsBlock,
		definition: DefinitionBlock,
		examples: ExamplesBlock,
		collocations: CollocationsBlock,
		similar: SimilarBlock
	};
</script>

{#each blocks as b (b.id)}
	{@const Body = BODY[b.id]}
	<Block label={BLOCK_LABEL[b.id]}><Body {word} /></Block>
{/each}
