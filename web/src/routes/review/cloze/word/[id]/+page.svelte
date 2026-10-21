<script lang="ts">
	import { page } from '$app/state';
	import { wordById } from '$lib/content';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import Stub from '$lib/ui/shell/Stub.svelte';
	import { hideTabBarWhile } from '$lib/state/ui.svelte';

	hideTabBarWhile();
	const word = $derived(wordById.get(page.params.id ?? ''));
</script>

<main class="page">
	<NavBar backLabel="Сессия" fallback="/review/cloze" />
	<Stub what={`Карточка «${word?.word ?? page.params.id}» из Cloze (§3)`} />
</main>
