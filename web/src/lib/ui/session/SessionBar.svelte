<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Settings from '@lucide/svelte/icons/settings';
	import { back, href } from '$lib/nav';

	let {
		done,
		position,
		total,
		settingsPath
	}: {
		/** Words finished, for the progress bar. */
		done: number;
		/** N in «N / M». */
		position: number;
		total: number;
		/** ⚙︎: settings of this mode as a separate screen. */
		settingsPath: string;
	} = $props();

	const pct = $derived(total ? Math.min(100, (done / total) * 100) : 0);
</script>

<header class="sbar">
	<button aria-label="Назад" onclick={() => back('/add')}><ArrowLeft size={22} /></button>
	<div class="bar"><i style:width="{pct}%"></i></div>
	<span class="cnt">{position} / {total}</span>
	<a href={href(settingsPath)} aria-label="Настройки режима"><Settings size={20} /></a>
</header>

<style>
	.sbar {
		display: flex;
		align-items: center;
		gap: 12px;
		height: calc(var(--navbar-h) + var(--safe-top));
		padding: var(--safe-top) 0 0;
		color: var(--text-2);
	}
	.bar {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar i {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 0.2s;
	}
	.cnt {
		font-size: 13px;
		font-variant-numeric: tabular-nums;
	}
	a {
		color: var(--text-2);
		display: flex;
	}
</style>
