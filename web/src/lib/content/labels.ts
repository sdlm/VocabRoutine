import type { BlockId } from '$lib/state/schema';
import type { Pos, Register, Word } from './types';

export const POS_LABEL: Record<Pos, string> = {
	noun: 'существительное',
	verb: 'глагол',
	adjective: 'прилагательное',
	adverb: 'наречие'
};

export const REGISTER_LABEL: Record<Register, string> = {
	neutral: 'нейтральный',
	formal: 'формальный',
	informal: 'разговорный',
	slang: 'сленг'
};

export const BLOCK_LABEL: Record<BlockId, string> = {
	translations: 'Переводы',
	definition: 'Определение',
	examples: 'Примеры',
	collocations: 'Словосочетания',
	similar: 'Похожие слова'
};

/** Card tags and the Cloze «Мета» hint: part of speech · level · register. */
export function metaTags(w: Word): string[] {
	return [POS_LABEL[w.pos], w.level, REGISTER_LABEL[w.register]];
}
