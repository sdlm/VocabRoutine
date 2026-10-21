import { describe, expect, test } from 'vitest';
import { startClozeSession } from '$lib/domain/cloze-session';
import { startForwardSession } from '$lib/domain/forward-session';
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

	test('learning: null → demo data', () => {
		expect(parseState(JSON.stringify({ version: 1, learning: null, activity: {} }), NOW)).toEqual(makeSeed(NOW));
	});

	test('learning: [] or activity: null → demo data', () => {
		expect(parseState(JSON.stringify({ version: 1, learning: [], activity: {} }), NOW)).toEqual(makeSeed(NOW));
		expect(parseState(JSON.stringify({ version: 1, learning: {}, activity: null }), NOW)).toEqual(makeSeed(NOW));
	});

	test('drops learning entries for unknown words or mismatched ids', () => {
		const house = makeSeed(NOW).learning.house;
		const saved = {
			version: 1,
			learning: { house, 'no-such-word': { ...house, wordId: 'no-such-word' }, eat: { ...house, wordId: 'house' }, borrow: null },
			activity: {}
		};
		const state = parseState(JSON.stringify(saved), NOW);
		expect(Object.keys(state.learning)).toEqual(['house']);
		expect(state.learning.house).toEqual(house);
	});

	test('unknown top-level keys are not kept', () => {
		const saved = { ...makeSeed(NOW), junk: 1 };
		const state = parseState(JSON.stringify(saved), NOW);
		expect('junk' in state).toBe(false);
		expect(Object.keys(state).sort()).toEqual(['activity', 'learning', 'sessions', 'settings', 'version']);
	});

	test('state saved before sessions existed gets empty sessions', () => {
		const { sessions: _, ...old } = makeSeed(NOW);
		expect(parseState(JSON.stringify(old), NOW).sessions).toEqual({ forward: null, cloze: null });
	});

	test('a valid Cloze session is restored, a malformed one is dropped', () => {
		const session = startClozeSession(['house', 'eat'], NOW);
		const valid = { ...makeSeed(NOW), sessions: { cloze: session } };
		const broken = { ...makeSeed(NOW), sessions: { cloze: { queue: 'oops' } } };
		expect(parseState(JSON.stringify(valid), NOW).sessions.cloze).toEqual(session);
		expect(parseState(JSON.stringify(broken), NOW).sessions.cloze).toBeNull();
	});

	test('a valid forward session is restored, a malformed one is dropped', () => {
		const session = startForwardSession([{ wordId: 'often', kind: 'review' }], NOW);
		const valid = { ...makeSeed(NOW), sessions: { forward: session, cloze: null } };
		const noRevealed = { ...makeSeed(NOW), sessions: { forward: { ...session, revealed: 2 }, cloze: null } };
		const badStep = { ...makeSeed(NOW), sessions: { forward: { ...session, queue: [null] }, cloze: null } };
		expect(parseState(JSON.stringify(valid), NOW).sessions.forward).toEqual(session);
		expect(parseState(JSON.stringify(noRevealed), NOW).sessions.forward).toBeNull();
		expect(parseState(JSON.stringify(badStep), NOW).sessions.forward).toBeNull();
	});

	test('a broken template is repaired', () => {
		const saved = makeSeed(NOW);
		const raw = { ...saved, settings: { ...saved.settings, template: [{ id: 'examples', mode: 'shown' }, { id: 'audio', mode: 'tap' }] } };
		const t = parseState(JSON.stringify(raw), NOW).settings.template;
		expect(t[0]).toEqual({ id: 'examples', mode: 'shown' });
		expect(t.map((b) => b.id).sort()).toEqual(['collocations', 'definition', 'examples', 'similar', 'translations']);
	});
});
