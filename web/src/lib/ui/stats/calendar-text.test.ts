import { describe, expect, test } from 'vitest';
import type { CalendarDay } from '$lib/domain/calendar';
import { dayFacts, dayName, shortDate } from './calendar-text';

const day = (over: Partial<CalendarDay>): CalendarDay => ({ key: '2026-10-21', state: 'past', seconds: 360, counted: 12, level: 1, streakDay: null, ...over });
const texts = (d: CalendarDay, goal = 10) => dayFacts(d, goal).map((f) => f.text);

describe('dates', () => {
	test('short date and weekday', () => {
		expect(shortDate('2026-10-05')).toBe('5 окт');
		expect(shortDate('2026-05-31')).toBe('31 мая');
		expect(shortDate('2027-01-01')).toBe('1 янв');
		expect(shortDate('2026-12-31')).toBe('31 дек');
		expect(dayName('2026-10-24')).toBe('Сб, 24 окт');
		expect(dayName('2026-10-19')).toBe('Пн, 19 окт');
	});
});

describe('dayFacts', () => {
	test('a past day with the goal met, in the streak', () => {
		expect(dayFacts(day({ streakDay: 2 }), 10)).toEqual([
			{ text: '6 мин' },
			{ text: '12 слов' },
			{ text: 'цель ✓', tone: 'ok' },
			{ text: 'в стрике', tone: 'streak' }
		]);
	});

	test('a past day short of the goal', () => {
		expect(texts(day({ seconds: 1500, counted: 6 }))).toEqual(['25 мин', '6 слов', 'цель не выполнена']);
	});

	test('today short of the goal says how many words are left', () => {
		expect(texts(day({ state: 'today', seconds: 240, counted: 3 }))).toEqual(['4 мин', '3 слова', 'до цели 7 слов']);
		expect(texts(day({ state: 'today', counted: 9 }))).toContain('до цели 1 слово');
	});

	test('a goal of 0 is treated as 1, like the streak does', () => {
		expect(texts(day({ counted: 0, seconds: 0 }), 0)).toEqual(['0 мин', '0 слов', 'цель не выполнена']);
	});

	test('today with the goal met: done, in the streak', () => {
		expect(dayFacts(day({ state: 'today', counted: 10, streakDay: 0 }), 10).slice(2)).toEqual([
			{ text: 'цель ✓', tone: 'ok' },
			{ text: 'в стрике', tone: 'streak' }
		]);
	});

	test('a goal of 0 is met by a single word', () => {
		expect(texts(day({ counted: 1 }), 0)).toContain('цель ✓');
	});

	test('a missed goal is muted', () => {
		expect(dayFacts(day({ counted: 6 }), 10)[2]).toEqual({ text: 'цель не выполнена', tone: 'miss' });
		expect(dayFacts(day({ state: 'today', counted: 3 }), 10)[2]).toEqual({ text: 'до цели 7 слов', tone: 'miss' });
	});
});
