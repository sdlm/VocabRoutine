import { beforeEach, describe, expect, test } from 'vitest';
import { newEntry } from '$lib/domain/learning';
import { DAY, dayKey, shiftDay } from '$lib/domain/time';
import {
	dueForward,
	ensureForwardSession,
	finishForwardSession,
	gradeForwardWord,
	passForwardWord,
	revealForwardBlock
} from './forward.svelte';
import { app, resetDemo } from './store.svelte';

const today = () => app.activity[dayKey(Date.now())]?.counted ?? 0;
const ids = () => app.sessions.forward!.queue.map((q) => `${q.kind}:${q.wordId}`);

function start() {
	ensureForwardSession();
	return app.sessions.forward!;
}

/** «Помню» on a card, «Дальше» on other screens. */
function answer() {
	if (app.sessions.forward!.queue[0].kind === 'review') gradeForwardWord('remember');
	else passForwardWord();
}

/** Answer screens until the current one is `kind`. */
function skipTo(kind: 'new' | 'review') {
	while (app.sessions.forward!.queue[0].kind !== kind) answer();
}

/** Answer screens until `left` remain. */
function answerUntil(left: number) {
	while (app.sessions.forward!.queue.length > left) answer();
}

beforeEach(() => {
	resetDemo();
});

describe('ensureForwardSession', () => {
	test('starts a session with the due reviews and new words', () => {
		const s = start();
		expect(s.queue).toEqual(dueForward().map(({ wordId, kind }) => ({ wordId, kind })));
		expect(s.queue.filter((q) => q.kind === 'new')).toHaveLength(4);
		expect(s.total).toBe(s.queue.length);
	});

	test('continues the session of today', () => {
		const s = start();
		gradeForwardWord('remember');
		ensureForwardSession();
		expect(app.sessions.forward!.startedAt).toBe(s.startedAt);
		expect(app.sessions.forward!.done).toHaveLength(1);
	});

	test('a session from another day is replaced', () => {
		start();
		app.sessions.forward!.day = '2000-01-01';
		app.sessions.forward!.queue = [];
		expect(start().queue.length).toBeGreaterThan(0);
	});

	test('words removed from learning are pruned', () => {
		const first = start().queue[0].wordId;
		delete app.learning[first];
		expect(start().queue.some((q) => q.wordId === first)).toBe(false);
	});

	test('a session that lost every screen before an answer is dropped', () => {
		for (const q of start().queue) delete app.learning[q.wordId];
		ensureForwardSession();
		expect(app.sessions.forward).toBeNull();
	});

	test('…and replaced by a new session when other words are waiting', () => {
		for (const q of start().queue) delete app.learning[q.wordId];
		app.learning.dope = newEntry('dope', Date.now());
		start();
		expect(ids()).toEqual(['new:dope']);
	});

	test('no session when nothing is waiting', () => {
		for (const e of Object.values(app.learning)) {
			if (e.forward) e.forward.dueAt = Date.now() + DAY;
			else delete app.learning[e.wordId];
		}
		ensureForwardSession();
		expect(app.sessions.forward).toBeNull();
	});
});

