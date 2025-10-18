# Custom Lists - Usage Guide

## Quick Start

### Starting the App

```bash
pnpm dev
```

Visit `http://localhost:5173` and sign in.

## List Types Overview

### 🗂️ Basic List

**Best for**: Simple checklists, to-dos, general lists

- ✅ Checkbox to mark complete
- ✏️ Edit item name inline
- 🗑️ Delete items

**Example uses**:

- Packing list
- Books to read
- Things to remember

---

### 🛒 Shopping List

**Best for**: Grocery shopping organized by store

- ✅ Checkbox to mark as purchased
- 📍 Store selection (auto-completes from your stores)
- 🏪 Groups items by store

**Example uses**:

- Weekly groceries
- Home improvement supplies
- Party shopping

**Pro tip**: The store field learns from your entries and suggests stores you've used before.

---

### 📅 Events

**Best for**: Calendar events, appointments, reminders

- 📅 Date picker
- 🕐 Time selection (or mark as "All Day")
- 📍 Location field
- 📝 Description/notes
- 🌍 Timezone support

**Example uses**:

- Doctor appointments
- Birthday parties
- Project deadlines
- Travel itinerary

**Pro tip**: Events are sorted by date/time automatically.

---

### ✓ Task List

**Best for**: Prioritized tasks with specific ordering

- ✅ Checkbox to mark complete
- ☰ Drag handle for reordering
- 🔄 Drag & drop to change priority

**Example uses**:

- Project tasks in order
- Morning routine checklist
- Step-by-step instructions

**Pro tip**: Click and drag the ☰ handle to reorder tasks.

---

### 📖 Recipe Box

**Best for**: Saving and organizing recipes

- 📝 Multi-line ingredients list
- 👨‍🍳 Step-by-step instructions
- 🍽️ Number of servings
- ⏱️ Prep time
- 🔥 Cook time
- 🏷️ Category (dessert, main, etc.)

**Display features**:

- Collapsible ingredients section
- Collapsible instructions section
- Metadata badges at the top

**Example uses**:

- Family recipes
- Meal planning
- Baking projects
- Cocktail recipes

**Pro tip**: Use the ingredients field like:

```
2 cups flour
1 tsp salt
3 eggs
1/2 cup butter
```

---

### 💬 Messages (**Groups Only**)

**Best for**: Team communication and shared notes

- 📝 Multi-line message text
- ⚠️ Priority levels (Low, Medium, High, Urgent)
- 🏷️ Tags (comma-separated)
- Color-coded priority badges

**Available only when**: You're in group/shared mode (not personal mode)

**Example uses**:

- Team announcements
- Project updates
- Meeting notes
- Important reminders for the group

**Priority colors**:

- 🔵 Low (blue)
- 🟠 Medium (orange)
- 🟣 High (pink)
- 🔴 Urgent (red)

**Pro tip**: Use tags like `urgent, @john, meeting` to organize messages.

---

### 👥 Contacts

**Best for**: Address book and contact information

- 📱 Phone number
- ✉️ Email address
- 🏠 Physical address
- 🏢 Company/organization
- 📝 Notes

**Example uses**:

- Emergency contacts
- Vendor contacts
- Client information
- Friends and family info

**Pro tip**: All fields are optional - add only what you need.

---

### 🔖 Bookmarks

**Best for**: Organizing useful websites and links

- 🔗 URL (clickable, opens in new tab)
- 📝 Description/purpose
- 🏷️ Tags for organization

**Example uses**:

- Research links
- Tutorial bookmarks
- Work resources
- Reference documentation

**Pro tip**: Use tags like `work, tutorial, design` to categorize bookmarks for easy searching later.

---

## Creating a New List

1. Look for the **"Create New List"** button in your sidebar
2. A modal will pop up showing all available list types
3. Select the type that fits your needs:
   - 7 types in **Personal Mode**
   - 8 types in **Group Mode** (includes Messages)
4. Enter a name for your list (e.g., "Vacation Packing", "Family Recipes")
5. Click **Create**

## Adding Items to a List

1. Click on any list from your dashboard
2. Click the **"Add Item"** button at the top
3. A modal opens with type-specific fields:
   - Fill in the item name (always required)
   - Fill in additional fields based on the list type
   - For recipes: ingredients and instructions are required
   - For bookmarks: URL is required
   - For messages: message text is required
