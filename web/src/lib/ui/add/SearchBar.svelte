<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { closeSearch, search } from '$lib/state/search.svelte';
	import SearchField from '$lib/ui/controls/SearchField.svelte';

	/** The page focuses it inside the loupe tap, so the keyboard opens on iOS. */
	let { input = $bindable() }: { input?: HTMLInputElement } = $props();
</script>

<div class="sbar">
	<button type="button" class="back" aria-label="Закрыть поиск" onclick={closeSearch}><ArrowLeft size={22} /></button>
	<SearchField bind:value={search.query} bind:input placeholder="Слово" label="Поиск слова" />
</div>

<style>
	.sbar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 8px;
		height: calc(var(--navbar-h) + var(--safe-top) + 8px);
		padding: var(--safe-top) 16px 0 0;
		margin: 0 -16px 4px;
		background: var(--bar-bg);
		backdrop-filter: blur(12px);
	}
	.back {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		color: var(--accent);
	}
</style>
