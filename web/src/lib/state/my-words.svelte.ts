import { wordById } from '$lib/content';
import type { Word } from '$lib/content/types';
import { findMyWords, type WordsFilter } from '$lib/domain/stats';
import { app } from './store.svelte';

/** «Мои слова». Kept in memory like «Добавить»: it survives a trip to a card and back. */
export const myWords = $state({ filter: 'all' as WordsFilter, query: '' });

/** A «Слова» row on the stats screen: the list opens with that filter and no query. */
export function openMyWords(filter: WordsFilter): void {
	myWords.filter = filter;
	myWords.query = '';
}

export function myWordsResults(): Word[] {
	return findMyWords(Object.values(app.learning), myWords.filter, myWords.query, wordById);
}
