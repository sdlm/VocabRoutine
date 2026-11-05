import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DAY } from '$lib/domain/time';
import { GREETING_MS, greetingVisible, noteStreakCard, resetGreeting } from './streak-greeting.svelte';

beforeEach(() => {
	vi.useFakeTimers();
	resetGreeting();
});
afterEach(() => vi.useRealTimers());

describe('«Стрик засчитан»', () => {
	test('shows once the goal is reached, on the card it appeared on', () => {
		noteStreakCard('a', false);
		expect(greetingVisible()).toBe(false);
		noteStreakCard('b', true);
		expect(greetingVisible()).toBe(true);
		noteStreakCard('b', true);
		expect(greetingVisible()).toBe(true);
	});

	test('hides after two more cards', () => {
		noteStreakCard('a', true);
		noteStreakCard('b', true);
		expect(greetingVisible()).toBe(true);
		noteStreakCard('c', true);
		expect(greetingVisible()).toBe(false);
	});

	test('hides after 15 seconds', () => {
		noteStreakCard('a', true);
		vi.advanceTimersByTime(GREETING_MS - 1);
		expect(greetingVisible()).toBe(true);
		vi.advanceTimersByTime(1);
		expect(greetingVisible()).toBe(false);
	});

	test('does not come back the same day', () => {
		noteStreakCard('a', true);
		vi.advanceTimersByTime(GREETING_MS);
		noteStreakCard('b', true);
		expect(greetingVisible()).toBe(false);
	});

	test('greets again after the goal fell back below reached (data reset)', () => {
		noteStreakCard('a', true);
		vi.advanceTimersByTime(GREETING_MS);
		noteStreakCard('b', false);
		noteStreakCard('c', true);
		expect(greetingVisible()).toBe(true);
	});

	test('greets again on a new day', () => {
		const now = Date.now();
		noteStreakCard('a', true, now);
		noteStreakCard('b', true, now + DAY);
		expect(greetingVisible(now + DAY)).toBe(true);
	});
});
