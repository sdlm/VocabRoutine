import type { StreakInfo } from './streak';
import { shiftDay } from './time';
import type { Activity } from './types';

/** Two weeks per row. The bottom two rows (4 weeks) always show; older rows, up to 6 (12 weeks), once they hold activity. */
export const CALENDAR_MIN_ROWS = 2;
export const CALENDAR_MAX_ROWS = 6;
const ROW_DAYS = 14;

export type HeatLevel = 0 | 1 | 2 | 3;

/** Cell shade: none, under 10 min, under 20 min, longer. */
export function heatLevel(seconds: number): HeatLevel {
	if (seconds <= 0) return 0;
	if (seconds < 600) return 1;
	if (seconds < 1200) return 2;
	return 3;
}

/** `before`: earlier than the first lesson; drawn like `future`, as an empty outline. */
export type DayState = 'before' | 'past' | 'today' | 'future';

export interface CalendarDay {
	key: string;
	state: DayState;
	seconds: number;
	/** Words counted toward the daily goal. */
	counted: number;
	level: HeatLevel;
	/** Position in the current streak, 0 = its first day; null outside it. */
	streakDay: number | null;
}

export interface CalendarRow {
	/** Monday of the first of the row's two weeks. */
	start: string;
	/** 14 days, Monday to Sunday twice. */
	days: CalendarDay[];
}

export interface Calendar {
	/** Oldest first; the last row holds today. */
	rows: CalendarRow[];
	/**
	 * Every past day on the calendar since the first lesson is in the streak, so the streak pill would cover
	 * everything: it is dropped and a line says so. `from-start` when the first lesson is on the calendar.
	 */
	allInStreak: 'from-start' | 'visible' | null;
}

export interface DayRange {
	start: string;
	end: string;
}

const isActive = (a: Activity, key: string) => (a[key]?.counted ?? 0) > 0 || (a[key]?.seconds ?? 0) > 0;

/** First day with any activity, or null. */
export function firstActiveDay(activity: Activity): string | null {
	return Object.keys(activity).filter((k) => isActive(activity, k)).sort()[0] ?? null;
}

/** Monday of the week that holds `day`. */
export function weekStart(day: string): string {
	const [y, m, d] = day.split('-').map(Number);
	return shiftDay(day, -((new Date(y, m - 1, d).getDay() + 6) % 7));
}

/** Calendar days from `a` to `b`. */
function daysBetween(a: string, b: string): number {
	const utc = (k: string) => {
		const [y, m, d] = k.split('-').map(Number);
		return Date.UTC(y, m - 1, d);
	};
	return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/** The current streak as days: it ends today once today's goal is met, otherwise yesterday. */
export function streakRange(info: StreakInfo, today: string): DayRange | null {
	if (info.current === 0) return null;
	const end = info.goalReachedToday ? today : shiftDay(today, -1);
	return { start: shiftDay(end, -(info.current - 1)), end };
}

export function calendar(activity: Activity, today: string, streak: DayRange | null): Calendar {
	const first = firstActiveDay(activity);
	const bottom = shiftDay(weekStart(today), -7);
	const rowStart = (k: number) => shiftDay(bottom, -ROW_DAYS * k);
	const rowDays = (start: string) => Array.from({ length: ROW_DAYS }, (_, i) => shiftDay(start, i));

	// Up to the oldest row with activity; empty rows below it stay, so a break does not glue dates together.
	let count = CALENDAR_MIN_ROWS;
	for (let k = CALENDAR_MAX_ROWS - 1; k >= CALENDAR_MIN_ROWS; k--) {
		if (rowDays(rowStart(k)).some((key) => isActive(activity, key))) {
			count = k + 1;
			break;
		}
	}

	const day = (key: string): CalendarDay => {
		const seconds = activity[key]?.seconds ?? 0;
		const state: DayState = key > today ? 'future' : key === today ? 'today' : first === null || key < first ? 'before' : 'past';
		const inStreak = streak !== null && key >= streak.start && key <= streak.end;
		return {
			key,
			state,
			seconds,
			counted: activity[key]?.counted ?? 0,
			level: heatLevel(seconds),
			streakDay: inStreak ? daysBetween(streak.start, key) : null
		};
	};

	const rows: CalendarRow[] = [];
	for (let k = count - 1; k >= 0; k--) rows.push({ start: rowStart(k), days: rowDays(rowStart(k)).map(day) });

	// Today counts only once its goal is met; until then it neither breaks nor joins the run.
	const counted = rows.flatMap((r) => r.days).filter((d) => d.state === 'past' || (d.state === 'today' && d.streakDay !== null));
	const all = streak !== null && counted.length > 0 && counted.every((d) => d.streakDay !== null);
	const allInStreak = !all ? null : first !== null && first >= rows[0].start ? 'from-start' : 'visible';
	return { rows, allInStreak };
}
