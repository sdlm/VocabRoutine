<script lang="ts">
	import { activityTotals, heatmap, wordCounts } from '$lib/domain/stats';
	import { streakInfo } from '$lib/domain/streak';
	import { dayKey } from '$lib/domain/time';
	import { DAY_FORMS, formatMinutes, formatTotalTime, plural } from '$lib/format';
	import { app } from '$lib/state/store.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';
	import Heatmap from '$lib/ui/stats/Heatmap.svelte';
	import WordsBars from '$lib/ui/stats/WordsBars.svelte';

	// Re-read with every activity change (the time tracker writes every 15 s), so midnight moves the calendar.
	const today = $derived.by(() => (app.activity, dayKey(Date.now())));
	const streak = $derived(streakInfo(app.activity, app.settings.dailyGoal, today));
	const totals = $derived(activityTotals(app.activity));
	const counts = $derived(wordCounts(Object.values(app.learning)));
	const cells = $derived(heatmap(app.activity, today));
</script>

<main class="page">
	<NavBar backLabel="Настройки" fallback="/settings" />
	<h1 class="screen-title">Статистика</h1>

	<section class="card">
		<div class="streak">
			<span class="n">🔥 {streak.current}</span>
			<span class="t">{plural(streak.current, DAY_FORMS)} подряд<br />рекорд: {streak.record}</span>
		</div>
		<Heatmap {cells} />
	</section>

	<div class="kpis">
		<div class="kpi"><b>{totals.days}</b><span>{plural(totals.days, DAY_FORMS)} занятий</span></div>
		<div class="kpi"><b>{formatTotalTime(totals.seconds)}</b><span>в приложении</span></div>
		<div class="kpi"><b>{formatMinutes(totals.avgSeconds)}</b><span>в среднем/день</span></div>
	</div>

	<section class="card">
		<h2>Слова</h2>
		<WordsBars {counts} />
	</section>
</main>

<style>
	.card {
		margin-top: 12px;
		padding: 14px 16px;
		border-radius: 16px;
		background: var(--surface-2);
	}
	.streak {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.streak .n {
		font-size: 40px;
		font-weight: 800;
		line-height: 1;
	}
	.streak .t {
		font-size: 14px;
		color: var(--text-2);
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-top: 8px;
	}
	.kpi {
		padding: 12px 6px;
		border-radius: 14px;
		background: var(--surface-2);
		text-align: center;
	}
	.kpi b {
		display: block;
		font-size: 20px;
	}
	.kpi span {
		font-size: 12px;
		color: var(--text-3);
	}
	h2 {
		margin-bottom: 4px;
		font-size: 13px;
		font-weight: 400;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
</style>
