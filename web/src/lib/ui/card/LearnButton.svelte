<script lang="ts">
	import { toggleWord } from '$lib/state/search.svelte';
	import { isLearning } from '$lib/state/store.svelte';

	let { wordId }: { wordId: string } = $props();

	const learning = $derived(isLearning(wordId));
</script>

<!-- Goes through the search state, so a word added here stays in the «Добавить» list on return. -->
<div class="fade" aria-hidden="true"></div>
<button type="button" class="learn" class:on={learning} onclick={() => toggleWord(wordId)}>
	{learning ? '✓ В изучении · убрать' : 'Учить'}
</button>
<div class="spacer" aria-hidden="true"></div>

<style>
	.learn {
		position: fixed;
		left: 16px;
		right: 16px;
		bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 10px);
		z-index: 5;
		padding: 14px;
		border-radius: var(--radius);
		background: var(--accent);
		color: #fff;
		font-weight: 600;
		touch-action: manipulation;
	}
	.learn.on {
		/* The soft tint is translucent in the dark theme; the page colour underneath keeps the text readable. */
		background: linear-gradient(var(--success-soft), var(--success-soft)), var(--bg);
		color: var(--success);
	}
	.fade {
		position: fixed;
		left: 0;
		right: 0;
		bottom: calc(var(--tabbar-h) + var(--safe-bottom));
		z-index: 4;
		height: 90px;
		background: linear-gradient(transparent, var(--bg) 60%);
		pointer-events: none;
	}
	.spacer {
		height: 64px;
	}
</style>
