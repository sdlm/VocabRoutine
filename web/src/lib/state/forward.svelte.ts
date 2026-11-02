import { wordById } from '$lib/content';
import {
	appendForwardSteps,
	gradeStep,
	passStep,
	pruneForwardSession,
	revealBlock,
	startForwardSession,
	type ForwardGrade,
	type ForwardStep
} from '$lib/domain/forward-session';
import { gradeForward, introduceForward } from '$lib/domain/learning';
import { availableWords, type QueueItem } from '$lib/domain/queue';
import { dayKey } from '$lib/domain/time';
import { app, countForStreak, countIntroduction, slotsUsedToday } from './store.svelte';
import { forwardBlocks } from './template';

/**
 * Screens that still make sense: «Повтор» while the word is learned, other screens while the word
 * is available as that kind (removed words, words whose slot went to Cloze, … are not).
 */
function validSteps(items: QueueItem[]): (step: ForwardStep) => boolean {
	const available = new Set(items.map((i) => `${i.kind}:${i.wordId}`));
	return (step) =>
		step.kind === 'repeat' ? step.wordId in app.learning && wordById.has(step.wordId) : available.has(`${step.kind}:${step.wordId}`);
}

export function dueForward(now: number = Date.now()): QueueItem[] {
	return availableWords('forward', Object.values(app.learning), app.settings.queue, now, slotsUsedToday(now)).filter((i) =>
		wordById.has(i.wordId)
	);
}

/**
 * The single entry point: the tab calls it on open, «Готово» after the summary.
 * Drops a session from another day. Today's session follows `dueForward`: screens no longer valid leave,
 * words that became available and are not yet in the session go to the end. A session that lost every
 * screen before its first answer is dropped; a new one starts when words are waiting.
 */
export function ensureForwardSession(now: number = Date.now()): void {
	const items = dueForward(now);
	const s = app.sessions.forward;
	if (s && s.day === dayKey(now)) {
		const pruned = pruneForwardSession(s, validSteps(items));
		const inSession = new Set([...pruned.queue, ...pruned.done].map((x) => x.wordId));
		const synced = appendForwardSteps(pruned, items.filter((i) => !inSession.has(i.wordId)));
		if (synced.queue.length > 0 || synced.done.length > 0) {
			if (synced !== s) app.sessions.forward = synced;
			return;
		}
	}
	app.sessions.forward = items.length ? startForwardSession(items, now) : null;
}

/** The current screen, if it is valid; a stale one is pruned and null is returned. */
function currentStep(): ForwardStep | null {
	const s = app.sessions.forward;
	const step = s?.queue[0];
	if (!s || !step) return null;
	const valid = validSteps(dueForward());
	if (valid(step)) return step;
	app.sessions.forward = pruneForwardSession(s, valid);
	return null;
}

/** «Помню» / «Не помню»: grade the word and count it for the streak. */
export function gradeForwardWord(grade: ForwardGrade, now: number = Date.now()): void {
	const step = currentStep();
	if (step?.kind !== 'review') return;
	const result = grade === 'remember' ? 'success' : 'fail';
	app.learning[step.wordId] = gradeForward(app.learning[step.wordId], result, now, app.settings.queue);
	app.sessions.forward = gradeStep(app.sessions.forward!, grade, now);
	countForStreak(now);
}

/** «Дальше» on «Новое слово» introduces the word and counts it; on «Повтор» it only moves on. */
export function passForwardWord(now: number = Date.now()): void {
	const step = currentStep();
	if (!step || step.kind === 'review') return;
	if (step.kind === 'new') {
		const e = app.learning[step.wordId];
		// A word already answered in Cloze took its slot there.
		if (e.cloze === null) countIntroduction(now);
		else countForStreak(now);
		app.learning[step.wordId] = introduceForward(e, now, app.settings.queue);
	}
	app.sessions.forward = passStep(app.sessions.forward!, now);
}

/** Tap on the card: open the next «По тапу» block of the template. */
export function revealForwardBlock(): void {
	const s = app.sessions.forward;
	if (s?.queue[0]?.kind !== 'review') return;
	const next = forwardBlocks(app.settings.template, s.revealed).next;
	if (next) app.sessions.forward = revealBlock(s, next.id);
}

/** «Готово» on the summary: a new session starts at once if words are waiting. */
export function finishForwardSession(): void {
	app.sessions.forward = null;
	ensureForwardSession();
}
