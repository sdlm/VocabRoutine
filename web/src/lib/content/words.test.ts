import { describe, expect, test } from 'vitest';
import { parseCloze } from '$lib/domain/cloze';
import { words } from './index';
import { LEVELS, POS_LIST, REGISTERS } from './types';

const lc = (s: string) => s.toLowerCase();

describe('words.json: set', () => {
	test('has 30 words with unique ids equal to the lower-cased word', () => {
		expect(words).toHaveLength(30);
		expect(new Set(words.map((w) => w.id)).size).toBe(words.length);
		for (const w of words) expect(w.id).toBe(lc(w.word));
	});

	test('every filter value returns several words', () => {
		for (const level of LEVELS) expect(words.filter((w) => w.level === level).length, level).toBeGreaterThanOrEqual(3);
		for (const pos of POS_LIST) expect(words.filter((w) => w.pos === pos).length, pos).toBeGreaterThanOrEqual(3);
		for (const reg of REGISTERS) expect(words.filter((w) => w.register === reg).length, reg).toBeGreaterThanOrEqual(2);
	});

	test('translations go by share, largest first (search rows show the first)', () => {
		for (const w of words) {
			const shares = w.translations.map((t) => t.share);
			expect(shares, w.id).toEqual([...shares].sort((a, b) => b - a));
		}
	});

	test('no form belongs to two words', () => {
		const owner = new Map<string, string>();
		for (const w of words) {
			for (const f of [w.word, ...w.forms]) {
				const prev = owner.get(lc(f));
				expect(prev === undefined || prev === w.id, `${f}: ${prev} vs ${w.id}`).toBe(true);
				owner.set(lc(f), w.id);
			}
		}
	});
});

describe.each(words.map((w) => [w.id, w] as const))('words.json: %s', (_id, w) => {
	test('card blocks are complete', () => {
		expect(LEVELS).toContain(w.level);
		expect(POS_LIST).toContain(w.pos);
		expect(REGISTERS).toContain(w.register);
		expect(w.freqRank).toBeGreaterThan(0);
		expect(w.forms).not.toContain(w.word);
		expect(w.translations.length).toBeGreaterThanOrEqual(1);
		expect(w.translations.reduce((sum, t) => sum + t.share, 0)).toBe(100);
		expect(w.definition.length).toBeGreaterThan(10);
		expect(w.examples.length).toBeGreaterThanOrEqual(3);
		expect(w.examples.length).toBeLessThanOrEqual(4);
		expect(w.collocations.length).toBeGreaterThanOrEqual(3);
		expect(w.similar.length).toBeGreaterThanOrEqual(2);
		for (const s of w.similar) {
			expect(s.note.length).toBeGreaterThan(10);
			// The card prints «word — note», so the note must not start with the word again.
			expect(lc(s.note).startsWith(lc(s.word)), `${w.id}: ${s.note}`).toBe(false);
		}
	});

	test('cloze sentences: one gap in a known form, three distinct wrong options', () => {
		expect(w.cloze.length).toBe(5);
		const allowed = [w.word, ...w.forms].map(lc);
		for (const c of w.cloze) {
			const { answer } = parseCloze(c.en);
			expect(allowed, c.en).toContain(lc(answer));
			expect(c.ru.length).toBeGreaterThan(0);
			expect(c.options).toHaveLength(3);
			expect(new Set(c.options.map(lc)).size).toBe(3);
			expect(c.options.map(lc)).not.toContain(lc(answer));
		}
	});

	test('forms are plain words that the sentence tokenizer can link', () => {
		for (const f of [w.word, ...w.forms]) expect(f, f).toMatch(/^[A-Za-z]+(?:'[A-Za-z]+)?$/);
	});

	test('cloze sentences do not repeat the card examples', () => {
		const examples = w.examples.map((e) => lc(e.en));
		for (const c of w.cloze) {
			const { before, answer, after } = parseCloze(c.en);
			expect(examples, c.en).not.toContain(lc(before + answer + after));
		}
	});
});
