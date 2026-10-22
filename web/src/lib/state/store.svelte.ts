import { newEntry } from '$lib/domain/learning';
import { bumpActivity } from '$lib/domain/streak';
import { dayKey } from '$lib/domain/time';
import { parseState, STORAGE_KEY } from './persist';
import type { AppState } from './schema';
import { makeSeed } from './seed';

function read(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

export const app: AppState = $state(parseState(read(), Date.now()));

/** Persist every change. Called once from the root layout. */
export function startPersistence(): void {
	$effect(() => {
		const json = JSON.stringify(app);
		try {
			localStorage.setItem(STORAGE_KEY, json);
		} catch {
			// Private mode or quota: the prototype keeps working in memory.
		}
	});
}

export function isLearning(wordId: string): boolean {
	return wordId in app.learning;
}

/** A second toggle of the same word sooner than this is the second tap of a double tap. */
const TOGGLE_GUARD_MS = 400;
let lastToggle = { wordId: '', at: 0 };

/**
 * Tap on a search row or «Учить»: add the word, or remove it with all its progress.
 * A double tap would remove the word and add it back as new, silently wiping the progress,
 * so a repeat toggle of the same word within 400 ms is ignored. Returns whether it toggled.
 */
export function toggleLearning(wordId: string, now: number = Date.now()): boolean {
	const sinceLast = now - lastToggle.at;
	if (wordId === lastToggle.wordId && sinceLast >= 0 && sinceLast < TOGGLE_GUARD_MS) return false;
	lastToggle = { wordId, at: now };
	if (isLearning(wordId)) delete app.learning[wordId];
	else app.learning[wordId] = newEntry(wordId, now);
	return true;
}

export function addSeconds(seconds: number): void {
	app.activity = bumpActivity(app.activity, dayKey(Date.now()), { seconds });
}

export function countForStreak(now: number = Date.now()): void {
	app.activity = bumpActivity(app.activity, dayKey(now), { counted: 1 });
}

/** «Новое слово»: counts for the streak and takes a slot of today's new-word limit. */
export function countIntroduction(now: number = Date.now()): void {
	app.activity = bumpActivity(app.activity, dayKey(now), { counted: 1, introduced: 1 });
}

/** «Новое слово» screens passed today; removing a word does not give its slot back. */
export function newShownToday(now: number = Date.now()): number {
	return app.activity[dayKey(now)]?.introduced ?? 0;
}

/** «Прототип: сбросить данные». */
export function resetDemo(): void {
	Object.assign(app, makeSeed(Date.now()));
	lastToggle = { wordId: '', at: 0 };
}
