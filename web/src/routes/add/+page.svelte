<script lang="ts">
	import { flushSync } from 'svelte';
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import type { SheetPart } from '$lib/domain/search';
	import { plural, WORD_FORMS } from '$lib/format';
	import { href } from '$lib/nav';
	import { search, searchResults, toggleWord } from '$lib/state/search.svelte';
	import { isLearning } from '$lib/state/store.svelte';
	import { hideTabBarWhile } from '$lib/state/ui.svelte';
	import FilterChips from '$lib/ui/add/FilterChips.svelte';
	import FilterSheet from '$lib/ui/add/FilterSheet.svelte';
	import SearchBar from '$lib/ui/add/SearchBar.svelte';
	import WordRow from '$lib/ui/add/WordRow.svelte';
	import { keyboardInset, keyboardOpen } from '$lib/ui/keyboard.svelte';
	import LargeTitle from '$lib/ui/shell/LargeTitle.svelte';

	// The keyboard covers the fixed tab bar on iOS and squeezes the page on Android, so the bar steps aside while typing.
	const kb = keyboardInset();
	const keyboard = keyboardOpen();
	hideTabBarWhile(() => keyboard.open);

	let input: HTMLInputElement | undefined = $state();

	// The open sheet lives in history (shallow routing): the system «Назад» closes it instead of leaving the tab.
	const sheet = $derived(page.state.sheet ?? null);
	const openSheet = (part: SheetPart) => {
		// The sheet sits at the bottom of the screen; on iOS it would open behind the keyboard.
		input?.blur();
		pushState(href('/add'), { sheet: part });
	};
	const closeSheet = () => history.back();

	const results = $derived(searchResults());
	const added = $derived(results.filter((w) => isLearning(w.id)).length);

	/** Runs inside the loupe tap: focusing there is what opens the keyboard on iOS. */
	function openSearch() {
		search.open = true;
		flushSync();
		input?.focus();
	}
</script>

<main class="page">
	{#if search.open}
		<SearchBar bind:input />
	{:else}
		<LargeTitle title="Добавить" />
	{/if}
	<FilterChips onSearch={openSearch} onSheet={openSheet} />
	<p class="count">
		{results.length}
		{plural(results.length, WORD_FORMS)}{#if added > 0}&nbsp;· добавлено {added}{/if}
	</p>
	{#each results as w (w.id)}
		<WordRow word={w} query={search.query} added={isLearning(w.id)} onToggle={() => toggleWord(w.id)} />
	{:else}
		<p class="empty">Ничего не найдено</p>
	{/each}
	<div style:height="max(0px, calc({kb.px}px - var(--tabbar-h) - var(--safe-bottom)))" aria-hidden="true"></div>
</main>

{#if sheet}
	<FilterSheet part={sheet} onClose={closeSheet} />
{/if}

<style>
	.count {
		margin-bottom: 6px;
		font-size: 13px;
		color: var(--text-3);
	}
	.empty {
		padding: 32px 0;
		text-align: center;
		color: var(--text-3);
	}
</style>
