<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { WordsFilter } from '$lib/domain/stats';
	import { href } from '$lib/nav';
	import { openMyWords } from '$lib/state/my-words.svelte';

	let { counts }: { counts: { added: number; forward: number; cloze: number } } = $props();

	const rows: { filter: WordsFilter; label: string; key: keyof typeof counts; color: string }[] = [
		{ filter: 'all', label: 'Добавлено', key: 'added', color: 'var(--accent)' },
		{ filter: 'forward', label: 'Узнаю ≥ 7 дн', key: 'forward', color: 'var(--success)' },
		{ filter: 'cloze', label: 'Вспоминаю ≥ 7 дн', key: 'cloze', color: 'var(--warning)' }
	];

	/** Bars are measured against the added words. */
	const width = (n: number) => (counts.added ? `${(n / counts.added) * 100}%` : '0');
</script>

{#each rows as r (r.key)}
	<a class="row" href={href('/settings/stats/words')} onclick={() => openMyWords(r.filter)}>
		<span class="name">{r.label}</span>
		<span class="track"><i style:width={width(counts[r.key])} style:background={r.color}></i></span>
		<span class="n">{counts[r.key]}</span>
		<ChevronRight size={16} />
	</a>
{/each}

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		color: var(--text);
	}
	.row :global(svg) {
		flex: none;
		color: var(--text-3);
	}
	.name {
		flex: none;
		width: 136px;
		font-size: 15px;
	}
	.track {
		flex: 1;
		height: 8px;
		border-radius: 4px;
		background: var(--border);
		overflow: hidden;
	}
	.track i {
		display: block;
		height: 100%;
		border-radius: 4px;
	}
	.n {
		min-width: 28px;
		text-align: right;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
