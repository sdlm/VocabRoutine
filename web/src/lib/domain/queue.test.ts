import { describe, expect, test } from 'vitest';
import { newEntry } from './learning';
import { clozeQueue, forwardQueue, newLeftToday, newTomorrow, upcoming } from './queue';
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
		const q = forwardQueue([review('b', NOW - HOUR), review('a', NOW - DAY), review('later', NOW + HOUR)], s, NOW, 0);
		expect(ids(q)).toEqual(['a', 'b']);
		expect(q.every((i) => i.kind === 'review')).toBe(true);
	});

	test('new words come in order of adding, limited by newPerDay', () => {
		const entries = [fresh('n2', NOW - 1000), fresh('n1', NOW - 2000), fresh('n3', NOW - 500)];
		expect(ids(forwardQueue(entries, { ...s, newPerDay: 2 }, NOW, 0))).toEqual(['n1', 'n2']);
	});

	test('new words already shown today reduce the limit', () => {
		const entries = [fresh('n1', 1), fresh('n2', 2), fresh('n3', 3)];
		expect(newLeftToday(1, { ...s, newPerDay: 3 })).toBe(2);
		expect(ids(forwardQueue(entries, { ...s, newPerDay: 3 }, NOW, 1))).toEqual(['n1', 'n2']);
	});

	test('the limit never goes below zero', () => {
		expect(newLeftToday(5, { ...s, newPerDay: 3 })).toBe(0);
		expect(forwardQueue([fresh('n1', 1)], { ...s, newPerDay: 3 }, NOW, 5)).toEqual([]);
	});

	test('orders: first, last, mixed', () => {
		const entries = [review('r1', NOW - 4), review('r2', NOW - 3), review('r3', NOW - 2), review('r4', NOW - 1), fresh('n1', 1), fresh('n2', 2)];
		expect(ids(forwardQueue(entries, { ...s, newOrder: 'first' }, NOW, 0))).toEqual(['n1', 'n2', 'r1', 'r2', 'r3', 'r4']);
		expect(ids(forwardQueue(entries, { ...s, newOrder: 'last' }, NOW, 0))).toEqual(['r1', 'r2', 'r3', 'r4', 'n1', 'n2']);
		expect(ids(forwardQueue(entries, { ...s, newOrder: 'mixed' }, NOW, 0))).toEqual(['r1', 'n1', 'r2', 'r3', 'n2', 'r4']);
	});

	test('mixed spreads many new words evenly between few reviews', () => {
		const entries = [review('r1', NOW - 2), review('r2', NOW - 1), ...[1, 2, 3, 4, 5].map((i) => fresh(`n${i}`, i))];
		expect(ids(forwardQueue(entries, { ...s, newOrder: 'mixed' }, NOW, 0))).toEqual(['n1', 'r1', 'n2', 'n3', 'r2', 'n4', 'n5']);
	});

	test('mixed with no reviews returns only new words', () => {
		expect(ids(forwardQueue([fresh('n1', 1), fresh('n2', 2)], { ...s, newOrder: 'mixed' }, NOW, 0))).toEqual(['n1', 'n2']);
	});
});

describe('newTomorrow', () => {
	test('the daily limit when enough new words wait', () => {
		const entries = [fresh('n1', 1), fresh('n2', 2), fresh('n3', 3), review('r', NOW + DAY)];
		expect(newTomorrow(entries, { ...s, newPerDay: 2 })).toBe(2);
	});

	test('all waiting new words when fewer than the limit', () => {
		expect(newTomorrow([fresh('n1', 1), review('r', NOW + DAY)], s)).toBe(1);
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

describe('upcoming', () => {
	test('counts words later today and by the end of tomorrow', () => {
		const dueAts = [NOW - HOUR, NOW + 3 * HOUR, NOW + 5 * HOUR, NOW + DAY, NOW + 3 * DAY];
		expect(upcoming(dueAts, NOW)).toEqual({ laterToday: { count: 2, inMs: 3 * HOUR }, tomorrow: 3 });
	});
	test('nothing later today', () => {
		expect(upcoming([NOW + DAY], NOW)).toEqual({ laterToday: null, tomorrow: 1 });
		expect(upcoming([], NOW)).toEqual({ laterToday: null, tomorrow: 0 });
	});
});