4. Click **Add** to save

## Managing Items

### Editing

- Click the **Edit** button next to any item
- Update the name
- Press Enter or click **Save**
- Press Escape or click **Cancel** to discard changes

### Deleting

- Click the **Delete** (🗑️) button next to any item
- Item is immediately removed

### Marking Complete

- For Basic, Shopping, Tasks: Click the checkbox
- Completed items show with strikethrough
- Click again to unmark

### Reordering (Tasks Only)

- Click and hold the ☰ drag handle
- Drag the item up or down
- Release to drop in new position
- Order is saved automatically

## View Modes

### Personal Mode

- Lists visible only to you
- 7 list types available
- Perfect for: personal recipes, bookmarks, contacts

### Group Mode (Shared)

- Lists visible to all group members
- 8 list types available (includes Messages)
- Perfect for: family shopping lists, team events, shared recipes, group communication

**Switch modes** using the dropdown in the header.

## Tips & Tricks

### Recipes

- Copy/paste ingredients from websites
- Format ingredients as `quantity ingredient` for clarity
- Number your instructions: `1. Preheat oven...`
- Use standard time formats: "15 mins", "1.5 hours"

### Messages (Groups)

- Start with priority for important messages
- Use consistent tags: `@name` for mentions, `urgent` for time-sensitive
- Tags are searchable (future feature)

### Bookmarks

- Include the full URL with `https://`
- Use consistent tag categories: `work`, `personal`, `reference`, `tutorial`
- Description helps remember why you saved it

### Events

- Use "All Day" for birthdays, holidays, deadlines
- Add location for in-person events
- Description can include agenda, notes, or links

### Contacts

- Include country code for international numbers: `+1 (555) 123-4567`
- Format addresses consistently for easy reading
- Use notes for: dietary restrictions, preferences, emergency info

## Keyboard Shortcuts

When editing item names:

- **Enter**: Save changes
- **Escape**: Cancel and discard changes

## Mobile Usage

All list types work on mobile:

- Touch to select
- Long press on task handles to drag
- Forms adapt to mobile screens
- Links open in mobile browser

## Collaborative Features (Groups)

When in group mode:

- All members see the same lists
- Real-time sync (within seconds)
- Everyone can add/edit/delete items
- Messages list is only available in group mode for team communication

## Offline Support

HiveOS works offline:

- View all your lists
- Add/edit/delete items
- Changes sync when connection returns
- Indicator shows when offline

## Common Questions

**Q: Can I change a list's type after creating it?**  
A: Not currently - create a new list with the desired type instead.

**Q: Why can't I see Messages in personal mode?**  
A: Messages are designed for group collaboration. Switch to a group to access Messages.

**Q: Can I have multiple shopping lists?**  
A: Yes! Create as many lists as you want of any type.

**Q: Do recipe instructions support formatting?**  
A: Plain text only for now, but line breaks are preserved.

**Q: Can I export my lists?**  
A: Not yet - this is a planned feature.

**Q: Are my lists backed up?**  
A: Yes, everything is stored in the database and synced via Zero Cache.

## Troubleshooting

**Problem**: Items not showing up  
**Solution**: Check your view mode - make sure you're viewing the right mode (Personal vs Group)

**Problem**: Can't create a Messages list  
**Solution**: Messages are group-only. Switch to a group using the dropdown in the header.

**Problem**: Drag & drop not working on tasks  
**Solution**: Make sure you're clicking the ☰ handle, not the item itself.

**Problem**: Bookmark links not clickable  
**Solution**: Ensure URL starts with `http://` or `https://`

**Problem**: Store autocomplete not showing my stores  
**Solution**: Autocomplete learns from your entries - type the full name once and it will remember.

## Future Enhancements

Coming soon:

- Tag-based filtering and search
- Recipe scaling calculator
- Bookmark favicon display
- Contact quick actions (call/email)
- Export/import functionality
- Rich text formatting for instructions
- Recurring events
- Shared editing with real-time cursors
- Message threading/replies
- Attachment support for messages

---

**Need help?** Check the main README or open an issue on GitHub.
