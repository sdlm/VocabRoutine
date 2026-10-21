import { wordById } from '$lib/content';
import { defaultSettings, type AppState } from './schema';
import type { ClozeSession } from '$lib/domain/cloze-session';
import type { ForwardSession, ForwardStepKind } from '$lib/domain/forward-session';
import type { SessionClock } from '$lib/domain/session';
import type { LearningEntry } from '$lib/domain/types';
import { makeSeed } from './seed';
import { normalizeTemplate } from './template';

export const STORAGE_KEY = 'vocabroutine:v1';

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

function isSession(v: unknown): v is SessionClock & Record<string, unknown> {
	return (
		isObj(v) &&
		typeof v.day === 'string' &&
		typeof v.startedAt === 'number' &&
		typeof v.lastActiveAt === 'number' &&
		typeof v.elapsedMs === 'number' &&
		typeof v.total === 'number' &&
		Array.isArray(v.queue) &&
		Array.isArray(v.done)
	);
}

function isClozeSession(v: unknown): v is ClozeSession {
	return isSession(v) && (v.queue as unknown[]).every((q) => typeof q === 'string');
}

const STEP_KINDS: unknown[] = ['new', 'review', 'repeat'] satisfies ForwardStepKind[];

const isStep = (q: unknown): boolean => isObj(q) && typeof q.wordId === 'string' && STEP_KINDS.includes(q.kind);

function isForwardSession(v: unknown): v is ForwardSession {
	return isSession(v) && Array.isArray(v.revealed) && (v.queue as unknown[]).every(isStep);
}

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
		const sessions: Record<string, unknown> = isObj(raw.sessions) ? raw.sessions : {};
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
				template: normalizeTemplate(s.template)
			},
			activity: raw.activity as AppState['activity'],
			sessions: {
				forward: isForwardSession(sessions.forward) ? sessions.forward : null,
				cloze: isClozeSession(sessions.cloze) ? sessions.cloze : null
			}
		};
	} catch {
		return makeSeed(now);
	}
}
