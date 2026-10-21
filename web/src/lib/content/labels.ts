import type { SortOrder } from '$lib/domain/search';
import type { BlockId } from '$lib/state/schema';
import { LEVELS, type Level, type Pos, type Register, type Word } from './types';

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

/** Search row: «deploy v.». */
export const POS_ABBR: Record<Pos, string> = { noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.' };

/** Filter chips and sheets. */
export const POS_CHIP: Record<Pos, string> = { noun: 'Сущ.', verb: 'Глагол', adjective: 'Прил.', adverb: 'Нареч.' };

export const REGISTER_CHIP: Record<Register, string> = {
	neutral: 'Нейтральный',
	formal: 'Формальный',
	informal: 'Разговорный',
	slang: 'Сленг'
};

export const SORT_LABEL: Record<SortOrder, string> = { freq: 'По частотности', alpha: 'А–Я', random: 'Случайно' };

/** Level chip value: «B2», a run «B2–C1», otherwise a list «A1, B2». Null when any level fits. */
export function levelsLabel(levels: readonly Level[]): string | null {
	if (levels.length === 0) return null;
	const idx = levels.map((l) => LEVELS.indexOf(l)).sort((a, b) => a - b);
	const run = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
	if (levels.length > 1 && run) return `${LEVELS[idx[0]]}–${LEVELS[idx[idx.length - 1]]}`;
	return idx.map((i) => LEVELS[i]).join(', ');
}

/** Part-of-speech chip value: «Глагол», or «Глагол +1» for several. Null when any part fits. */
export function posLabel(pos: readonly Pos[]): string | null {
	if (pos.length === 0) return null;
	return pos.length === 1 ? POS_CHIP[pos[0]] : `${POS_CHIP[pos[0]]} +${pos.length - 1}`;
}
