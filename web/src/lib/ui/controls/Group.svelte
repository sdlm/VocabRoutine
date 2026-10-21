<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label?: string; children: Snippet } = $props();
</script>

{#if label}<div class="label">{label}</div>{/if}
<div class="group">{@render children()}</div>

<style>
	.label {
		margin: 20px 16px 6px;
		font-size: 13px;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.group {
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
	}
	.group > :global(* + *) {
		border-top: 1px solid var(--border);
	}
</style>
