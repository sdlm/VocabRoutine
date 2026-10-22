/// <reference types="vite-plugin-pwa/client" />

declare global {
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
