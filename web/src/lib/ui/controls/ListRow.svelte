<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	let {
		label,
		note,
		value,
		icon: Icon,
		tone = 'plain',
		href,
		external = false,
		children
	}: {
		label: string;
		/** Grey line under the label. */
		note?: string;
		/** Grey text before the chevron: the current value of a sub-screen. */
		value?: string;
		icon?: Component<{ size?: number }>;
		/** Colour of the icon tile. */
		tone?: 'accent' | 'success' | 'danger' | 'warning' | 'plain';
		/** A link row with › (or ↗ when `external`); otherwise `children` is the control on the right. */
		href?: string;
		external?: boolean;
		children?: Snippet;
	} = $props();
</script>

{#snippet body()}
	{#if Icon}<span class="icon {tone}"><Icon size={16} /></span>{/if}
	<span class="text">
		{label}
		{#if note}<small>{note}</small>{/if}
	</span>
	{#if value}<span class="value">{value}</span>{/if}
	{@render children?.()}
	{#if href}
		<span class="chev">
			{#if external}<ExternalLink size={16} />{:else}<ChevronRight size={18} />{/if}
		</span>
	{/if}
{/snippet}

{#if href}
	<a class="row" class:external {href} target={external ? '_blank' : undefined} rel={external ? 'noopener' : undefined}>
		{@render body()}
	</a>
{:else}
	<div class="row">{@render body()}</div>
{/if}

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 48px;
		padding: 8px 12px 8px 16px;
		color: var(--text);
	}
	a.row:active {
		background: var(--surface-2);
	}
	.external .text {
		color: var(--accent);
	}
	.icon {
		flex: none;
		width: 28px;
		height: 28px;
		border-radius: 7px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.icon.plain {
		background: var(--surface-2);
		color: var(--text-2);
	}
	.icon.accent {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.icon.success {
		background: var(--success-soft);
		color: var(--success);
	}
	.icon.danger {
		background: var(--danger-soft);
		color: var(--danger);
	}
	.icon.warning {
		background: var(--warning-soft);
		color: var(--warning);
	}
	.text {
		flex: 1;
		min-width: 0;
	}
	small {
		display: block;
		margin-top: 1px;
		font-size: 13px;
		color: var(--text-3);
		line-height: 1.3;
	}
	.value {
		color: var(--text-3);
		white-space: nowrap;
	}
	.chev {
		display: flex;
		color: var(--text-3);
	}
</style>
