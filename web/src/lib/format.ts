/** Russian plural: plural(3, WORD_FORMS) → 'слова'. */
export function plural(n: number, forms: readonly [string, string, string]): string {
	const n10 = n % 10;
	const n100 = n % 100;
	if (n10 === 1 && n100 !== 11) return forms[0];
	if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
	return forms[2];
}

export const WORD_FORMS = ['слово', 'слова', 'слов'] as const;
export const DAY_FORMS = ['день', 'дня', 'дней'] as const;

/** Time in the app: «23 ч»; under an hour «45 мин». */
export function formatTotalTime(seconds: number): string {
	const minutes = Math.round(seconds / 60);
	return minutes >= 60 ? `${Math.round(seconds / 3600)} ч` : `${minutes} мин`;
}

/** «16 мин». */
export function formatMinutes(seconds: number): string {
	return `${Math.round(seconds / 60)} мин`;
}

/** Session time as m:ss. */
export function formatDuration(ms: number): string {
	const total = Math.round(ms / 1000);
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
