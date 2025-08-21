// Persistent UI state shared across the app.
// Uses Svelte 5 runes so this file must be imported from .svelte/.svelte.ts code.

// Export a reactive object so we don't reassign an exported value (Svelte restriction)
import { writable } from 'svelte/store';

// Use a standard Svelte writable store (no Svelte runes) so it's safe to access
// from any module and won't throw runtime rune errors.
export const ui = writable({ groupActive: false });

// Client-only initialization and persistence using localStorage
if (typeof window !== 'undefined') {
	const stored = localStorage.getItem('groupActive');
	if (stored !== null) ui.set({ groupActive: stored === 'true' });

	// persist changes
	ui.subscribe((v) => {
		try {
			localStorage.setItem('groupActive', String(v.groupActive));
		} catch (e) {
			// ignore storage errors (quota/disabled)
		}
	});
}

export function setGroupActive(val: boolean) {
	ui.update((s) => ({ ...s, groupActive: val }));
}

export async function getGroupActive() {
	let value: { groupActive: boolean } | undefined;
	const unsub = ui.subscribe((v) => (value = v));
	unsub();
	return value?.groupActive;
}
