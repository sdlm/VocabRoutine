<script lang="ts">
	import { tick } from 'svelte';
	import { demoPipeline, formatFactor, formatInterval } from '$lib/domain/srs';
	import type { SrsSettings } from '$lib/domain/types';

	/** As in 07-settings.html: the pipeline does not grow past this. */
	const MAX_STEPS = 12;

	let { settings }: { settings: SrsSettings } = $props();

	/** Local to the screen: the demo never touches real words and starts empty on every visit. */
	let answers: boolean[] = $state([]);
	let pipe: HTMLElement;

	const demo = $derived(demoPipeline(answers, settings));

	async function answer(ok: boolean) {
		if (answers.length >= MAX_STEPS) return;
		answers.push(ok);
		await tick();
		// Keep the new step in view without moving the buttons from under the finger more than needed.
		pipe.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}
</script>

<div class="demo">
	<div class="buttons">
		<button type="button" class="no" onclick={() => answer(false)}>Не вспомнил</button>
		<button type="button" class="yes" onclick={() => answer(true)}>Вспомнил</button>
		<button type="button" class="reset" aria-label="Сбросить демо" onclick={() => (answers = [])}>↺</button>
	</div>
	<ol class="pipe" bind:this={pipe}>
		<li class="step">
			<span class="dot start">●</span>
			<span class="label">Добавлено</span>
			<span class="iv">{formatInterval(demo.startMs)}</span>
		</li>
		{#each demo.steps as st, i (i)}
			<li class="step">
				<span class="dot" class:yes={st.ok} class:no={!st.ok}>{st.ok ? '✓' : '✗'}</span>
				<span class="label">{i + 1}-е</span>
				<span class="prev">{formatInterval(st.prevMs)}</span>
				<span class="arrow">›</span>
				<span class="factor" class:yes={st.ok} class:no={!st.ok}>{formatFactor(st.factor)}</span>
				<span class="arrow">›</span>
				<span class="iv">{formatInterval(st.nextMs)}</span>
			</li>
		{/each}
	</ol>
	{#if demo.steps.length === 0}<p class="empty">Нажми «Вспомнил» или «Не вспомнил»</p>{/if}
</div>

<style>
	.demo {
		padding: 12px;
	}
	.buttons {
		display: flex;
		gap: 8px;
	}
	.buttons button {
		flex: 1;
		padding: 11px 0;
		border-radius: 10px;
		font-weight: 600;
		touch-action: manipulation;
	}
	.no {
		background: var(--danger-soft);
		color: var(--danger);
	}
	.yes {
		background: var(--success-soft);
		color: var(--success);
	}
	.buttons .reset {
		flex: none;
		padding: 11px 14px;
		background: var(--surface-2);
		color: var(--text-2);
	}
	.pipe {
		list-style: none;
		margin-top: 12px;
	}
	.step {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 0;
		font-size: 15px;
		scroll-margin-bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 16px);
	}
	/* Connector between the dots. */
	.step + .step {
		padding-top: 13px;
		background: linear-gradient(var(--border), var(--border)) 10px 0 / 2px 8px no-repeat;
	}
	.dot {
		flex: none;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 700;
	}
	.dot.start {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.dot.yes,
	.factor.yes {
		background: var(--success-soft);
		color: var(--success);
	}
	.dot.no,
	.factor.no {
		background: var(--danger-soft);
		color: var(--danger);
	}
	.label {
		flex: 1;
		color: var(--text-2);
	}
	.prev,
	.arrow {
		color: var(--text-3);
	}
	.factor {
		padding: 1px 6px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 700;
	}
	.iv {
		min-width: 48px;
		text-align: right;
		font-weight: 700;
	}
	.empty {
		padding: 8px 0 2px;
		font-size: 14px;
		color: var(--text-3);
		text-align: center;
	}
</style>
