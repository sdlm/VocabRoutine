<script lang="ts">
	import { untrack } from 'svelte';
	import { plural, WORD_FORMS } from '$lib/format';
	import { streakInfo } from '$lib/domain/streak';
	import { dayKey } from '$lib/domain/time';
	import { app } from '$lib/state/store.svelte';
	import { greetingVisible, noteStreakCard } from '$lib/state/streak-greeting.svelte';

	/** Any value that changes when a new card opens. */
	let { card }: { card: unknown } = $props();

	const info = $derived(streakInfo(app.activity, app.settings.dailyGoal, dayKey(Date.now())));

	$effect.pre(() => {
		const c = card;
		const reached = info.goalReachedToday;
		untrack(() => noteStreakCard(c, reached));
	});
</script>

{#if !info.goalReachedToday}
	<div class="goal">🔥 ещё <b>{info.remainingToday}</b> {plural(info.remainingToday, WORD_FORMS)} до стрика</div>
{:else if greetingVisible()}
	<div class="goal done">🔥 Стрик на сегодня засчитан</div>
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
