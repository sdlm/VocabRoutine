import { describe, expect, test } from 'vitest';
import { formatDuration, plural, WORD_FORMS } from './format';

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
