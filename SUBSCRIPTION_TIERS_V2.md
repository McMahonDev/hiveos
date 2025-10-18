# Subscription Tier System - Updated Architecture

## Overview

Simplified three-tier system where subscription tiers are **separate from group membership**. Users can collaborate based on their personal subscription level.

## The Three Tiers

### 1. Free Tier ($0/month)

**Personal subscription:**

- Solo user only
- Limited data storage
- Single device
- Cannot create groups
- Cannot collaborate with others

**If invited to family group:**

- Joins as free member via access code
- Gets access to that specific family group
- Still "free" tier personally
- Can use group features while in group

### 2. Individual Tier ($5/month)

**Personal subscription:**

- Unlimited data storage
- Multiple devices
- **Can create groups**
- **Can invite other $5 users to groups**
- Real-time collaboration
- Priority support

**Group behavior:**

- Creates "individual" type groups
- Can invite unlimited other individual ($5) users
- All members must be paying $5/month individually
- No access codes (direct invites only)

### 3. Family Tier ($20/month)

**Personal subscription:**

- Everything from Individual tier
- **Can create family groups (up to 6 members)**
- **Generate access codes**
- **Invited family members get FREE access**
- Manage all family members

**Group behavior:**

- Creates "family" type groups
- Can have up to 6 total members
- Generates access codes for family members
- Family members join for free (don't pay $5)
- Family members keep "free" tier but access group

## How It Works

### Group Creation Flow

**Free User trying to create group:**

```
1. Enter group name
2. System blocks: "Upgrade to Individual ($5/month) to create groups"
3. Shows payment modal for Individual plan
4. After payment → subscription_tier = 'individual'
5. Group created as "individual" type
6. Can now invite other $5 users
```

**Individual User ($5) creating group:**

```
1. Enter group name
2. Group created immediately
3. Group type = "individual"
4. Max members = unlimited (but all must be $5 tier)
5. Can invite other individual users
6. No access codes (invites only)
```

**Family User ($20) creating group:**

```
1. Enter group name
2. Group created immediately
3. Group type = "family"
4. Max members = 6
5. Can generate access codes
6. Invited members join for FREE
```

### Joining Groups

**Via Access Code (Family Plan only):**

```
1. New user signs up with access code
2. Validates code is for "family" type group
3. User created with subscription_tier = 'free'
4. User added to family group
5. User has access to group features
6. User's personal tier stays "free"
```

**Via Direct Invite (Individual Plan):**

```
1. Individual user ($5) invites another user by email
2. Invited user must be subscription_tier = 'individual' ($5)
3. Both users can collaborate in group
4. Both pay $5/month individually
```

### Group Types

**Individual Group:**

- Created by $5/month users
- All members must have "individual" subscription
- Unlimited members (or practical limit like 99)
- No access codes
- Shared collaboration space

**Family Group:**

- Created by $20/month user
- Up to 6 total members
- Admin pays $20, members are free
- Access codes work
- Members get free access but stay "free" tier

## Database Schema

### User Table

```typescript
subscription_tier: 'free' | 'individual' | 'family'; // Personal payment status
active_group_id: string | null; // Currently active group
subscription_status: string; // Stripe status
subscription_id: string; // Stripe subscription ID
```

### UserGroups Table

```typescript
groupType: 'individual' | 'family'; // Determines behavior
maxMembers: number; // 99 for individual, 6 for family
createdById: string; // The paying user
```

### UserGroupMembers Table

```typescript
isAdmin: boolean; // Can manage group
// No subscription_tier here - it's on the user table
```

### AccessCodes Table

```typescript
groupId: string; // Must be 'family' type group
// Only works for family groups
```

## Business Rules

### Creating Groups

- Free users: Must upgrade to Individual ($5) first
- Individual users: Can create "individual" groups immediately
- Family users: Can create "family" groups immediately
- One active group per user at a time

### Joining Groups as Member

- **Individual groups**: Require personal $5/month subscription
- **Family groups**: Can join with free tier via access code
- Users must leave current group before joining new one

### Access Codes

- **Only work for "family" type groups**
- Individual groups don't use access codes
- Family admin generates codes
- Codes give free access to that specific family group
- Member stays "free" tier personally

### Payment Responsibilities

- **Free tier**: No payment
- **Individual tier**: User pays $5/month for themselves
- **Family tier**: Admin pays $20/month for group, members free
- Canceling subscription removes group creation ability

## UI/UX Flow

### Free User Dashboard

```
Tier Badge: "Free Plan"
- Personal lists only
- Limited storage
- [Upgrade to Individual ($5)] button
```

### Individual User ($5) Dashboard

```
Tier Badge: "Individual Plan - $5/month"
- Unlimited storage
- Create groups
- [Manage Groups] button
Group Section:
- [Create New Group] (works immediately)
- Shows existing groups
```

### Family User ($20) Dashboard

```
Tier Badge: "Family Plan - $20/month"
- Everything in Individual
- Up to 6 family members
- [Manage Group & Access Codes] button
Group Section:
- [Create Family Group] (works immediately)
- Generate access codes
- Manage family members
```

### Free User in Family Group

```
Tier Badge: "Free Plan"
- But has access to family group features
- Can see group lists
- Cannot create own groups
- Can leave family group anytime
```

## Upgrade Paths

### Free → Individual ($5)

- User clicks "Upgrade" or tries to create group
- Shows Individual plan modal
- After payment: subscription_tier = 'individual'
- Can now create "individual" groups

### Individual → Family ($20)

- User wants family access codes
- Shows Family plan modal
- After payment: subscription_tier = 'family'
- Can now create "family" groups with codes
- Existing "individual" groups stay active

### Downgrade Scenarios

**Cancel Individual subscription:**

- subscription_tier → 'free'
- Removed from all "individual" groups (need $5 to stay)
- Can stay in family groups if invited
- Cannot create new groups

**Cancel Family subscription:**

- subscription_tier → 'free'
- Family group dissolved OR admin transfers
- Family members removed from group
- Cannot generate new access codes

## Migration Notes

### From Old System (6 tiers) to New (3 tiers)

**Old → New mapping:**

```
free → free
individual → individual
family_member → free (with active_group_id set)
family_admin → family
team_member → free (or individual depending on context)
team_admin → family (or keep as-is if team feature later)
```

**Migration strategy:**

1. Update all `family_admin` → `family`
2. Update all `family_member` → `free` (keep their active_group_id)
3. Update all `team_member` → `free` or `individual`
4. Update all `team_admin` → `family`

## Code Changes Summary

**Modified Files:**

- `auth-schema.ts` - Simplified comment to 3 tiers
- `src/zero-schema.ts` - Updated tier values comment
- `src/lib/server/subscriptions.ts` - 3 tier types, updated pricing
- `src/routes/api/mock-checkout/+server.ts` - Only 'individual' | 'family'
- `src/lib/components/subscriptionTierBadge.svelte` - 3 tier info objects
- `src/routes/account/+page.svelte` - Updated group creation logic
- `src/routes/account/register/+page.server.ts` - Don't change tier on join
- `src/routes/account/subscription/+page.svelte` - 3 tier names
- `src/lib/components/subscriptionUpgradeModal.svelte` - Updated features

## Key Differences from Before

### Before (Wrong)

- Creating family group → tier changes to 'family_admin'
- 6 different tiers (confusing)
- Member tiers (family_member, team_member)
- Tier tied to group membership

### After (Correct)

- Creating group → tier stays same (already paid)
- 3 clear tiers (free, individual, family)
- No "member" tiers (members keep personal tier)
- Subscription separate from group membership

## Testing Checklist

- [ ] Free user blocked from creating groups
- [ ] Free user shown Individual upgrade modal when trying to create group
- [ ] Individual user can create group immediately after paying $5
- [ ] Individual user can invite other $5 users
- [ ] Family user can create family group with $20 plan
- [ ] Family user can generate access codes
- [ ] Access code signup leaves user as "free" tier
- [ ] Access code gives access to family group
- [ ] Free user in family group can see/use group features
- [ ] Canceling subscription removes group creation ability
- [ ] Individual group requires all members be $5 tier
- [ ] Family group allows free members via codes

## Future Enhancements

- Team tier for businesses (coming later)
- Ability to upgrade group from individual → family
- Transfer group ownership
- Nested groups or sub-groups
- Group-specific permissions
