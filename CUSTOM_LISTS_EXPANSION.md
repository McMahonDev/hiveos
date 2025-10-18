# Custom Lists Expansion - New List Types

## Overview

Expanded the custom list system from 4 to 8 list types, adding Recipe Box, Messages (groups only), Contacts, and Bookmarks.

## Implementation Date

January 2025

## How to Use

1. **Start the dev server**: `pnpm dev`
2. **Create a new list**:
   - Click "Create New List" in the sidebar
   - Choose from 8 types (7 in personal mode, 8 in group mode)
   - Give it a descriptive name
3. **Add items**:
   - Click "Add Item" button
   - Fill in type-specific fields
   - Submit to add to your list
4. **View & manage**:
   - Click on any list from the dashboard
   - Check off items, edit, or delete as needed
   - For recipes: expand/collapse ingredients and instructions
   - For messages: see priority badges and tags
   - For bookmarks: click links to open in new tab

## New List Types

### 1. Recipe Box (`'recipe'`)

**Icon**: 🍳  
**Purpose**: Save and organize recipes with ingredients and cooking instructions

**Fields**:

- `name` (required): Recipe name
- `ingredients` (text, required): Multi-line list of ingredients
- `instructions` (text, required): Step-by-step cooking instructions
- `servings` (integer): Number of servings
- `prepTime` (text): Preparation time (e.g., "15 mins")
- `cookTime` (text): Cooking time (e.g., "30 mins")
- `category` (text): Recipe category (dessert, main course, etc.)
- `status` (boolean): Checkbox for tried/not tried

**Display Features**:

- Collapsible ingredients section
- Collapsible instructions section
- Metadata badges for servings, prep time, and cook time
- Pre-formatted text display for ingredients and instructions

### 2. Messages (`'messages'`) - **Groups Only**

**Icon**: 💬  
**Purpose**: Team communication, shared notes, and group reminders

**Availability**: Only visible when in group mode (collaborative communication)

**Fields**:

- `name` (required): Message title/subject
- `messageText` (text, required): Full message content
- `priority` (text): Priority level (low, medium, high, urgent)
- `tags` (text): Comma-separated tags for organization
- `status` (boolean): Mark as read/unread

**Display Features**:

- Color-coded priority badges
- Tag chips for easy filtering
- Full message text with proper formatting

### 3. Contacts (`'contacts'`)

**Icon**: 👤  
**Purpose**: Address book for phone numbers, emails, and addresses

**Fields**:

- `name` (required): Contact name
- `phone` (text): Phone number
- `email` (text): Email address
- `address` (text): Physical address
- `company` (text): Company/organization
- `notes` (text): Additional notes
- `status` (boolean): Favorite/not favorite

**Display Features**:

- Icon-prefixed contact info (📱 phone, ✉️ email, 🏠 address, 🏢 company)
- Italicized notes section
- Card-style layout

### 4. Bookmarks (`'bookmarks'`)

**Icon**: 🔖  
**Purpose**: Save and organize web links

**Fields**:

- `name` (required): Bookmark title
- `url` (text, required): Web URL
- `description` (text): What the bookmark is for
- `tags` (text): Comma-separated tags
- `notes` (text): Additional context
- `status` (boolean): Important/not important

**Display Features**:

- Clickable external links (opens in new tab)
- Tag chips for categorization
- Description in secondary text color

## Database Schema Updates

### Migration: `0015_purple_mephistopheles.sql`

Added 12 new columns to `customListItems` table:

```sql
-- Recipe fields
ingredients TEXT
instructions TEXT
servings INTEGER
prepTime TEXT
cookTime TEXT

-- Messages fields
messageText TEXT
priority TEXT

-- Contacts fields
phone TEXT
email TEXT
address TEXT

-- Bookmarks fields
url TEXT

-- Shared field
tags TEXT (used by messages and bookmarks)
```

### Zero Schema

Updated `src/zero-schema.ts` to include all new fields with proper TypeScript typing.

### Drizzle Schema

Updated `src/lib/server/db/schema.ts` to mirror Zero schema changes.

## UI Changes

### Create List Modal (`+layout.svelte`)

- Added 4 new radio button options
- Each option has an emoji icon and description
- Total of 8 list type options now available

### Custom List Page (`custom-list/[id]/+page.svelte`)

