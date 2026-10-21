import { dayKey } from './time';
import type { LearningEntry, QueueSettings } from './types';

export interface ForwardItem {
	wordId: string;
	kind: 'new' | 'review';
}

/** Spread `inserts` evenly between `base` items, keeping both orders. */
function interleave<T>(base: T[], inserts: T[]): T[] {
	const out: T[] = [];
	let b = 0;
	inserts.forEach((item, i) => {
		const until = Math.floor(((i + 1) * base.length) / (inserts.length + 1));
		while (b < until) out.push(base[b++]);
		out.push(item);
	});
	while (b < base.length) out.push(base[b++]);
	return out;
}

export function newLeftToday(entries: LearningEntry[], s: QueueSettings, now: number): number {
	const today = dayKey(now);
	const shown = entries.filter((e) => e.forwardIntroducedAt !== null && dayKey(e.forwardIntroducedAt) === today).length;
	return Math.max(0, s.newPerDay - shown);
}

export function forwardQueue(entries: LearningEntry[], s: QueueSettings, now: number): ForwardItem[] {
	const due: ForwardItem[] = entries
		.filter((e) => e.forward !== null && e.forward.dueAt <= now)
		.sort((a, b) => a.forward!.dueAt - b.forward!.dueAt)
		.map((e) => ({ wordId: e.wordId, kind: 'review' }));
	const fresh: ForwardItem[] = entries
		.filter((e) => e.forward === null)
		.sort((a, b) => a.addedAt - b.addedAt)
		.slice(0, newLeftToday(entries, s, now))
		.map((e) => ({ wordId: e.wordId, kind: 'new' }));
	if (s.newOrder === 'first') return [...fresh, ...due];
	if (s.newOrder === 'last') return [...due, ...fresh];
	return interleave(due, fresh);
}

export function clozeQueue(entries: LearningEntry[], now: number): string[] {
	return entries
		.filter((e) => e.cloze !== null && e.cloze.dueAt <= now)
		.sort((a, b) => a.cloze!.dueAt - b.cloze!.dueAt)
		.map((e) => e.wordId);
}
