<script lang="ts">
	import { stepValue } from './step';

	let {
		value = $bindable(),
		min,
		max,
		step = 1,
		decimals = 0,
		format = String,
		label
	}: {
		value: number;
		min: number;
		max: number;
		step?: number;
		/** Digits kept after every step: 1 for the ×0,1 factors. */
		decimals?: number;
		format?: (v: number) => string;
		label: string;
	} = $props();

	const change = (delta: number) => (value = stepValue(value, delta, min, max, decimals));
</script>

<div class="stepper" role="group" aria-label={label}>
	<button type="button" aria-label="Меньше" disabled={value <= min} onclick={() => change(-step)}>−</button>
	<span class="value" aria-live="polite">{format(value)}</span>
	<button type="button" aria-label="Больше" disabled={value >= max} onclick={() => change(step)}>+</button>
</div>

<style>
	.stepper {
		flex: none;
		display: flex;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: 9px;
		overflow: hidden;
	}
	button {
		width: 40px;
		height: 32px;
		font-size: 18px;
		color: var(--accent);
		touch-action: manipulation;
	}
	button:disabled {
		color: var(--text-3);
		opacity: 0.5;
		cursor: default;
	}
	button:active:not(:disabled) {
		background: var(--accent-soft);
	}
	.value {
		min-width: 44px;
		padding: 0 6px;
		align-self: stretch;
		display: flex;
		align-items: center;
		justify-content: center;
		border-inline: 1px solid var(--border);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
