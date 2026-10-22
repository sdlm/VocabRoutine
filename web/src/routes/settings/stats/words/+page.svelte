<script lang="ts">
	import { wordById } from '$lib/content';
	import type { WordsFilter } from '$lib/domain/stats';
	import { myWords, myWordsResults } from '$lib/state/my-words.svelte';
	import { app } from '$lib/state/store.svelte';
	import { hideTabBarWhile } from '$lib/state/ui.svelte';
	import SearchField from '$lib/ui/controls/SearchField.svelte';
	import Segmented from '$lib/ui/controls/Segmented.svelte';
	import { keyboardInset, keyboardOpen } from '$lib/ui/keyboard.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import MyWordRow from '$lib/ui/stats/MyWordRow.svelte';

	// Same as «Добавить»: the tab bar steps aside while the keyboard is up.
	const kb = keyboardInset();
	const keyboard = keyboardOpen();
	hideTabBarWhile(() => keyboard.open);

	const filters: { value: WordsFilter; label: string }[] = [
		{ value: 'all', label: 'Все' },
		{ value: 'forward', label: 'Узнаю ≥7' },
		{ value: 'cloze', label: 'Вспоминаю ≥7' }
	];

	const total = $derived(Object.keys(app.learning).filter((id) => wordById.has(id)).length);
	const list = $derived(myWordsResults());
	const empty = $derived(
		total === 0
			? 'Слов пока нет. Их можно добавить в разделе «Добавить».'
			: myWords.query.trim() || myWords.filter === 'all'
				? 'Ничего не найдено'
				: 'Пока нет слов с интервалом от 7 дней'
	);
</script>

<main class="page">
	<NavBar backLabel="Статистика" fallback="/settings/stats" />
	<h1 class="screen-title">Мои слова · {total}</h1>
	<div class="search">
		<SearchField bind:value={myWords.query} placeholder="Найти среди моих…" label="Поиск среди моих слов" />
	</div>
	<Segmented label="Фильтр" options={filters} bind:value={myWords.filter} />
	{#each list as w (w.id)}
		<MyWordRow word={w} entry={app.learning[w.id]} />
	{:else}
		<p class="empty">{empty}</p>
	{/each}
	<div style:height="max(0px, calc({kb.px}px - var(--tabbar-h) - var(--safe-bottom)))" aria-hidden="true"></div>
</main>

<style>
	.search {
		margin-top: 10px;
	}
	.search + :global(.seg) {
		margin: 8px 0 4px;
	}
	.empty {
		padding: 32px 0;
		text-align: center;
		color: var(--text-3);
	}
</style>
