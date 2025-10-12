// View preferences utility
// Manages which default lists (Events, Shopping List) appear in each view mode

export type ListType = 'events' | 'shoppingList';

export type ViewPreferences = {
	[viewMode: string]: {
		showEvents: boolean;
		showShoppingList: boolean;
	};
};

const DEFAULT_PREFERENCES: ViewPreferences = {
	personal: { showEvents: true, showShoppingList: true },
	shared: { showEvents: true, showShoppingList: true }
};

// Reactive state using Svelte 5 runes
class ViewPreferencesState {
	preferences = $state<ViewPreferences>(DEFAULT_PREFERENCES);

	constructor() {
		// Load from localStorage on initialization
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('viewPreferences');
			if (stored) {
				try {
					this.preferences = JSON.parse(stored);
				} catch (e) {
					console.error('Failed to parse view preferences:', e);
				}
			}
		}
	}

	save() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('viewPreferences', JSON.stringify(this.preferences));
		}
	}

	shouldShowList(viewMode: string, listType: ListType): boolean {
		const viewPrefs = this.preferences[viewMode];
		
		if (!viewPrefs) {
			// Default to showing all lists if no preference set
			return true;
		}
		
		if (listType === 'events') {
			return viewPrefs.showEvents ?? true;
		} else if (listType === 'shoppingList') {
			return viewPrefs.showShoppingList ?? true;
		}
		
		return true;
	}

	toggleSetting(viewMode: string, setting: 'showEvents' | 'showShoppingList') {
		if (!this.preferences[viewMode]) {
			this.preferences[viewMode] = { showEvents: true, showShoppingList: true };
		}
		this.preferences[viewMode][setting] = !this.preferences[viewMode][setting];
		this.save();
	}
}

export const viewPreferencesState = new ViewPreferencesState();

// Legacy functions for backwards compatibility
export function getViewPreferences(): ViewPreferences {
	return viewPreferencesState.preferences;
}

export function shouldShowList(viewMode: string, listType: ListType): boolean {
	return viewPreferencesState.shouldShowList(viewMode, listType);
}

export function saveViewPreferences(preferences: ViewPreferences): void {
	viewPreferencesState.preferences = preferences;
	viewPreferencesState.save();
}
