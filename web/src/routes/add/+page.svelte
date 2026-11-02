<script lang="ts">
	import { flushSync } from 'svelte';
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import type { SheetPart } from '$lib/domain/search';
	import { plural, WORD_FORMS } from '$lib/format';
	import { href } from '$lib/nav';
	import { search, searchResults, showMore, toggleWord, visibleLimit } from '$lib/state/search.svelte';
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

	// Filters (and the search bar) stay on top; once stuck they get the bar background.
	let top: HTMLElement | undefined = $state();
	let stuck = $state(false);
	$effect(() => {
		search.open;
		if (!top) return;
		const el = top;
		const update = () => (stuck = el.getBoundingClientRect().top <= 0);
		update();
		window.addEventListener('scroll', update, { passive: true });
		return () => window.removeEventListener('scroll', update);
	});

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

	// Thousands of rows take seconds to build: draw a page, add the next one before the list ends.
	const visible = $derived(results.slice(0, visibleLimit()));
	let more: HTMLElement | undefined = $state();

	$effect(() => {
		// Re-observe whenever the list changes: a fresh observer reports the current state at once,
		// so if the sentinel is still in reach after a page (short rows, tall screen), the next page follows.
		visible.length;
		if (!more) return;
		const io = new IntersectionObserver(([e]) => e.isIntersecting && showMore(), { rootMargin: '0px 0px 600px 0px' });
		io.observe(more);
		return () => io.disconnect();
	});

	/** Runs inside the loupe tap: focusing there is what opens the keyboard on iOS. */
	function openSearch() {
		search.open = true;
		flushSync();
		input?.focus();
	}
</script>

<main class="page">
	{#if !search.open}
		<LargeTitle title="Добавить" pinned={false} />
	{/if}
	<div bind:this={top} class="top" class:stuck class:notch={!search.open}>
		{#if search.open}
			<SearchBar bind:input />
		{/if}
		<FilterChips onSearch={openSearch} onSheet={openSheet} />
	</div>
	<p class="count">
		{results.length}
		{plural(results.length, WORD_FORMS)}{#if added > 0}&nbsp;· добавлено {added}{/if}
	</p>
	{#each visible as w (w.id)}
		<WordRow word={w} query={search.query} added={isLearning(w.id)} onToggle={() => toggleWord(w.id)} />
	{:else}
		<p class="empty">Ничего не найдено</p>
	{/each}
	{#if visible.length < results.length}
		<div bind:this={more} class="more" aria-hidden="true"></div>
	{/if}
	<div style:height="max(0px, calc({kb.px}px - var(--tabbar-h) - var(--safe-bottom)))" aria-hidden="true"></div>
</main>

{#if sheet}
	<FilterSheet part={sheet} onClose={closeSheet} />
{/if}

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		margin: 0 -16px;
		padding: 0 16px;
		border-bottom: 1px solid transparent;
	}
	/* Without the search bar nothing else keeps the chips out of the notch: the room is
	   always there but overlaps the title above, so the unstuck layout does not move. */
	.top.notch {
		margin-top: calc(-1 * var(--safe-top));
		padding-top: var(--safe-top);
	}
	.top.stuck {
		background: var(--bar-bg);
		backdrop-filter: blur(12px);
		border-color: var(--border);
	}
	.count {
		margin-bottom: 6px;
		font-size: 13px;
		color: var(--text-3);
	}
	.more {
		height: 1px;
	}
	.empty {
		padding: 32px 0;
		text-align: center;
		color: var(--text-3);
	}
</style>
