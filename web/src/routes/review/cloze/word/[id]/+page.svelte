<script lang="ts">
	import { page } from '$app/state';
	import { wordById } from '$lib/content';
	import { hideTabBarWhile } from '$lib/state/ui.svelte';
	import WordCard from '$lib/ui/card/WordCard.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';

	hideTabBarWhile();
	const word = $derived(wordById.get(page.params.id ?? ''));
	let headerHidden = $state(false);
</script>

<main class="page">
	<NavBar backLabel="Сессия" fallback="/review/cloze" title={headerHidden ? (word?.word ?? '') : ''} />
	{#if word}
		<WordCard {word} bind:headerHidden />
	{:else}
		<p>Слово не найдено</p>
	{/if}
</main>
