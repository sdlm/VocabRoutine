<script lang="ts">
	import type { Word } from '$lib/content/types';

	let { word }: { word: Word } = $props();
</script>

<p>{word.definition}</p>

<style>
	p {
		line-height: 1.5;
	}
</style>
