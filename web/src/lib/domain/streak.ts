import { shiftDay } from './time';
import type { Activity, DayActivity } from './types';

export interface StreakInfo {
	current: number;
	record: number;
	todayCounted: number;
	remainingToday: number;
	goalReachedToday: boolean;
}

export function streakInfo(activity: Activity, goal: number, today: string): StreakInfo {
	const g = Math.max(1, goal); // a goal of 0 would make every day reached and the loops endless
	const reached = (key: string) => (activity[key]?.counted ?? 0) >= g;
	const todayCounted = activity[today]?.counted ?? 0;
	const goalReachedToday = todayCounted >= g;

	// Today not reached yet does not break the streak: count back from yesterday.
	let current = 0;
	let key = goalReachedToday ? today : shiftDay(today, -1);
	while (reached(key)) {
		current++;
		key = shiftDay(key, -1);
	}

	let record = 0;
	for (const k of Object.keys(activity).sort()) {
		if (!reached(k) || reached(shiftDay(k, -1))) continue; // only start at the beginning of a run
		let run = 0;
		let r = k;
		while (reached(r)) {
			run++;
			r = shiftDay(r, 1);
		}
		record = Math.max(record, run);
	}

	return { current, record, todayCounted, remainingToday: Math.max(0, g - todayCounted), goalReachedToday };
}

/** Returns a new Activity with `delta` added to the given day. */
export function bumpActivity(activity: Activity, key: string, delta: Partial<DayActivity>): Activity {
	const prev = activity[key] ?? { counted: 0, seconds: 0 };
	const day: DayActivity = { counted: prev.counted + (delta.counted ?? 0), seconds: prev.seconds + (delta.seconds ?? 0) };
	const introduced = (prev.introduced ?? 0) + (delta.introduced ?? 0);
	if (introduced > 0) day.introduced = introduced;
	return { ...activity, [key]: day };
}
