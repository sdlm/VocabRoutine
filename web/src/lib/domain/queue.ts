import { CLOZE_THRESHOLD_MS } from './learning';
import { nextMidnight } from './time';
import type { LearningEntry, ModeProgress, QueueSettings } from './types';

export type Screen = 'forward' | 'cloze';

export interface QueueItem {
	wordId: string;
	/** 'new': not yet seen on this screen («Новое слово» in forward). */
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
 * Never seen words the screens may still take today. `slotsUsedToday` comes from the day's activity,
 * not from the entries: a word removed after its first showing keeps its slot.
 */
export function newLeftToday(slotsUsedToday: number, s: QueueSettings): number {
	return Math.max(0, s.newPerDay - slotsUsedToday);
}

const progressOn = (screen: Screen, e: LearningEntry): ModeProgress | null => (screen === 'forward' ? e.forward : e.cloze);

/** Seen anywhere: «Новое слово» passed in forward or answered in Cloze. */
const seenAnywhere = (e: LearningEntry): boolean => e.forward !== null || e.cloze !== null;

const byAdded = (a: LearningEntry, b: LearningEntry) => a.addedAt - b.addedAt;

/**
 * Words the screen may show now.
 * - Seen on this screen: comes back when due, nothing else is checked.
 * - Cloze in «После прямого»: a word not seen in Cloze needs a forward interval of at least 7 days.
 * - Not seen on this screen but seen on the other: new, takes no slot.
 * - Never seen: new, the first by adding while today's slots last. The slots are shared by both screens:
 *   a word stays new for both of them until its first showing on either one.
 * New words are placed among the reviews by `newOrder`.
 */
export function availableWords(screen: Screen, entries: LearningEntry[], s: QueueSettings, now: number, slotsUsedToday: number): QueueItem[] {
	const due: QueueItem[] = entries
		.filter((e) => {
			const p = progressOn(screen, e);
			return p !== null && p.dueAt <= now;
		})
		.sort((a, b) => progressOn(screen, a)!.dueAt - progressOn(screen, b)!.dueAt)
		.map((e) => ({ wordId: e.wordId, kind: 'review' }));
	const notHere = entries.filter(
		(e) =>
			progressOn(screen, e) === null &&
			(screen === 'forward' || s.clozeEntry === 'onAdd' || (e.forward !== null && e.forward.intervalMs >= CLOZE_THRESHOLD_MS))
	);
	const free = notHere.filter(seenAnywhere);
	const slotted = notHere.filter((e) => !seenAnywhere(e)).sort(byAdded).slice(0, newLeftToday(slotsUsedToday, s));
	const fresh: QueueItem[] = [...free, ...slotted].sort(byAdded).map((e) => ({ wordId: e.wordId, kind: 'new' }));
	if (s.newOrder === 'first') return [...fresh, ...due];
	if (s.newOrder === 'last') return [...due, ...fresh];
	return interleave(due, fresh);
}

/** New words that tomorrow's forward queue will take: the daily limit, if enough words wait. */
export function newTomorrow(entries: LearningEntry[], s: QueueSettings): number {
	return Math.min(s.newPerDay, entries.filter((e) => e.forward === null).length);
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
