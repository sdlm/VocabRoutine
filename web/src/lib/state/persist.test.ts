import { describe, expect, test } from 'vitest';
import { parseState } from './persist';
import { defaultSettings } from './schema';
import { makeSeed } from './seed';

const NOW = new Date(2026, 9, 20, 12).getTime();

describe('parseState', () => {
	test('nothing saved → demo data', () => {
		expect(parseState(null, NOW)).toEqual(makeSeed(NOW));
	});

	test('broken JSON or another version → demo data', () => {
		expect(parseState('{oops', NOW)).toEqual(makeSeed(NOW));
		expect(parseState(JSON.stringify({ version: 2, learning: {}, activity: {} }), NOW)).toEqual(makeSeed(NOW));
	});

	test('round-trips a saved state', () => {
		const state = makeSeed(NOW);
		state.settings.dailyGoal = 25;
		expect(parseState(JSON.stringify(state), NOW)).toEqual(state);
	});

	test('missing settings get defaults', () => {
		const saved = { version: 1, learning: {}, activity: {}, settings: { dailyGoal: 5, cloze: { autoAdvance: true } } };
		const state = parseState(JSON.stringify(saved), NOW);
		expect(state.settings.dailyGoal).toBe(5);
		expect(state.settings.cloze).toEqual({ ...defaultSettings().cloze, autoAdvance: true });
		expect(state.settings.queue).toEqual(defaultSettings().queue);
		expect(state.settings.template).toEqual(defaultSettings().template);
	});
});
