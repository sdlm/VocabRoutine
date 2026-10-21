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

/** Exact form match; only case and surrounding spaces are ignored. */
export function isCorrect(input: string, answer: string): boolean {
	return input.trim().toLowerCase() === answer.trim().toLowerCase();
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
