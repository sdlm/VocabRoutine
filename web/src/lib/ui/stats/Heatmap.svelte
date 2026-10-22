<script lang="ts">
	import type { HeatCell } from '$lib/domain/stats';
	import { formatMinutes } from '$lib/format';

	/** 56 days, oldest first: 4 rows of 14, as in 08-stats.html. */
	let { cells }: { cells: HeatCell[] } = $props();
</script>

<div class="heat" role="img" aria-label="Календарь занятий за 8 недель">
	{#each cells as c (c.key)}
		<i class="l{c.level}" title="{c.key}: {formatMinutes(c.seconds)}"></i>
	{/each}
</div>

<style>
	.heat {
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		gap: 3px;
		margin-top: 12px;
	}
	i {
		aspect-ratio: 1;
		border-radius: 3px;
		background: var(--border);
	}
	.l1 {
		background: color-mix(in srgb, var(--success) 30%, transparent);
	}
	.l2 {
		background: color-mix(in srgb, var(--success) 60%, transparent);
	}
	.l3 {
		background: var(--success);
	}
</style>
