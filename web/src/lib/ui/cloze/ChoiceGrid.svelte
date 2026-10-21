<script lang="ts">
	let {
		choices,
		answer,
		picked,
		closed,
		onPick
	}: {
		choices: string[];
		answer: string;
		/** Chosen option once closed; null after «Сдаться». */
		picked: string | null;
		closed: boolean;
		onPick: (choice: string) => void;
	} = $props();

	function state(choice: string): string {
		if (!closed) return '';
		if (choice === answer) return 'ok';
		return choice === picked ? 'bad' : 'dim';
	}
</script>

<div class="grid">
	{#each choices as c (c)}
		<button type="button" class={state(c)} disabled={closed} onclick={() => onPick(c)}>{c}</button>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 10px;
	}
	button {
		padding: 16px 4px;
		border-radius: var(--radius);
		background: var(--surface-2);
		font-size: 17px;
	}
	button:disabled {
		cursor: default;
	}
	.ok {
		background: var(--success-soft);
		color: var(--success);
		font-weight: 700;
	}
	.bad {
		background: var(--danger-soft);
		color: var(--danger);
	}
	.dim {
		opacity: 0.35;
	}
</style>
