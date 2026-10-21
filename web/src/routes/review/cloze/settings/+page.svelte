<script lang="ts">
	import { hideTabBarWhile } from '$lib/state/ui.svelte';
	import ClozeSettingsForm from '$lib/ui/cloze/ClozeSettingsForm.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';

	hideTabBarWhile();
</script>

<main class="page grouped">
	<NavBar backLabel="Сессия" fallback="/review/cloze" />
	<h1 class="screen-title">Настройки Cloze</h1>
	<p class="screen-sub">Сессия на паузе. Изменения применяются сразу.</p>
	<ClozeSettingsForm />
</main>
