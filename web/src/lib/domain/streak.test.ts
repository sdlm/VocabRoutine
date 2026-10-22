import { describe, expect, test } from 'vitest';
import { bumpActivity, streakInfo } from './streak';
import { shiftDay } from './time';
import type { Activity } from './types';

const TODAY = '2026-10-20';

/** counts[0] is today, counts[1] yesterday, … */
function history(counts: number[]): Activity {
	const a: Activity = {};
	counts.forEach((counted, i) => {
		a[shiftDay(TODAY, -i)] = { counted, seconds: 60 };
	});
	return a;
}

describe('streakInfo', () => {
	test('a goal of 0 or less is treated as 1 and terminates', () => {
		const info = streakInfo(history([0, 0]), 0, TODAY);
		expect(info.current).toBe(0);
		expect(info.remainingToday).toBe(1);
	});

	test('empty history', () => {
		expect(streakInfo({}, 10, TODAY)).toEqual({ current: 0, record: 0, todayCounted: 0, remainingToday: 10, goalReachedToday: false });
	});

	test('today not reached yet keeps the streak from yesterday', () => {
		const info = streakInfo(history([3, 10, 12, 10]), 10, TODAY);
		expect(info.current).toBe(3);
		expect(info.remainingToday).toBe(7);
		expect(info.goalReachedToday).toBe(false);
	});

	test('today reached extends the streak', () => {
		const info = streakInfo(history([10, 10, 10]), 10, TODAY);
		expect(info.current).toBe(3);
		expect(info.remainingToday).toBe(0);
		expect(info.goalReachedToday).toBe(true);
	});

	test('a missed day breaks the streak', () => {
		expect(streakInfo(history([0, 10, 9, 10, 10]), 10, TODAY).current).toBe(1);
	});

	test('record is the longest run ever', () => {
		const info = streakInfo(history([10, 0, 10, 10, 10, 10, 0, 10]), 10, TODAY);
		expect(info.current).toBe(1);
		expect(info.record).toBe(4);
	});
});

describe('bumpActivity', () => {
	test('creates the day and adds to existing values without mutating', () => {
		const a0: Activity = {};
		const a1 = bumpActivity(a0, TODAY, { counted: 1 });
		const a2 = bumpActivity(a1, TODAY, { seconds: 30 });
		expect(a0).toEqual({});
		expect(a2[TODAY]).toEqual({ counted: 1, seconds: 30 });
	});

	test('counts introduced words; days without them have no such field', () => {
		const a1 = bumpActivity({}, TODAY, { counted: 1, introduced: 1 });
		const a2 = bumpActivity(a1, TODAY, { counted: 1, introduced: 1 });
		expect(a2[TODAY]).toEqual({ counted: 2, seconds: 0, introduced: 2 });
		expect(bumpActivity(a2, TODAY, { seconds: 5 })[TODAY].introduced).toBe(2);
	});
});
