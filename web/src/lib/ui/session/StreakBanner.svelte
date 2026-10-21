<script lang="ts">
	import { plural, WORD_FORMS } from '$lib/format';
	import { streakInfo } from '$lib/domain/streak';
	import { dayKey } from '$lib/domain/time';
	import { app } from '$lib/state/store.svelte';

	const info = $derived(streakInfo(app.activity, app.settings.dailyGoal, dayKey(Date.now())));
</script>

{#if info.goalReachedToday}
	<div class="goal done">🔥 Стрик на сегодня засчитан</div>
{:else}
	<div class="goal">🔥 ещё <b>{info.remainingToday}</b> {plural(info.remainingToday, WORD_FORMS)} до стрика</div>
{/if}

<style>
	.goal {
		padding: 6px 12px;
		border-radius: var(--radius);
		background: var(--warning-soft);
		color: var(--warning);
		font-size: 14px;
		text-align: center;
	}
	.goal.done {
		background: var(--success-soft);
		color: var(--success);
	}
</style>
