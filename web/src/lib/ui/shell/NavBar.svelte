<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { back } from '$lib/nav';

	let {
		backLabel,
		fallback,
		title = '',
		right
	}: {
		/** Text after «‹», e.g. «Настройки». */
		backLabel: string;
		/** Where «‹» leads when there is no history (deep link). */
		fallback: string;
		title?: string;
		right?: Snippet;
	} = $props();
</script>

<header class="nav">
	<button class="back" onclick={() => back(fallback)}>
		<ChevronLeft size={22} />
		<span>{backLabel}</span>
	</button>
	<span class="title">{title}</span>
	<span class="right">{@render right?.()}</span>
</header>

<style>
	.nav {
		position: sticky;
		top: 0;
		z-index: 10;
		height: calc(var(--navbar-h) + var(--safe-top));
		padding: var(--safe-top) 8px 0 4px;
		margin: 0 -16px 8px;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		background: var(--bar-bg);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border);
	}
	.back {
		display: flex;
		align-items: center;
		color: var(--accent);
		font-size: 17px;
		justify-self: start;
		max-width: 100%;
		overflow: hidden;
		white-space: nowrap;
	}
	.title {
		font-size: 17px;
		font-weight: 600;
	}
	.right {
		justify-self: end;
		display: flex;
		gap: 8px;
		color: var(--accent);
	}
</style>
