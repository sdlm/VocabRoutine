import { wordById } from '$lib/content';
import { defaultSettings, type AppState } from './schema';
import type { LearningEntry } from '$lib/domain/types';
import { makeSeed } from './seed';

export const STORAGE_KEY = 'vocabroutine:v1';

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Restore state saved by an earlier run. Missing, unreadable or foreign data
 * yields fresh demo data. Settings are merged over defaults, so new settings
 * added in later versions get their default values.
 */
export function parseState(json: string | null, now: number): AppState {
	if (!json) return makeSeed(now);
	try {
		const raw = JSON.parse(json);
		if (!isObj(raw) || raw.version !== 1 || !isObj(raw.learning) || !isObj(raw.activity)) return makeSeed(now);
		const d = defaultSettings();
		const s: Record<string, any> = isObj(raw.settings) ? raw.settings : {};
		const learning: Record<string, LearningEntry> = {};
		for (const [key, value] of Object.entries(raw.learning)) {
			if (wordById.has(key) && isObj(value) && value.wordId === key) learning[key] = value as unknown as LearningEntry;
		}
		return {
			version: 1,
			learning,
			settings: {
				...d,
				...s,
				cloze: { ...d.cloze, ...s.cloze },
				queue: { ...d.queue, ...s.queue },
				template: Array.isArray(s.template) ? s.template : d.template
			},
			activity: raw.activity as AppState['activity']
		};
	} catch {
		return makeSeed(now);
	}
}
