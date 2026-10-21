import type { ForwardItem } from './queue';
import { startClock, touch, type SessionClock } from './session';

/** 'repeat' is «Повтор»: a word marked «Не помню» comes back once at the end, all blocks open, no grade. */
export type ForwardStepKind = 'new' | 'review' | 'repeat';

export interface ForwardStep {
	wordId: string;
	kind: ForwardStepKind;
}

export type ForwardGrade = 'remember' | 'forgot';

export interface ForwardResult {
	wordId: string;
	/** 'intro' is the «Новое слово» screen. */
	grade: ForwardGrade | 'intro';
}

/** Saved after every answer, so a session resumes where it stopped. */
export interface ForwardSession extends SessionClock {
	/** M in «N / M»: screens in the session. «Не помню» adds the «Повтор» screen. */
	total: number;
	/** Screens still to show; the current one is queue[0]. */
	queue: ForwardStep[];
	/** One entry per word: its grade or its introduction. «Повтор» adds nothing. */
	done: ForwardResult[];
	/** Ids of the «По тапу» blocks opened on the current card. Ids, not a count: the template may change mid-card. */
	revealed: string[];
}

export function startForwardSession(items: ForwardItem[], now: number): ForwardSession {
	return {
		...startClock(now),
		total: items.length,
		queue: items.map(({ wordId, kind }) => ({ wordId, kind })),
		done: [],
		revealed: []
	};
}

/** «Помню» / «Не помню» on a card. «Не помню» brings the word back as «Повтор» at the end. */
export function gradeStep(s: ForwardSession, grade: ForwardGrade, now: number): ForwardSession {
	const [step, ...rest] = s.queue;
	if (step?.kind !== 'review') throw new Error('gradeStep: the current screen is not a card');
	const forgot = grade === 'forgot';
	return {
		...s,
		...touch(s, now),
		total: forgot ? s.total + 1 : s.total,
		queue: forgot ? [...rest, { wordId: step.wordId, kind: 'repeat' }] : rest,
		done: [...s.done, { wordId: step.wordId, grade }],
		revealed: []
	};
}

/** «Дальше» on «Новое слово» (recorded as an introduction) or on «Повтор» (not recorded). */
export function passStep(s: ForwardSession, now: number): ForwardSession {
	const [step, ...rest] = s.queue;
	if (!step || step.kind === 'review') throw new Error('passStep: the current screen has no «Дальше»');
	return {
		...s,
		...touch(s, now),
		queue: rest,
		done: step.kind === 'new' ? [...s.done, { wordId: step.wordId, grade: 'intro' }] : s.done,
		revealed: []
	};
}

/** Tap on the card: open the block `blockId`. */
export function revealBlock(s: ForwardSession, blockId: string): ForwardSession {
	return s.revealed.includes(blockId) ? s : { ...s, revealed: [...s.revealed, blockId] };
}

/** Drop screens that are no longer valid (word removed from learning, re-added, …). */
export function pruneForwardSession(s: ForwardSession, keep: (step: ForwardStep) => boolean): ForwardSession {
	const queue = s.queue.filter(keep);
	if (queue.length === s.queue.length) return s;
	return {
		...s,
		queue,
		total: s.total - (s.queue.length - queue.length),
		revealed: queue[0] === s.queue[0] ? s.revealed : []
	};
}

export interface ForwardProgress {
	/** Screens behind; fills the progress bar. */
	finished: number;
	/** N in «N / M». */
	position: number;
	/** M in «N / M». */
	total: number;
}

export function forwardProgress(s: ForwardSession): ForwardProgress {
	const finished = s.total - s.queue.length;
	return { finished, position: Math.min(finished + 1, s.total), total: s.total };
}

export interface ForwardSummary {
	/** Words graded or introduced. */
	reviewed: number;
	remember: number;
	forgot: number;
	/** «Новое слово» screens. */
	fresh: number;
	elapsedMs: number;
}

export function forwardSummary(s: ForwardSession): ForwardSummary {
	const count = (g: ForwardResult['grade']) => s.done.filter((r) => r.grade === g).length;
	return {
		reviewed: s.done.length,
		remember: count('remember'),
		forgot: count('forgot'),
		fresh: count('intro'),
		elapsedMs: s.elapsedMs
	};
}
