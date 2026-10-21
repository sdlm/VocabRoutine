import { DAY } from './time';
import type { Result, SrsSettings } from './types';

export function nextInterval(prevMs: number, result: Result, s: SrsSettings): number {
	const k = result === 'success' ? s.successFactor : s.failFactor;
	return Math.max(s.minIntervalMs, prevMs * k);
}

function decimal(v: number): string {
	return (Math.round(v * 10) / 10).toString().replace('.', ',');
}

/** Same rules as the demo in 07-settings.html. */
export function formatInterval(ms: number): string {
	const d = ms / DAY;
	if (d < 1) return `${Math.round(d * 24)} ч`;
	if (d < 30) return `${Math.round(d)} дн`;
	if (d < 365) return `${decimal(d / 30)} мес`;
	return `${decimal(d / 365)} г`;
}

export function formatFactor(k: number): string {
	return `×${k.toFixed(1).replace('.', ',')}`;
}
