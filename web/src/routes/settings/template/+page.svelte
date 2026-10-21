<script lang="ts">
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import TemplateEditor from '$lib/ui/template/TemplateEditor.svelte';
</script>

<main class="page grouped">
	<NavBar backLabel="Настройки" fallback="/settings" />
	<h1 class="screen-title">Шаблон карточки</h1>
	<TemplateEditor />
</main>
