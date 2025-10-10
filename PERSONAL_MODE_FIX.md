# Personal vs Shared Mode Fix

## Issue

Items created in "personal" mode were being assigned to the group ID, making them visible to all group members when they switched to personal mode. Personal items should be truly personal to each user.

## Root Cause

The `assignedToId` field was always using the `groupId` regardless of the view mode. This meant:

- User 1 creates item in Personal mode → assigned to groupId
- User 2 switches to Personal mode → sees User 1's item (because they share the groupId)

## Solution

Modified the logic so that:

- **Personal Mode**: `assignedToId = user's own ID` (data.id)
- **Shared Mode**: `assignedToId = groupId`
- **Custom Modes**: `assignedToId = groupId` (treated like shared)

## Files Changed

### 1. Events Page (`src/routes/events/+page.svelte`)

**Before:**

```typescript
function assignedToId(): string {
	if (!groupid || groupid === '0') {
		return data.id;
	}
	return groupid;
}
```

**After:**

```typescript
function assignedToId(): string {
	// In personal mode, always assign to user's own ID
	// In shared mode, assign to groupId
	if (viewModeState.currentMode === 'personal') {
		return data.id;
	}
	// For shared or custom modes, use groupId
	return groupid || data.id;
}
```

### 2. Shopping List Page (`src/routes/shopping-list/+page.svelte`)

**Before:**

```typescript
assignedToId: groupid,
```

**After:**

```typescript
const assignedTo = viewModeState.currentMode === 'personal' ? data.id : (groupid || data.id);
// ...
assignedToId: assignedTo,
```

### 3. My Day Page (`src/routes/my-day/+page.svelte`)

**Before:**

```typescript
assignedToId: groupId,
```

**After:**

```typescript
const assignedTo = viewModeState.currentMode === 'personal' ? data.id : groupId;
// ...
assignedToId: assignedTo,
```

### 4. Events List Component (`src/lib/components/eventsList.svelte`)

**Query Before:**

```typescript
z.current.query.events.where('assignedToId', groupId).where('viewMode', viewModeState.currentMode);
```

**Query After:**

```typescript
const assignedId = viewModeState.currentMode === 'personal' ? data.id : groupId;

z.current.query.events
	.where('assignedToId', assignedId)
	.where('viewMode', viewModeState.currentMode);
```

### 5. Shopping List Component (`src/lib/components/shoppingList.svelte`)

**Query Before:**

```typescript
z.current.query.shoppingList
	.where('assignedToId', groupid)
	.where('viewMode', viewModeState.currentMode);
```

**Query After:**

```typescript
const assignedId = viewModeState.currentMode === 'personal' ? data.id : groupid;

z.current.query.shoppingList
	.where('assignedToId', assignedId)
	.where('viewMode', viewModeState.currentMode);
```

### 6. My Day Page Query (`src/routes/my-day/+page.svelte`)

Same pattern as events list component.

## Behavior After Fix

### Personal Mode

- User 1 creates event → `assignedToId = user1_id`, `viewMode = 'personal'`
- User 2 creates event → `assignedToId = user2_id`, `viewMode = 'personal'`
- User 1 only sees their own items
- User 2 only sees their own items
- ✅ **Items are truly personal**

### Shared Mode

- User 1 creates event → `assignedToId = groupId`, `viewMode = 'shared'`
- User 2 creates event → `assignedToId = groupId`, `viewMode = 'shared'`
- Both users see all shared items
- ✅ **Items are shared within the group**

### Custom Mode (e.g., "Work")

- User 1 creates event → `assignedToId = groupId`, `viewMode = 'work-category-id'`
- User 2 creates event → `assignedToId = groupId`, `viewMode = 'work-category-id'`
- Both users see all work items
- ✅ **Custom categories can be shared**

## Database Impact

**No schema changes required** - we're just changing how the existing `assignedToId` field is populated.

## Testing

### Test Case 1: Personal Items Stay Personal

1. User 1 logs in, switches to Personal mode
2. User 1 creates an event "Personal Meeting"
3. User 2 logs in, switches to Personal mode
4. User 2 should NOT see "Personal Meeting"
5. ✅ Pass if item is not visible

### Test Case 2: Shared Items Are Visible

1. User 1 logs in, switches to Shared mode
2. User 1 creates an event "Team Meeting"
3. User 2 logs in, switches to Shared mode
4. User 2 SHOULD see "Team Meeting"
5. ✅ Pass if item is visible

### Test Case 3: Mode Switching

1. User 1 creates item in Personal mode
2. User 1 switches to Shared mode
3. Personal item should disappear
4. User 1 switches back to Personal mode
5. Personal item should reappear
6. ✅ Pass if filtering works correctly

### Test Case 4: Custom Categories

1. User 1 creates custom category "Work"
2. User 1 switches to "Work" mode
3. User 1 creates event "Work Project"
4. User 2 logs in, creates same "Work" category
5. User 2 switches to "Work" mode
6. User 2 SHOULD see "Work Project" (shared behavior)
7. ✅ Pass if custom modes work like shared

## Verification Queries

Check database to verify correct assignedToId values:

```sql
-- Check personal mode items (should have different assignedToIds)
SELECT id, name, "assignedToId", "viewMode"
FROM events
WHERE "viewMode" = 'personal';

-- Check shared mode items (should have same groupId)
SELECT id, name, "assignedToId", "viewMode"
FROM events
WHERE "viewMode" = 'shared';
```

## Rollback

If needed, revert with:

```bash
git checkout HEAD -- src/routes/events/+page.svelte
git checkout HEAD -- src/routes/shopping-list/+page.svelte
git checkout HEAD -- src/routes/my-day/+page.svelte
git checkout HEAD -- src/lib/components/eventsList.svelte
git checkout HEAD -- src/lib/components/shoppingList.svelte
```

---

**Status**: ✅ Fixed and Ready for Testing
**Date**: December 2024
