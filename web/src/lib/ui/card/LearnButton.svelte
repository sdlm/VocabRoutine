<script lang="ts">
	import { isLearning } from '$lib/state/store.svelte';

	/** `onToggle` adds or removes the word; the page picks how, depending on where the card was opened. */
	let { wordId, onToggle }: { wordId: string; onToggle: () => void } = $props();

	const learning = $derived(isLearning(wordId));
</script>

<div class="fade" aria-hidden="true"></div>
<button type="button" class="learn" class:on={learning} onclick={onToggle}>
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
