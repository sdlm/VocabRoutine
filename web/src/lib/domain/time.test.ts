import { describe, expect, test } from 'vitest';
import { dayKey, shiftDay } from './time';

describe('dayKey', () => {
	test('formats local date with zero padding', () => {
		expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
	});
	test('local midnight starts a new day', () => {
		expect(dayKey(new Date(2026, 0, 6, 0, 0).getTime())).toBe('2026-01-06');
	});
});

describe('shiftDay', () => {
	test('crosses month and year boundaries', () => {
		expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
		expect(shiftDay('2026-02-28', 1)).toBe('2026-03-01');
	});
});
