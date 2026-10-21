import { nextInterval } from './srs';
import { DAY } from './time';
import type { LearningEntry, Result, SrsSettings } from './types';

/** A word becomes available for Cloze once its forward interval exceeds this. */
export const CLOZE_THRESHOLD_MS = 5 * DAY;

export function newEntry(wordId: string, now: number): LearningEntry {
	return { wordId, addedAt: now, forwardIntroducedAt: null, forward: null, clozeEnteredAt: null, cloze: null };
}

/** «Новое слово» screen: first forward review comes after the minimum interval. */
export function introduceForward(e: LearningEntry, now: number, s: SrsSettings): LearningEntry {
	return {
		...e,
		forwardIntroducedAt: now,
		forward: { intervalMs: s.minIntervalMs, dueAt: now + s.minIntervalMs }
	};
}

export function gradeForward(e: LearningEntry, result: Result, now: number, s: SrsSettings): LearningEntry {
	if (!e.forward) throw new Error(`gradeForward: ${e.wordId} was not introduced`);
	const intervalMs = nextInterval(e.forward.intervalMs, result, s);
	const next: LearningEntry = { ...e, forward: { intervalMs, dueAt: now + intervalMs } };
	if (e.clozeEnteredAt === null && intervalMs > CLOZE_THRESHOLD_MS) {
		// Enters Cloze due immediately; the first Cloze answer is computed from the minimum interval.
		next.clozeEnteredAt = now;
		next.cloze = { intervalMs: s.minIntervalMs, dueAt: now };
	}
	return next;
}

export function gradeCloze(e: LearningEntry, result: Result, now: number, s: SrsSettings): LearningEntry {
	if (!e.cloze) throw new Error(`gradeCloze: ${e.wordId} is not in Cloze`);
	const intervalMs = nextInterval(e.cloze.intervalMs, result, s);
	return { ...e, cloze: { intervalMs, dueAt: now + intervalMs } };
}
