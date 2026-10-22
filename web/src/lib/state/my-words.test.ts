import { beforeEach, describe, expect, test } from 'vitest';
import { myWords, myWordsResults, openMyWords } from './my-words.svelte';
import { app, resetDemo } from './store.svelte';

beforeEach(() => {
	resetDemo();
	openMyWords('all');
});

describe('myWords', () => {
	test('lists every word in learning', () => {
		expect(myWordsResults()).toHaveLength(Object.keys(app.learning).length);
	});

	test('a stats row opens the list with its filter and clears the query', () => {
		myWords.query = 'zzz';
		openMyWords('cloze');
		expect(myWords).toEqual({ filter: 'cloze', query: '' });
		expect(myWordsResults().map((w) => w.id).sort()).toEqual(['house', 'journey']);
	});

	test('a word removed from learning leaves the list', () => {
		delete app.learning.house;
		expect(myWordsResults().some((w) => w.id === 'house')).toBe(false);
	});
});
