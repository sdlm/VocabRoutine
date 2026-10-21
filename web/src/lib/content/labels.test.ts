import { describe, expect, test } from 'vitest';
import { levelsLabel, posLabel } from './labels';

describe('levelsLabel', () => {
	test.each([
		[[], null],
		[['B2'], 'B2'],
		[['B2', 'C1'], 'B2–C1'],
		[['C1', 'A2', 'B1', 'B2'], 'A2–C1'],
		[['A1', 'B2'], 'A1, B2'],
		[['A1', 'A2', 'C2'], 'A1, A2, C2']
	] as const)('%j → %s', (levels, label) => {
		expect(levelsLabel(levels)).toBe(label);
	});
});

describe('posLabel', () => {
	test('none, one, several', () => {
		expect(posLabel([])).toBeNull();
		expect(posLabel(['verb'])).toBe('Глагол');
		expect(posLabel(['noun', 'verb', 'adverb'])).toBe('Сущ. +2');
	});
});
