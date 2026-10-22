<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import { page } from '$app/state';
	import { wordById } from '$lib/content';
	import { href } from '$lib/nav';
	import { toggleWord } from '$lib/state/search.svelte';
	import { toggleLearning } from '$lib/state/store.svelte';
	import LearnButton from '$lib/ui/card/LearnButton.svelte';
	import WordCard from '$lib/ui/card/WordCard.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';

	const word = $derived(wordById.get(page.params.id ?? ''));
	let headerHidden = $state(false);

	// «Мои слова» marks its history entry; a deep link, a reload or «Добавить» leave it unmarked.
	const fromMyWords = $derived(page.state.from === 'my-words');
</script>

<main class="page">
	<NavBar
		backLabel={fromMyWords ? 'Мои слова' : 'Добавить'}
		fallback={fromMyWords ? '/settings/stats/words' : '/add'}
		title={headerHidden ? (word?.word ?? '') : ''}
	>
		{#snippet right()}
			<a href={href(`/word/${page.params.id}/template`)} aria-label="Шаблон карточки"><Settings size={20} /></a>
		{/snippet}
	</NavBar>
	{#if word}
		<WordCard {word} bind:headerHidden />
		<!-- From «Добавить» it goes through the search state, so the word stays in that list on return. -->
		<LearnButton wordId={word.id} onToggle={() => (fromMyWords ? toggleLearning(word.id) : toggleWord(word.id))} />
	{:else}
		<p>Слово не найдено</p>
	{/if}
</main>
