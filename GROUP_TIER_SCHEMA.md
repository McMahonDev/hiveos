# Group & Subscription Tier Schema Updates

## Overview
Updated database schemas to support tiered subscriptions and group access codes system.

## Subscription Tiers

### Tier Types
- `free` - Default tier, solo user, limited features
- `individual` - $5/month, unlimited data, can collaborate with other paid users
- `family_member` - Member of a family plan
- `family_admin` - Admin of a family plan ($20/month, up to 6 accounts)
- `team_member` - Member of a team/organization
- `team_admin` - Admin of a team/organization

## Schema Changes

### User Table
Added to `user` table:
- `subscription_tier` (text, NOT NULL, default: 'free') - User's subscription level
- `active_group_id` (text, nullable) - Reference to the group user is currently in (users can only join one group)

### UserGroups Table
Added to `userGroups` table:
- `groupType` (text) - Type of group: 'family', 'team', etc.
- `maxMembers` (integer) - Maximum number of members allowed in the group
- `createdAt` (timestamp) - When the group was created

### UserGroupMembers Table
Added to `userGroupMembers` table:
- `isAdmin` (boolean, default: false) - Whether this member has admin privileges (multiple admins allowed)
- `joinedAt` (timestamp) - When the member joined the group

### AccessCodes Table (NEW)
New table for managing group invitation codes:
- `id` (text, PRIMARY KEY) - Unique identifier
- `code` (text, UNIQUE, NOT NULL) - The actual access code (e.g., "FAMILY-2024-XYZ")
- `groupId` (text, NOT NULL) - Reference to userGroups table
- `createdById` (text, NOT NULL) - Admin who created the code
- `usesRemaining` (integer, nullable) - Number of remaining uses (null = unlimited)
- `maxUses` (integer, nullable) - Maximum uses allowed (for tracking)
- `expiresAt` (timestamp, nullable) - When the code expires (optional)
- `createdAt` (timestamp) - When the code was created

## Business Logic

### Group Membership
- Users can only be in **one group at a time** (tracked via `active_group_id`)
- Groups can have **multiple admins** (tracked via `isAdmin` in `userGroupMembers`)
- Default creator is always an admin
- Admins cannot see payment information (exception noted in requirements)

### Data Separation
- When joining a group, user's existing data stays in their personal/custom views
- Group data is in a separate shared view accessible to all group members
- Personal data remains private even after joining a group

### Tier Restrictions
- **Free tier**: Can't interact with other users, data limits, single device
- **Individual tier ($5)**: Can interact with other paid users
- **Family tier ($20)**: Up to 6 accounts, access via codes
- **Free users in groups**: Get full features except admin features

### Access Codes
- Created by group admins
- Can be single-use or multi-use
- Optional expiration dates
- Automatically enrolls users into the group upon signup/redemption

## Permissions

### AccessCodes Permissions
- **Select**: ANYONE_CAN (needed for signup flow to validate codes)
- **Insert**: Only code creator/admin
- **Update**: Only code creator/admin  
- **Delete**: Only code creator/admin

## Migration Details

**Migration file**: `drizzle/0012_oval_quasar.sql`

Key migration steps:
1. Created `accessCodes` table with unique constraint on `code`
2. Added `subscription_tier` to user with default 'free'
3. Added `active_group_id` to user
4. Added `isAdmin` and `joinedAt` to userGroupMembers
5. Added `groupType`, `maxMembers`, and `createdAt` to userGroups

All changes deployed to Zero sync server (hash: 6fe71ef)

## Next Steps (Frontend)

1. **User signup/registration flow**
   - Add optional access code input field
   - Validate access code before account creation
   - Auto-enroll user if valid code provided

2. **Upgrade/subscription UI**
   - Show current tier in settings/account page
   - Add upgrade buttons for paid tiers
   - Payment integration (Stripe/etc)

3. **Group management UI**
   - Create group interface for paid users
   - Access code generation UI for admins
   - Member management (view members, toggle admin status)
   - Leave group functionality

4. **Admin features**
   - Generate access codes
   - Manage member roles (promote/demote admins)
   - View group usage/member count vs max
   - Revoke/expire access codes

5. **Data view filtering**
   - Ensure personal data stays in personal view
   - Group data only appears in shared/group view
   - Respect subscription tier limitations

6. **Free tier limitations**
   - Implement data limits
   - Single device session tracking
   - Disable collaboration features

## Database Relations

```
user
  ├─ subscription_tier (free, individual, family_member, family_admin, team_member, team_admin)
  ├─ active_group_id → userGroups.id
  └─ userGroupMembers (one-to-many)

userGroups
  ├─ groupType (family, team, etc)
  ├─ maxMembers
  ├─ createdById → user.id
  ├─ userGroupMembers (one-to-many)
  └─ accessCodes (one-to-many)

userGroupMembers
  ├─ userId → user.id
  ├─ userGroupId → userGroups.id
  ├─ isAdmin (boolean)
  └─ joinedAt (timestamp)

accessCodes
  ├─ code (unique)
  ├─ groupId → userGroups.id
  ├─ createdById → user.id
  ├─ usesRemaining
  ├─ maxUses
  ├─ expiresAt
  └─ createdAt
```
