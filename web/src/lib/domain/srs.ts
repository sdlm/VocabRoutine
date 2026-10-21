import { DAY, HOUR } from './time';
import type { Result, SrsSettings } from './types';

export function nextInterval(prevMs: number, result: Result, s: SrsSettings): number {
	const k = result === 'success' ? s.successFactor : s.failFactor;
	return Math.max(s.minIntervalMs, prevMs * k);
}

function decimal(v: number): string {
	return v.toString().replace('.', ',');
}

/** Same rules as the demo in 07-settings.html. Rounds first, then picks the unit. */
export function formatInterval(ms: number): string {
	const hours = Math.round(ms / HOUR);
	if (hours < 24) return `${hours} ч`;
	const days = Math.round(ms / DAY);
	if (days < 30) return `${days} дн`;
	const months = Math.round((ms / DAY / 30) * 10) / 10;
	if (months < 12) return `${decimal(months)} мес`;
	const years = Math.round((ms / DAY / 365) * 10) / 10;
	return `${decimal(years)} г`;
}

export function formatFactor(k: number): string {
	return `×${k.toFixed(1).replace('.', ',')}`;
}
