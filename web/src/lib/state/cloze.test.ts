import { beforeEach, describe, expect, test } from 'vitest';
import { DAY, dayKey } from '$lib/domain/time';
import { answerCloze, cloze, ensureClozeSession, nextCloze, syncClozeView, useLetterHint } from './cloze.svelte';
import { app, resetDemo } from './store.svelte';

const today = () => app.activity[dayKey(Date.now())]?.counted ?? 0;

function start() {
	ensureClozeSession();
	syncClozeView();
	return app.sessions.cloze!;
}

beforeEach(() => {
	resetDemo();
	cloze.view = null;
	app.settings.cloze.onboarded = true;
});

describe('ensureClozeSession', () => {
	test('starts a session with the due Cloze words, oldest first', () => {
		expect(start().queue).toEqual(['eat', 'house', 'borrow']);
		expect(cloze.view?.wordId).toBe('eat');
	});

	test('no session before onboarding', () => {
		app.settings.cloze.onboarded = false;
		ensureClozeSession();
		expect(app.sessions.cloze).toBeNull();
	});

	test('a session from another day is replaced', () => {
		start();
		app.sessions.cloze!.day = '2000-01-01';
		app.sessions.cloze!.queue = ['house'];
		expect(start().queue).toEqual(['eat', 'house', 'borrow']);
	});

	test('words removed from learning are pruned', () => {
		start();
		delete app.learning.house;
		expect(start().queue).toEqual(['eat', 'borrow']);
	});
});

describe('answerCloze', () => {
	test('correct: grades with the success factor, counts for the streak, shows the closed view', () => {
		start();
		answerCloze('correct', 'eaten');
		expect(app.learning.eat.cloze!.intervalMs).toBe(2.5 * 2.5 * DAY);
		expect(today()).toBe(1);
		expect(cloze.view?.closed).toEqual({ outcome: 'correct', picked: 'eaten' });
		expect(app.sessions.cloze!.queue).toEqual(['house', 'borrow']);
	});

	test('giving up is a fail and also counts for the streak', () => {
		start();
		answerCloze('gaveUp', null);
		expect(app.learning.eat.cloze!.intervalMs).toBe(1.25 * DAY);
		expect(today()).toBe(1);
		expect(cloze.view?.closed?.outcome).toBe('gaveUp');
	});

	test('auto-advance skips the result screen only for a correct answer', () => {
		app.settings.cloze.autoAdvance = true;
		start();
		answerCloze('correct', 'x');
		expect(cloze.view?.wordId).toBe('house');
		expect(cloze.view?.closed).toBeNull();
		answerCloze('wrong', 'x');
		expect(cloze.view?.wordId).toBe('house');
		expect(cloze.view?.closed?.outcome).toBe('wrong');
	});

	test('a closed word cannot be answered twice', () => {
		start();
		answerCloze('wrong', 'x');
		answerCloze('correct', 'x');
		expect(app.sessions.cloze!.done).toHaveLength(1);
		expect(today()).toBe(1);
	});
});

describe('nextCloze', () => {
	test('on an open word it is a skip: back of the queue, no streak, no grading', () => {
		start();
		const before = app.learning.eat.cloze;
		nextCloze();
		expect(app.sessions.cloze!.queue).toEqual(['house', 'borrow', 'eat']);
		expect(app.learning.eat.cloze).toEqual(before);
		expect(today()).toBe(0);
		expect(cloze.view?.wordId).toBe('house');
	});

	test('on a closed word it moves on; after the last word the view is empty (summary)', () => {
		start();
		for (let i = 0; i < 3; i++) {
			answerCloze('correct', 'x');
			nextCloze();
		}
		expect(cloze.view).toBeNull();
		expect(app.sessions.cloze!.done).toHaveLength(3);
	});
});

describe('useLetterHint', () => {
	test('reveals letters of the gap form, at most two', () => {
		start();
		const v = cloze.view!;
		useLetterHint();
		useLetterHint();
		expect(v.prefix).toHaveLength(2);
		expect(v.typed).toBe('');
	});
});
