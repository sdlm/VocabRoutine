import { describe, expect, test } from 'vitest';
import { CLOZE_THRESHOLD_MS, gradeCloze, gradeForward, introduceForward, newEntry } from './learning';
import { DAY, HOUR } from './time';
import type { SrsSettings } from './types';

const s: SrsSettings = { successFactor: 2.5, failFactor: 0.5, minIntervalMs: DAY };
const T0 = new Date(2026, 9, 20, 10).getTime();

describe('introduceForward', () => {
	test('schedules the first review after the minimum interval', () => {
		const e = introduceForward(newEntry('deploy', T0), T0, { ...s, minIntervalMs: 4 * HOUR });
		expect(e.forwardIntroducedAt).toBe(T0);
		expect(e.forward).toEqual({ intervalMs: 4 * HOUR, dueAt: T0 + 4 * HOUR });
		expect(e.cloze).toBeNull();
	});
	test('throws when the word was already introduced', () => {
		const e = introduceForward(newEntry('deploy', T0), T0, s);
		expect(() => introduceForward(e, T0 + DAY, s)).toThrow('introduceForward: deploy was already introduced');
	});
});

describe('gradeForward', () => {
	test('updates interval and due date', () => {
		const e = gradeForward(introduceForward(newEntry('deploy', T0), T0, s), 'success', T0 + DAY, s);
		expect(e.forward).toEqual({ intervalMs: 2.5 * DAY, dueAt: T0 + DAY + 2.5 * DAY });
	});

	test('does not enter Cloze at exactly the threshold', () => {
		const e = { ...newEntry('deploy', T0), forward: { intervalMs: 2 * DAY, dueAt: T0 } };
		expect(gradeForward(e, 'success', T0, s).forward!.intervalMs).toBe(CLOZE_THRESHOLD_MS);
		expect(gradeForward(e, 'success', T0, s).clozeEnteredAt).toBeNull();
	});

	test('enters Cloze due now with the minimum interval once interval > 5 days', () => {
		const e = { ...newEntry('deploy', T0), forward: { intervalMs: 2.5 * DAY, dueAt: T0 } };
		const next = gradeForward(e, 'success', T0, s);
		expect(next.clozeEnteredAt).toBe(T0);
		expect(next.cloze).toEqual({ intervalMs: DAY, dueAt: T0 });
	});

	test('a word stays in Cloze after its forward interval drops', () => {
		const inCloze = {
			...newEntry('deploy', T0),
			forward: { intervalMs: 8 * DAY, dueAt: T0 },
			clozeEnteredAt: T0 - DAY,
			cloze: { intervalMs: 3 * DAY, dueAt: T0 + DAY }
		};
		const next = gradeForward(inCloze, 'fail', T0, s);
		expect(next.forward!.intervalMs).toBe(4 * DAY);
		expect(next.clozeEnteredAt).toBe(T0 - DAY);
		expect(next.cloze).toEqual(inCloze.cloze);
	});

	test('throws for a word that was never introduced', () => {
		expect(() => gradeForward(newEntry('deploy', T0), 'success', T0, s)).toThrow();
	});
});

describe('gradeCloze', () => {
	test('first answer is computed from the minimum interval', () => {
		const e = { ...newEntry('deploy', T0), clozeEnteredAt: T0, cloze: { intervalMs: DAY, dueAt: T0 } };
		expect(gradeCloze(e, 'success', T0, s).cloze).toEqual({ intervalMs: 2.5 * DAY, dueAt: T0 + 2.5 * DAY });
	});

	test('does not touch forward progress', () => {
		const e = {
			...newEntry('deploy', T0),
			forward: { intervalMs: 6 * DAY, dueAt: T0 + 6 * DAY },
			clozeEnteredAt: T0,
			cloze: { intervalMs: DAY, dueAt: T0 }
		};
		expect(gradeCloze(e, 'fail', T0, s).forward).toEqual(e.forward);
	});
});
