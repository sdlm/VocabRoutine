import { describe, expect, test } from 'vitest';
import { wordById } from '$lib/content';
import { newEntry } from './learning';
import { activityTotals, findMyWords, heatLevel, heatmap, isSolid, SOLID_MS, wordCounts } from './stats';
import { DAY } from './time';
import type { Activity, LearningEntry } from './types';

function entry(id: string, addedAt: number, forwardDays: number | null, clozeDays: number | null): LearningEntry {
	return {
		...newEntry(id, addedAt),
		forward: forwardDays === null ? null : { intervalMs: forwardDays * DAY, dueAt: 0 },
		cloze: clozeDays === null ? null : { intervalMs: clozeDays * DAY, dueAt: 0 }
	};
}

const entries = [
	entry('deploy', 3, 12, 9),
	entry('house', 1, 8, 2),
	entry('cheap', 2, 3, null),
	entry('chill', 4, null, null)
];
const ids = (list: { id: string }[]) => list.map((w) => w.id);

describe('isSolid / wordCounts', () => {
	test('solid means an interval of at least 7 days in that mode', () => {
		expect(isSolid(entry('x', 0, 7, null), 'forward')).toBe(true);
		expect(isSolid({ ...entry('x', 0, null, null), forward: { intervalMs: SOLID_MS - 1, dueAt: 0 } }, 'forward')).toBe(false);
		expect(isSolid(entry('x', 0, 30, null), 'cloze')).toBe(false);
	});

	test('three independent counts', () => {
		expect(wordCounts(entries)).toEqual({ added: 4, forward: 2, cloze: 1 });
		expect(wordCounts([])).toEqual({ added: 0, forward: 0, cloze: 0 });
	});
});

describe('findMyWords', () => {
	test('newest first', () => {
		expect(ids(findMyWords(entries, 'all', '', wordById))).toEqual(['chill', 'deploy', 'cheap', 'house']);
	});

	test('filters by mode', () => {
		expect(ids(findMyWords(entries, 'forward', '', wordById))).toEqual(['deploy', 'house']);
		expect(ids(findMyWords(entries, 'cloze', '', wordById))).toEqual(['deploy']);
	});

	test('the query matches the word or a translation, ignoring case', () => {
		expect(ids(findMyWords(entries, 'all', ' DEP ', wordById))).toEqual(['deploy']);
		const ru = wordById.get('house')!.translations[0].text.slice(0, 3).toUpperCase();
		expect(ids(findMyWords(entries, 'all', ru, wordById))).toContain('house');
	});

	test('skips entries of unknown words', () => {
		expect(findMyWords([entry('nope', 1, 1, null)], 'all', '', wordById)).toEqual([]);
	});
});

describe('activityTotals', () => {
	test('days with any activity, total and average seconds', () => {
		const a: Activity = {
			'2026-10-18': { counted: 10, seconds: 600 },
			'2026-10-19': { counted: 0, seconds: 0 },
			'2026-10-20': { counted: 2, seconds: 1200 }
		};
		expect(activityTotals(a)).toEqual({ days: 2, seconds: 1800, avgSeconds: 900 });
	});

	test('empty history', () => {
		expect(activityTotals({})).toEqual({ days: 0, seconds: 0, avgSeconds: 0 });
	});
});

describe('heatmap', () => {
	test('levels: none, under 10 min, under 20 min, longer', () => {
		expect([0, 1, 599, 600, 1199, 1200].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3]);
	});

	test('56 cells, oldest first, today last', () => {
		const cells = heatmap({ '2026-10-20': { counted: 1, seconds: 900 } }, '2026-10-20');
		expect(cells).toHaveLength(56);
		expect(cells[0].key).toBe('2026-08-26');
		expect(cells[55]).toEqual({ key: '2026-10-20', seconds: 900, level: 2 });
		expect(cells[54].level).toBe(0);
	});
});
