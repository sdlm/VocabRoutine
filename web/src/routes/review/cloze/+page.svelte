<script lang="ts">
	import { clozeSummary } from '$lib/domain/cloze-session';
	import { formatDuration, plural } from '$lib/format';
	import { cloze, dueClozeWords, ensureClozeSession, finishClozeSession, syncClozeView } from '$lib/state/cloze.svelte';
	import { app } from '$lib/state/store.svelte';
	import { hideTabBarWhile } from '$lib/state/ui.svelte';
	import ClozeScreen from '$lib/ui/cloze/ClozeScreen.svelte';
	import ClozeSettingsForm from '$lib/ui/cloze/ClozeSettingsForm.svelte';
	import EmptyToday from '$lib/ui/session/EmptyToday.svelte';
	import SessionBar from '$lib/ui/session/SessionBar.svelte';
	import SessionSummary from '$lib/ui/session/SessionSummary.svelte';
	import StreakBanner from '$lib/ui/session/StreakBanner.svelte';
	import NavBar from '$lib/ui/shell/NavBar.svelte';

	ensureClozeSession();
	syncClozeView();

	const session = $derived(app.sessions.cloze);
	const mode = $derived.by(() => {
		if (session) return cloze.view ? 'session' : 'summary';
		return !app.settings.cloze.onboarded && dueClozeWords().length > 0 ? 'onboarding' : 'empty';
	});
	hideTabBarWhile(() => mode !== 'empty');

	// N in «N / M»: a closed word is already counted in `done`.
	const position = $derived(session && cloze.view ? session.done.length + (cloze.view.closed ? 0 : 1) : 0);

	const summaryStats = $derived.by(() => {
		if (!session) return [];
		const s = clozeSummary(session);
		return [
			{ value: String(s.reviewed), label: plural(s.reviewed, ['слово повторено', 'слова повторено', 'слов повторено']) },
			{ value: `${s.correct} / ${s.wrong}`, label: 'верно / неверно' },
			{ value: String(s.fresh), label: plural(s.fresh, ['новое слово', 'новых слова', 'новых слов']) },
			{ value: formatDuration(s.elapsedMs), label: 'времени' }
		];
	});

	const dueAts = $derived(Object.values(app.learning).flatMap((e) => (e.cloze ? [e.cloze.dueAt] : [])));

	function start() {
		app.settings.cloze.onboarded = true;
		ensureClozeSession();
		syncClozeView();
	}
</script>

{#if mode === 'session' && session && cloze.view}
	<main class="page">
		<SessionBar done={session.done.length} {position} total={session.total} settingsPath="/review/cloze/settings" />
		<StreakBanner />
		<ClozeScreen view={cloze.view} />
	</main>
{:else if mode === 'summary'}
	<main class="page">
		<SessionSummary stats={summaryStats} onDone={finishClozeSession} />
	</main>
{:else if mode === 'onboarding'}
	<main class="page grouped">
		<NavBar backLabel="Назад" fallback="/add" />
		<h1 class="screen-title">Настройки Cloze</h1>
		<p class="screen-sub">Можно поменять в любой момент: ⚙︎ в сессии или «Настройки › Cloze».</p>
		<ClozeSettingsForm />
		<button class="cta" onclick={start}>Начать</button>
	</main>
{:else}
	<main class="page">
		<EmptyToday title="Cloze → слово" {dueAts} />
	</main>
{/if}
