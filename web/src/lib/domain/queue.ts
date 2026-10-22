import { nextMidnight } from './time';
import type { LearningEntry, QueueSettings } from './types';

export interface ForwardItem {
	wordId: string;
	kind: 'new' | 'review';
}

/**
 * Proportional merge: base item i sits at (i+1)/(base.length+1), insert j at (j+1)/(inserts.length+1).
 * Items are merged by position; on a tie the base item goes first. Both orders are kept.
 */
function interleave<T>(base: T[], inserts: T[]): T[] {
	const out: T[] = [];
	let b = 0;
	let j = 0;
	while (b < base.length || j < inserts.length) {
		// Compare (b+1)/(B+1) <= (j+1)/(I+1) via cross-multiplication to stay exact.
		const baseFirst = j >= inserts.length || (b < base.length && (b + 1) * (inserts.length + 1) <= (j + 1) * (base.length + 1));
		out.push(baseFirst ? base[b++] : inserts[j++]);
	}
	return out;
}

/**
 * New words the forward queue may still take today. `shownToday` comes from the day's activity,
 * not from the entries: a word removed after «Новое слово» keeps its slot.
 */
export function newLeftToday(shownToday: number, s: QueueSettings): number {
	return Math.max(0, s.newPerDay - shownToday);
}

/** `newShownToday`: «Новое слово» screens passed today (DayActivity.introduced). */
export function forwardQueue(entries: LearningEntry[], s: QueueSettings, now: number, newShownToday: number): ForwardItem[] {
	const due: ForwardItem[] = entries
		.filter((e) => e.forward !== null && e.forward.dueAt <= now)
		.sort((a, b) => a.forward!.dueAt - b.forward!.dueAt)
		.map((e) => ({ wordId: e.wordId, kind: 'review' }));
	const fresh: ForwardItem[] = entries
		.filter((e) => e.forward === null)
		.sort((a, b) => a.addedAt - b.addedAt)
		.slice(0, newLeftToday(newShownToday, s))
		.map((e) => ({ wordId: e.wordId, kind: 'new' }));
	if (s.newOrder === 'first') return [...fresh, ...due];
	if (s.newOrder === 'last') return [...due, ...fresh];
	return interleave(due, fresh);
}

/** New words that tomorrow's forward queue will take: the daily limit, if enough words wait. */
export function newTomorrow(entries: LearningEntry[], s: QueueSettings): number {
	return Math.min(s.newPerDay, entries.filter((e) => e.forward === null).length);
}

export function clozeQueue(entries: LearningEntry[], now: number): string[] {
	return entries
		.filter((e) => e.cloze !== null && e.cloze.dueAt <= now)
		.sort((a, b) => a.cloze!.dueAt - b.cloze!.dueAt)
		.map((e) => e.wordId);
}

export interface Upcoming {
	/** Words due later today and the time until the first of them; null if none. */
	laterToday: { count: number; inMs: number } | null;
	/** Words that will be due by the end of tomorrow, later today included. */
	tomorrow: number;
}

/** Numbers for «На сегодня всё», from the due dates of one mode. */
export function upcoming(dueAts: number[], now: number): Upcoming {
	const midnight = nextMidnight(now);
	const endOfTomorrow = nextMidnight(midnight);
	const future = dueAts.filter((t) => t > now);
	const today = future.filter((t) => t < midnight);
	return {
		laterToday: today.length ? { count: today.length, inMs: Math.min(...today) - now } : null,
		tomorrow: future.filter((t) => t < endOfTomorrow).length
	};
}
