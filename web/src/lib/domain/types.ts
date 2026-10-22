export type Result = 'success' | 'fail';

export interface SrsSettings {
	successFactor: number;
	failFactor: number;
	minIntervalMs: number;
}

export type NewOrder = 'first' | 'mixed' | 'last';

export interface QueueSettings extends SrsSettings {
	newPerDay: number;
	newOrder: NewOrder;
}

export interface ModeProgress {
	intervalMs: number;
	dueAt: number;
}

export interface LearningEntry {
	wordId: string;
	addedAt: number;
	/** First «Новое слово» screen in forward mode; null until shown. */
	forwardIntroducedAt: number | null;
	forward: ModeProgress | null;
	/** Moment the word became available for Cloze; null until then. */
	clozeEnteredAt: number | null;
	cloze: ModeProgress | null;
}

export interface DayActivity {
	/** Words counted toward the daily goal. */
	counted: number;
	/** Seconds the app was visible. */
	seconds: number;
	/** New words shown in forward mode («Новое слово»). Missing in days saved before plan 5. */
	introduced?: number;
}

/** Keyed by dayKey(). */
export type Activity = Record<string, DayActivity>;
