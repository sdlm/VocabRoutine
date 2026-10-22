<script lang="ts">
	import CircleX from '@lucide/svelte/icons/circle-x';
	import Search from '@lucide/svelte/icons/search';
	import type { WordsFilter } from '$lib/domain/stats';
	import { myWords, myWordsResults } from '$lib/state/my-words.svelte';
	import { app } from '$lib/state/store.svelte';
	import { hideTabBarWhile } from '$lib/state/ui.svelte';
	import Segmented from '$lib/ui/controls/Segmented.svelte';
	import { keyboardInset, keyboardOpen } from '$lib/ui/keyboard.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import MyWordRow from '$lib/ui/stats/MyWordRow.svelte';

	// Same as «Добавить»: the tab bar steps aside while the keyboard is up.
	const kb = keyboardInset();
	const keyboard = keyboardOpen();
	hideTabBarWhile(() => keyboard.open);

	let input: HTMLInputElement | undefined = $state();

	const filters: { value: WordsFilter; label: string }[] = [
		{ value: 'all', label: 'Все' },
		{ value: 'forward', label: 'Узнаю ≥7' },
		{ value: 'cloze', label: 'Вспоминаю ≥7' }
	];

	const total = $derived(Object.keys(app.learning).length);
	const list = $derived(myWordsResults());
</script>

<main class="page">
	<NavBar backLabel="Статистика" fallback="/settings/stats" />
	<h1 class="screen-title">Мои слова · {total}</h1>
	<label class="field">
		<Search size={16} />
		<input
			bind:this={input}
			bind:value={myWords.query}
			placeholder="Найти среди моих…"
			aria-label="Поиск среди моих слов"
			enterkeyhint="search"
			autocomplete="off"
			autocapitalize="none"
			autocorrect="off"
			spellcheck="false"
			onkeydown={(e) => {
				if (e.key === 'Enter' && !e.isComposing) input?.blur();
			}}
		/>
		{#if myWords.query}
			<!-- pointerdown is cancelled so the field keeps focus and the keyboard stays up -->
			<button
				type="button"
				class="clear"
				aria-label="Очистить"
				onpointerdown={(e) => e.preventDefault()}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => (myWords.query = '')}><CircleX size={18} /></button
			>
		{/if}
	</label>
	<Segmented label="Фильтр" options={filters} bind:value={myWords.filter} />
	{#each list as w (w.id)}
		<MyWordRow word={w} entry={app.learning[w.id]} />
	{:else}
		<p class="empty">{total ? 'Ничего не найдено' : 'Слов пока нет. Их можно добавить в разделе «Добавить».'}</p>
	{/each}
	<div style:height="max(0px, calc({kb.px}px - var(--tabbar-h) - var(--safe-bottom)))" aria-hidden="true"></div>
</main>

<style>
	.field {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 36px;
		margin-top: 10px;
		padding: 0 8px 0 10px;
		border: 1.5px solid transparent;
		border-radius: 10px;
		background: var(--surface-2);
		color: var(--text-3);
	}
	.field:focus-within {
		border-color: var(--accent);
	}
	input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		font: inherit;
		font-size: 17px;
		color: var(--text);
	}
	.clear {
		display: flex;
		padding: 8px;
		margin: -8px -4px -8px 0;
		color: var(--text-3);
	}
	.field + :global(.seg) {
		margin: 8px 0 4px;
	}
	.empty {
		padding: 32px 0;
		text-align: center;
		color: var(--text-3);
	}
</style>
