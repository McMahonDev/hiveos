# View Preferences Cross-File State

This implementation provides a shared reactive state for view preferences across all Svelte components using Svelte 5's runes.

## How It Works

The `viewPreferencesState` in `src/lib/utils/viewPreferences.svelte.ts` is a **singleton state module** that uses Svelte 5's `$state` rune. This means:

1. **Single Source of Truth**: One instance is shared across all files that import it
2. **Reactive**: Changes in one component automatically update all other components
3. **Persistent**: State is saved to and loaded from localStorage

## Usage Examples

### In Settings Page

```typescript
import { viewPreferencesState } from '$lib/utils/viewPreferences.svelte';

// Initialize on mount
$effect(() => {
	viewPreferencesState.init();
});

// Toggle a setting
viewPreferencesState.toggleSetting(viewMode, 'showEvents');

// Access preferences (reactive)
const isEventsVisible = viewPreferencesState.preferences[viewMode]?.showEvents;
```

### In Layout or Other Components

```typescript
import { viewPreferencesState } from '$lib/utils/viewPreferences.svelte';

// Check if a list should be shown (reactive)
$effect(() => {
  if (!viewPreferencesState.shouldShowList(currentMode, 'events')) {
    // Handle visibility
  }
});

// Direct access to preferences (reactive)
{#if viewPreferencesState.preferences[viewMode]?.showShoppingList}
  <ShoppingList />
{/if}
```

## Key Features

- ✅ **Cross-file reactivity**: Changes propagate automatically
- ✅ **Type-safe**: Full TypeScript support with proper types
- ✅ **Persistent**: Automatically saves to localStorage
- ✅ **Lazy initialization**: Call `init()` once when needed
- ✅ **Dynamic view modes**: Automatically handles custom categories
- ✅ **Safe defaults**: Returns sensible defaults if preferences not set

## API

### Properties

- `preferences` - Get/set the full preferences object (reactive)
- `isInitialized` - Check if state has been loaded from localStorage

### Methods

- `init()` - Load preferences from localStorage (call once)
- `save()` - Manually save to localStorage (usually automatic)
- `shouldShowList(viewMode, listType)` - Check if a list type should be visible
- `toggleSetting(viewMode, setting)` - Toggle a setting and save
- `ensureViewMode(viewMode)` - Ensure a view mode has default preferences

## Files Using This State

- `/src/routes/+layout.svelte` - Sidebar visibility
- `/src/routes/+page.svelte` - Home page list visibility
- `/src/routes/settings/+page.svelte` - Settings UI
- `/src/routes/events/+page.svelte` - Events page redirect
- `/src/routes/my-day/+page.svelte` - My Day page redirect
- `/src/routes/shopping-list/+page.svelte` - Shopping list page redirect

All these files share the same state instance and react to changes automatically!
