import { describe, expect, test } from 'vitest';
import { formatDuration, formatMinutes, formatTotalTime, plural, WORD_FORMS } from './format';

describe('plural', () => {
	test.each([
		[1, 'слово'],
		[2, 'слова'],
		[5, 'слов'],
		[11, 'слов'],
		[12, 'слов'],
		[21, 'слово'],
		[22, 'слова'],
		[111, 'слов']
	])('%i → %s', (n, form) => {
		expect(plural(n, WORD_FORMS)).toBe(form);
	});
});

describe('formatDuration', () => {
	test('minutes and zero-padded seconds', () => {
		expect(formatDuration(400_000)).toBe('6:40');
		expect(formatDuration(5_000)).toBe('0:05');
	});
});

describe('formatTotalTime / formatMinutes', () => {
	test('hours from one hour up, minutes below', () => {
		expect(formatTotalTime(23 * 3600 + 1200)).toBe('23 ч');
		expect(formatTotalTime(3600)).toBe('1 ч');
		expect(formatTotalTime(2700)).toBe('45 мин');
		expect(formatTotalTime(0)).toBe('0 мин');
		expect(formatTotalTime(3599)).toBe('1 ч');
		expect(formatTotalTime(3569)).toBe('59 мин');
	});

	test('minutes are rounded', () => {
		expect(formatMinutes(16 * 60 + 29)).toBe('16 мин');
		expect(formatMinutes(16 * 60 + 31)).toBe('17 мин');
	});
});
