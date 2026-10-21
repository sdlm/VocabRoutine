import { defaultSettings, type AppState } from './schema';
import { makeSeed } from './seed';

export const STORAGE_KEY = 'vocabroutine:v1';

/**
 * Restore state saved by an earlier run. Missing, unreadable or foreign data
 * yields fresh demo data. Settings are merged over defaults, so new settings
 * added in later versions get their default values.
 */
export function parseState(json: string | null, now: number): AppState {
	if (!json) return makeSeed(now);
	try {
		const raw = JSON.parse(json);
		if (raw?.version !== 1 || typeof raw.learning !== 'object' || typeof raw.activity !== 'object') return makeSeed(now);
		const d = defaultSettings();
		const s = raw.settings ?? {};
		return {
			...raw,
			settings: {
				...d,
				...s,
				cloze: { ...d.cloze, ...s.cloze },
				queue: { ...d.queue, ...s.queue },
				template: Array.isArray(s.template) ? s.template : d.template
			}
		};
	} catch {
		return makeSeed(now);
	}
}
