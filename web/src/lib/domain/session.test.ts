import { describe, expect, test } from 'vitest';
import { IDLE_CAP_MS, startClock, touch } from './session';
import { dayKey } from './time';

const NOW = new Date(2026, 9, 20, 12).getTime();

describe('session clock', () => {
	test('starts today with no elapsed time', () => {
		expect(startClock(NOW)).toEqual({ day: dayKey(NOW), startedAt: NOW, lastActiveAt: NOW, elapsedMs: 0 });
	});

	test('adds the gap since the last action', () => {
		expect(touch(startClock(NOW), NOW + 30_000)).toEqual({ lastActiveAt: NOW + 30_000, elapsedMs: 30_000 });
	});

	test('a long pause counts as IDLE_CAP_MS', () => {
		expect(touch(startClock(NOW), NOW + 3_600_000).elapsedMs).toBe(IDLE_CAP_MS);
	});

	test('a clock going backwards adds nothing', () => {
		expect(touch(startClock(NOW), NOW - 5_000).elapsedMs).toBe(0);
	});
});
