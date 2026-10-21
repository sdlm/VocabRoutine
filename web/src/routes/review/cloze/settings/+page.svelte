<script lang="ts">
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import Stub from '$lib/ui/shell/Stub.svelte';
	import { hideTabBarWhile } from '$lib/state/ui.svelte';

	hideTabBarWhile();
</script>

<main class="page">
	<NavBar backLabel="Сессия" fallback="/review/cloze" title="Cloze" />
	<Stub what="Настройки Cloze из сессии (§6)" />
</main>
