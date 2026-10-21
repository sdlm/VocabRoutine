<script lang="ts">
	import LargeTitle from '$lib/ui/shell/LargeTitle.svelte';
	import Stub from '$lib/ui/shell/Stub.svelte';
	import { href } from '$lib/nav';
</script>

<main class="page">
	<LargeTitle title="Добавить" />
	<Stub what="Поиск слов (§2)" />
	<p><a href={href('/word/deploy')}>Карточка deploy ›</a></p>
</main>
