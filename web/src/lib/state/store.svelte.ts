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

/** Tap on a search row: add the word, or remove it with all its progress. */
export function toggleLearning(wordId: string): void {
	if (isLearning(wordId)) delete app.learning[wordId];
	else app.learning[wordId] = newEntry(wordId, Date.now());
}

export function addSeconds(seconds: number): void {
	app.activity = bumpActivity(app.activity, dayKey(Date.now()), { seconds });
}

export function countForStreak(): void {
	app.activity = bumpActivity(app.activity, dayKey(Date.now()), { counted: 1 });
}

/** «Прототип: сбросить данные». */
export function resetDemo(): void {
	Object.assign(app, makeSeed(Date.now()));
}
