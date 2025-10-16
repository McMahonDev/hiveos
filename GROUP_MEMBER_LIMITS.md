# Group Member Limits Update

## Overview

Updated the group member limits to be more appropriate for different group types. Individual groups now have unlimited members, while Family groups maintain the 6-member limit.

## Changes Made

### 1. Schema Update (`src/zero-schema.ts`)

**Before:**

```typescript
maxMembers: number(), // Maximum number of members allowed
```

**After:**

```typescript
maxMembers: number().optional(), // Maximum number of members (null = unlimited for individual groups, 6 for family)
```

**Impact:** Allows `null` values for unlimited member groups (Individual tier).

---

### 2. Group Creation Logic (`src/routes/account/+page.svelte`)

**Before:**

```typescript
const maxMembers = currentTier === 'family' ? 6 : 99; // Family: 6, Individual: many
```

**After:**

```typescript
const maxMembers = currentTier === 'family' ? 6 : null; // Individual groups have no member limit (null), Family groups limited to 6
```

**Impact:** Individual groups are truly unlimited instead of having an arbitrary 99 member cap.

---

### 3. UI Display (`src/routes/account/groups/+page.svelte`)

**Before:**

```svelte
{allGroupMembers?.current?.length ?? 0} / {group.maxMembers ?? '∞'}
```

**After:**

```svelte
{#if group.maxMembers === null}
	{allGroupMembers?.current?.length ?? 0} members
{:else}
	{allGroupMembers?.current?.length ?? 0} / {group.maxMembers}
{/if}
```

**Impact:**

- Individual groups show: "5 members" (just the count)
- Family groups show: "5 / 6" (progress towards limit)

---

### 4. Invite Validation (`src/routes/account/+page.svelte`)

**Added capacity check:**

```typescript
// Check if group is at capacity (only applies to groups with maxMembers set, like family groups)
const currentGroup = group.current[0];
if (currentGroup.maxMembers !== null) {
	const currentMemberCount = allGroupMembers?.current?.length ?? 0;
	if (currentMemberCount >= currentGroup.maxMembers) {
		alert(
			`This group is at full capacity (${currentGroup.maxMembers} members). Remove a member before inviting new ones.`
		);
		return;
	}
}
```

**Impact:** Family groups cannot invite members when at capacity (6/6).

---

## Member Limit Rules by Group Type

### Individual Groups ($5/mo)

- **Member Limit:** `null` (unlimited)
- **Display:** "X members"
- **Validation:** No capacity checks when inviting
- **Use Case:** Open collaboration with any number of paid users
- **Examples:**
  - "1 member"
  - "5 members"
  - "20 members"

### Family Groups ($20/mo)

- **Member Limit:** `6`
- **Display:** "X / 6"
- **Validation:** Blocks invitations when at capacity
- **Use Case:** Household/family sharing with controlled size
- **Examples:**
  - "2 / 6"
  - "5 / 6"
  - "6 / 6" (at capacity, cannot invite more)

### Other Group Types

- Can have custom limits set during creation
- Follow same validation rules as Family groups
- `null` = unlimited, number = enforced limit

---

## Server-Side Validation

The existing server-side validation already handles `null` correctly:

```typescript
// Check if group is at capacity
if (group.maxMembers) {
	// This is falsy for null, so unlimited groups skip this check
	const memberCount = await db
		.select()
		.from(userGroupMembers)
		.where(eq(userGroupMembers.userGroupId, group.id));

	if (memberCount.length >= group.maxMembers) {
		return fail(400, { error: 'This group is at full capacity' });
	}
}
```

Files checked:

- ✅ `src/routes/account/+page.server.ts`
- ✅ `src/routes/account/register/+page.server.ts`

---

## Database Schema

The database schema already supports nullable integers:

```typescript
// Drizzle schema (src/lib/server/db/schema.ts)
maxMembers: integer('maxMembers'), // Already nullable by default in PostgreSQL
```

**No migration required** - `integer()` in Drizzle is nullable by default.

---

## Testing Scenarios

### Individual Group

1. ✅ Create Individual group → maxMembers = null
2. ✅ Invite 10 members → all accepted, no capacity warnings
3. ✅ Display shows "10 members" (not "10 / ∞")
4. ✅ Can continue inviting indefinitely

### Family Group

1. ✅ Create Family group → maxMembers = 6
2. ✅ Invite 5 members → accepted
3. ✅ Display shows "6 / 6" (including creator)
4. ✅ Try to invite 7th member → blocked with "at full capacity" message
5. ✅ Remove a member → can now invite again

### Existing Groups

- Groups created before this change with `maxMembers = 99` will continue to work
- Consider running a data migration to set Individual groups to `null`:
  ```sql
  UPDATE "userGroups"
  SET "maxMembers" = NULL
  WHERE "groupType" = 'individual' AND "maxMembers" = 99;
  ```

---

## Related Changes

This change builds on the subscription/group decoupling work:

- See `SUBSCRIPTION_GROUP_DECOUPLING.md` for context
- Member limits are enforced regardless of subscription status
- All invited/accepting members must still have paid subscriptions

---

## Future Enhancements

1. **Team Tier**: Could introduce larger team limits (50-100 members)
2. **Custom Limits**: Allow admins to set custom limits during group creation
3. **Grace Period**: Allow groups to temporarily exceed limits during transitions
4. **Analytics**: Track average group size by type for pricing optimization
