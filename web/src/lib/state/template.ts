import { BLOCK_LABEL } from '$lib/content/labels';
import { defaultSettings, type BlockId, type BlockMode, type TemplateBlock } from './schema';

const MODES: BlockMode[] = ['shown', 'tap', 'off'];

/**
 * Template read from storage: unknown or repeated blocks and bad modes are dropped,
 * blocks missing from it are appended with their default mode.
 */
export function normalizeTemplate(raw: unknown): TemplateBlock[] {
	const defaults = defaultSettings().template;
	const known = new Set<string>(defaults.map((b) => b.id));
	const out: TemplateBlock[] = [];
	for (const b of Array.isArray(raw) ? raw : []) {
		if (b === null || typeof b !== 'object') continue;
		const { id, mode } = b as Record<string, unknown>;
		if (typeof id !== 'string' || !known.has(id) || out.some((o) => o.id === id)) continue;
		if (!MODES.includes(mode as BlockMode)) continue;
		out.push({ id: id as BlockId, mode: mode as BlockMode });
	}
	for (const d of defaults) if (!out.some((o) => o.id === d.id)) out.push({ ...d });
	return out;
}

/** Outside the forward review every enabled block is open. */
export function enabledBlocks(t: TemplateBlock[]): TemplateBlock[] {
	return t.filter((b) => b.mode !== 'off');
}

export interface ForwardBlocks {
	/** «Сразу» blocks and the opened «По тапу» blocks, in template order. */
	visible: TemplateBlock[];
	/** The block the next tap opens: the first «По тапу» block not opened yet; null when all are open. */
	next: TemplateBlock | null;
	/** «По тапу» blocks opened so far. */
	opened: number;
	/** Number of «По тапу» blocks. */
	tapCount: number;
}

export function forwardBlocks(t: TemplateBlock[], revealed: readonly string[]): ForwardBlocks {
	const tap = t.filter((b) => b.mode === 'tap');
	const isOpen = (b: TemplateBlock) => revealed.includes(b.id);
	return {
		visible: t.filter((b) => b.mode === 'shown' || (b.mode === 'tap' && isOpen(b))),
		next: tap.find((b) => !isOpen(b)) ?? null,
		opened: tap.filter(isOpen).length,
		tapCount: tap.length
	};
}

/** New template with the block at `from` moved to `to`. */
export function moveBlock(t: TemplateBlock[], from: number, to: number): TemplateBlock[] {
	const out = [...t];
	const [b] = out.splice(from, 1);
	out.splice(to, 0, b);
	return out;
}

const name = (b: TemplateBlock) => BLOCK_LABEL[b.id].toLowerCase();

/** «слово + примеры → тап: переводы → тап: определение» */
export function templatePreview(t: TemplateBlock[]): string {
	const shown = t.filter((b) => b.mode === 'shown').map(name);
	const tap = t.filter((b) => b.mode === 'tap').map((b) => `тап: ${name(b)}`);
	return [['слово', ...shown].join(' + '), ...tap].join(' → ');
}
