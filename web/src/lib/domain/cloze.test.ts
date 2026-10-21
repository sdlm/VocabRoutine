import { describe, expect, test } from 'vitest';
import { choices, isCorrect, linkWords, parseCloze } from './cloze';

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