**Form Fields Added**:

1. **Recipe Form**:
   - Ingredients textarea (5 rows, required)
   - Instructions textarea (6 rows, required)
   - Servings number input
   - Prep Time text input
   - Cook Time text input
   - 3-column grid layout for metadata fields

2. **Messages Form**:
   - Message Text textarea (4 rows, required)
   - Priority select (low/medium/high/urgent)

3. **Contacts Form**:
   - Phone input (tel type)
   - Email input (email type)
   - Address textarea (3 rows)

4. **Bookmarks Form**:
   - URL input (url type, required)
   - Description textarea (2 rows, optional)
   - Tags input (comma-separated, optional)

**Display Logic Added**:

- Type-specific conditional rendering
- Collapsible sections for recipes
- Priority badges for messages
- Icon-prefixed info for contacts
- External link handling for bookmarks
- Tag chip styling (shared by messages and bookmarks)

### Dashboard (`+page.svelte`)

Updated `getListIcon()` function to include icons for all 8 types:

- 'recipe' → 🍳
- 'messages' → 💬
- 'contacts' → 👤
- 'bookmarks' → 🔖

## CSS Enhancements

### New Styles Added

1. `.recipe-metadata` - 3-column responsive grid for recipe metadata
2. `.recipe-details` - Recipe-specific display styling with collapsible sections
3. `.message-details` - Message display with priority badges
4. `.message-priority` - Color-coded badges (blue/low, orange/medium, pink/high, red/urgent)
5. `.contact-details` - Contact card layout
6. `.contact-info` - Icon-prefixed contact information
7. `.bookmark-details` - Bookmark list styling
8. `.bookmark-url` - Clickable link styling
9. `.tag` - Green rounded tag chips

## TypeScript Updates

- Extended `selectedListType` type to include 4 new types
- Updated form submission logic in `onsubmit()` to extract type-specific fields
- Added type guards for safe array iteration in drag-and-drop

## Accessibility

- Added `svelte-ignore` comments for intentional a11y patterns
- Added ARIA roles for draggable task items
- Maintained keyboard accessibility for modals

## Zero Permissions

- Permissions unchanged after schema additions (hash=6fe71ef)
- All new fields follow existing permission patterns

## Testing Checklist

- [ ] Create each new list type from modal
- [ ] Add items to each list type with all fields
- [ ] Verify display of type-specific fields
- [ ] Test collapsible sections in recipes
- [ ] Test priority badges in messages
- [ ] Test external links in bookmarks
- [ ] Test tag rendering for messages and bookmarks
- [ ] Verify offline support for new types
- [ ] Test edit functionality for new types
- [ ] Test deletion of items with new fields
- [ ] Verify view mode filtering works for new types
- [ ] Test on mobile devices

## Future Enhancements

- [ ] Add search/filter by tags
- [ ] Add recipe category filtering
- [ ] Add contact import/export
- [ ] Add bookmark favicon fetching
- [ ] Add message threading
- [ ] Add priority filtering for messages
- [ ] Add rich text editing for instructions
- [ ] Add recipe scaling calculator
- [ ] Add bookmark archiving
- [ ] Add contact quick actions (call, email)

## Files Modified

1. `src/zero-schema.ts` - Added 4 new list types and 12+ new fields
2. `src/lib/server/db/schema.ts` - Mirrored Zero schema changes
3. `src/routes/+layout.svelte` - Added 4 new list type options to modal
4. `src/routes/custom-list/[id]/+page.svelte` - Added forms and display logic for new types
5. `src/routes/+page.svelte` - Updated dashboard icon function
6. `drizzle/0015_purple_mephistopheles.sql` - Database migration

## Migration Commands Run

```bash
pnpm drizzle-kit generate        # Generated migration
pnpm drizzle-kit migrate         # Applied to database
pnpm zero-deploy-permissions -p './src/zero-schema.ts'  # Validated permissions
```

## Notes

- All new fields are optional except for required form fields (name, ingredients, instructions, messageText, url)
- Tags are stored as comma-separated strings and parsed on display
- Recipe times are stored as text to allow flexible formats ("15 mins", "1 hour", etc.)
- Priority values are stored as lowercase strings matching the select options
- URLs in bookmarks are validated by HTML5 url input type
- Phone and email inputs use HTML5 validation types
