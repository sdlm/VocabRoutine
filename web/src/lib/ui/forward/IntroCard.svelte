<script lang="ts">
	import type { Word } from '$lib/content/types';
	import { app } from '$lib/state/store.svelte';
	import { enabledBlocks } from '$lib/state/template';
	import CardBlocks from '$lib/ui/card/CardBlocks.svelte';

	let { word, kind }: { word: Word; kind: 'new' | 'repeat' } = $props();
</script>

<span class="lab" class:repeat={kind === 'repeat'}>{kind === 'new' ? 'Новое слово' : 'Повтор'}</span>
<h1 class="word">{word.word}</h1>
<CardBlocks {word} blocks={enabledBlocks(app.settings.template)} />

<style>
	.lab {
		display: inline-block;
		margin-top: 16px;
		padding: 3px 10px;
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 13px;
		font-weight: 700;
	}
	.lab.repeat {
		background: var(--warning-soft);
		color: var(--warning);
	}
	.word {
		margin: 8px 0 16px;
		font-size: 36px;
		text-align: center;
	}
</style>
