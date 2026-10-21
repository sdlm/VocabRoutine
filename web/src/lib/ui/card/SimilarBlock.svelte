<script lang="ts">
	import type { Word } from '$lib/content/types';

	let { word }: { word: Word } = $props();
</script>

{#each word.similar as s (s.word)}
	<p><b>{s.word}</b> — {s.note}</p>
{/each}

<style>
	p {
		margin-bottom: 8px;
		line-height: 1.5;
	}
</style>
