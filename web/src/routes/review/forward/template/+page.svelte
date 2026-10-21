<script lang="ts">
	import { hideTabBarWhile } from '$lib/state/ui.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import TemplateEditor from '$lib/ui/template/TemplateEditor.svelte';

	hideTabBarWhile();
</script>

<main class="page grouped">
	<NavBar backLabel="Сессия" fallback="/review/forward" />
	<h1 class="screen-title">Шаблон карточки</h1>
	<TemplateEditor />
</main>
