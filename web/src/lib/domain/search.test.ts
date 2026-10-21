import { describe, expect, test } from 'vitest';
import { words } from '$lib/content';
import { LEVELS } from '$lib/content/types';
import { defaultFilters, matchIndex, searchKey, searchWords, sheetOnlyChanges, toggleValue, type SearchFilters } from './search';

const none = () => false;
const ids = (q: string, f: Partial<SearchFilters> = {}, hidden: (id: string) => boolean = none, seed = 1) =>
	searchWords(words, q, { ...defaultFilters(), ...f }, hidden, seed).map((w) => w.id);

describe('matchIndex', () => {
	test('finds the query ignoring case and outer spaces', () => {
		expect(matchIndex('Deploy', ' DEPL ')).toBe(0);
		expect(matchIndex('cheap', 'ea')).toBe(2);
		expect(matchIndex('cheap', 'x')).toBe(-1);
	});
});

describe('searchWords', () => {
	test('without a query: every word, by frequency', () => {
		const all = ids('');
		expect(all).toHaveLength(30);
		expect(all.slice(0, 3)).toEqual(['house', 'often', 'eat']);
	});

	test('the query filters by the word, case-insensitive', () => {
		expect(ids(' DEPL ')).toEqual(['deploy']);
		expect(ids('zzz')).toEqual([]);
	});

	test('words starting with the query come first', () => {
		const o = ids('o');
		expect(o.slice(0, 3)).toEqual(['often', 'outcome', 'obfuscate']);
		expect(o).toContain('house');
	});

	test('values within a filter are OR, filters are AND', () => {
		expect(ids('', { levels: ['C2'], pos: ['adjective'] })).toEqual(['dope', 'ephemeral', 'gobsmacked']);
		expect(ids('', { levels: ['A1', 'C2'], registers: ['slang'] })).toEqual(['dope', 'gobsmacked']);
	});

	test('«Только новые» drops hidden words; off, it shows them', () => {
		const learning = (id: string) => id === 'house' || id === 'eat';
		expect(ids('', {}, learning)).not.toContain('house');
		expect(ids('', { onlyNew: false }, learning)).toContain('house');
	});

	test('А–Я sorts by the word', () => {
		expect(ids('', { sort: 'alpha' }).slice(0, 3)).toEqual(['allegedly', 'awesome', 'borrow']);
	});

	test('«Случайно» is stable for a seed and changes with it', () => {
		const a = ids('', { sort: 'random' }, none, 7);
		expect(ids('', { sort: 'random' }, none, 7)).toEqual(a);
		expect(ids('', { sort: 'random' }, none, 8)).not.toEqual(a);
		expect([...a].sort()).toEqual(ids('', { sort: 'alpha' }));
	});
});

describe('sheetOnlyChanges', () => {
	test('counts only filters without a chip, defaults excluded', () => {
		expect(sheetOnlyChanges(defaultFilters())).toBe(0);
		expect(sheetOnlyChanges({ ...defaultFilters(), levels: ['B2'], pos: ['verb'] })).toBe(0);
		expect(sheetOnlyChanges({ ...defaultFilters(), registers: ['slang', 'formal'], sort: 'alpha' })).toBe(2);
		expect(sheetOnlyChanges({ ...defaultFilters(), onlyNew: false })).toBe(1);
	});
});

describe('searchKey', () => {
	test('same list → same key; another query or filter → another key', () => {
		const f = defaultFilters();
		expect(searchKey(' Depl', f)).toBe(searchKey('depl', defaultFilters()));
		expect(searchKey('depl', f)).not.toBe(searchKey('dep', f));
		expect(searchKey('', f)).not.toBe(searchKey('', { ...f, levels: ['B2'] }));
	});
});

describe('toggleValue', () => {
	test('adds and removes, keeping the canonical order', () => {
		expect(toggleValue(['C1'], 'B2', LEVELS)).toEqual(['B2', 'C1']);
		expect(toggleValue(['B2', 'C1'], 'B2', LEVELS)).toEqual(['C1']);
	});
});

describe('defaultFilters', () => {
	test('returns fresh arrays', () => {
		const a = defaultFilters();
		a.levels.push('A1');
		expect(defaultFilters().levels).toEqual([]);
	});
});
