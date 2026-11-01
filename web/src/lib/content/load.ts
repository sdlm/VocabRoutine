import { decompress } from 'brotli/decompress';
import type { Word } from './types';

const RETRY_TEXT = 'Не удалось загрузить словарь, пробуем ещё раз…';

export interface LoadDeps {
	fetch: (url: string) => Promise<Response>;
	/** Resolves after `ms`, or sooner when the network comes back. */
	wait: (ms: number) => Promise<void>;
	/** An attempt failed; another one follows. */
	onRetry: () => void;
}

const browserDeps: LoadDeps = {
	fetch: (url) => fetch(url),
	wait: (ms) =>
		new Promise((resolve) => {
			const done = () => {
				clearTimeout(timer);
				removeEventListener('online', done);
				resolve();
			};
			const timer = setTimeout(done, ms);
			addEventListener('online', done);
		}),
	onRetry: () => {
		const boot = document.getElementById('boot');
		if (boot) boot.textContent = RETRY_TEXT;
	}
};

/** Pause before the next attempt: 1, 2, 4, 8, 16, then 30 s. */
export function retryDelay(attempt: number): number {
	return Math.min(1000 * 2 ** attempt, 30_000);
}

/** Brotli-compressed JSON array → words; plain JSON too, when the host already decoded it. Throws on anything else. */
export function decodeWords(bytes: Uint8Array): Word[] {
	// Our lgwin-24 brotli stream starts with a byte whose low nibble is 0xF, so it is never `[` (0x5B).
	const json = bytes[0] === 0x5b ? bytes : decompress(bytes);
	const words: unknown = JSON.parse(new TextDecoder().decode(json));
	if (!Array.isArray(words)) throw new Error('the dictionary holds no list');
	return words as Word[];
}

/** Fetches the dictionary until it arrives whole: the app has nothing to show without it. */
export async function loadWords(url: string, deps: LoadDeps = browserDeps): Promise<Word[]> {
	for (let attempt = 0; ; attempt++) {
		try {
			const res = await deps.fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return decodeWords(new Uint8Array(await res.arrayBuffer()));
		} catch (e) {
			console.warn('loadWords', e);
			deps.onRetry();
			await deps.wait(retryDelay(attempt));
		}
	}
}
