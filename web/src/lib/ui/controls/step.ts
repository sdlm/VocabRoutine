/**
 * −/+ on a stepper. Rounds to `decimals` on every step, so 2.5 + 0.1 is 2.6
 * and the float error of 0.1 does not pile up. The result stays within [min, max].
 */
export function stepValue(value: number, delta: number, min: number, max: number, decimals = 0): number {
	const f = 10 ** decimals;
	return Math.min(max, Math.max(min, Math.round((value + delta) * f) / f));
}
