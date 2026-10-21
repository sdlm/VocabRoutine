<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import Search from '@lucide/svelte/icons/search';
	import { closeSearch, search } from '$lib/state/search.svelte';

	/** The page focuses it inside the loupe tap, so the keyboard opens on iOS. */
	let { input = $bindable() }: { input?: HTMLInputElement } = $props();
</script>

<div class="sbar">
	<button type="button" class="back" aria-label="Закрыть поиск" onclick={closeSearch}><ArrowLeft size={22} /></button>
	<label class="field">
		<Search size={16} />
		<input
			bind:this={input}
			bind:value={search.query}
			placeholder="Слово"
			aria-label="Поиск слова"
			enterkeyhint="search"
			autocomplete="off"
			autocapitalize="none"
			autocorrect="off"
			spellcheck="false"
			onkeydown={(e) => {
				if (e.key === 'Enter' && !e.isComposing) input?.blur();
			}}
		/>
		{#if search.query}
			<!-- pointerdown is cancelled so the field keeps focus and the keyboard stays up -->
			<button
				type="button"
				class="clear"
				aria-label="Очистить"
				onpointerdown={(e) => e.preventDefault()}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => (search.query = '')}><CircleX size={18} /></button
			>
		{/if}
	</label>
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
	.field {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 6px;
		height: 36px;
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
</style>
