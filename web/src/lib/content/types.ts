export type Pos = 'noun' | 'verb' | 'adjective' | 'adverb';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Register = 'neutral' | 'formal' | 'informal' | 'slang';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const POS_LIST: Pos[] = ['noun', 'verb', 'adjective', 'adverb'];
export const REGISTERS: Register[] = ['neutral', 'formal', 'informal', 'slang'];

export interface ClozeSentence {
	/** Exactly one gap: "They {{deployed}} the fix overnight." */
	en: string;
	ru: string;
	/** Three wrong choices in the same grammatical form as the gap. */
	options: string[];
}

export interface Word {
	/** = word.toLowerCase() */
	id: string;
	/** Dictionary form. */
	word: string;
	/** All other forms, irregular included: deploys, deployed, deploying. */
	forms: string[];
	pos: Pos;
	level: Level;
	register: Register;
	/** Lower = more frequent; used by «по частотности». */
	freqRank: number;
	/** Shares sum to 100. */
	translations: { text: string; share: number }[];
	/** In English. */
	definition: string;
	examples: { en: string; ru: string }[];
	collocations: string[];
	/** note: when to prefer one over the other, in Russian. */
	similar: { word: string; note: string }[];
	cloze: ClozeSentence[];
}
