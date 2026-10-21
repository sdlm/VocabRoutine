<script lang="ts">
	import type { Word } from '$lib/content/types';

	let { word }: { word: Word } = $props();
</script>

<div class="colls">
	{#each word.collocations as c (c)}<span>{c}</span>{/each}
</div>

<style>
	.colls {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	span {
		padding: 4px 10px;
		border-radius: 10px;
		background: var(--surface-2);
		font-size: 15px;
	}
</style>
