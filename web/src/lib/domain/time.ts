export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Local calendar day as 'YYYY-MM-DD'. Day boundary is local midnight. */
export function dayKey(ts: number): string {
	const d = new Date(ts);
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${m}-${day}`;
}

/** Shift a day key by n calendar days (DST-safe). */
export function shiftDay(key: string, n: number): string {
	const [y, m, d] = key.split('-').map(Number);
	return dayKey(new Date(y, m - 1, d + n).getTime());
}

/** Start of the next local day. */
export function nextMidnight(ts: number): number {
	const d = new Date(ts);
	return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}
