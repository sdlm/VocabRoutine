<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import { page } from '$app/state';
	import { wordById } from '$lib/content';
	import { href } from '$lib/nav';
	import WordCard from '$lib/ui/card/WordCard.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';

	const word = $derived(wordById.get(page.params.id ?? ''));
	let headerHidden = $state(false);
</script>

<main class="page">
	<NavBar backLabel="Назад" fallback="/add" title={headerHidden ? (word?.word ?? '') : ''}>
		{#snippet right()}
			<a href={href(`/word/${page.params.id}/template`)} aria-label="Шаблон карточки"><Settings size={20} /></a>
		{/snippet}
	</NavBar>
	{#if word}
		<WordCard {word} bind:headerHidden />
	{:else}
		<p>Слово не найдено</p>
	{/if}
</main>
