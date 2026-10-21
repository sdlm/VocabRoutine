import { describe, expect, test } from 'vitest';
import { formatFactor, formatInterval, nextInterval } from './srs';
import { DAY, HOUR } from './time';
import type { Result, SrsSettings } from './types';

const base: SrsSettings = { successFactor: 2.5, failFactor: 0.5, minIntervalMs: DAY };

function run(min: number, history: string): string[] {
	const s = { ...base, minIntervalMs: min };
	let iv = min;
	const out = [formatInterval(iv)];
	for (const ch of history) {
		iv = nextInterval(iv, (ch === '1' ? 'success' : 'fail') as Result, s);
		out.push(formatInterval(iv));
	}
	return out;
}

describe('nextInterval', () => {
	test('success multiplies by successFactor', () => {
		expect(nextInterval(DAY, 'success', base)).toBe(2.5 * DAY);
	});
	test('fail multiplies by failFactor instead of resetting', () => {
		expect(nextInterval(10 * DAY, 'fail', base)).toBe(5 * DAY);
	});
	test('never drops below the minimum interval', () => {
		expect(nextInterval(DAY, 'fail', base)).toBe(DAY);
	});
});

describe('demo scenarios from 07-settings.html', () => {
	test('min 1 h, ✓✓✓✓✗✓ crosses from hours to days and back', () => {
		expect(run(HOUR, '111101')).toEqual(['1 ч', '3 ч', '6 ч', '16 ч', '2 дн', '20 ч', '2 дн']);
	});
	test('min 1 d, ✓✓✗✓✓', () => {
		expect(run(DAY, '11011')).toEqual(['1 дн', '3 дн', '6 дн', '3 дн', '8 дн', '20 дн']);
	});
});

describe('formatInterval', () => {
	test('months and years use one decimal with a comma', () => {
		expect(formatInterval(45 * DAY)).toBe('1,5 мес');
		expect(formatInterval(30 * DAY)).toBe('1 мес');
		expect(formatInterval(400 * DAY)).toBe('1,1 г');
	});
	test('rounds first, then picks the unit', () => {
		expect(formatInterval(23.6 * HOUR)).toBe('1 дн');
		expect(formatInterval(29.7 * DAY)).toBe('1 мес');
		expect(formatInterval(364 * DAY)).toBe('1 г');
	});
});

describe('formatFactor', () => {
	test('always one decimal', () => {
		expect(formatFactor(2.5)).toBe('×2,5');
		expect(formatFactor(1)).toBe('×1,0');
	});
});
