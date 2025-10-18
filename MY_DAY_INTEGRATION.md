# My Day - Event Calendar Integration

## Overview

The **My Day** page provides a timeline view of today's events from all event-type custom lists. It automatically appears in the sidebar when you create an event list.

## Implementation Date

October 2025

## How It Works

### Automatic Sidebar Link

- **📅 My Day** link appears in the sidebar automatically when you have at least one event-type list
- Hidden when no event lists exist (keeps UI clean)
- Available in both personal and group modes

### Data Source

- Pulls events from **all custom lists with `listType: 'events'`**
- Filters by current view mode (personal/shared)
- Shows only today's events

### Features

#### Timeline Views

- **2 Hours** - Next 2 hours from now
- **6 Hours** - Next 6 hours
- **12 Hours** - Next 12 hours (default)
- **24 Hours** - Full day view
- **Custom** - Set your own hour range

#### All-Day Events Section

- Displayed at the top in colorful cards
- Shows event name and location
- Pink gradient styling

#### Timed Events Timeline

- Visual timeline with hour markers
- Current time indicator (red line with pulsing dot)
- Color-coded event blocks
- Handles overlapping events with multi-column layout
- Compact mode for short events
- Click any event to see details

#### Event Management

- **View Details** - Click any event to see full information
- **Edit Events** - ✏️ button in modal to edit details
- **Create Events** - Click any time slot to create new event at that time
- **Quick Create** - Pre-fills date and time based on clicked slot

## Usage

### Creating Your First Event List

1. Click **"+ Create List"** in sidebar
2. Select **📅 Events** type
3. Name it (e.g., "Work Calendar", "Family Events")
4. **📅 My Day** link appears in sidebar

### Viewing My Day

1. Click **📅 My Day** in sidebar
2. See today's events on timeline
3. Adjust time range with buttons at top
4. Events automatically update as you add/edit them

### Adding Events from My Day

1. Click any empty time slot on timeline
2. Modal opens with date/time pre-filled
3. Add event name and details
4. Event saved to your first event list

### Managing Events

- **View**: Click event card → see all details
- **Edit**: Click ✏️ in event modal → edit inline → save
- **Time**: Toggle "All Day" checkbox for all-day events
- **Duration**: Set start and end times for timed events

## Technical Details

### Schema Integration

Events are stored as `customListItems` with these fields:

```typescript
{
	name: string; // Event title
	date: string; // YYYY-MM-DD
	time: string; // HH:MM (empty for all-day)
	endTime: string; // HH:MM (optional)
	location: string; // Where
	description: string; // Notes
	allDay: boolean; // All-day flag
	timezone: string; // User's timezone
	customListId: string; // Parent event list
}
```

### Multiple Event Lists

- You can create multiple event lists (work, personal, family, etc.)
- **My Day aggregates events from ALL event lists**
- Filter on the server by `viewMode` and `listType: 'events'`
- Filter client-side by `customListId` to only show events from event lists

### Auto-Create Behavior

- First event created from My Day → uses first available event list
- No event lists exist → automatically creates "My Events" list
- Subsequent events → always added to first event list

### Real-Time Updates

- Events sync via Zero Cache
- Timeline updates automatically when events change
- Current time indicator pulses and updates every minute
- No page refresh needed

## UI Features

### Responsive Design

- Desktop: Full timeline with hour labels on left
- Mobile: Compact view, smaller time labels
- Touch-friendly on mobile devices

### Visual Indicators

- **Current Time**: Red line with pulsing dot
- **All-Day Events**: Pink/purple gradient cards
- **Timed Events**: Purple gradient blocks
- **Overlapping Events**: Side-by-side columns
- **Short Events**: Compact inline format

### Accessibility

- Keyboard navigation support
- Screen reader labels
- Focus indicators on clickable elements
- Modal keyboard shortcuts (Escape to close)

## Comparison with Old System

### Before (Old Events Table)

- Hardcoded `events` table
- Single event type only
- Not part of custom lists system
- Separate permissions

### After (Custom Lists Integration)

- Events are custom lists with `listType: 'events'`
- Can have multiple event calendars
- Unified permissions with custom lists
- My Day aggregates from all event lists
- Flexible: create work events, personal events, family events, etc.

## Example Workflows

### Work & Personal Calendars

1. Create "Work Events" list (events type)
2. Create "Personal Events" list (events type)
3. My Day shows events from both
4. Add events to appropriate list manually via list pages
5. Quick-add from My Day goes to first list

### Family Collaboration

1. Switch to group/shared mode
2. Create "Family Calendar" (events type)
3. All family members see same My Day view
4. Anyone can add/edit family events
5. Real-time sync across devices

### Event Planning

1. Create "Wedding Planning" event list
2. Add all wedding-related events with details
3. My Day shows today's tasks
4. See timeline for appointments, vendor meetings, etc.

## Tips & Tricks

### Time Range Selection

- **Morning Routine**: Use 2-hour view when starting day
- **Work Day**: Use 12-hour view during work
- **Planning Ahead**: Use 24-hour view for full day overview
- **Custom**: Set specific ranges like 4 hours for focused work

### Event Duration

- Set end times for accurate timeline blocks
- Default duration: 1 hour if no end time
- Overlapping events display side-by-side automatically

### All-Day Events

- Perfect for: birthdays, holidays, deadlines
- Always shown at top of My Day
- Don't clutter timeline

### Quick Entry

- Click future time slots to create events
- Date auto-fills to today
- Time auto-fills to clicked hour
- Just add title and you're done!

## Future Enhancements

Planned features:

- [ ] Week view alongside day view
- [ ] Event search/filter
- [ ] Recurring events
- [ ] Event categories/colors per list
- [ ] Calendar export (iCal)
- [ ] Event reminders/notifications
- [ ] Drag events to reschedule
- [ ] Multi-day events spanning timeline
- [ ] Event attachments
- [ ] Guest lists / attendees

## Troubleshooting

**Q: My Day link not showing?**  
A: Create an event-type custom list first. The link appears automatically.

**Q: Events not appearing?**  
A: Check that events have today's date and belong to an event-type list.

**Q: Can't edit event?**  
A: Click the ✏️ edit button in the event detail modal.

**Q: Where do quick-created events go?**  
A: They're added to your first event list. View/manage them on that list's page.

**Q: Can I have multiple event calendars?**  
A: Yes! Create multiple event-type lists. My Day aggregates all of them.

**Q: Events from other list types showing?**  
A: No, My Day only shows items from lists with `listType: 'events'`.

---

**Integration Status**: ✅ Complete  
**Last Updated**: October 2025
