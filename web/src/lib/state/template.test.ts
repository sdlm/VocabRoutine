import { describe, expect, test } from 'vitest';
import { defaultSettings, type TemplateBlock } from './schema';
import { enabledBlocks, forwardBlocks, moveBlock, normalizeTemplate, templatePreview } from './template';

// The example from 04-review-forward.html: Примеры «Сразу», Похожие слова «Выкл».
const MOCKUP: TemplateBlock[] = [
	{ id: 'examples', mode: 'shown' },
	{ id: 'translations', mode: 'tap' },
	{ id: 'definition', mode: 'tap' },
	{ id: 'collocations', mode: 'tap' },
	{ id: 'similar', mode: 'off' }
];

describe('normalizeTemplate', () => {
	test('keeps a valid template as is', () => {
		expect(normalizeTemplate(MOCKUP)).toEqual(MOCKUP);
	});

	test('drops unknown, repeated and broken blocks, appends missing ones with defaults', () => {
		const raw = [{ id: 'similar', mode: 'shown' }, { id: 'audio', mode: 'tap' }, { id: 'similar', mode: 'off' }, { id: 'examples', mode: 'loud' }, null, 'x'];
		expect(normalizeTemplate(raw)).toEqual([
			{ id: 'similar', mode: 'shown' },
			{ id: 'translations', mode: 'tap' },
			{ id: 'definition', mode: 'tap' },
			{ id: 'examples', mode: 'tap' },
			{ id: 'collocations', mode: 'tap' }
		]);
	});

	test('anything else gives the default template', () => {
		expect(normalizeTemplate('oops')).toEqual(defaultSettings().template);
	});
});

describe('enabledBlocks', () => {
	test('drops «Выкл» and keeps the order', () => {
		expect(enabledBlocks(MOCKUP).map((b) => b.id)).toEqual(['examples', 'translations', 'definition', 'collocations']);
	});
});

describe('forwardBlocks', () => {
	test('by default only the word is shown; the first tap opens translations', () => {
		const v = forwardBlocks(defaultSettings().template, []);
		expect(v.visible).toEqual([]);
		expect(v.next?.id).toBe('translations');
		expect(v.opened).toBe(0);
		expect(v.tapCount).toBe(5);
	});

	test('«Сразу» blocks are visible at once, taps open «По тапу» blocks in order', () => {
		const v = forwardBlocks(MOCKUP, ['translations']);
		expect(v.visible.map((b) => b.id)).toEqual(['examples', 'translations']);
		expect(v.next?.id).toBe('definition');
		expect(v.opened).toBe(1);
		expect(v.tapCount).toBe(3);
	});

	test('visible blocks keep the template order', () => {
		const t: TemplateBlock[] = [
			{ id: 'translations', mode: 'tap' },
			{ id: 'examples', mode: 'shown' }
		];
		expect(forwardBlocks(t, ['translations']).visible.map((b) => b.id)).toEqual(['translations', 'examples']);
	});

	test('opened blocks stay open after the template is reordered', () => {
		const reordered = [MOCKUP[2], MOCKUP[1], MOCKUP[0], MOCKUP[3], MOCKUP[4]]; // definition first
		const v = forwardBlocks(reordered, ['translations']);
		expect(v.visible.map((b) => b.id)).toEqual(['translations', 'examples']);
		expect(v.next?.id).toBe('definition');
	});

	test('an opened block switched to «Выкл» is hidden and not counted', () => {
		const t = MOCKUP.map((b) => (b.id === 'translations' ? { ...b, mode: 'off' as const } : b));
		const v = forwardBlocks(t, ['translations']);
		expect(v.visible.map((b) => b.id)).toEqual(['examples']);
		expect(v.opened).toBe(0);
		expect(v.tapCount).toBe(2);
	});

	test('nothing left to open', () => {
		const all = ['translations', 'definition', 'collocations'];
		expect(forwardBlocks(MOCKUP, all).next).toBeNull();
		expect(forwardBlocks(MOCKUP, all).visible).toHaveLength(4);
	});
});

describe('moveBlock', () => {
	test('moves down and up without touching the input', () => {
		const ids = (t: TemplateBlock[]) => t.map((b) => b.id);
		expect(ids(moveBlock(MOCKUP, 0, 2))).toEqual(['translations', 'definition', 'examples', 'collocations', 'similar']);
		expect(ids(moveBlock(MOCKUP, 4, 0))).toEqual(['similar', 'examples', 'translations', 'definition', 'collocations']);
		expect(MOCKUP[0].id).toBe('examples');
	});
});

describe('templatePreview', () => {
	test('the mockup example', () => {
		expect(templatePreview(MOCKUP)).toBe('слово + примеры → тап: переводы → тап: определение → тап: словосочетания');
	});

	test('default: every block by tap', () => {
		expect(templatePreview(defaultSettings().template)).toBe(
			'слово → тап: переводы → тап: определение → тап: примеры → тап: словосочетания → тап: похожие слова'
		);
	});

	test('all off: only the word', () => {
		expect(templatePreview(MOCKUP.map((b) => ({ ...b, mode: 'off' as const })))).toBe('слово');
	});
});
