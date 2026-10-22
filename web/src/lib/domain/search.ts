import type { Level, Pos, Register, Word } from '$lib/content/types';

export type SortOrder = 'freq' | 'alpha' | 'random';

/** Filter sheet on «Добавить»: all filters (⚌) or one chip. */
export type SheetPart = 'all' | 'levels' | 'pos';

export interface SearchFilters {
	/** Empty = any. */
	levels: Level[];
	pos: Pos[];
	registers: Register[];
	/** Hide words already in learning. */
	onlyNew: boolean;
	sort: SortOrder;
}

export const DEFAULT_FILTERS: SearchFilters = { levels: [], pos: [], registers: [], onlyNew: true, sort: 'freq' };

export function defaultFilters(): SearchFilters {
	return { ...DEFAULT_FILTERS, levels: [], pos: [], registers: [] };
}

/** Where the query starts inside the word (case-insensitive), -1 if it does not occur. */
export function matchIndex(word: string, query: string): number {
	return word.toLowerCase().indexOf(query.trim().toLowerCase());
}

/** FNV-1a: a stable pseudo-random rank, so «Случайно» does not reshuffle on every keystroke. */
function rank(seed: number, id: string): number {
	let h = 0x811c9dc5 ^ seed;
	for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
	return h >>> 0;
}

/**
 * The result list. `hidden` drops words for «Только новые» (the caller decides which added
 * words stay visible). With a query, words that start with it come first, then the chosen order.
 */
export function searchWords(
	list: readonly Word[],
	query: string,
	f: SearchFilters,
	hidden: (id: string) => boolean,
	seed: number
): Word[] {
	const q = query.trim();
	const found = list.filter(
		(w) =>
			(!q || matchIndex(w.word, q) >= 0) &&
			(f.levels.length === 0 || f.levels.includes(w.level)) &&
			(f.pos.length === 0 || f.pos.includes(w.pos)) &&
			(f.registers.length === 0 || f.registers.includes(w.register)) &&
			!(f.onlyNew && hidden(w.id))
	);
	const order = (a: Word, b: Word): number =>
		f.sort === 'freq' ? a.freqRank - b.freqRank : f.sort === 'alpha' ? a.word.localeCompare(b.word, 'en') : rank(seed, a.id) - rank(seed, b.id);
	const prefixFirst = (a: Word, b: Word): number => Number(matchIndex(b.word, q) === 0) - Number(matchIndex(a.word, q) === 0);
	return found.sort((a, b) => (q ? prefixFirst(a, b) : 0) || order(a, b));
}

/** The number on ⚌: changed filters that have no chip (register, «Только новые», sort). */
export function sheetOnlyChanges(f: SearchFilters): number {
	return Number(f.registers.length > 0) + Number(f.onlyNew !== DEFAULT_FILTERS.onlyNew) + Number(f.sort !== DEFAULT_FILTERS.sort);
}

/** Identity of «what the list shows»: changing it ends the grace period for just-added words. */
export function searchKey(query: string, f: SearchFilters): string {
	return JSON.stringify([query.trim().toLowerCase(), f.levels, f.pos, f.registers, f.onlyNew, f.sort]);
}

/** Add or remove a value of a multi-select filter, keeping the canonical order (A1…C2). */
export function toggleValue<T>(list: readonly T[], value: T, order: readonly T[]): T[] {
	const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	return order.filter((v) => next.includes(v));
}
