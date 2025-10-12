// View preferences utility
// Manages which default lists (Events, Shopping List) appear in each view mode
// Cross-file reactive state using Svelte 5 runes

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

// Create a reactive state module that works across files
function createViewPreferencesState() {
	let preferences = $state<ViewPreferences>(DEFAULT_PREFERENCES);
	let isInitialized = $state(false);

	// Initialize from localStorage
	function init() {
		if (typeof window !== 'undefined' && !isInitialized) {
			const stored = localStorage.getItem('viewPreferences');
			if (stored) {
				try {
					preferences = JSON.parse(stored);
				} catch (e) {
					console.error('Failed to parse view preferences:', e);
				}
			}
			isInitialized = true;
		}
	}

	// Save to localStorage
	function save() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('viewPreferences', JSON.stringify(preferences));
		}
	}

	// Check if a list should be shown in a view mode
	function shouldShowList(viewMode: string, listType: ListType): boolean {
		const viewPrefs = preferences[viewMode];

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

	// Toggle a setting for a view mode
	function toggleSetting(viewMode: string, setting: 'showEvents' | 'showShoppingList') {
		if (!preferences[viewMode]) {
			preferences[viewMode] = { showEvents: true, showShoppingList: true };
		}
		preferences[viewMode][setting] = !preferences[viewMode][setting];
		save();
	}

	// Ensure a view mode has preferences initialized
	function ensureViewMode(viewMode: string) {
		if (!preferences[viewMode]) {
			preferences[viewMode] = { showEvents: true, showShoppingList: true };
			save();
		}
	}

	return {
		get preferences() {
			return preferences;
		},
		set preferences(value: ViewPreferences) {
			preferences = value;
			save();
		},
		init,
		save,
		shouldShowList,
		toggleSetting,
		ensureViewMode,
		get isInitialized() {
			return isInitialized;
		}
	};
}

// Export a single instance that will be shared across all files
export const viewPreferencesState = createViewPreferencesState();
