<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import TabBar from '$lib/ui/shell/TabBar.svelte';
	import { badges, startBadges } from '$lib/badges.svelte';
	import { startActivityTracking } from '$lib/state/activity.svelte';
	import { leaveAddTab } from '$lib/state/search.svelte';
	import { app, startPersistence } from '$lib/state/store.svelte';
	import { tabBarVisible, ui, type TabId } from '$lib/state/ui.svelte';
	import { applyTheme } from '$lib/theme';

	let { children } = $props();

	startPersistence();
	startActivityTracking();
	startBadges();

	const TAB_PREFIXES: [string, TabId][] = [
		['/add', 'add'],
		['/review/forward', 'forward'],
		['/review/cloze', 'cloze'],
		['/settings', 'settings']
	];

	$effect(() => {
		const id = page.route.id ?? '';
		// The card belongs to no tab: highlight the one it was opened from, the same mark its «‹» reads.
		if (id === '/word/[id]') {
			ui.lastTab = page.state.from === 'my-words' ? 'settings' : 'add';
			return;
		}
		const match = TAB_PREFIXES.find(([prefix]) => id.startsWith(prefix));
		if (!match) return;
		ui.lastTab = match[1];
		if (match[1] !== 'add') leaveAddTab();
	});

	$effect(() => applyTheme(app.settings.theme));

	onMount(async () => {
		if (import.meta.env.DEV) return;
		const { registerSW } = await import('virtual:pwa-register');
		registerSW({ immediate: true });
	});
</script>

{@render children()}

{#if tabBarVisible()}
	<TabBar active={ui.lastTab} {badges} />
{/if}
