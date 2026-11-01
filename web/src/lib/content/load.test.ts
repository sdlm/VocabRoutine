import { brotliCompressSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { decodeWords, loadWords, retryDelay, type LoadDeps } from './load';

const WORDS = [{ id: 'go', word: 'go' }, { id: 'идти', word: 'идти' }];
// A plain Uint8Array copy: `Response` and the DOM types want an ArrayBuffer-backed view, not a Node Buffer.
const BR = new Uint8Array(brotliCompressSync(Buffer.from(JSON.stringify(WORDS))));

const ok = (body: Uint8Array<ArrayBuffer>) => new Response(body, { status: 200 });

/** Answers fetches in order and records every wait, retry and reload request. */
function fakeDeps(...responses: (Response | Error)[]) {
	const waits: number[] = [];
	const reloads: string[] = [];
	let retries = 0;
	const deps: LoadDeps = {
		fetch: async () => {
			const next = responses.shift();
			if (!next) throw new Error('no more responses');
			if (next instanceof Error) throw next;
			return next;
		},
		wait: async (ms) => void waits.push(ms),
		onRetry: () => void retries++,
		reloadOnce: (url) => void reloads.push(url)
	};
	return { deps, waits, reloads, retries: () => retries };
}

describe('decodeWords', () => {
	test('brotli bytes come back as the same words, Cyrillic included', () => {
		expect(decodeWords(BR)).toEqual(WORDS);
	});

	test('plain JSON bytes, already decoded by the host, come back as the same words', () => {
		expect(decodeWords(new TextEncoder().encode(JSON.stringify(WORDS)))).toEqual(WORDS);
	});

	test('garbage throws', () => {
		expect(() => decodeWords(new TextEncoder().encode('<html>404</html>'))).toThrow();
	});

	test('valid JSON that is not a list throws', () => {
		expect(() => decodeWords(brotliCompressSync(Buffer.from('{}')))).toThrow();
	});
});

describe('retryDelay', () => {
	test('doubles from 1 s and stops at 30 s', () => {
		expect([0, 1, 2, 3, 4, 5, 6, 20].map(retryDelay)).toEqual([
			1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000
		]);
	});
});

describe('loadWords', () => {
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('the first good answer needs no retry', async () => {
		const f = fakeDeps(ok(BR));
		expect(await loadWords('words.br', f.deps)).toEqual(WORDS);
		expect(f.retries()).toBe(0);
		expect(f.waits).toEqual([]);
	});

	test('a network error is retried', async () => {
		const f = fakeDeps(new TypeError('Failed to fetch'), ok(BR));
		expect(await loadWords('words.br', f.deps)).toEqual(WORDS);
		expect(f.retries()).toBe(1);
		expect(f.waits).toEqual([1000]);
	});

	test('an HTTP error is retried', async () => {
		const f = fakeDeps(new Response('nope', { status: 404 }), ok(BR));
		expect(await loadWords('words.br', f.deps)).toEqual(WORDS);
		expect(f.retries()).toBe(1);
		expect(f.waits).toEqual([1000]);
	});

	test('a missing file asks to reload with its URL, then keeps retrying', async () => {
		const f = fakeDeps(new Response('gone', { status: 404 }), ok(BR));
		expect(await loadWords('words.br', f.deps)).toEqual(WORDS);
		expect(f.reloads).toEqual(['words.br']);
		expect(f.retries()).toBe(1);
	});

	test('a server error or a network error does not ask to reload', async () => {
		const f = fakeDeps(new Response('oops', { status: 500 }), new TypeError('Failed to fetch'), ok(BR));
		expect(await loadWords('words.br', f.deps)).toEqual(WORDS);
		expect(f.reloads).toEqual([]);
		expect(f.retries()).toBe(2);
	});

	test('a broken file is retried', async () => {
		const f = fakeDeps(ok(BR.subarray(0, BR.length - 3)), ok(BR));
		expect(await loadWords('words.br', f.deps)).toEqual(WORDS);
		expect(f.retries()).toBe(1);
		expect(f.waits).toEqual([1000]);
	});

	test('it keeps trying with growing pauses', async () => {
		const fail = () => new TypeError('Failed to fetch');
		const f = fakeDeps(fail(), fail(), fail(), fail(), fail(), fail(), fail(), ok(BR));
		expect(await loadWords('words.br', f.deps)).toEqual(WORDS);
		expect(f.retries()).toBe(7);
		expect(f.waits).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
	});
});
