# View Mode Feature Documentation

## Overview

The View Mode feature allows users to organize and filter their events, shopping lists, and custom lists into different categories without affecting who has access to the data. This is useful for separating personal items from shared group items, or organizing work-related items separately.

## Key Concepts

### View Modes

There are three types of view modes:

1. **Personal** - Default mode. Shows items marked as personal.
2. **Shared** - Available when user is in a group. Shows items marked as shared.
3. **Custom Categories** - User-defined categories (e.g., "Work", "Family", "Projects")

### How It Works

- **Data Access**: View modes only affect what data is _displayed_, not who can access it. The underlying permission system (based on groups and assignedToId) remains unchanged.
- **Persistence**: The current view mode is stored in localStorage and persists across sessions.
- **Filtering**: All queries for events, shopping lists, and custom lists are filtered by the current active view mode.

## User Interface

### View Mode Dropdown

Located in the header, the dropdown shows:

- Current active mode
- Available modes (Personal, Shared if in group, custom categories)
- Option to add new custom categories

### Adding Custom Categories

1. Click the view mode dropdown
2. Click "+ Add Category"
3. Enter a name (e.g., "Work", "Projects")
4. Click "Create"

## Technical Implementation

### Database Schema Changes

#### New Table: `viewModeCategories`

```sql
CREATE TABLE "viewModeCategories" (
  "id" text PRIMARY KEY,
  "name" text,
  "userId" text,
  "createdAt" timestamp
);
```

#### Modified Tables

Added `viewMode` column to:

- `events`
- `shoppingList`
- `customLists`
- `customListItems`

### State Management

File: `src/lib/state/viewMode.svelte.ts`

Exports:

- `viewModeState` - Reactive state object
- `setViewMode(mode)` - Switch to a different view mode
- `getCurrentViewMode()` - Get the active mode
- `getAvailableModes()` - Get all available modes for current user

### Components

#### ViewModeDropdown Component

File: `src/lib/components/viewModeDropdown.svelte`

Features:

- Displays current mode
- Lists available modes
- Modal for creating new categories
- Auto-updates when group membership changes

### Query Filtering

All data queries now include view mode filtering:

```typescript
// Example: Events query
events = new Query(
	z.current.query.events
		.where('assignedToId', groupId)
		.where('viewMode', viewModeState.currentMode)
		.orderBy('createdAt', 'asc')
);
```

### Insert Operations

All new items are tagged with the current view mode:

```typescript
// Example: Creating an event
z.current.mutate.events.insert({
	// ... other fields
	viewMode: viewModeState.currentMode
});
```

## Migration Guide

### For Existing Data

Run the data migration to set default view modes:

```bash
# Apply the default viewMode migration
psql -d your_database < drizzle/0012_set_default_viewmode.sql
```

This sets all existing items to 'personal' mode.

### For Zero Sync

After schema changes, regenerate permissions:

```bash
pnpm zero-deploy-permissions -p './src/zero-schema.ts'
```

## Usage Examples

### Switching Between Modes

Users can easily switch between modes to:

- View personal items only (default)
- View shared group items
- View work-related items (custom category)
- View family items (custom category)

### Creating Items in Different Modes

1. Switch to desired mode (e.g., "Work")
2. Create events, lists, or items
3. They're automatically tagged with "Work" mode
4. Switch to "Personal" - work items are hidden
5. Switch back to "Work" - work items reappear

## Architecture Decisions

### Why View Modes vs. Separate Lists?

**View Modes Approach (Implemented)**:

- ✅ Clean, unified interface
- ✅ Easy mode switching
- ✅ Items stay with the same permission/group structure
- ✅ Users can organize without complex permissions

**Separate Lists Approach**:

- ❌ More complex UI with multiple list views
- ❌ Harder to reorganize items
- ❌ Potential confusion about which list to use

### Data Integrity

- View modes are stored as strings for flexibility
- Built-in modes: 'personal', 'shared'
- Custom modes: stored as category IDs (nanoid)
- Invalid/deleted categories gracefully degrade to showing no items

## Future Enhancements

Potential improvements:

1. **Move items between modes** - UI to change viewMode of existing items
2. **Color coding** - Different colors for different modes
3. **Mode-specific settings** - Different default values per mode
4. **Shared custom categories** - Team-wide custom categories
5. **Mode templates** - Pre-configured category sets

## Troubleshooting

### Items not appearing after mode switch

1. Check that items were created with the current mode
2. Verify localStorage has correct mode: `localStorage.getItem('hiveosViewMode')`
3. Check browser console for query errors

### Mode dropdown not showing shared option

- Verify user is in a group
- Check `data.groupId !== data.id` in the component

### Custom categories not persisting

- Check Zero sync is working
- Verify `viewModeCategories` table exists in database
- Check browser console for insert errors

## API Reference

### State Functions

```typescript
// Get current mode
const mode = getCurrentViewMode(); // 'personal' | 'shared' | string

// Set mode
setViewMode('work-category-id');

// Get available modes
const modes = getAvailableModes(); // ['personal', 'shared', 'work-id']

// Add new mode to available list
addAvailableMode('new-category-id');
```

### Component Props

```typescript
// ViewModeDropdown.svelte
interface Props {
	data: {
		auth: boolean;
		id: string;
		groupId: string;
		z: Z<Schema>;
	};
}
```
