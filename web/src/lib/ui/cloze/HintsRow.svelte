<script lang="ts" module>
	export interface Hint {
		/** Stable key for the list. */
		id: string;
		label: string;
		used: boolean;
		onUse: () => void;
	}
</script>

<script lang="ts">
	let { hints }: { hints: Hint[] } = $props();
</script>

{#if hints.length}
	<div class="hints">
		{#each hints as h (h.id)}
			<!-- pointerdown is cancelled so the input keeps focus and the keyboard stays open -->
			<button type="button" class:used={h.used} aria-disabled={h.used}
				onpointerdown={(e) => e.preventDefault()}
				onclick={() => !h.used && h.onUse()}
			>
				{h.label}
			</button>
		{/each}
	</div>
{/if}

<style>
	.hints {
		display: flex;
		gap: 6px;
		margin-bottom: 8px;
	}
	button {
		padding: 6px 12px;
		border-radius: 16px;
		border: 1px solid var(--border);
		background: var(--surface);
		font-size: 14px;
	}
	button.used {
		color: var(--text-3);
		background: var(--surface-2);
	}
</style>
