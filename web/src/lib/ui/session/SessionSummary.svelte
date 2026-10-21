<script lang="ts">
	import { DAY_FORMS, plural } from '$lib/format';
	import { streakInfo } from '$lib/domain/streak';
	import { dayKey } from '$lib/domain/time';
	import { app } from '$lib/state/store.svelte';

	let { stats, onDone }: { stats: { value: string; label: string }[]; onDone: () => void } = $props();

	const streak = $derived(streakInfo(app.activity, app.settings.dailyGoal, dayKey(Date.now())).current);
</script>

<div class="summary">
	<div class="head">
		<div class="emoji">🎉</div>
		<h2>Сессия завершена</h2>
		<p>Стрик: {streak} {plural(streak, DAY_FORMS)} 🔥</p>
	</div>
	<div class="stats">
		{#each stats as s (s.label)}
			<div class="stat"><b>{s.value}</b><span>{s.label}</span></div>
		{/each}
	</div>
	<button class="done" onclick={onDone}>Готово</button>
</div>

<style>
	.summary {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		padding: calc(var(--safe-top) + 48px) 0 calc(var(--safe-bottom) + 24px);
	}
	.head {
		text-align: center;
	}
	.emoji {
		font-size: 56px;
	}
	h2 {
		margin: 8px 0 4px;
		font-size: 24px;
	}
	p {
		color: var(--text-2);
	}
	.stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-top: 28px;
	}
	.stat {
		padding: 14px;
		border-radius: 14px;
		background: var(--surface-2);
		text-align: center;
	}
	.stat b {
		display: block;
		font-size: 26px;
	}
	.stat span {
		font-size: 13px;
		color: var(--text-2);
	}
	.done {
		margin-top: auto;
		padding: 15px;
		border-radius: 14px;
		background: var(--accent);
		color: #fff;
		font-weight: 600;
	}
</style>
