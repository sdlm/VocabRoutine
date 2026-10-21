import type { ClozeSession } from '$lib/domain/cloze-session';
import { DAY } from '$lib/domain/time';
import type { Activity, LearningEntry, QueueSettings } from '$lib/domain/types';

export type BlockId = 'translations' | 'definition' | 'examples' | 'collocations' | 'similar';
/** «Сразу» / «По тапу» / «Выкл» */
export type BlockMode = 'shown' | 'tap' | 'off';

export interface TemplateBlock {
	id: BlockId;
	mode: BlockMode;
}

export interface ClozeSettings {
	answerMode: 'typing' | 'choice';
	showTranslation: boolean;
	showMeta: boolean;
	autoAdvance: boolean;
	/** Settings screen shown before the first Cloze session. */
	onboarded: boolean;
}

export type Theme = 'light' | 'dark' | 'auto';

export interface Settings {
	dailyGoal: number;
	template: TemplateBlock[];
	cloze: ClozeSettings;
	queue: QueueSettings;
	theme: Theme;
}

/** Active review sessions; null when there is none. */
export interface Sessions {
	cloze: ClozeSession | null;
}

export interface AppState {
	version: 1;
	learning: Record<string, LearningEntry>;
	settings: Settings;
	activity: Activity;
	sessions: Sessions;
}

export function defaultSettings(): Settings {
	return {
		dailyGoal: 10,
		template: [
			{ id: 'translations', mode: 'tap' },
			{ id: 'definition', mode: 'tap' },
			{ id: 'examples', mode: 'tap' },
			{ id: 'collocations', mode: 'tap' },
			{ id: 'similar', mode: 'tap' }
		],
		cloze: { answerMode: 'typing', showTranslation: true, showMeta: false, autoAdvance: false, onboarded: false },
		queue: { newPerDay: 10, newOrder: 'mixed', successFactor: 2.5, failFactor: 0.5, minIntervalMs: DAY },
		theme: 'auto'
	};
}
