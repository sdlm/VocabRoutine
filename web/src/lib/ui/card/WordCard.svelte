<script lang="ts">
	import type { Word } from '$lib/content/types';
	import { metaTags } from '$lib/content/labels';
	import { app } from '$lib/state/store.svelte';
	import { enabledBlocks } from '$lib/state/template';
	import CardBlocks from './CardBlocks.svelte';

	let {
		word,
		headerHidden = $bindable(false)
	}: {
		word: Word;
		/** True once the word heading scrolled under the navbar; the page then shows the word there. */
		headerHidden?: boolean;
	} = $props();

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

<!-- Outside the forward review every enabled block is open, in template order. -->
<CardBlocks {word} blocks={enabledBlocks(app.settings.template)} />

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
