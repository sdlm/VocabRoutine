import { dayKey } from '$lib/domain/time';
import { reachedAtLaunch } from './store.svelte';

/** «Стрик засчитан» hides this long after it appeared… */
export const GREETING_MS = 15_000;
/** …or once this many more cards opened after the one it appeared on. */
export const GREETING_CARDS = 2;

interface Greeting {
	day: string;
	/** The card on screen now; any value that changes when a new card opens. */
	card: unknown;
	cardsAfter: number;
	expired: boolean;
}

/** In memory only: a reopened app does not show the banner again. */
let greeting: Greeting | null = $state(null);
let greetedDay: string | null = reachedAtLaunch;
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * The streak banner calls this whenever its card or today's goal changes.
 * Counts cards opened after the greeting; starts the greeting the first time this run sees today's goal reached.
 */
export function noteStreakCard(card: unknown, goalReached: boolean, now: number = Date.now()): void {
	const today = dayKey(now);
	if (greeting && card !== greeting.card) {
		greeting.card = card;
		greeting.cardsAfter++;
	}
	if (!goalReached) {
		// The goal fell back below reached («Сбросить данные»): reaching it again is a new moment to greet.
		if (greetedDay === today) greetedDay = null;
		clearTimeout(timer);
		greeting = null;
		return;
	}
	if (greetedDay === today) return;
	greetedDay = today;
	clearTimeout(timer);
	greeting = { day: today, card, cardsAfter: 0, expired: false };
	timer = setTimeout(() => {
		if (greeting) greeting.expired = true;
	}, GREETING_MS);
}

export function greetingVisible(now: number = Date.now()): boolean {
	return greeting !== null && greeting.day === dayKey(now) && !greeting.expired && greeting.cardsAfter < GREETING_CARDS;
}

/** Tests: forget the greeting and what was reached at launch. */
export function resetGreeting(): void {
	clearTimeout(timer);
	greeting = null;
	greetedDay = null;
}
