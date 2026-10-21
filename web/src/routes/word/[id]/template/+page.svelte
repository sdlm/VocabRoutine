<script lang="ts">
	import { page } from '$app/state';
	import { wordById } from '$lib/content';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import Stub from '$lib/ui/shell/Stub.svelte';

	const word = $derived(wordById.get(page.params.id ?? ''));
</script>

<main class="page">
	<NavBar backLabel={word?.word ?? 'Назад'} fallback={`/word/${page.params.id}`} title="Шаблон карточки" />
	<Stub what="Шаблон карточки (§4)" />
</main>
