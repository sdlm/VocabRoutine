<script lang="ts">
	import type { Calendar, CalendarDay } from '$lib/domain/calendar';
	import { formatMinutes } from '$lib/format';
	import { ALL_IN_STREAK, dayFacts, dayName, shortDate } from './calendar-text';

	let { cal, goal }: { cal: Calendar; goal: number } = $props();

	const WEEK = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];
	/** The streak pill is --streak-0 on the first day of the run and fades to --streak-3 by the fourth. */
	const FADE_DAYS = 3;
	const fade = (n: number) => `var(--streak-${Math.min(n, FADE_DAYS)})`;

	const days = $derived(cal.rows.flatMap((r) => r.days));
	/** The tapped day; today until the user taps another. */
	let picked: string | null = $state(null);
	const shown = $derived(days.find((d) => d.key === picked) ?? days.find((d) => d.state === 'today')!);
	/** No pill without a streak, and none when it would cover every day (a line says so instead). */
	const pill = $derived(cal.allInStreak === null && days.some((d) => d.streakDay !== null));

	const inPill = (d: CalendarDay | undefined) => pill && d?.streakDay != null;
	/** The pill runs on to the next tile inside the same week; it breaks at the week gap and at the row end. */
	const joins = (row: CalendarDay[], i: number) => inPill(row[i]) && i % 7 < 6 && inPill(row[i + 1]);
	const joined = (row: CalendarDay[], i: number) => inPill(row[i]) && i % 7 > 0 && inPill(row[i - 1]);
	const pillStyle = (d: CalendarDay) => (inPill(d) ? `--h1: ${fade(d.streakDay!)}; --h2: ${fade(d.streakDay! + 1)}` : undefined);
</script>

<div class="cal" role="group" aria-label="Календарь занятий">
	<span></span>
	{#each [0, 1] as half (half)}
		{#if half}<span></span>{/if}
		{#each WEEK as w, i (i)}<span class="wd" aria-hidden="true">{w}</span>{/each}
	{/each}
	{#each cal.rows as row (row.start)}
		<span class="rl">{shortDate(row.start)}</span>
		{#each row.days as d, i (d.key)}
			{#if i === 7}<span></span>{/if}
			{#if d.state === 'before' || d.state === 'future'}
				<span class="c none"></span>
			{:else}
				<button
					type="button"
					class="c l{d.level}"
					class:today={d.state === 'today'}
					class:sel={d.key === picked && d.state !== 'today'}
					class:s={inPill(d)}
					class:join={joins(row.days, i)}
					class:joined={joined(row.days, i)}
					style={pillStyle(d)}
					aria-label="{dayName(d.key)}: {formatMinutes(d.seconds)}"
					aria-pressed={d.key === shown.key}
					onclick={() => (picked = d.key)}
				></button>
			{/if}
		{/each}
	{/each}
</div>

{#if cal.allInStreak}<p class="all">🔥 {ALL_IN_STREAK[cal.allInStreak]}</p>{/if}

<p class="day" aria-live="polite">
	<b>{dayName(shown.key)}{shown.state === 'today' ? ', сегодня' : ''}</b>{#each dayFacts(shown, goal) as f (f.text)}{' · '}<span
			class={f.tone}>{f.text}</span
		>{/each}
</p>

<div class="legend">
	<span class="scale">
		<i style:background="var(--heat-0)"></i><span>0</span>
		<i style:background="var(--heat-1)"></i><span>&lt;10</span>
		<i style:background="var(--heat-2)"></i><span>10–20</span>
		<i style:background="var(--heat-3)"></i><span>20+ мин</span>
	</span>
	{#if pill}<span class="mark"><i></i>стрик</span>{/if}
</div>

<style>
	/* Two weeks per row: row label, 7 days, a gap, 7 days. */
	.cal {
		display: grid;
		grid-template-columns: 38px repeat(7, 1fr) 7px repeat(7, 1fr);
		gap: 4px 3px;
		align-items: center;
		margin-top: 14px;
		isolation: isolate;
	}
	.wd,
	.rl {
		font-size: 11px;
		color: var(--text-3);
		text-align: center;
	}
	.rl {
		text-align: left;
		white-space: nowrap;
	}
	/* The cell keeps its size; the tile sits inside it, so the streak pill shows around the tile. */
	.c {
		position: relative;
		aspect-ratio: 1;
		padding: 0;
		border-radius: 3px;
		touch-action: manipulation;
	}
	.c::before {
		content: '';
		position: absolute;
		inset: 2.5px;
		border-radius: 2px;
		background: var(--heat-0);
	}
	.c.l1::before {
		background: var(--heat-1);
	}
	.c.l2::before {
		background: var(--heat-2);
	}
	.c.l3::before {
		background: var(--heat-3);
	}
	.c.none::before {
		background: transparent;
		box-shadow: inset 0 0 0 1px var(--border);
	}
	.c.today {
		outline: 1.5px solid var(--text);
		outline-offset: 1px;
	}
	.c.sel {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
		z-index: 1;
	}
	/* Keyboard focus stays visible over the today and picked rings. */
	.c:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
		z-index: 2;
	}
	.c.s {
		border-radius: 5px;
		background: linear-gradient(to right, var(--h1), var(--h2));
	}
	.c.s.join {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	.c.s.joined {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	/* Bridge over the 3 px gap to the next tile of the run. */
	.c.s.join::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		right: -3px;
		width: 3px;
		background: var(--h2);
	}
	.all {
		margin-top: 10px;
		font-size: 13px;
		font-weight: 600;
		color: var(--streak-0);
	}
	.day {
		margin-top: 12px;
		padding: 9px 10px;
		border-radius: 10px;
		background: var(--bg);
		font-size: 13px;
		line-height: 1.4;
		color: var(--text-2);
	}
	.day b {
		color: var(--text);
		font-weight: 600;
	}
	.ok {
		color: var(--success);
	}
	.miss {
		color: var(--text-3);
	}
	.streak {
		color: var(--streak-0);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px 12px;
		margin-top: 12px;
		font-size: 12px;
		color: var(--text-3);
	}
	.scale,
	.mark {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.legend i {
		position: relative;
		flex: none;
		width: 12px;
		height: 12px;
		border-radius: 3px;
	}
	.scale span {
		margin-right: 4px;
	}
	.mark i {
		background: linear-gradient(to right, var(--streak-0), var(--streak-3));
	}
	.mark i::before {
		content: '';
		position: absolute;
		inset: 2px;
		border-radius: 2px;
		background: var(--heat-2);
	}
</style>
