<script lang="ts">
	import BookPlus from '@lucide/svelte/icons/book-plus';
	import Layers from '@lucide/svelte/icons/layers';
	import TextCursorInput from '@lucide/svelte/icons/text-cursor-input';
	import Settings from '@lucide/svelte/icons/settings';
	import { href } from '$lib/nav';
	import type { TabId } from '$lib/state/ui.svelte';

	// Temporary icons until §9.1 of the UI spec is decided.
	const tabs = [
		{ id: 'add', path: '/add', icon: BookPlus, label: 'Добавить' },
		{ id: 'forward', path: '/review/forward', icon: Layers, label: 'Слово → перевод' },
		{ id: 'cloze', path: '/review/cloze', icon: TextCursorInput, label: 'Cloze → слово' },
		{ id: 'settings', path: '/settings', icon: Settings, label: 'Настройки' }
	] as const;

	let { active, badges }: { active: TabId; badges: { forward: number; cloze: number } } = $props();

	function badge(id: TabId): number {
		return id === 'forward' ? badges.forward : id === 'cloze' ? badges.cloze : 0;
	}
</script>

<nav class="tabbar">
	{#each tabs as tab (tab.id)}
		{@const n = badge(tab.id)}
		<a class="tab" class:act={active === tab.id} href={href(tab.path)} aria-label={tab.label}>
			<tab.icon size={22} strokeWidth={1.8} />
			{#if n > 0}<span class="badge">{n}</span>{/if}
		</a>
	{/each}
</nav>

<style>
	.tabbar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		height: calc(var(--tabbar-h) + var(--safe-bottom));
		padding: 6px 0 var(--safe-bottom);
		display: flex;
		justify-content: space-around;
		align-items: flex-start;
		background: var(--bar-bg);
		backdrop-filter: blur(12px);
		border-top: 1px solid var(--border);
	}
	.tab {
		position: relative;
		width: 56px;
		height: 36px;
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-3);
	}
	.tab.act {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.badge {
		position: absolute;
		top: -4px;
		right: 2px;
		min-width: 18px;
		padding: 0 5px;
		border-radius: 9px;
		background: var(--badge);
		color: #fff;
		font-size: 11px;
		line-height: 18px;
		text-align: center;
	}
</style>
