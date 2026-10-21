<script lang="ts">
	import { buildFormIndex } from '$lib/content';
	import type { Word } from '$lib/content/types';
	import { linkWords } from '$lib/domain/cloze';

	let { word }: { word: Word } = $props();

	// The word and its forms are highlighted in each example.
	const own = $derived(buildFormIndex([word]));
</script>

{#each word.examples as ex (ex.en)}
	<p>
		{#each linkWords(ex.en, own) as seg, i (i)}{#if seg.wordId}<b>{seg.text}</b>{:else}{seg.text}{/if}{/each}
		<br /><i>{ex.ru}</i>
	</p>
{/each}

<style>
	p {
		margin-bottom: 8px;
		line-height: 1.5;
	}
	i {
		color: var(--text-2);
	}
</style>
