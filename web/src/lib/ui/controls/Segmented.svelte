<script lang="ts" generics="T extends string | number">
	let {
		options,
		value = $bindable(),
		label,
		compact = false
	}: {
		options: { value: T; label: string }[];
		value: T;
		label?: string;
		/** Small inline variant for list rows. */
		compact?: boolean;
	} = $props();
</script>

<div class="seg" class:compact role="radiogroup" aria-label={label}>
	{#each options as o (o.value)}
		<button type="button" role="radio" aria-checked={value === o.value} class:on={value === o.value} onclick={() => (value = o.value)}>
			{o.label}
		</button>
	{/each}
</div>

<style>
	.seg {
		display: flex;
		margin: 8px;
		padding: 2px;
		border-radius: 9px;
		background: var(--surface-2);
	}
	button {
		flex: 1;
		padding: 7px 0;
		border-radius: 7px;
		font-size: 15px;
		color: var(--text-2);
	}
	button.on {
		background: var(--surface);
		color: var(--text);
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}
	.seg.compact {
		margin: 0;
		flex: none;
	}
	.compact button {
		flex: none;
		padding: 5px 8px;
		font-size: 13px;
	}
</style>
