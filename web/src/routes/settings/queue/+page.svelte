<script lang="ts">
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import Stub from '$lib/ui/shell/Stub.svelte';
</script>

<main class="page">
	<NavBar backLabel="Настройки" fallback="/settings" />
	<Stub what="Очередь (§8)" />
</main>
