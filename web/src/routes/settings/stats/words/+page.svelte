<script lang="ts">
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import Stub from '$lib/ui/shell/Stub.svelte';
</script>

<main class="page">
	<NavBar backLabel="Статистика" fallback="/settings/stats" />
	<Stub what="Мои слова (§7)" />
</main>
