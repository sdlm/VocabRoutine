import { describe, expect, test } from 'vitest';
import { stepValue } from './step';

describe('stepValue', () => {
	test('whole steps stay within the bounds', () => {
		expect(stepValue(10, 1, 1, 100)).toBe(11);
		expect(stepValue(1, -1, 1, 100)).toBe(1);
		expect(stepValue(100, 1, 1, 100)).toBe(100);
	});

	test('tenths are rounded on every step, so float error does not pile up', () => {
		let v = 2.5;
		for (let i = 0; i < 7; i++) v = stepValue(v, 0.1, 1.1, 5, 1);
		expect(v).toBe(3.2);
		for (let i = 0; i < 7; i++) v = stepValue(v, -0.1, 1.1, 5, 1);
		expect(v).toBe(2.5);
	});

	test('factor bounds: success ×1,1…×5, fail ×0,1…×1', () => {
		expect(stepValue(1.1, -0.1, 1.1, 5, 1)).toBe(1.1);
		expect(stepValue(5, 0.1, 1.1, 5, 1)).toBe(5);
		expect(stepValue(0.1, -0.1, 0.1, 1, 1)).toBe(0.1);
		expect(stepValue(1, 0.1, 0.1, 1, 1)).toBe(1);
	});

	test('a value outside the bounds snaps back into them', () => {
		expect(stepValue(0, -1, 1, 100)).toBe(1);
		expect(stepValue(150, 1, 1, 100)).toBe(100);
	});
});
