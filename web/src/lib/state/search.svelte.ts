import { words } from '$lib/content';
import type { Word } from '$lib/content/types';
import { defaultFilters, searchKey, searchWords, type SortOrder } from '$lib/domain/search';
import { isLearning, toggleLearning } from './store.svelte';

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/** «Добавить». Kept in memory: it survives a trip to a card and back, a reload starts clean. */
export const search = $state({
	open: false,
	query: '',
	filters: defaultFilters(),
	/** Order for «Случайно»; picking «Случайно» again reshuffles. */
	seed: randomSeed(),
	/** Words toggled while the list looked like `key` stay in it under «Только новые». */
	kept: { key: '', ids: [] as string[] }
});

export function searchResults(): Word[] {
	const key = searchKey(search.query, search.filters);
	const kept = search.kept.key === key ? search.kept.ids : [];
	return searchWords(words, search.query, search.filters, (id) => isLearning(id) && !kept.includes(id), search.seed);
}

/** Row tap and the card's «Учить»: toggle learning; the row stays put until the query or filters change. */
export function toggleWord(id: string): void {
	const key = searchKey(search.query, search.filters);
	if (search.kept.key !== key) search.kept = { key, ids: [] };
	if (!search.kept.ids.includes(id)) search.kept.ids.push(id);
	toggleLearning(id);
}

/** ← in the search bar: clear the query and fold the bar back into the loupe. */
export function closeSearch(): void {
	search.open = false;
	search.query = '';
}

/** «Сбросить» in a chip sheet (one filter) or in ⚌ (all of them). */
export function resetFilters(part: 'levels' | 'pos' | 'all'): void {
	if (part === 'all') search.filters = defaultFilters();
	else search.filters[part] = [];
}

export function setSort(sort: SortOrder): void {
	if (sort === 'random') search.seed = randomSeed();
	search.filters.sort = sort;
}
