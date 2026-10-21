import { describe, expect, test } from 'vitest';
import { newEntry } from './learning';
import { clozeQueue, forwardQueue, newLeftToday } from './queue';
import { DAY, HOUR } from './time';
import type { LearningEntry, QueueSettings } from './types';

const NOW = new Date(2026, 9, 20, 12).getTime();
const s: QueueSettings = { successFactor: 2.5, failFactor: 0.5, minIntervalMs: DAY, newPerDay: 10, newOrder: 'last' };

function review(id: string, dueAt: number): LearningEntry {
	return { ...newEntry(id, NOW - 30 * DAY), forwardIntroducedAt: NOW - 20 * DAY, forward: { intervalMs: DAY, dueAt } };
}
function fresh(id: string, addedAt: number): LearningEntry {
	return newEntry(id, addedAt);
}
const ids = (q: { wordId: string }[]) => q.map((i) => i.wordId);

describe('forwardQueue', () => {
	test('includes only reviews due by now, oldest due first', () => {
		const q = forwardQueue([review('b', NOW - HOUR), review('a', NOW - DAY), review('later', NOW + HOUR)], s, NOW);
		expect(ids(q)).toEqual(['a', 'b']);
		expect(q.every((i) => i.kind === 'review')).toBe(true);
	});

	test('new words come in order of adding, limited by newPerDay', () => {
		const entries = [fresh('n2', NOW - 1000), fresh('n1', NOW - 2000), fresh('n3', NOW - 500)];
		expect(ids(forwardQueue(entries, { ...s, newPerDay: 2 }, NOW))).toEqual(['n1', 'n2']);
	});

	test('new words already shown today reduce the limit', () => {
		const shownToday = { ...review('old', NOW + DAY), forwardIntroducedAt: NOW - HOUR };
		const entries = [shownToday, fresh('n1', 1), fresh('n2', 2), fresh('n3', 3)];
		expect(newLeftToday(entries, { ...s, newPerDay: 3 }, NOW)).toBe(2);
		expect(ids(forwardQueue(entries, { ...s, newPerDay: 3 }, NOW))).toEqual(['n1', 'n2']);
	});

	test('words shown yesterday do not count toward today', () => {
		const shownYesterday = { ...review('old', NOW + DAY), forwardIntroducedAt: NOW - DAY };
		expect(newLeftToday([shownYesterday], { ...s, newPerDay: 3 }, NOW)).toBe(3);
	});

	test('orders: first, last, mixed', () => {
		const entries = [review('r1', NOW - 4), review('r2', NOW - 3), review('r3', NOW - 2), review('r4', NOW - 1), fresh('n1', 1), fresh('n2', 2)];
		expect(ids(forwardQueue(entries, { ...s, newOrder: 'first' }, NOW))).toEqual(['n1', 'n2', 'r1', 'r2', 'r3', 'r4']);
		expect(ids(forwardQueue(entries, { ...s, newOrder: 'last' }, NOW))).toEqual(['r1', 'r2', 'r3', 'r4', 'n1', 'n2']);
		expect(ids(forwardQueue(entries, { ...s, newOrder: 'mixed' }, NOW))).toEqual(['r1', 'n1', 'r2', 'r3', 'n2', 'r4']);
	});

	test('mixed spreads many new words evenly between few reviews', () => {
		const entries = [review('r1', NOW - 2), review('r2', NOW - 1), ...[1, 2, 3, 4, 5].map((i) => fresh(`n${i}`, i))];
		expect(ids(forwardQueue(entries, { ...s, newOrder: 'mixed' }, NOW))).toEqual(['n1', 'r1', 'n2', 'n3', 'r2', 'n4', 'n5']);
	});

	test('mixed with no reviews returns only new words', () => {
		expect(ids(forwardQueue([fresh('n1', 1), fresh('n2', 2)], { ...s, newOrder: 'mixed' }, NOW))).toEqual(['n1', 'n2']);
	});
});

describe('clozeQueue', () => {
	test('only words in Cloze and due by now, independent of forward due date', () => {
		const inCloze = (id: string, dueAt: number): LearningEntry => ({
			...review(id, NOW + 10 * DAY),
			clozeEnteredAt: NOW - DAY,
			cloze: { intervalMs: DAY, dueAt }
		});
		const entries = [inCloze('c2', NOW - HOUR), inCloze('c1', NOW - DAY), inCloze('later', NOW + HOUR), review('notInCloze', NOW - DAY)];
		expect(clozeQueue(entries, NOW)).toEqual(['c1', 'c2']);
	});
});
