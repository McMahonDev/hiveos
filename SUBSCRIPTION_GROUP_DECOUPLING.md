# Subscription and Group Decoupling

## Overview

This document describes the changes made to completely decouple subscription tiers from group membership. Users now maintain their paid subscription status independently of their group membership.

## Key Principle

**Subscription status is personal and permanent until explicitly canceled by the user.**

Group membership and subscription tiers are now completely independent:

- Creating a group does NOT change subscription tier
- Deleting a group does NOT change subscription tier
- Joining a group does NOT change subscription tier
- Leaving a group does NOT change subscription tier
- Being removed from a group does NOT change subscription tier

## Changes Made

### 1. Group Deletion (`src/routes/account/+page.svelte` - `deleteGroup`)

**Before:**

```typescript
z?.current.mutate.user.update({
	id: userId,
	active_group_id: null,
	subscription_tier: 'free' // ❌ Incorrectly downgraded users
});
```

**After:**

```typescript
z?.current.mutate.user.update({
	id: userId,
	active_group_id: null
	// ✅ subscription_tier is NOT changed - it's independent
});
```

**Impact:** Users who delete their group keep their paid subscription and can create new groups or join other groups without re-subscribing.

---

### 2. Member Removal (`src/routes/account/groups/+page.svelte` - `removeMember`)

**Before:**

```typescript
z?.current.mutate.user.update({
	id: memberUserId,
	active_group_id: null,
	subscription_tier: 'free' // ❌ Incorrectly downgraded removed members
});
```

**After:**

```typescript
z?.current.mutate.user.update({
	id: memberUserId,
	active_group_id: null
	// ✅ subscription_tier is NOT changed - it's independent
});
```

**Impact:** Members removed from groups keep their paid subscription and can join other groups without re-subscribing.

---

### 3. Invite Validation (`src/routes/account/+page.svelte` - `inviteMember`)

**Added validation to ensure only paid users can be invited:**

```typescript
// Check if the invited user exists and has a paid subscription
const invitedUser = z?.current
	? new Query(z.current.query.user.where('email', email)).current[0]
	: null;

// Only paid users (individual or family tier) can be invited to groups
if (invitedUser) {
	const tier = invitedUser.subscription_tier;
	if (tier !== 'individual' && tier !== 'family') {
		alert(
			'Only paid users can be invited to groups. The invited user must upgrade to an Individual ($5/mo) or Family plan first.'
		);
		return;
	}
}
```

**Impact:** Group admins cannot invite free users. Invitees must have an active Individual ($5/mo) or Family plan.

---

### 4. Accept Invitation Validation (`src/routes/account/+page.svelte` - `acceptRequest`)

**Added validation to ensure only paid users can accept invitations:**

```typescript
// Check if user has a paid subscription before accepting
const currentTier = user?.current?.[0]?.subscription_tier;
if (currentTier !== 'individual' && currentTier !== 'family') {
	alert(
		'You must have a paid subscription (Individual $5/mo or Family plan) to join a group. Please upgrade your account first.'
	);
	return;
}
```

**Impact:** Free users cannot accept group invitations until they upgrade.

---

### 5. UI Updates

#### Invite Member Form

Added informational banner:

```html
<div class="info-banner">
	<strong>Note:</strong> Only paid users (Individual or Family plan) can be invited to groups. Free
	users must upgrade to Individual ($5/mo) before accepting an invitation.
</div>
```

#### Pending Invitations

Added conditional upgrade notice for free users:

```html
{#if user?.current[0]?.subscription_tier !== 'individual' && user?.current[0]?.subscription_tier !==
'family'}
<div class="info-banner">
	<strong>Upgrade Required:</strong> You must have an Individual ($5/mo) or Family plan to accept
	group invitations.
</div>
{/if}
```

#### Info Banner Styling

```css
.info-banner {
	padding: 0.875rem 1rem;
	background: rgba(255, 212, 0, 0.1);
	border-left: 3px solid var(--primary);
	border-radius: 6px;
	font-size: 0.9rem;
	color: var(--textColor);
	margin-bottom: 1rem;
	line-height: 1.5;
}
```

---

## User Flows

### Flow 1: Paid User Creates and Deletes Group

1. User with Individual plan creates a group (no member limit) ✅
2. User invites other paid members (unlimited) ✅
3. User decides to delete the group ✅
4. **Result:** User still has Individual plan, can create new groups immediately ✅

