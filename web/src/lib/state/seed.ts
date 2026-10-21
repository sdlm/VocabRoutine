import { DAY, HOUR, dayKey, shiftDay } from '$lib/domain/time';
import type { Activity, LearningEntry } from '$lib/domain/types';
import { defaultSettings, type AppState } from './schema';

interface SeedWord {
	id: string;
	/** Forward interval in days. */
	interval: number;
	/** Forward due date relative to now, in hours (negative = overdue). */
	dueIn: number;
	/** Cloze due date relative to now, in hours; omitted = not in Cloze. */
	clozeDueIn?: number;
}

/** Words already in learning. Intervals > 5 days are in Cloze. */
const SEEN: SeedWord[] = [
	{ id: 'house', interval: 16, dueIn: -5, clozeDueIn: -2 },
	{ id: 'eat', interval: 39, dueIn: 200, clozeDueIn: -20 },
	{ id: 'borrow', interval: 6.3, dueIn: -1, clozeDueIn: -1 },
	{ id: 'journey', interval: 8, dueIn: 30, clozeDueIn: 50 },
	{ id: 'often', interval: 2.5, dueIn: -26 },
	{ id: 'cheap', interval: 1, dueIn: -3 },
	{ id: 'improve', interval: 1, dueIn: -10 },
	{ id: 'deploy', interval: 2.5, dueIn: -2 },
	{ id: 'outcome', interval: 1, dueIn: 12 },
	{ id: 'reliable', interval: 3, dueIn: 40 },
	{ id: 'purchase', interval: 0.5, dueIn: -1 },
	{ id: 'guy', interval: 4, dueIn: 70 }
];

/** Added but never shown: the forward session opens with «Новое слово». */
const FRESH = ['thorough', 'mitigate', 'chill', 'awesome'];

/** Goal reached on the 12 days before today; today is empty. */
export const SEED_STREAK = 12;

function seedActivity(today: string, goal: number): Activity {
	const a: Activity = {};
	for (let i = 1; i <= 56; i++) {
		const key = shiftDay(today, -i);
		if (i <= SEED_STREAK) a[key] = { counted: goal + (i % 4), seconds: 600 + ((i * 137) % 1500) };
		else if (i === SEED_STREAK + 1 || i % 5 === 0) continue; // gaps; the first one ends the current streak
		else a[key] = { counted: i % 3 === 0 ? goal - 4 : goal + (i % 6), seconds: 300 + ((i * 211) % 2100) };
	}
	return a;
}

export function makeSeed(now: number): AppState {
	const settings = defaultSettings();
	const learning: Record<string, LearningEntry> = {};
	SEEN.forEach((w, i) => {
		const intervalMs = w.interval * DAY;
		const dueAt = now + w.dueIn * HOUR;
		const inCloze = w.clozeDueIn !== undefined;
		learning[w.id] = {
			wordId: w.id,
			addedAt: now - (40 - i) * DAY,
			forwardIntroducedAt: now - (39 - i) * DAY,
			forward: { intervalMs, dueAt },
			clozeEnteredAt: inCloze ? now - 3 * DAY : null,
			cloze: inCloze ? { intervalMs: 2.5 * DAY, dueAt: now + w.clozeDueIn! * HOUR } : null
		};
	});
	FRESH.forEach((id, i) => {
		learning[id] = {
			wordId: id,
			addedAt: now - DAY + i * HOUR,
			forwardIntroducedAt: null,
			forward: null,
			clozeEnteredAt: null,
			cloze: null
		};
	});
	return {
		version: 1,
		learning,
		settings,
		activity: seedActivity(dayKey(now), settings.dailyGoal),
		sessions: { cloze: null }
	};
}
