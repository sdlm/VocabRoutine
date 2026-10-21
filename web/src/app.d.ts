/// <reference types="vite-plugin-pwa/client" />

declare global {
	namespace App {
		interface PageState {
			/** Open filter sheet on «Добавить»: a history entry, so the system «Назад» closes it. */
			sheet?: 'all' | 'levels' | 'pos';
		}
	}
}

export {};
