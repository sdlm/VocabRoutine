<script lang="ts">
	import { page } from '$app/state';
	import { wordById } from '$lib/content';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import TemplateEditor from '$lib/ui/template/TemplateEditor.svelte';

	const word = $derived(wordById.get(page.params.id ?? ''));
</script>

<main class="page grouped">
	<NavBar backLabel={word?.word ?? 'Назад'} fallback={`/word/${page.params.id}`} />
	<h1 class="screen-title">Шаблон карточки</h1>
	<TemplateEditor />
</main>
