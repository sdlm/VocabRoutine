/// <reference types="vite-plugin-pwa/client" />

declare global {
	/** `version` from package.json, set by `define` in vite.config.ts. */
	const __APP_VERSION__: string;

	namespace App {
		interface PageState {
			/** Open filter sheet on «Добавить»: a history entry, so the system «Назад» closes it. */
			sheet?: import('$lib/domain/search').SheetPart;
			/** Word card opened from «Мои слова»: its «‹» and «Учить» follow that list, not «Добавить». */
			from?: 'my-words';
		}
	}
}

export {};
