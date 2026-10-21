<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<section class="blk">
	<h3>{label}</h3>
	{@render children()}
</section>

<style>
	.blk {
		padding: 12px 0;
		border-top: 1px solid var(--border);
	}
	h3 {
		margin-bottom: 6px;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
</style>
