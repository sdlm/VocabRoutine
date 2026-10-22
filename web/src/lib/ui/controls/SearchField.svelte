<script lang="ts">
	import CircleX from '@lucide/svelte/icons/circle-x';
	import Search from '@lucide/svelte/icons/search';

	let {
		value = $bindable(),
		input = $bindable(),
		placeholder,
		label
	}: {
		value: string;
		/** The page may focus it inside a tap, so the keyboard opens on iOS. */
		input?: HTMLInputElement;
		placeholder: string;
		/** Accessible name of the field. */
		label: string;
	} = $props();
</script>

<label class="field">
	<Search size={16} />
	<input
		bind:this={input}
		bind:value
		{placeholder}
		aria-label={label}
		enterkeyhint="search"
		autocomplete="off"
		autocapitalize="none"
		autocorrect="off"
		spellcheck="false"
		onkeydown={(e) => {
			if (e.key === 'Enter' && !e.isComposing) input?.blur();
		}}
	/>
	{#if value}
		<!-- pointerdown is cancelled so the field keeps focus and the keyboard stays up -->
		<button
			type="button"
			class="clear"
			aria-label="Очистить"
			onpointerdown={(e) => e.preventDefault()}
			onmousedown={(e) => e.preventDefault()}
			onclick={() => (value = '')}><CircleX size={18} /></button
		>
	{/if}
</label>

<style>
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
