import { beforeEach, describe, expect, test } from 'vitest';
import { defaultFilters } from '$lib/domain/search';
import { closeSearch, leaveAddTab, resetFilters, search, searchResults, setSort, toggleWord } from './search.svelte';
import { app, isLearning, resetDemo } from './store.svelte';

const ids = () => searchResults().map((w) => w.id);
/** Taps far enough apart for the double-tap guard. */
const T = Date.now();

beforeEach(() => {
	resetDemo();
	closeSearch();
	resetFilters('all');
	search.kept = { key: '', ids: [] };
});

describe('searchResults', () => {
	test('by default shows only words not in learning', () => {
		const list = ids();
		expect(list.length).toBe(30 - Object.keys(app.learning).length);
		expect(list.every((id) => !isLearning(id))).toBe(true);
	});

	test('«Только новые» off shows every word', () => {
		search.filters.onlyNew = false;
		expect(ids()).toHaveLength(30);
	});
});

describe('toggleWord', () => {
	test('adds a word, and it stays in the list until the query changes', () => {
		search.query = 'eph';
		toggleWord('ephemeral');
		expect(isLearning('ephemeral')).toBe(true);
		expect(ids()).toEqual(['ephemeral']);
		search.query = 'ephe';
		expect(ids()).toEqual([]);
	});

	test('the kept word disappears when a filter changes', () => {
		toggleWord('ephemeral');
		expect(ids()).toContain('ephemeral');
		search.filters.levels = ['C2'];
		expect(ids()).not.toContain('ephemeral');
	});

	test('leaving for another tab ends the hold; query and filters stay', () => {
		search.query = 'eph';
		toggleWord('ephemeral');
		leaveAddTab();
		expect(isLearning('ephemeral')).toBe(true);
		expect(ids()).toEqual([]);
		expect(search.query).toBe('eph');
	});

	test('a second tap removes the word again', () => {
		toggleWord('ephemeral', T);
		toggleWord('ephemeral', T + 1000);
		expect(isLearning('ephemeral')).toBe(false);
		expect(ids()).toContain('ephemeral');
	});

	test('the second tap of a double tap is ignored, so the progress is not wiped', () => {
		search.filters.onlyNew = false;
		toggleWord('house', T);
		toggleWord('house', T + 300);
		expect(isLearning('house')).toBe(false);
		toggleWord('ephemeral', T + 350); // another word is not blocked
		expect(isLearning('ephemeral')).toBe(true);
		toggleWord('house', T + 800);
		expect(isLearning('house')).toBe(true);
	});

	test('removing a word drops its progress: added again, it is new', () => {
		search.filters.onlyNew = false;
		toggleWord('house', T);
		expect(isLearning('house')).toBe(false);
		toggleWord('house', T + 1000);
		expect(app.learning.house.forward).toBeNull();
	});
});

describe('closeSearch / resetFilters / setSort', () => {
	test('closeSearch clears the query and folds the bar', () => {
		search.open = true;
		search.query = 'dep';
		closeSearch();
		expect(search).toMatchObject({ open: false, query: '' });
	});

	test('resetFilters resets one filter or all of them', () => {
		search.filters = { ...defaultFilters(), levels: ['B2'], pos: ['verb'], onlyNew: false };
		resetFilters('levels');
		expect(search.filters).toMatchObject({ levels: [], pos: ['verb'], onlyNew: false });
		resetFilters('all');
		expect(search.filters).toEqual(defaultFilters());
	});

	test('picking «Случайно» reshuffles', () => {
		const seeds = new Set<number>();
		for (let i = 0; i < 5; i++) {
			setSort('random');
			seeds.add(search.seed);
		}
		expect(search.filters.sort).toBe('random');
		expect(seeds.size).toBeGreaterThan(1);
	});
});
