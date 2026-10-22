import { describe, expect, test } from 'vitest';
import { isTextField, windowSqueeze } from './keyboard.svelte';

const el = (tagName: string, type = '') => ({ tagName, type }) as unknown as Element;

describe('isTextField', () => {
	test('text inputs and textareas bring up the keyboard', () => {
		expect(isTextField(el('INPUT', 'text'))).toBe(true);
		expect(isTextField(el('INPUT', 'search'))).toBe(true);
		expect(isTextField(el('TEXTAREA'))).toBe(true);
	});

	test('switches, checkboxes, buttons and nothing do not', () => {
		expect(isTextField(el('INPUT', 'checkbox'))).toBe(false);
		expect(isTextField(el('INPUT', 'radio'))).toBe(false);
		expect(isTextField(el('BUTTON'))).toBe(false);
		expect(isTextField(null)).toBe(false);
	});
});

describe('windowSqueeze', () => {
	test('the window much shorter than its tallest height while typing', () => {
		const squeezed = windowSqueeze();
		expect(squeezed(400, 800, false)).toBe(false);
		expect(squeezed(400, 500, true)).toBe(true);
		expect(squeezed(400, 500, false)).toBe(false);
		expect(squeezed(400, 700, true)).toBe(false); // 100 px: a toolbar, not the keyboard
	});

	test('rotating with the keyboard up: open until the window grows', () => {
		const squeezed = windowSqueeze();
		squeezed(400, 800, false);
		expect(squeezed(400, 500, true)).toBe(true);
		expect(squeezed(800, 150, true)).toBe(true); // new width, first height already squeezed
		expect(squeezed(800, 150, true)).toBe(true);
		expect(squeezed(800, 380, true)).toBe(false); // keyboard hidden, focus kept
		expect(squeezed(800, 150, true)).toBe(true); // and shown again
	});

	test('rotating without typing records the full height', () => {
		const squeezed = windowSqueeze();
		squeezed(400, 800, false);
		expect(squeezed(800, 380, false)).toBe(false);
		expect(squeezed(800, 380, true)).toBe(false);
	});

	test('focus lost after rotating ends the assumption', () => {
		const squeezed = windowSqueeze();
		squeezed(400, 800, false);
		squeezed(800, 150, true);
		expect(squeezed(800, 150, false)).toBe(false);
	});
});
