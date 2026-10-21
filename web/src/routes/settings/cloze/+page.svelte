<script lang="ts">
	import ClozeSettingsForm from '$lib/ui/cloze/ClozeSettingsForm.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
</script>

<main class="page grouped">
	<NavBar backLabel="Настройки" fallback="/settings" />
	<h1 class="screen-title">Cloze</h1>
	<ClozeSettingsForm />
</main>
