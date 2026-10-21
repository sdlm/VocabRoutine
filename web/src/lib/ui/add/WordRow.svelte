<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { POS_ABBR } from '$lib/content/labels';
	import type { Word } from '$lib/content/types';
	import { matchIndex } from '$lib/domain/search';
	import { href } from '$lib/nav';

	let { word, query, added, onToggle }: { word: Word; query: string; added: boolean; onToggle: () => void } = $props();

	const q = $derived(query.trim());
	const at = $derived(q ? matchIndex(word.word, q) : -1);
</script>

<!-- Added words are shown only by the green background (UI spec §2), no checkmarks. -->
<div class="row" class:added>
	<button type="button" class="main" aria-pressed={added} onclick={onToggle}>
		<span class="w"
			>{#if at >= 0}{word.word.slice(0, at)}<mark>{word.word.slice(at, at + q.length)}</mark>{word.word.slice(at + q.length)}{:else}{word.word}{/if}</span
		>
		<small class="pos">{POS_ABBR[word.pos]}</small>
		<small class="sub">{word.translations[0].text} · {word.level}</small>
	</button>
	<a class="more" href={href(`/word/${word.id}`)} aria-label="Карточка {word.word}"><ChevronRight size={18} /></a>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		margin: 0 -8px 2px;
		border-radius: var(--radius);
		transition: background 0.15s;
	}
	.row.added {
		background: var(--success-soft);
	}
	.main {
		flex: 1;
		min-width: 0;
		padding: 9px 8px 9px 10px;
		text-align: left;
		touch-action: manipulation;
	}
	.w {
		font-size: 17px;
		font-weight: 600;
	}
	mark {
		background: none;
		color: var(--accent);
	}
	.pos {
		margin-left: 4px;
		font-size: 13px;
		color: var(--text-3);
	}
	.sub {
		display: block;
		font-size: 14px;
		color: var(--text-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.added .sub,
	.added .pos {
		color: var(--success);
	}
	.more {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		align-self: stretch;
		color: var(--text-3);
	}
</style>
