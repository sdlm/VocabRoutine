<script lang="ts">
	import type { Word } from '$lib/content/types';

	let { word }: { word: Word } = $props();
</script>

{#each word.translations as t (t.text)}
	<div class="share">
		<span class="text">{t.text}</span>
		<span class="bar"><i style:width="{t.share}%"></i></span>
		<span class="pct">{t.share}%</span>
	</div>
{/each}

<style>
	.share {
		display: grid;
		grid-template-columns: 40% 1fr 40px;
		align-items: center;
		gap: 8px;
		margin: 4px 0;
	}
	.bar {
		height: 6px;
	}
	.bar i {
		display: block;
		height: 100%;
		border-radius: 3px;
		background: var(--accent);
	}
	.pct {
		text-align: right;
		font-size: 13px;
		color: var(--text-3);
	}
</style>
