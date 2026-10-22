<script lang="ts">
	import { formatFactor } from '$lib/domain/srs';
	import { DAY, HOUR } from '$lib/domain/time';
	import type { NewOrder } from '$lib/domain/types';
	import { app } from '$lib/state/store.svelte';
	import Group from '$lib/ui/controls/Group.svelte';
	import ListRow from '$lib/ui/controls/ListRow.svelte';
	import Segmented from '$lib/ui/controls/Segmented.svelte';
	import Stepper from '$lib/ui/controls/Stepper.svelte';
	import QueueDemo from '$lib/ui/settings/QueueDemo.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';

	const q = $derived(app.settings.queue);

	const orders: { value: NewOrder; label: string }[] = [
		{ value: 'first', label: 'Сначала' },
		{ value: 'mixed', label: 'Вперемешку' },
		{ value: 'last', label: 'В конце' }
	];
	const minimums = [
		{ value: HOUR, label: '1 ч' },
		{ value: 4 * HOUR, label: '4 ч' },
		{ value: DAY, label: '1 д' }
	];
</script>

<main class="page grouped">
	<NavBar backLabel="Настройки" fallback="/settings" />
	<h1 class="screen-title">Очередь</h1>
	<Group label="Каждый день">
		<ListRow label="Новых слов в день">
			<Stepper bind:value={q.newPerDay} min={0} max={50} label="Новых слов в день" />
		</ListRow>
		<!-- Three long labels do not fit next to the title on a phone: the control goes under it. -->
		<div class="stacked">
			<span>Новые слова</span>
			<Segmented label="Новые слова" options={orders} bind:value={q.newOrder} />
		</div>
	</Group>
	<Group label="Интервалы">
		<ListRow label="При успехе" note="интервал × коэффициент">
			<Stepper bind:value={q.successFactor} min={1.1} max={5} step={0.1} decimals={1} format={formatFactor} label="При успехе" />
		</ListRow>
		<ListRow label="При провале" note="интервал × коэффициент">
			<Stepper bind:value={q.failFactor} min={0.1} max={1} step={0.1} decimals={1} format={formatFactor} label="При провале" />
		</ListRow>
		<ListRow label="Минимальный интервал" note="интервал не опускается ниже">
			<Segmented compact label="Минимальный интервал" options={minimums} bind:value={q.minIntervalMs} />
		</ListRow>
	</Group>
	<Group label="Как это работает">
		<QueueDemo settings={q} />
	</Group>
	<p class="note">Демо пересчитывается при смене коэффициентов. На реальные слова не влияет.</p>
</main>

<style>
	.stacked {
		padding: 12px 16px 0;
	}
	.stacked :global(.seg) {
		margin: 8px 0 10px;
	}
	.note {
		margin: 6px 16px 0;
		font-size: 13px;
		color: var(--text-3);
	}
</style>
