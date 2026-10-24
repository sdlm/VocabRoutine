import type { Word } from '$lib/content/types';
import { DAY } from './time';
import type { Activity, LearningEntry } from './types';

/** «Узнаю ≥ 7 дн», «Вспоминаю ≥ 7 дн»: the interval in that mode is at least this. */
export const SOLID_MS = 7 * DAY;

export type Mode = 'forward' | 'cloze';

/** «Мои слова» filter: every word, or the ones solid in one mode. */
export type WordsFilter = 'all' | Mode;

export function isSolid(e: LearningEntry, mode: Mode): boolean {
	const p = e[mode];
	return p !== null && p.intervalMs >= SOLID_MS;
}

/** «Слова» on the stats screen. Not a funnel: a word can be solid in Cloze and not in forward mode. */
export function wordCounts(entries: readonly LearningEntry[]): { added: number; forward: number; cloze: number } {
	return {
		added: entries.length,
		forward: entries.filter((e) => isSolid(e, 'forward')).length,
		cloze: entries.filter((e) => isSolid(e, 'cloze')).length
	};
}

/**
 * «Мои слова»: words in learning, newest first. The query is a substring of the word
 * or of any translation, case-insensitive.
 */
export function findMyWords(
	entries: readonly LearningEntry[],
	filter: WordsFilter,
	query: string,
	byId: ReadonlyMap<string, Word>
): Word[] {
	const q = query.trim().toLowerCase();
	return entries
		.filter((e) => byId.has(e.wordId) && (filter === 'all' || isSolid(e, filter)))
		.sort((a, b) => b.addedAt - a.addedAt)
		.map((e) => byId.get(e.wordId)!)
		.filter((w) => !q || w.word.toLowerCase().includes(q) || w.translations.some((t) => t.text.toLowerCase().includes(q)));
}

/** The three numbers for all time. A day counts once it has any activity. */
export function activityTotals(activity: Activity): { days: number; seconds: number; avgSeconds: number } {
	const active = Object.values(activity).filter((d) => d.counted > 0 || d.seconds > 0);
	const seconds = active.reduce((sum, d) => sum + d.seconds, 0);
	return { days: active.length, seconds, avgSeconds: active.length ? seconds / active.length : 0 };
}
