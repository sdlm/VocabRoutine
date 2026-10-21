<script lang="ts">
	import { POS_CHIP, REGISTER_CHIP, SORT_LABEL } from '$lib/content/labels';
	import { LEVELS, POS_LIST, REGISTERS } from '$lib/content/types';
	import { toggleValue, type SortOrder } from '$lib/domain/search';
	import { plural, WORD_FORMS } from '$lib/format';
	import { resetFilters, search, searchResults, setSort } from '$lib/state/search.svelte';
	import Toggle from '$lib/ui/controls/Toggle.svelte';
	import Sheet from '$lib/ui/shell/Sheet.svelte';
	import type { SheetPart } from './FilterChips.svelte';

	let { part, onClose }: { part: SheetPart; onClose: () => void } = $props();

	const TITLE: Record<SheetPart, string> = { all: 'Фильтры', levels: 'Уровень', pos: 'Часть речи' };
	const SORTS: SortOrder[] = ['freq', 'alpha', 'random'];

	// Filters apply at once; the button only closes the sheet.
	const count = $derived(searchResults().length);

	// Closing goes back in history; a second tap on the fading backdrop must not leave the tab.
	let closed = false;
	function close() {
		if (closed) return;
		closed = true;
		onClose();
	}
</script>

<Sheet title={TITLE[part]} subtitle={part === 'all' ? undefined : 'Можно выбрать несколько'} onClose={close} onReset={() => resetFilters(part)}>
	{#if part !== 'pos'}
		{#if part === 'all'}<div class="label">Уровень</div>{/if}
		<div class="levels">
			{#each LEVELS as l (l)}
				<button
					type="button"
					aria-pressed={search.filters.levels.includes(l)}
					onclick={() => (search.filters.levels = toggleValue(search.filters.levels, l, LEVELS))}>{l}</button
				>
			{/each}
		</div>
	{/if}
	{#if part !== 'levels'}
		{#if part === 'all'}<div class="label">Часть речи</div>{/if}
		<div class="wrap">
			{#each POS_LIST as p (p)}
				<button
					type="button"
					aria-pressed={search.filters.pos.includes(p)}
					onclick={() => (search.filters.pos = toggleValue(search.filters.pos, p, POS_LIST))}>{POS_CHIP[p]}</button
				>
			{/each}
		</div>
	{/if}
	{#if part === 'all'}
		<div class="label">Регистр</div>
		<div class="wrap">
			{#each REGISTERS as r (r)}
				<button
					type="button"
					aria-pressed={search.filters.registers.includes(r)}
					onclick={() => (search.filters.registers = toggleValue(search.filters.registers, r, REGISTERS))}>{REGISTER_CHIP[r]}</button
				>
			{/each}
		</div>
		<div class="toggle"><Toggle label="Только новые слова" bind:checked={search.filters.onlyNew} /></div>
		<div class="label">Сортировка</div>
		<div class="wrap" role="radiogroup" aria-label="Сортировка">
			{#each SORTS as s (s)}
				<button type="button" role="radio" aria-checked={search.filters.sort === s} onclick={() => setSort(s)}>{SORT_LABEL[s]}</button>
			{/each}
		</div>
	{/if}
	<button type="button" class="show" onclick={close}>Показать {count} {plural(count, WORD_FORMS)}</button>
</Sheet>

<style>
	.label {
		margin: 14px 0 6px;
		font-size: 12px;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.levels {
		display: flex;
		gap: 6px;
		margin-top: 8px;
	}
	.levels button {
		flex: 1;
		padding: 10px 0;
		border-radius: 9px;
	}
	.wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 8px;
	}
	.wrap button {
		padding: 7px 12px;
		border-radius: 16px;
		font-size: 15px;
	}
	.levels button,
	.wrap button {
		background: var(--surface-2);
		color: var(--text-2);
	}
	.levels button[aria-pressed='true'],
	.wrap button[aria-pressed='true'],
	.wrap button[aria-checked='true'] {
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
	}
	.toggle {
		margin: 10px -16px 0;
	}
	.show {
		display: block;
		width: 100%;
		margin-top: 20px;
		padding: 14px;
		border-radius: var(--radius);
		background: var(--accent);
		color: #fff;
		font-weight: 600;
	}
</style>
