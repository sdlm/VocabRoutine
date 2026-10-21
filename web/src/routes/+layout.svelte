<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import TabBar from '$lib/ui/shell/TabBar.svelte';
	import { badges, startBadges } from '$lib/badges.svelte';
	import { startActivityTracking } from '$lib/state/activity.svelte';
	import { app, startPersistence } from '$lib/state/store.svelte';
	import { ui, type TabId } from '$lib/state/ui.svelte';

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
		const match = TAB_PREFIXES.find(([prefix]) => id.startsWith(prefix));
		if (match) ui.lastTab = match[1];
	});

	$effect(() => {
		const root = document.documentElement;
		if (app.settings.theme === 'auto') delete root.dataset.theme;
		else root.dataset.theme = app.settings.theme;
	});

	onMount(async () => {
		if (import.meta.env.DEV) return;
		const { registerSW } = await import('virtual:pwa-register');
		registerSW({ immediate: true });
	});
</script>

{@render children()}

{#if ui.tabBar}
	<TabBar active={ui.lastTab} {badges} />
{/if}
