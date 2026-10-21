<script lang="ts">
	import { forwardProgress, forwardSummary } from '$lib/domain/forward-session';
	import { newTomorrow } from '$lib/domain/queue';
	import { formatDuration, plural } from '$lib/format';
	import { ensureForwardSession, finishForwardSession } from '$lib/state/forward.svelte';
	import { app } from '$lib/state/store.svelte';
	import { hideTabBarWhile } from '$lib/state/ui.svelte';
	import ForwardScreen from '$lib/ui/forward/ForwardScreen.svelte';
	import EmptyToday from '$lib/ui/session/EmptyToday.svelte';
	import SessionBar from '$lib/ui/session/SessionBar.svelte';
	import SessionSummary from '$lib/ui/session/SessionSummary.svelte';
	import StreakBanner from '$lib/ui/session/StreakBanner.svelte';

	ensureForwardSession();

	const session = $derived(app.sessions.forward);
	const mode = $derived(session ? (session.queue.length ? 'session' : 'summary') : 'empty');
	hideTabBarWhile(() => mode !== 'empty');

	const progress = $derived(session ? forwardProgress(session) : null);

	const summaryStats = $derived.by(() => {
		if (!session) return [];
		const s = forwardSummary(session);
		return [
			{ value: String(s.reviewed), label: plural(s.reviewed, ['слово повторено', 'слова повторено', 'слов повторено']) },
			{ value: `${s.remember} / ${s.forgot}`, label: 'помню / не помню' },
			{ value: String(s.fresh), label: plural(s.fresh, ['новое слово', 'новых слова', 'новых слов']) },
			{ value: formatDuration(s.elapsedMs), label: 'времени' }
		];
	});

	const entries = $derived(Object.values(app.learning));
	const dueAts = $derived(entries.flatMap((e) => (e.forward ? [e.forward.dueAt] : [])));
	const freshTomorrow = $derived(newTomorrow(entries, app.settings.queue));
</script>

{#if mode === 'session' && session && progress}
	<main class="page">
		<SessionBar done={progress.finished} position={progress.position} total={progress.total} settingsPath="/review/forward/template" />
		<StreakBanner />
		<ForwardScreen {session} />
	</main>
{:else if mode === 'summary'}
	<main class="page">
		<SessionSummary stats={summaryStats} onDone={finishForwardSession} />
	</main>
{:else}
	<main class="page">
		<EmptyToday title="Слово → перевод" {dueAts} extraTomorrow={freshTomorrow} />
	</main>
{/if}
