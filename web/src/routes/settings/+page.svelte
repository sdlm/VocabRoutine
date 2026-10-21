<script lang="ts">
	import { href } from '$lib/nav';
	import { resetDemo } from '$lib/state/store.svelte';
	import LargeTitle from '$lib/ui/shell/LargeTitle.svelte';

	const links = [
		['/settings/stats', 'Статистика'],
		['/settings/queue', 'Очередь'],
		['/settings/template', 'Шаблон карточки'],
		['/settings/cloze', 'Cloze']
	];

	function reset() {
		if (confirm('Стереть прогресс и засеять демо-данные заново?')) resetDemo();
	}
</script>

<main class="page">
	<LargeTitle title="Настройки" />
	<ul class="list">
		{#each links as [path, label] (path)}
			<li><a href={href(path)}>{label} ›</a></li>
		{/each}
	</ul>
	<ul class="list">
		<li><button class="danger" onclick={reset}>Прототип: сбросить данные</button></li>
	</ul>
</main>

<style>
	.list {
		list-style: none;
		margin-bottom: 24px;
		border-radius: var(--radius);
		background: var(--surface-2);
	}
	.list li + li {
		border-top: 1px solid var(--border);
	}
	.list a,
	.list button {
		display: block;
		width: 100%;
		padding: 12px 16px;
		text-align: left;
		color: var(--text);
	}
	.list .danger {
		color: var(--danger);
	}
</style>
