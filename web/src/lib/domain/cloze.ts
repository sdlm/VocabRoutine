export interface ParsedCloze {
	before: string;
	answer: string;
	after: string;
}

const GAP = /\{\{([^}]+)\}\}/g;

export function parseCloze(en: string): ParsedCloze {
	const gaps = [...en.matchAll(GAP)];
	if (gaps.length !== 1) throw new Error(`Cloze must have exactly one {{gap}}: ${en}`);
	const m = gaps[0];
	return { before: en.slice(0, m.index), answer: m[1], after: en.slice(m.index! + m[0].length) };
}

/** Case, surrounding/repeated spaces and typographic apostrophes (iOS Smart Punctuation) are ignored. */
function normalize(s: string): string {
	return s.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
}

/** Exact form match after normalization. */
export function isCorrect(input: string, answer: string): boolean {
	return normalize(input) === normalize(answer);
}

export type TypingState = 'empty' | 'ok' | 'bad';

/**
 * Live feedback while typing: 'ok' while the input is still a prefix of the answer
 * (trailing spaces after the full answer are fine), 'bad' once it strays.
 */
export function typingState(input: string, answer: string): TypingState {
	const s = input.trimStart().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
	if (!s) return 'empty';
	const a = normalize(answer);
	return a.startsWith(s) || s.trimEnd() === a ? 'ok' : 'bad';
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
	const a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export function choices(answer: string, options: string[], rng: () => number = Math.random): string[] {
	return shuffle([answer, ...options], rng);
}

export interface Segment {
	text: string;
	/** Card to open on tap; null for plain text. */
	wordId: string | null;
}

/** Split text into tappable words (known to formIndex) and plain text. */
export function linkWords(text: string, formIndex: Map<string, string>): Segment[] {
	const out: Segment[] = [];
	for (const part of text.split(/([A-Za-z]+(?:'[A-Za-z]+)?)/)) {
		if (!part) continue;
		const wordId = formIndex.get(part.toLowerCase()) ?? null;
		const last = out[out.length - 1];
		if (!wordId && last && !last.wordId) last.text += part;
		else out.push({ text: part, wordId });
	}
	return out;
}

/** How many letters the «1-я буква» / «2-я буква» hint may reveal. */
export function maxHintLetters(answer: string): number {
	return Math.min(2, Math.max(0, answer.length - 1));
}

/**
 * Reveal one more letter of the answer as a locked prefix. What the user typed
 * is kept when it agrees with the new prefix, otherwise it is cleared.
 */
export function applyLetterHint(answer: string, prefix: string, typed: string): { prefix: string; typed: string } {
	const next = answer.slice(0, prefix.length + 1);
	const full = prefix + typed;
	return { prefix: next, typed: full.toLowerCase().startsWith(next.toLowerCase()) ? full.slice(next.length) : '' };
}
