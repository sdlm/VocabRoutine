import { describe, expect, test } from 'vitest';
import {
	forwardProgress,
	forwardSummary,
	gradeStep,
	passStep,
	pruneForwardSession,
	revealBlock,
	startForwardSession
} from './forward-session';
import type { ForwardItem } from './queue';
import { IDLE_CAP_MS } from './session';

const NOW = new Date(2026, 9, 20, 12).getTime();
const ITEMS: ForwardItem[] = [
	{ wordId: 'often', kind: 'review' },
	{ wordId: 'thorough', kind: 'new' },
	{ wordId: 'cheap', kind: 'review' }
];
const start = () => startForwardSession(ITEMS, NOW);

describe('startForwardSession', () => {
	test('takes the queue as screens; M is its length', () => {
		const s = start();
		expect(s.queue).toEqual(ITEMS);
		expect(s.total).toBe(3);
		expect(s.done).toEqual([]);
		expect(s.revealed).toEqual([]);
		expect(s.startedAt).toBe(NOW);
	});
});

describe('gradeStep', () => {
	test('«Помню» records the grade and moves on', () => {
		const s = gradeStep(start(), 'remember', NOW + 1000);
		expect(s.done).toEqual([{ wordId: 'often', grade: 'remember' }]);
		expect(s.queue.map((q) => q.wordId)).toEqual(['thorough', 'cheap']);
		expect(s.total).toBe(3);
	});

	test('«Не помню» appends «Повтор» at the end and grows M', () => {
		const s = gradeStep(start(), 'forgot', NOW + 1000);
		expect(s.done).toEqual([{ wordId: 'often', grade: 'forgot' }]);
		expect(s.queue.at(-1)).toEqual({ wordId: 'often', kind: 'repeat' });
		expect(s.total).toBe(4);
	});

	test('resets revealed blocks and adds the active time', () => {
		const s = gradeStep(revealBlock(start(), 'translations'), 'remember', NOW + 3_600_000);
		expect(s.revealed).toEqual([]);
		expect(s.elapsedMs).toBe(IDLE_CAP_MS);
	});

	test('throws on a screen without grades', () => {
		const s = gradeStep(start(), 'remember', NOW);
		expect(() => gradeStep(s, 'remember', NOW)).toThrow();
	});
});

describe('passStep', () => {
	test('«Новое слово» is recorded as an introduction', () => {
		const s = passStep(gradeStep(start(), 'remember', NOW), NOW);
		expect(s.done.at(-1)).toEqual({ wordId: 'thorough', grade: 'intro' });
		expect(s.queue.map((q) => q.wordId)).toEqual(['cheap']);
	});

	test('«Повтор» leaves the session without a record', () => {
		let s = gradeStep(start(), 'forgot', NOW); // often → repeat at the end
		s = passStep(s, NOW); // thorough
		s = gradeStep(s, 'remember', NOW); // cheap
		expect(s.queue).toEqual([{ wordId: 'often', kind: 'repeat' }]);
		s = passStep(s, NOW);
		expect(s.queue).toEqual([]);
		expect(s.done).toHaveLength(3);
	});

	test('throws on a card', () => {
		expect(() => passStep(start(), NOW)).toThrow();
	});
});

describe('revealBlock', () => {
	test('records opened blocks once each', () => {
		let s = start();
		s = revealBlock(s, 'translations');
		s = revealBlock(s, 'definition');
		expect(s.revealed).toEqual(['translations', 'definition']);
		expect(revealBlock(s, 'definition')).toBe(s);
	});
});

describe('pruneForwardSession', () => {
	test('drops screens and shrinks M by the same number', () => {
		const s = pruneForwardSession(start(), (q) => q.wordId !== 'thorough');
		expect(s.queue.map((q) => q.wordId)).toEqual(['often', 'cheap']);
		expect(s.total).toBe(2);
	});

	test('keeps revealed blocks when the current screen stays, resets them when it goes', () => {
		const s = revealBlock(start(), 'translations');
		expect(pruneForwardSession(s, (q) => q.wordId !== 'cheap').revealed).toEqual(['translations']);
		expect(pruneForwardSession(s, (q) => q.wordId !== 'often').revealed).toEqual([]);
	});

	test('returns the same session when nothing is dropped', () => {
		const s = start();
		expect(pruneForwardSession(s, () => true)).toBe(s);
	});
});

describe('forwardProgress', () => {
	test('N counts the current screen; «Не помню» grows M, N goes on', () => {
		let s = start();
		expect(forwardProgress(s)).toEqual({ finished: 0, position: 1, total: 3 });
		s = gradeStep(s, 'forgot', NOW);
		expect(forwardProgress(s)).toEqual({ finished: 1, position: 2, total: 4 });
	});

	test('a finished session shows M / M', () => {
		let s = gradeStep(start(), 'remember', NOW);
		s = passStep(s, NOW);
		s = gradeStep(s, 'remember', NOW);
		expect(forwardProgress(s)).toEqual({ finished: 3, position: 3, total: 3 });
	});
});

describe('forwardSummary', () => {
	test('counts grades and introductions; «Повтор» is not a word reviewed again', () => {
		let s = gradeStep(start(), 'forgot', NOW);
		s = passStep(s, NOW + 10_000);
		s = gradeStep(s, 'remember', NOW + 20_000);
		s = passStep(s, NOW + 30_000);
		expect(forwardSummary(s)).toEqual({ reviewed: 3, remember: 1, forgot: 1, fresh: 1, elapsedMs: 30_000 });
	});
});
