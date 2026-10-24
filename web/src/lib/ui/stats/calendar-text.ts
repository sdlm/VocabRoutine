import type { Calendar, CalendarDay } from '$lib/domain/calendar';
import { formatMinutes, plural, WORD_FORMS } from '$lib/format';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const parts = (key: string) => key.split('-').map(Number);

/** «12 окт»: row labels. */
export function shortDate(key: string): string {
	const [, m, d] = parts(key);
	return `${d} ${MONTHS[m - 1]}`;
}

/** «Сб, 24 окт»: the tapped day. */
export function dayName(key: string): string {
	const [y, m, d] = parts(key);
	return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${shortDate(key)}`;
}

export interface DayFact {
	text: string;
	tone?: 'ok' | 'miss' | 'streak';
}

/** The line under the calendar: minutes, words, the goal, the streak. */
export function dayFacts(d: CalendarDay, goal: number): DayFact[] {
	const g = Math.max(1, goal);
	const facts: DayFact[] = [{ text: formatMinutes(d.seconds) }, { text: `${d.counted} ${plural(d.counted, WORD_FORMS)}` }];
	if (d.counted >= g) facts.push({ text: 'цель ✓', tone: 'ok' });
	else if (d.state === 'today') facts.push({ text: `до цели ${g - d.counted} ${plural(g - d.counted, WORD_FORMS)}`, tone: 'miss' });
	else facts.push({ text: 'цель не выполнена', tone: 'miss' });
	if (d.streakDay !== null) facts.push({ text: 'в стрике', tone: 'streak' });
	return facts;
}

/** The line that replaces the streak pill when every day on the calendar is in the streak. */
export const ALL_IN_STREAK: Record<NonNullable<Calendar['allInStreak']>, string> = {
	'from-start': 'С первого занятия — ни одного пропуска',
	visible: 'Все дни на календаре — в стрике'
};
