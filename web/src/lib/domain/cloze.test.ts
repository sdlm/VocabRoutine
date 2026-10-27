import { describe, expect, test } from 'vitest';
import { applyLetterHint, choices, isCorrect, linkWords, maxHintLetters, parseCloze, typingState } from './cloze';

describe('parseCloze', () => {
	test('splits around the single gap', () => {
		expect(parseCloze('They {{deployed}} the fix overnight.')).toEqual({
			before: 'They ',
			answer: 'deployed',
			after: ' the fix overnight.'
		});
	});
	test('rejects zero or several gaps', () => {
		expect(() => parseCloze('No gap here.')).toThrow();
		expect(() => parseCloze('{{a}} and {{b}}')).toThrow();
	});
});

describe('isCorrect', () => {
	test('requires the exact form', () => {
		expect(isCorrect('deployed', 'deployed')).toBe(true);
		expect(isCorrect('deploy', 'deployed')).toBe(false);
	});
	test('ignores case and surrounding spaces', () => {
		expect(isCorrect('  Deployed ', 'deployed')).toBe(true);
	});
	test('treats typographic apostrophes and repeated spaces as equal', () => {
		expect(isCorrect('don’t', "don't")).toBe(true);
		expect(isCorrect('a  b', 'a b')).toBe(true);
	});
	test('any typo is an error', () => {
		expect(isCorrect('deplyed', 'deployed')).toBe(false);
	});
});

describe('typingState', () => {
	test('empty field is neutral', () => {
		expect(typingState('', 'deploy')).toBe('empty');
		expect(typingState('  ', 'deploy')).toBe('empty');
	});
	test('a prefix of the answer is on track', () => {
		expect(typingState('d', 'deploy')).toBe('ok');
		expect(typingState('de', 'deploy')).toBe('ok');
		expect(typingState('deploy', 'deploy')).toBe('ok');
	});
	test('a letter off the answer is wrong', () => {
		expect(typingState('des', 'deploy')).toBe('bad');
		expect(typingState('deploys', 'deploy')).toBe('bad');
	});
	test('trailing spaces after the full answer are fine', () => {
		expect(typingState('deploy ', 'deploy')).toBe('ok');
		expect(typingState('deploy  ', 'deploy')).toBe('ok');
	});
	test('a space inside a word is wrong', () => {
		expect(typingState('dep ', 'deploy')).toBe('bad');
	});
	test('multi-word answers accept the space between words', () => {
		expect(typingState('set ', 'set up')).toBe('ok');
		expect(typingState('set  u', 'set up')).toBe('ok');
		expect(typingState('set x', 'set up')).toBe('bad');
	});
	test('ignores case and typographic apostrophes', () => {
		expect(typingState('Don’', "don't")).toBe('ok');
	});
});

describe('choices', () => {
	test('contains the answer and all options exactly once', () => {
		const c = choices('deployed', ['installed', 'released', 'launched'], () => 0.3);
		expect([...c].sort()).toEqual(['deployed', 'installed', 'launched', 'released']);
	});
});

describe('linkWords', () => {
	const index = new Map([
		['deploy', 'deploy'],
		['deployed', 'deploy'],
		['servers', 'server']
	]);
	test('links base and inflected forms, merges plain text', () => {
		expect(linkWords('We deployed new servers today.', index)).toEqual([
			{ text: 'We ', wordId: null },
			{ text: 'deployed', wordId: 'deploy' },
			{ text: ' new ', wordId: null },
			{ text: 'servers', wordId: 'server' },
			{ text: ' today.', wordId: null }
		]);
	});
	test('matching ignores case', () => {
		expect(linkWords('Deploy it', index)[0]).toEqual({ text: 'Deploy', wordId: 'deploy' });
	});
});

describe('letter hint', () => {
	test('at most two letters, never the whole word', () => {
		expect(maxHintLetters('deployed')).toBe(2);
		expect(maxHintLetters('go')).toBe(1);
	});
	test('first letter into an empty field', () => {
		expect(applyLetterHint('deployed', '', '')).toEqual({ prefix: 'd', typed: '' });
	});
	test('second letter keeps typing that agrees with the prefix', () => {
		expect(applyLetterHint('deployed', 'd', 'epl')).toEqual({ prefix: 'de', typed: 'pl' });
	});
	test('typing that contradicts the prefix is cleared', () => {
		expect(applyLetterHint('deployed', '', 'xyz')).toEqual({ prefix: 'd', typed: '' });
	});
});