describe('gradeForwardWord', () => {
	test('«Помню» multiplies the interval and counts for the streak', () => {
		start();
		skipTo('review');
		const id = app.sessions.forward!.queue[0].wordId;
		const before = app.learning[id].forward!.intervalMs;
		gradeForwardWord('remember');
		expect(app.learning[id].forward!.intervalMs).toBe(before * 2.5);
		expect(app.sessions.forward!.done.at(-1)).toEqual({ wordId: id, grade: 'remember' });
	});

	test('«Не помню» counts for the streak and brings the word back as «Повтор»', () => {
		start();
		skipTo('review');
		const id = app.sessions.forward!.queue[0].wordId;
		const counted = today();
		gradeForwardWord('forgot');
		expect(today()).toBe(counted + 1);
		expect(ids().at(-1)).toBe(`repeat:${id}`);
	});

	test('«Повтор» does not change the interval and does not count', () => {
		start();
		skipTo('review');
		const id = app.sessions.forward!.queue[0].wordId;
		gradeForwardWord('forgot');
		const interval = app.learning[id].forward!.intervalMs;
		answerUntil(1);
		expect(ids()).toEqual([`repeat:${id}`]);
		const counted = today();
		passForwardWord();
		expect(today()).toBe(counted);
		expect(app.learning[id].forward!.intervalMs).toBe(interval);
		expect(app.sessions.forward!.queue).toEqual([]);
	});

	test('does nothing on «Новое слово»', () => {
		start();
		skipTo('new');
		const before = JSON.stringify(app.sessions.forward);
		gradeForwardWord('remember');
		expect(JSON.stringify(app.sessions.forward)).toBe(before);
	});

	test('a word removed during the session is skipped, not graded', () => {
		start();
		skipTo('review');
		const id = app.sessions.forward!.queue[0].wordId;
		delete app.learning[id];
		const counted = today();
		gradeForwardWord('remember');
		expect(today()).toBe(counted);
		expect(app.sessions.forward!.queue.some((q) => q.wordId === id)).toBe(false);
	});
});

describe('passForwardWord', () => {
	test('«Новое слово» introduces the word and counts for the streak', () => {
		start();
		skipTo('new');
		const id = app.sessions.forward!.queue[0].wordId;
		const counted = today();
		passForwardWord();
		expect(app.learning[id].forwardIntroducedAt).not.toBeNull();
		expect(app.learning[id].forward!.intervalMs).toBe(DAY);
		expect(today()).toBe(counted + 1);
		expect(app.sessions.forward!.done.at(-1)).toEqual({ wordId: id, grade: 'intro' });
	});

	test('a word removed after «Новое слово» keeps its slot in today\'s limit', () => {
		app.settings.queue.newPerDay = 1;
		start();
		skipTo('new');
		const id = app.sessions.forward!.queue[0].wordId;
		passForwardWord();
		delete app.learning[id];
		expect(dueForward().filter((i) => i.kind === 'new')).toEqual([]);
	});

	test('words introduced on another day do not take today\'s slots', () => {
		app.activity[shiftDay(dayKey(Date.now()), -1)] = { counted: 3, seconds: 60, introduced: 3 };
		app.settings.queue.newPerDay = 3;
		expect(dueForward().filter((i) => i.kind === 'new')).toHaveLength(3);
	});

	test('does nothing on a card', () => {
		start();
		skipTo('review');
		const before = JSON.stringify(app.sessions.forward);
		passForwardWord();
		expect(JSON.stringify(app.sessions.forward)).toBe(before);
	});
});

describe('revealForwardBlock', () => {
	test('opens «По тапу» blocks in template order, one per tap', () => {
		start();
		skipTo('review');
		revealForwardBlock();
		revealForwardBlock();
		expect(app.sessions.forward!.revealed).toEqual(['translations', 'definition']);
		for (let i = 0; i < 7; i++) revealForwardBlock();
		expect(app.sessions.forward!.revealed).toHaveLength(5);
		gradeForwardWord('remember');
		expect(app.sessions.forward!.revealed).toEqual([]);
	});

	test('«Выкл» and «Сразу» blocks are skipped', () => {
		app.settings.template[0].mode = 'shown'; // translations
		app.settings.template[1].mode = 'off'; // definition
		start();
		skipTo('review');
		for (let i = 0; i < 7; i++) revealForwardBlock();
		expect(app.sessions.forward!.revealed).toEqual(['examples', 'collocations', 'similar']);
	});
});

describe('finishForwardSession', () => {
	test('clears the finished session and starts a new one if words became due', () => {
		start();
		app.sessions.forward!.queue = [];
		finishForwardSession();
		// The seed words were not graded, so they are still due: a fresh session starts.
		expect(app.sessions.forward?.queue.length).toBeGreaterThan(0);
		expect(app.sessions.forward?.done).toEqual([]);
	});

	test('no session after «Готово» when nothing is waiting', () => {
		start();
		answerUntil(0);
		finishForwardSession();
		expect(app.sessions.forward).toBeNull();
	});
});
