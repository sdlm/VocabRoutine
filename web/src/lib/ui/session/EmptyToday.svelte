<script lang="ts">
	import { plural, WORD_FORMS } from '$lib/format';
	import { HOUR } from '$lib/domain/time';
	import { upcoming } from '$lib/domain/queue';
	import { formatInterval } from '$lib/domain/srs';
	import { href } from '$lib/nav';
	import LargeTitle from '$lib/ui/shell/LargeTitle.svelte';

	let {
		title,
		dueAts,
		extraTomorrow = 0
	}: {
		title: string;
		/** Due dates of the mode's words. */
		dueAts: number[];
		/** Added to «Завтра в очереди»: new words tomorrow's forward queue takes. */
		extraTomorrow?: number;
	} = $props();

	const next = $derived(upcoming(dueAts, Date.now()));
</script>

<LargeTitle {title} />
<div class="empty">
	<div class="check">✓</div>
	<h2>На сегодня всё</h2>
	{#if next.laterToday}
		<p>
			{next.laterToday.count === 1 ? 'Следующее' : 'Следующие'}
			{next.laterToday.count}
			{plural(next.laterToday.count, WORD_FORMS)} —
			{next.laterToday.inMs < HOUR ? 'меньше чем через час' : `через ${formatInterval(next.laterToday.inMs)}`}
		</p>
	{/if}
	<p>Завтра в очереди: {next.tomorrow + extraTomorrow}</p>
	<a class="link" href={href('/add')}>Добавить новые слова →</a>
</div>

<style>
	.empty {
		padding-top: 64px;
		text-align: center;
	}
	.check {
		font-size: 48px;
		color: var(--success);
	}
	h2 {
		margin: 8px 0;
		font-size: 22px;
	}
	p {
		color: var(--text-2);
		font-size: 15px;
	}
	.link {
		display: inline-block;
		margin-top: 20px;
		padding: 10px 16px;
		border-radius: var(--radius);
		background: var(--accent-soft);
		font-size: 15px;
	}
</style>
