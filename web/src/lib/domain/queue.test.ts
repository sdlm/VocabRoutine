import { describe, expect, test } from 'vitest';
import { newEntry } from './learning';
import { availableWords, newLeftToday, newTomorrow, upcoming } from './queue';
import { DAY, HOUR } from './time';
import type { LearningEntry, QueueSettings } from './types';

const NOW = new Date(2026, 9, 20, 12).getTime();
const s: QueueSettings = { successFactor: 2.5, failFactor: 0.5, minIntervalMs: DAY, newPerDay: 10, newOrder: 'last', clozeEntry: 'afterForward' };

function review(id: string, dueAt: number): LearningEntry {
	return { ...newEntry(id, NOW - 30 * DAY), forwardIntroducedAt: NOW - 20 * DAY, forward: { intervalMs: DAY, dueAt } };
}
function fresh(id: string, addedAt: number): LearningEntry {
	return newEntry(id, addedAt);
}
const ids = (q: { wordId: string }[]) => q.map((i) => i.wordId);

describe('availableWords: forward', () => {
	test('includes only reviews due by now, oldest due first', () => {
		const q = availableWords('forward', [review('b', NOW - HOUR), review('a', NOW - DAY), review('later', NOW + HOUR)], s, NOW, 0);
		expect(ids(q)).toEqual(['a', 'b']);
		expect(q.every((i) => i.kind === 'review')).toBe(true);
	});

	test('new words come in order of adding, limited by newPerDay', () => {
		const entries = [fresh('n2', NOW - 1000), fresh('n1', NOW - 2000), fresh('n3', NOW - 500)];
		expect(ids(availableWords('forward', entries, { ...s, newPerDay: 2 }, NOW, 0))).toEqual(['n1', 'n2']);
	});

	test('new words already shown today reduce the limit', () => {
		const entries = [fresh('n1', 1), fresh('n2', 2), fresh('n3', 3)];
		expect(newLeftToday(1, { ...s, newPerDay: 3 })).toBe(2);
		expect(ids(availableWords('forward', entries, { ...s, newPerDay: 3 }, NOW, 1))).toEqual(['n1', 'n2']);
	});

	test('the limit never goes below zero', () => {
		expect(newLeftToday(5, { ...s, newPerDay: 3 })).toBe(0);
		expect(availableWords('forward', [fresh('n1', 1)], { ...s, newPerDay: 3 }, NOW, 5)).toEqual([]);
	});

	test('orders: first, last, mixed', () => {
		const entries = [review('r1', NOW - 4), review('r2', NOW - 3), review('r3', NOW - 2), review('r4', NOW - 1), fresh('n1', 1), fresh('n2', 2)];
		expect(ids(availableWords('forward', entries, { ...s, newOrder: 'first' }, NOW, 0))).toEqual(['n1', 'n2', 'r1', 'r2', 'r3', 'r4']);
		expect(ids(availableWords('forward', entries, { ...s, newOrder: 'last' }, NOW, 0))).toEqual(['r1', 'r2', 'r3', 'r4', 'n1', 'n2']);
		expect(ids(availableWords('forward', entries, { ...s, newOrder: 'mixed' }, NOW, 0))).toEqual(['r1', 'n1', 'r2', 'r3', 'n2', 'r4']);
	});

	test('mixed spreads many new words evenly between few reviews', () => {
		const entries = [review('r1', NOW - 2), review('r2', NOW - 1), ...[1, 2, 3, 4, 5].map((i) => fresh(`n${i}`, i))];
		expect(ids(availableWords('forward', entries, { ...s, newOrder: 'mixed' }, NOW, 0))).toEqual(['n1', 'r1', 'n2', 'n3', 'r2', 'n4', 'n5']);
	});

	test('mixed with no reviews returns only new words', () => {
		expect(ids(availableWords('forward', [fresh('n1', 1), fresh('n2', 2)], { ...s, newOrder: 'mixed' }, NOW, 0))).toEqual(['n1', 'n2']);
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

function inCloze(id: string, dueAt: number, forwardInterval = 10 * DAY): LearningEntry {
	return {
		...review(id, NOW + 10 * DAY),
		forward: { intervalMs: forwardInterval, dueAt: NOW + 10 * DAY },
		clozeEnteredAt: NOW - DAY,
		cloze: { intervalMs: DAY, dueAt }
	};
}
/** Seen in forward only, with this forward interval. */
function forwardOnly(id: string, intervalMs: number): LearningEntry {
	return { ...review(id, NOW + DAY), forward: { intervalMs, dueAt: NOW + DAY } };
}
const onAdd: QueueSettings = { ...s, clozeEntry: 'onAdd' };

describe('availableWords: Cloze', () => {
	test('words seen in Cloze come when due, oldest first, whatever their forward interval', () => {
		const entries = [inCloze('c2', NOW - HOUR), inCloze('c1', NOW - DAY, DAY), inCloze('later', NOW + HOUR), review('notInCloze', NOW - DAY)];
		expect(availableWords('cloze', entries, s, NOW, 0)).toEqual([
			{ wordId: 'c1', kind: 'review' },
			{ wordId: 'c2', kind: 'review' }
		]);
	});

	test('«После прямого»: an unseen word comes once its forward interval reaches 7 days', () => {
		const entries = [forwardOnly('under', 6.9 * DAY), forwardOnly('at', 7 * DAY), forwardOnly('over', 15 * DAY), fresh('n1', 1)];
		expect(availableWords('cloze', entries, s, NOW, 0)).toEqual([
			{ wordId: 'at', kind: 'new' },
			{ wordId: 'over', kind: 'new' }
		]);
	});

	test('«После прямого»: words over the threshold take no slots', () => {
		expect(ids(availableWords('cloze', [forwardOnly('over', 15 * DAY)], s, NOW, 99))).toEqual(['over']);
	});

	test('«Сразу»: never seen words come as new, limited by today\'s slots, in order of adding', () => {
		const entries = [fresh('n2', NOW - 1000), fresh('n1', NOW - 2000), fresh('n3', NOW - 500)];
		expect(availableWords('cloze', entries, { ...onAdd, newPerDay: 3 }, NOW, 1)).toEqual([
			{ wordId: 'n1', kind: 'new' },
			{ wordId: 'n2', kind: 'new' }
		]);
	});

	test('«Сразу»: a word seen in forward comes without a slot, whatever its interval', () => {
		const entries = [forwardOnly('seen', DAY), fresh('n1', 1)];
		expect(ids(availableWords('cloze', entries, { ...onAdd, newPerDay: 3 }, NOW, 3))).toEqual(['seen']);
	});

	test('orders new words against reviews by newOrder', () => {
		const entries = [inCloze('r1', NOW - 2), inCloze('r2', NOW - 1), fresh('n1', 1)];
		expect(ids(availableWords('cloze', entries, { ...onAdd, newOrder: 'first' }, NOW, 0))).toEqual(['n1', 'r1', 'r2']);
		expect(ids(availableWords('cloze', entries, { ...onAdd, newOrder: 'last' }, NOW, 0))).toEqual(['r1', 'r2', 'n1']);
	});
});

describe('availableWords: forward and Cloze share the slots', () => {
	test('a word seen in Cloze comes to forward as new without a slot', () => {
		const clozeOnly: LearningEntry = { ...fresh('c', 1), clozeEnteredAt: NOW, cloze: { intervalMs: DAY, dueAt: NOW + DAY } };
		const entries = [clozeOnly, fresh('n1', 2)];
		expect(availableWords('forward', entries, { ...s, newPerDay: 1 }, NOW, 1)).toEqual([{ wordId: 'c', kind: 'new' }]);
	});

	test('both screens offer the same never seen words for today\'s slots', () => {
		const entries = [fresh('n1', 1), fresh('n2', 2), fresh('n3', 3)];
		const settings = { ...onAdd, newPerDay: 2 };
		expect(ids(availableWords('forward', entries, settings, NOW, 0))).toEqual(['n1', 'n2']);
		expect(ids(availableWords('cloze', entries, settings, NOW, 0))).toEqual(['n1', 'n2']);
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
