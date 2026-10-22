import { wordById } from '$lib/content';
import { applyLetterHint, choices, maxHintLetters, parseCloze } from '$lib/domain/cloze';
import {
	closeWord,
	isNewInCloze,
	outcomeResult,
	pruneSession,
	skipWord,
	startClozeSession,
	type ClozeOutcome,
	type ClozeSession
} from '$lib/domain/cloze-session';
import { gradeCloze } from '$lib/domain/learning';
import { clozeQueue } from '$lib/domain/queue';
import { dayKey } from '$lib/domain/time';
import { app, countForStreak } from './store.svelte';

/**
 * What the screen shows for one word. Kept in memory only: it survives opening
 * a card or the settings and coming back, but not a reload.
 */
export interface ClozeView {
	/** Ties the view to its session; a reset or a new session invalidates it. */
	sessionStartedAt: number;
	wordId: string;
	/** Index in word.cloze. */
	sentence: number;
	/** Answer and options, shuffled once, for «4 слова». */
	choices: string[];
	/** Letters revealed by the hint; they cannot be erased. */
	prefix: string;
	typed: string;
	hints: { translation: boolean; meta: boolean };
	/** Set once the word is closed. `picked` is the typed text or the chosen option. */
	closed: { outcome: ClozeOutcome; picked: string | null } | null;
}

export const cloze: { view: ClozeView | null } = $state({ view: null });

function inCloze(wordId: string): boolean {
	return wordById.has(wordId) && app.learning[wordId]?.cloze != null;
}

export function dueClozeWords(now: number = Date.now()): string[] {
	return clozeQueue(Object.values(app.learning), now).filter((id) => wordById.has(id));
}

/**
 * Called when the Cloze tab opens and after onboarding: drops a session from
 * another day, prunes removed words, starts a session when words are due.
 * A session that lost every word before its first answer is dropped too.
 */
export function ensureClozeSession(now: number = Date.now()): void {
	const s = app.sessions.cloze;
	if (s && s.day === dayKey(now)) {
		const pruned = pruneSession(s, inCloze);
		if (pruned.queue.length > 0 || pruned.done.length > 0) {
			if (pruned !== s) app.sessions.cloze = pruned;
			return;
		}
	}
	const queue = app.settings.cloze.onboarded ? dueClozeWords(now) : [];
	app.sessions.cloze = queue.length ? startClozeSession(queue, now) : null;
}

function newView(s: ClozeSession, wordId: string): ClozeView {
	const word = wordById.get(wordId)!;
	const sentence = Math.floor(Math.random() * word.cloze.length);
	const c = word.cloze[sentence];
	return {
		sessionStartedAt: s.startedAt,
		wordId,
		sentence,
		choices: choices(parseCloze(c.en).answer, c.options),
		prefix: '',
		typed: '',
		hints: { translation: false, meta: false },
		closed: null
	};
}

/** Make `cloze.view` match the session: keep a closed view until «Дальше», else show the current word. */
export function syncClozeView(): void {
	const s = app.sessions.cloze;
	const v = cloze.view;
	if (!s) {
		cloze.view = null;
		return;
	}
	if (v && v.sessionStartedAt === s.startedAt && (v.closed || v.wordId === s.queue[0])) return;
	cloze.view = s.queue.length ? newView(s, s.queue[0]) : null;
}

/** Close the current word: grade it, count it for the streak, record it in the session. */
export function answerCloze(outcome: ClozeOutcome, picked: string | null, now: number = Date.now()): void {
	const s = app.sessions.cloze;
	const v = cloze.view;
	if (!s || !v || v.closed || v.wordId !== s.queue[0]) return;
	const entry = app.learning[v.wordId];
	if (!entry?.cloze) {
		app.sessions.cloze = pruneSession(s, inCloze);
		cloze.view = null;
		syncClozeView();
		return;
	}
	const isNew = isNewInCloze(entry);
	app.learning[v.wordId] = gradeCloze(entry, outcomeResult(outcome), now, app.settings.queue);
	app.sessions.cloze = closeWord(s, outcome, isNew, now);
	countForStreak(now);
	if (outcome === 'correct' && app.settings.cloze.autoAdvance) {
		cloze.view = null;
		syncClozeView();
	} else {
		v.closed = { outcome, picked };
	}
}

/** «Дальше»: on an open word it is a skip (the word comes back today), on a closed one it moves on. */
export function nextCloze(now: number = Date.now()): void {
	const s = app.sessions.cloze;
	const v = cloze.view;
	if (!s || !v) return;
	if (!v.closed && s.queue[0] === v.wordId) app.sessions.cloze = skipWord(s, now);
	cloze.view = null;
	syncClozeView();
}

export function useLetterHint(): void {
	const v = cloze.view;
	if (!v || v.closed) return;
	const word = wordById.get(v.wordId)!;
	const answer = parseCloze(word.cloze[v.sentence].en).answer;
	if (v.prefix.length >= maxHintLetters(answer)) return;
	const next = applyLetterHint(answer, v.prefix, v.typed);
	v.prefix = next.prefix;
	v.typed = next.typed;
}

export function useHint(kind: 'translation' | 'meta'): void {
	if (cloze.view) cloze.view.hints[kind] = true;
}

/** «Готово» on the session summary. */
export function finishClozeSession(): void {
	app.sessions.cloze = null;
	cloze.view = null;
	ensureClozeSession();
	syncClozeView();
}
