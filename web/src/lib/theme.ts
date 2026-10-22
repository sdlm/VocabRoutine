import type { Theme } from '$lib/state/schema';

/** Browser bar colour per scheme: the page background (--bg in app.css). */
export const THEME_COLOR = { light: '#ffffff', dark: '#000000' } as const;

/** Each theme-color tag in app.html serves one scheme through its media query; a fixed theme overrides both. */
export function themeColor(theme: Theme, scheme: 'light' | 'dark'): string {
	return THEME_COLOR[theme === 'auto' ? scheme : theme];
}

/** «Тема»: data-theme on <html> switches the tokens in app.css; «Авто» leaves it to prefers-color-scheme. */
export function applyTheme(theme: Theme): void {
	const root = document.documentElement;
	if (theme === 'auto') delete root.dataset.theme;
	else root.dataset.theme = theme;
	for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
		meta.content = themeColor(theme, meta.media.includes('dark') ? 'dark' : 'light');
	}
}
