import { describe, expect, test } from 'vitest';
import { clozeQueue, forwardQueue } from '$lib/domain/queue';
import { streakInfo } from '$lib/domain/streak';
import { CLOZE_THRESHOLD_MS } from '$lib/domain/learning';
import { dayKey } from '$lib/domain/time';
import { wordById } from '$lib/content';
import { makeSeed, SEED_STREAK } from './seed';

const NOW = new Date(2026, 9, 20, 12).getTime();
const seed = makeSeed(NOW);
const entries = Object.values(seed.learning);

describe('makeSeed', () => {
	test('uses only words from words.json', () => {
		for (const id of Object.keys(seed.learning)) expect(wordById.has(id), id).toBe(true);
	});

	test('forward queue has reviews and new words', () => {
		const q = forwardQueue(entries, seed.settings.queue, NOW);
		expect(q.filter((i) => i.kind === 'review').length).toBeGreaterThanOrEqual(5);
		expect(q.filter((i) => i.kind === 'new').length).toBe(4);
	});

	test('Cloze queue is not empty', () => {
		expect(clozeQueue(entries, NOW).length).toBeGreaterThanOrEqual(3);
	});

	test('exactly the words with forward interval > 5 days are in Cloze', () => {
		for (const e of entries) {
			const over = (e.forward?.intervalMs ?? 0) > CLOZE_THRESHOLD_MS;
			expect(e.clozeEnteredAt !== null, e.wordId).toBe(over);
		}
	});

	test('streak continues from yesterday and today is still open', () => {
		const info = streakInfo(seed.activity, seed.settings.dailyGoal, dayKey(NOW));
		expect(info.current).toBe(SEED_STREAK);
		expect(info.todayCounted).toBe(0);
		expect(info.record).toBeGreaterThanOrEqual(SEED_STREAK);
	});
});
