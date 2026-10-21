import { describe, expect, test } from 'vitest';
import {
	clozeSummary,
	closeWord,
	IDLE_CAP_MS,
	isNewInCloze,
	outcomeResult,
	pruneSession,
	skipWord,
	startClozeSession
} from './cloze-session';
import { newEntry } from './learning';
import { DAY, HOUR } from './time';

const T0 = new Date(2026, 9, 20, 10).getTime();

describe('startClozeSession', () => {
	test('snapshots the queue and the day', () => {
		const s = startClozeSession(['a', 'b'], T0);
		expect(s).toEqual({ day: '2026-10-20', startedAt: T0, lastActiveAt: T0, elapsedMs: 0, total: 2, queue: ['a', 'b'], done: [] });
	});
});

describe('closeWord', () => {
	test('moves the current word to done with its outcome', () => {
		const s = closeWord(startClozeSession(['a', 'b'], T0), 'wrong', true, T0 + 10_000);
		expect(s.queue).toEqual(['b']);
		expect(s.done).toEqual([{ wordId: 'a', outcome: 'wrong', isNew: true }]);
		expect(s.total).toBe(2);
	});

	test('counts active time but caps idle gaps', () => {
		const s1 = closeWord(startClozeSession(['a', 'b'], T0), 'correct', false, T0 + 30_000);
		const s2 = closeWord(s1, 'correct', false, T0 + 30_000 + HOUR);
		expect(s1.elapsedMs).toBe(30_000);
		expect(s2.elapsedMs).toBe(30_000 + IDLE_CAP_MS);
	});

	test('throws on an empty queue', () => {
		expect(() => closeWord(startClozeSession([], T0), 'correct', false, T0)).toThrow();
	});
});

describe('skipWord', () => {
	test('moves the current word to the end without a result', () => {
		const s = skipWord(startClozeSession(['a', 'b', 'c'], T0), T0);
		expect(s.queue).toEqual(['b', 'c', 'a']);
		expect(s.done).toEqual([]);
		expect(s.total).toBe(3);
	});
});

describe('pruneSession', () => {
	test('drops words no longer in Cloze and shrinks the total', () => {
		const s = closeWord(startClozeSession(['a', 'b', 'c'], T0), 'correct', false, T0);
		const pruned = pruneSession(s, (id) => id !== 'c');
		expect(pruned.queue).toEqual(['b']);
		expect(pruned.total).toBe(2);
	});
	test('returns the same object when nothing changes', () => {
		const s = startClozeSession(['a'], T0);
		expect(pruneSession(s, () => true)).toBe(s);
	});
});

describe('outcomeResult', () => {
	test('only a correct answer is a success; giving up is a fail', () => {
		expect(outcomeResult('correct')).toBe('success');
		expect(outcomeResult('wrong')).toBe('fail');
		expect(outcomeResult('gaveUp')).toBe('fail');
	});
});

describe('isNewInCloze', () => {
	test('true right after entering Cloze, false after the first answer', () => {
		const entered = { ...newEntry('a', T0), clozeEnteredAt: T0, cloze: { intervalMs: DAY, dueAt: T0 } };
		const answered = { ...entered, cloze: { intervalMs: 2.5 * DAY, dueAt: T0 + 2.5 * DAY } };
		expect(isNewInCloze(entered)).toBe(true);
		expect(isNewInCloze(answered)).toBe(false);
		expect(isNewInCloze(newEntry('a', T0))).toBe(false);
	});
});

describe('clozeSummary', () => {
	test('counts outcomes; giving up counts as wrong', () => {
		let s = startClozeSession(['a', 'b', 'c'], T0);
		s = closeWord(s, 'correct', true, T0 + 1000);
		s = closeWord(s, 'wrong', false, T0 + 2000);
		s = closeWord(s, 'gaveUp', false, T0 + 3000);
		expect(clozeSummary(s)).toEqual({ reviewed: 3, correct: 1, wrong: 2, fresh: 1, elapsedMs: 3000 });
	});
});
