// View mode state management
// Manages the current active view mode (personal, shared, or custom category)

export type ViewMode = 'personal' | 'shared' | string; // string for custom category IDs

interface ViewModeState {
	currentMode: ViewMode;
	availableModes: ViewMode[];
}

function getInitialMode(): ViewMode {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('hiveosViewMode');
		if (stored) {
			return stored;
		}
	}
	return 'personal'; // Default to personal mode
}

function persistMode(mode: ViewMode) {
	if (typeof window !== 'undefined') {
		localStorage.setItem('hiveosViewMode', mode);
	}
}

export const viewModeState = $state<ViewModeState>({
	currentMode: getInitialMode(),
	availableModes: ['personal']
});

export function setViewMode(mode: ViewMode) {
	viewModeState.currentMode = mode;
	persistMode(mode);
}

export function getCurrentViewMode(): ViewMode {
	return viewModeState.currentMode;
}

export function addAvailableMode(mode: ViewMode) {
	if (!viewModeState.availableModes.includes(mode)) {
		viewModeState.availableModes.push(mode);
	}
}

export function setAvailableModes(modes: ViewMode[]) {
	viewModeState.availableModes = modes;
}

export function getAvailableModes(): ViewMode[] {
	return viewModeState.availableModes;
}
