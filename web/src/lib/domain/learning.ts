import { nextInterval } from './srs';
import { DAY } from './time';
import type { LearningEntry, Result, SrsSettings } from './types';

/** «После прямого»: a word not yet seen in Cloze becomes available once its forward interval reaches this. */
export const CLOZE_THRESHOLD_MS = 7 * DAY;

export function newEntry(wordId: string, now: number): LearningEntry {
	return { wordId, addedAt: now, forwardIntroducedAt: null, forward: null, clozeEnteredAt: null, cloze: null };
}

/** «Новое слово» screen: first forward review comes after the minimum interval. */
export function introduceForward(e: LearningEntry, now: number, s: SrsSettings): LearningEntry {
	if (e.forward !== null) throw new Error(`introduceForward: ${e.wordId} was already introduced`);
	return {
		...e,
		forwardIntroducedAt: now,
		forward: { intervalMs: s.minIntervalMs, dueAt: now + s.minIntervalMs }
	};
}

/** First Cloze answer: the word enters Cloze due now, so the answer is graded from the minimum interval. */
export function enterCloze(e: LearningEntry, now: number, s: SrsSettings): LearningEntry {
	if (e.cloze !== null) throw new Error(`enterCloze: ${e.wordId} is already in Cloze`);
	return { ...e, clozeEnteredAt: now, cloze: { intervalMs: s.minIntervalMs, dueAt: now } };
}

export function gradeForward(e: LearningEntry, result: Result, now: number, s: SrsSettings): LearningEntry {
	if (!e.forward) throw new Error(`gradeForward: ${e.wordId} was not introduced`);
	const intervalMs = nextInterval(e.forward.intervalMs, result, s);
	return { ...e, forward: { intervalMs, dueAt: now + intervalMs } };
}

export function gradeCloze(e: LearningEntry, result: Result, now: number, s: SrsSettings): LearningEntry {
	if (!e.cloze) throw new Error(`gradeCloze: ${e.wordId} is not in Cloze`);
	const intervalMs = nextInterval(e.cloze.intervalMs, result, s);
	return { ...e, cloze: { intervalMs, dueAt: now + intervalMs } };
}
