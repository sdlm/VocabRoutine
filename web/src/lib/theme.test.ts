import { describe, expect, test } from 'vitest';
import { themeColor } from './theme';

describe('themeColor', () => {
	test('«Авто» keeps the colour of each tag\'s own scheme', () => {
		expect(themeColor('auto', 'light')).toBe('#ffffff');
		expect(themeColor('auto', 'dark')).toBe('#000000');
	});

	test('a fixed theme paints both tags', () => {
		expect(themeColor('dark', 'light')).toBe('#000000');
		expect(themeColor('light', 'dark')).toBe('#ffffff');
	});
});
