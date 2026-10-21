import { startClock, touch, type SessionClock } from './session';
import type { LearningEntry, Result } from './types';

export { IDLE_CAP_MS } from './session';

export type ClozeOutcome = 'correct' | 'wrong' | 'gaveUp';

export interface ClozeResult {
	wordId: string;
	outcome: ClozeOutcome;
	/** First Cloze answer ever for this word («новых слов» in the summary). */
	isNew: boolean;
}

/** Saved after every answer, so a session resumes where it stopped. */
export interface ClozeSession extends SessionClock {
	/** M in «N / M»: queue length at the start. */
	total: number;
	/** Words still to answer; the current word is queue[0]. */
	queue: string[];
	done: ClozeResult[];
}

export function startClozeSession(queue: string[], now: number): ClozeSession {
	return { ...startClock(now), total: queue.length, queue: [...queue], done: [] };
}

export function outcomeResult(outcome: ClozeOutcome): Result {
	return outcome === 'correct' ? 'success' : 'fail';
}

/** A word is new in Cloze until its first answer moves the due date past the entry moment. */
export function isNewInCloze(e: LearningEntry): boolean {
	return e.cloze !== null && e.cloze.dueAt === e.clozeEnteredAt;
}

/** The current word got an answer: it leaves the queue for good. */
export function closeWord(s: ClozeSession, outcome: ClozeOutcome, isNew: boolean, now: number): ClozeSession {
	const [wordId, ...rest] = s.queue;
	if (wordId === undefined) throw new Error('closeWord: the queue is empty');
	return { ...s, ...touch(s, now), queue: rest, done: [...s.done, { wordId, outcome, isNew }] };
}

/** «Дальше» on an open word: it moves to the end and comes back today. */
export function skipWord(s: ClozeSession, now: number): ClozeSession {
	const [wordId, ...rest] = s.queue;
	if (wordId === undefined) throw new Error('skipWord: the queue is empty');
	return { ...s, ...touch(s, now), queue: [...rest, wordId] };
}

/** Drop queued words that are no longer in Cloze (removed from learning). */
export function pruneSession(s: ClozeSession, inCloze: (wordId: string) => boolean): ClozeSession {
	const queue = s.queue.filter(inCloze);
	return queue.length === s.queue.length ? s : { ...s, queue, total: s.total - (s.queue.length - queue.length) };
}

export interface ClozeSummary {
	reviewed: number;
	correct: number;
	wrong: number;
	fresh: number;
	elapsedMs: number;
}

export function clozeSummary(s: ClozeSession): ClozeSummary {
	const correct = s.done.filter((r) => r.outcome === 'correct').length;
	return {
		reviewed: s.done.length,
		correct,
		wrong: s.done.length - correct,
		fresh: s.done.filter((r) => r.isNew).length,
		elapsedMs: s.elapsedMs
	};
}
