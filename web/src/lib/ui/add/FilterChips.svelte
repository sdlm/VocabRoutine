<script lang="ts" module>
	export type SheetPart = 'all' | 'levels' | 'pos';
</script>

<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { levelsLabel, posLabel } from '$lib/content/labels';
	import { sheetOnlyChanges } from '$lib/domain/search';
	import { search } from '$lib/state/search.svelte';

	let { onSearch, onSheet }: { onSearch: () => void; onSheet: (part: SheetPart) => void } = $props();

	const levels = $derived(levelsLabel(search.filters.levels));
	const pos = $derived(posLabel(search.filters.pos));
	const changes = $derived(sheetOnlyChanges(search.filters));
</script>

<div class="chips">
	{#if !search.open}
		<button type="button" class="round" aria-label="Поиск" onclick={onSearch}><Search size={16} strokeWidth={2.4} /></button>
	{/if}
	<button type="button" class="chip" class:on={levels} onclick={() => onSheet('levels')}>
		{levels ?? 'Уровень'}<ChevronDown size={14} />
	</button>
	<button type="button" class="chip" class:on={pos} onclick={() => onSheet('pos')}>
		{pos ?? 'Часть речи'}<ChevronDown size={14} />
	</button>
	<button type="button" class="round" aria-label="Все фильтры" onclick={() => onSheet('all')}>
		<SlidersHorizontal size={16} />
		{#if changes > 0}<span class="dot">{changes}</span>{/if}
	</button>
</div>

<style>
	.chips {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 4px -16px 10px;
		padding: 4px 16px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.chip,
	.round {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		height: 32px;
		border-radius: 16px;
		background: var(--surface-2);
		color: var(--text-2);
		font-size: 15px;
	}
	.chip {
		gap: 2px;
		padding: 0 10px 0 12px;
	}
	.chip.on {
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
	}
	.round {
		position: relative;
		justify-content: center;
		width: 40px;
	}
	.dot {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 17px;
		padding: 0 4px;
		border-radius: 9px;
		background: var(--accent);
		color: #fff;
		font-size: 11px;
		line-height: 17px;
	}
</style>
