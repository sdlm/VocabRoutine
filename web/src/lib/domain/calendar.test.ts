import { describe, expect, test } from 'vitest';
import { calendar, CALENDAR_MAX_ROWS, CALENDAR_MIN_ROWS, firstActiveDay, heatLevel, streakRange, weekStart, type Calendar } from './calendar';
import type { StreakInfo } from './streak';
import { shiftDay } from './time';
import type { Activity } from './types';

const TODAY = '2026-10-24'; // Saturday

/** Activity on every day from `from` to `to` (inclusive), `seconds` each. */
function days(from: string, to: string, seconds = 900, counted = 10): Activity {
	const a: Activity = {};
	for (let k = from; k <= to; k = shiftDay(k, 1)) a[k] = { counted, seconds };
	return a;
}
const info = (current: number, goalReachedToday = false): StreakInfo => ({ current, record: current, todayCounted: 0, remainingToday: 0, goalReachedToday });
const find = (c: Calendar, key: string) => c.rows.flatMap((r) => r.days).find((d) => d.key === key)!;

describe('heatLevel', () => {
	test('none, under 10 min, under 20 min, longer', () => {
		expect([0, 1, 599, 600, 1199, 1200].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3]);
	});
});

describe('weekStart / firstActiveDay', () => {
	test('weeks start on Monday', () => {
		expect(weekStart('2026-10-24')).toBe('2026-10-19');
		expect(weekStart('2026-10-19')).toBe('2026-10-19');
		expect(weekStart('2026-10-25')).toBe('2026-10-19');
		expect(weekStart('2027-01-01')).toBe('2026-12-28');
	});

	test('the first day with words or seconds', () => {
		expect(firstActiveDay({ '2026-10-02': { counted: 0, seconds: 0 }, '2026-10-05': { counted: 0, seconds: 30 }, '2026-10-09': { counted: 3, seconds: 0 } })).toBe('2026-10-05');
		expect(firstActiveDay({})).toBeNull();
	});
});

describe('streakRange', () => {
	test('ends yesterday until today\'s goal is met, then today', () => {
		expect(streakRange(info(3), TODAY)).toEqual({ start: '2026-10-21', end: '2026-10-23' });
		expect(streakRange(info(3, true), TODAY)).toEqual({ start: '2026-10-22', end: '2026-10-24' });
	});

	test('no streak, no range', () => {
		expect(streakRange(info(0), TODAY)).toBeNull();
	});
});

describe('calendar rows', () => {
	test('two weeks per row starting on Monday; the last row holds this week', () => {
		const c = calendar({}, TODAY, null);
		expect(c.rows.map((r) => r.start)).toEqual(['2026-09-28', '2026-10-12']);
		expect(c.rows[1].days).toHaveLength(14);
		expect(c.rows[1].days[0].key).toBe('2026-10-12');
		expect(c.rows[1].days[13].key).toBe('2026-10-25');
	});

	test('a new user sees the two bottom rows', () => {
		expect(calendar(days('2026-10-21', '2026-10-23'), TODAY, null).rows).toHaveLength(2);
	});

	test('a row appears once it has activity, up to six', () => {
		expect(calendar(days('2026-09-20', '2026-10-23'), TODAY, null).rows).toHaveLength(3);
		expect(calendar(days('2026-01-01', '2026-10-23'), TODAY, null).rows).toHaveLength(CALENDAR_MAX_ROWS);
	});

	test('empty rows between active ones stay', () => {
		const a = { ...days('2026-08-04', '2026-08-06'), ...days('2026-10-20', '2026-10-23') };
		const c = calendar(a, TODAY, null);
		expect(c.rows).toHaveLength(6);
		expect(c.rows[0].start).toBe('2026-08-03');
	});

	test('activity older than six rows adds none: after a long break, two rows', () => {
		const c = calendar({ ...days('2026-03-02', '2026-03-02'), ...days('2026-10-22', '2026-10-23') }, TODAY, null);
		expect(c.rows).toHaveLength(CALENDAR_MIN_ROWS);
		expect(c.rows[0].start).toBe('2026-09-28');
	});
});

describe('calendar days', () => {
	test('before the first lesson, past, today, future', () => {
		const c = calendar(days('2026-10-21', '2026-10-23', 300), TODAY, null);
		expect(find(c, '2026-10-20').state).toBe('before');
		expect(find(c, '2026-10-21')).toMatchObject({ state: 'past', seconds: 300, counted: 10, level: 1 });
		expect(find(c, TODAY).state).toBe('today');
		expect(find(c, '2026-10-25').state).toBe('future');
	});

	test('a past day without activity after the first lesson is a gap, not «before»', () => {
		const a = { ...days('2026-10-15', '2026-10-16'), ...days('2026-10-19', '2026-10-23') };
		expect(find(calendar(a, TODAY, null), '2026-10-17')).toMatchObject({ state: 'past', level: 0 });
	});

	test('streak days are numbered from the first one', () => {
		const c = calendar(days('2026-10-01', '2026-10-23'), TODAY, { start: '2026-10-21', end: '2026-10-23' });
		expect(['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', TODAY].map((k) => find(c, k).streakDay)).toEqual([null, 0, 1, 2, null]);
	});
});

describe('calendar: all days in the streak', () => {
	test('a past day outside the streak keeps the pill', () => {
		expect(calendar(days('2026-10-01', '2026-10-23'), TODAY, { start: '2026-10-10', end: '2026-10-23' }).allInStreak).toBeNull();
	});

	test('a streak older than the calendar covers everything', () => {
		expect(calendar(days('2026-01-01', '2026-10-23'), TODAY, { start: '2026-02-01', end: '2026-10-23' }).allInStreak).toBe('visible');
	});

	test('a new user with no missed day: from the start', () => {
		expect(calendar(days('2026-10-19', '2026-10-23'), TODAY, { start: '2026-10-19', end: '2026-10-23' }).allInStreak).toBe('from-start');
	});

	test('today counts only once its goal is met', () => {
		const a = { ...days('2026-10-19', '2026-10-23'), [TODAY]: { counted: 2, seconds: 60 } };
		expect(calendar(a, TODAY, { start: '2026-10-19', end: '2026-10-23' }).allInStreak).toBe('from-start');
		const firstToday = { [TODAY]: { counted: 10, seconds: 60 } };
		expect(calendar(firstToday, TODAY, { start: TODAY, end: TODAY }).allInStreak).toBe('from-start');
		expect(calendar(firstToday, TODAY, null).allInStreak).toBeNull();
	});

	test('no streak, no line', () => {
		expect(calendar(days('2026-10-19', '2026-10-23'), TODAY, null).allInStreak).toBeNull();
		expect(calendar({}, TODAY, null).allInStreak).toBeNull();
	});
});
