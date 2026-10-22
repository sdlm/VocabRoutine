import { wordById } from '$lib/content';
import {
	gradeStep,
	passStep,
	pruneForwardSession,
	revealBlock,
	startForwardSession,
	type ForwardGrade,
	type ForwardStep
} from '$lib/domain/forward-session';
import { gradeForward, introduceForward } from '$lib/domain/learning';
import { forwardQueue, type ForwardItem } from '$lib/domain/queue';
import { dayKey } from '$lib/domain/time';
import { app, countForStreak, countIntroduction, newShownToday } from './store.svelte';
import { forwardBlocks } from './template';

/** A queued screen still makes sense: the word is learned and in the state the screen expects. */
function stillValid(step: ForwardStep): boolean {
	const e = app.learning[step.wordId];
	if (!e || !wordById.has(step.wordId)) return false;
	return step.kind === 'new' ? e.forward === null : e.forward !== null;
}

export function dueForward(now: number = Date.now()): ForwardItem[] {
	return forwardQueue(Object.values(app.learning), app.settings.queue, now, newShownToday(now)).filter((i) => wordById.has(i.wordId));
}

/**
 * The single entry point: the tab calls it on open, «Готово» after the summary.
 * Drops a session from another day, prunes stale screens, starts a session when words are waiting.
 * A session that lost every screen before its first answer is dropped too.
 */
export function ensureForwardSession(now: number = Date.now()): void {
	const s = app.sessions.forward;
	if (s && s.day === dayKey(now)) {
		const pruned = pruneForwardSession(s, stillValid);
		if (pruned.queue.length > 0 || pruned.done.length > 0) {
			if (pruned !== s) app.sessions.forward = pruned;
			return;
		}
	}
	const items = dueForward(now);
	app.sessions.forward = items.length ? startForwardSession(items, now) : null;
}

/** The current screen, if it is valid; a stale one is pruned and null is returned. */
function currentStep(): ForwardStep | null {
	const s = app.sessions.forward;
	const step = s?.queue[0];
	if (!s || !step) return null;
	if (stillValid(step)) return step;
	app.sessions.forward = pruneForwardSession(s, stillValid);
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
		app.learning[step.wordId] = introduceForward(app.learning[step.wordId], now, app.settings.queue);
		countIntroduction(now);
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
