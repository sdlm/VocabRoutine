import raw from './words.json';
import type { Word } from './types';

export const words: Word[] = raw as Word[];

export const wordById: Map<string, Word> = new Map(words.map((w) => [w.id, w]));

/** Lower-cased word and every form → word id. */
export function buildFormIndex(list: Word[]): Map<string, string> {
	const index = new Map<string, string>();
	for (const w of list) {
		for (const f of [w.word, ...w.forms]) index.set(f.toLowerCase(), w.id);
	}
	return index;
}

export const formIndex = buildFormIndex(words);
