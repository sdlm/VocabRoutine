<script lang="ts">
	import Layers from '@lucide/svelte/icons/layers';
	import TextCursorInput from '@lucide/svelte/icons/text-cursor-input';
	import type { Word } from '$lib/content/types';
	import { formatInterval } from '$lib/domain/srs';
	import { isSolid, type Mode } from '$lib/domain/stats';
	import type { LearningEntry } from '$lib/domain/types';
	import { href } from '$lib/nav';

	let { word, entry }: { word: Word; entry: LearningEntry } = $props();

	// Mode marks are the tab icons for now, until §9.1 of the UI spec picks the icons.
	const modes = [
		{ mode: 'forward' as Mode, icon: Layers, label: 'Слово → перевод' },
		{ mode: 'cloze' as Mode, icon: TextCursorInput, label: 'Cloze' }
	];
</script>

<a class="row" href={href(`/word/${word.id}`)}>
	<span class="main">
		<span class="w">{word.word}</span>
		<small>{word.translations[0].text} · {word.level}</small>
	</span>
	{#each modes as m (m.mode)}
		{@const p = entry[m.mode]}
		<span class="pill" class:ok={isSolid(entry, m.mode)} aria-label="{m.label}: {p ? formatInterval(p.intervalMs) : 'ещё не было'}">
			<m.icon size={12} strokeWidth={2.2} />{p ? formatInterval(p.intervalMs) : '—'}
		</span>
	{/each}
</a>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 9px 0;
		border-bottom: 1px solid var(--border);
		color: var(--text);
	}
	.main {
		flex: 1;
		min-width: 0;
	}
	.w {
		font-size: 17px;
		font-weight: 600;
	}
	small {
		display: block;
		font-size: 14px;
		color: var(--text-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pill {
		flex: none;
		display: flex;
		align-items: center;
		gap: 3px;
		min-width: 64px;
		padding: 3px 7px;
		border-radius: 8px;
		background: var(--surface-2);
		color: var(--text-3);
		font-size: 13px;
		white-space: nowrap;
	}
	.pill.ok {
		background: var(--success-soft);
		color: var(--success);
	}
</style>