### Flow 1b: Family User Creates Group

1. User with Family plan creates a group (6 member limit) ✅
2. User invites other paid members (up to 6 total) ✅
3. Tries to invite 7th member → blocked with capacity message ❌
4. **Result:** Family groups enforce 6 member limit ✅

### Flow 2: Paid User Leaves Group

1. User with Individual plan joins Group A ✅
2. Admin removes user from Group A ✅
3. **Result:** User still has Individual plan, can join Group B immediately ✅

### Flow 3: Free User Tries to Join Group

1. Free user receives group invitation 📧
2. User tries to accept invitation ❌
3. Alert shown: "You must have a paid subscription to join a group" ❌
4. User upgrades to Individual plan ($5/mo) ✅
5. User accepts invitation ✅
6. User joins group successfully ✅

### Flow 4: Admin Tries to Invite Free User

1. Admin enters free user's email ✅
2. System checks user's subscription tier 🔍
3. Alert shown: "Only paid users can be invited to groups" ❌
4. Invitation is not sent ❌

---

## Business Logic Summary

### Subscription Requirements for Groups

| Action            | Free User         | Individual User         | Family User             |
| ----------------- | ----------------- | ----------------------- | ----------------------- |
| Create Group      | ❌ (must upgrade) | ✅ (unlimited members)  | ✅ (max 6 members)      |
| Join Group        | ❌ (must upgrade) | ✅                      | ✅                      |
| Be Invited        | ❌                | ✅                      | ✅                      |
| Accept Invitation | ❌ (must upgrade) | ✅                      | ✅                      |
| Invite Members    | N/A               | ✅ (unlimited)          | ✅ (up to capacity)     |
| Leave Group       | N/A               | ✅ (keeps subscription) | ✅ (keeps subscription) |
| Delete Own Group  | N/A               | ✅ (keeps subscription) | ✅ (keeps subscription) |
| Be Removed        | N/A               | ✅ (keeps subscription) | ✅ (keeps subscription) |

### Group Member Limits

**Individual Groups ($5/mo):**

- **No member limit** (`maxMembers: null`)
- Display: "X members" (just shows count)
- Invitations: Unlimited
- Use case: Collaboration with any number of paid users

**Family Groups ($20/mo):**

- **6 member maximum** (`maxMembers: 6`)
- Display: "X / 6" (shows progress)
- Invitations: Blocked when at capacity
- Use case: Household/family sharing with controlled size

**Other Group Types:**

- Custom limits can be set based on group type
- Validation enforced on invite and accept flows

### What Changes Subscription Tier?

**The ONLY ways subscription tier changes:**

1. ✅ User explicitly upgrades via payment flow
2. ✅ User explicitly cancels subscription via subscription management
3. ✅ Subscription expires/fails (handled by payment processor)

**What DOES NOT change subscription tier:**

1. ❌ Creating a group
2. ❌ Deleting a group
3. ❌ Joining a group
4. ❌ Leaving a group
5. ❌ Being removed from a group
6. ❌ Group being deleted by admin

---

## Migration Notes

**No database migration required** - these are code-only changes that enforce business logic.

Existing users maintain their current subscription tiers. The changes only affect the behavior when group operations occur.

---

## Testing Checklist

- [x] Delete group as group admin → subscription tier unchanged
- [x] Remove member from group → member's subscription tier unchanged
- [x] Invite free user to group → invitation blocked with clear message
- [x] Free user accepts invitation → blocked with upgrade prompt
- [x] Paid user deletes group → can create new group immediately
- [x] Paid user removed from group → can join other groups immediately

---

## Related Files

- `src/routes/account/+page.svelte` - Main account settings with group management
- `src/routes/account/groups/+page.svelte` - Detailed group management page
- `src/lib/server/subscriptions.ts` - Subscription management (unchanged, kept for reference)
- `auth-schema.ts` - User table schema with subscription_tier field

---

## Future Enhancements

1. **Subscription Management Page**: Create dedicated `/account/subscription` page for managing subscriptions independently of groups
2. **Bulk Invites**: Allow admins to invite multiple paid users at once
3. **Group Transfer**: Allow transferring group ownership between paid users
4. **Grace Period**: Consider allowing removed members a grace period before losing group access
