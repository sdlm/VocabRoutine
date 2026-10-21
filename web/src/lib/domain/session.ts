import { dayKey } from './time';

/** Timing shared by both review sessions. */
export interface SessionClock {
	/** dayKey of the start; a session from another day is discarded. */
	day: string;
	startedAt: number;
	lastActiveAt: number;
	/** Active time; gaps longer than IDLE_CAP_MS count as IDLE_CAP_MS. */
	elapsedMs: number;
}

export const IDLE_CAP_MS = 2 * 60_000;

export function startClock(now: number): SessionClock {
	return { day: dayKey(now), startedAt: now, lastActiveAt: now, elapsedMs: 0 };
}

/** Fields to spread into a session after an action at `now`. */
export function touch(s: SessionClock, now: number): Pick<SessionClock, 'lastActiveAt' | 'elapsedMs'> {
	return { lastActiveAt: now, elapsedMs: s.elapsedMs + Math.min(Math.max(0, now - s.lastActiveAt), IDLE_CAP_MS) };
}
