<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import { page } from '$app/state';
	import { wordById } from '$lib/content';
	import { href } from '$lib/nav';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import Stub from '$lib/ui/shell/Stub.svelte';

	const word = $derived(wordById.get(page.params.id ?? ''));
</script>

<main class="page">
	<NavBar backLabel="Назад" fallback="/add">
		{#snippet right()}
			<a href={href(`/word/${page.params.id}/template`)} aria-label="Шаблон карточки"><Settings size={20} /></a>
		{/snippet}
	</NavBar>
	<Stub what={`Карточка «${word?.word ?? page.params.id}» (§3)`} />
</main>
