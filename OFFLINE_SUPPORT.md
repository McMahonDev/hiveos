# Offline Support in HiveOS

HiveOS now includes offline capabilities with **optimistic updates** that allow you to continue using the app even when your internet connection is lost. Items appear **instantly** in your lists, even when offline!

## Features

### 1. **Offline Indicator**
- A banner appears at the top of the screen when you go offline
- Shows "You're offline" with the number of pending changes
- When back online, shows "Syncing..." while changes are being uploaded

### 2. **Queue Management**
- All changes (add, edit, delete) are automatically queued when offline
- Changes are stored in localStorage and persist across browser sessions
- When you come back online, changes sync automatically

### 3. **Read-Only Access**
Zero provides read-only access to previously loaded data while offline. You can:
- View your shopping lists
- View events
- Browse custom lists
- See previously loaded data

### 4. **Supported Operations**
The following operations work offline and will sync when back online:

#### Shopping List
- ✅ Add new items
- ✅ Edit item names and stores
- ✅ Check/uncheck items
- ✅ Delete items

#### Events
- ✅ Add new events
- ✅ Edit event details
- ✅ Delete events

#### Custom Lists
- ✅ Add items
- ✅ Edit items
- ✅ Delete items
- ✅ Mark items complete

## How It Works

### 1. Detection
The app automatically detects when you go online/offline using browser events.

### 2. Optimistic Updates
When you make changes (online or offline):
- Changes appear **immediately** in the UI
- Items show with a blue left border and slightly faded to indicate they're pending
- No waiting for server confirmation

### 3. Queuing
When offline, all mutations (create, update, delete) are:
- Stored in a local queue
- Persisted to localStorage
- Displayed in the offline indicator
- **Visible immediately in the UI via optimistic updates**

### 4. Syncing
When connection is restored:
- The app automatically starts syncing
- Queued changes are executed in order
- Failed changes are retried up to 5 times
- Successfully synced changes are removed from the queue
- Optimistic items are replaced with real server data

### 5. Conflict Resolution
Zero uses server reconciliation for conflicts:
- The server has the final say on all data
- If a conflict occurs, the server's version wins
- Your changes may be rejected if they conflict with server state
- If a conflict occurs, the optimistic item will be replaced/removed by the server's decision

## Best Practices

### Do's
✅ Make changes while offline - they'll sync later and appear immediately
✅ Keep the app open while syncing to ensure changes complete
✅ Check the offline indicator to see pending changes
✅ Add items to shopping lists even without internet
✅ Look for the blue border on items - that means they're pending sync

### Don'ts
❌ Don't close the browser before syncing completes
❌ Don't make conflicting changes on multiple devices while offline
❌ Don't expect real-time updates while offline (data will be stale)
❌ Don't be surprised if a pending item disappears (server rejected it)

## Limitations

1. **No New Data**: While offline, you won't receive:
   - Changes from other users
   - Updates from other devices
   - New items added elsewhere

2. **Read-Only for Unloaded Data**: You can only view data that was loaded before going offline

3. **Max Retries**: Failed syncs are retried 5 times before being dropped

4. **Storage Limits**: Large numbers of offline changes may hit localStorage limits (typically 5-10MB)

## Technical Details

### Queue Storage
- Location: `localStorage` key: `offline-mutation-queue`
- Format: JSON array of pending mutations
- Cleared after successful sync

### Retry Logic
- Max retries: 5 attempts
- Exponential backoff (handled by Zero client)
- Failed mutations after max retries are dropped

### Components
- **OfflineIndicator**: Shows connection status banner
- **OfflineQueueManager**: Manages pending mutations queue
- **OptimisticUpdatesManager**: Tracks and displays pending items immediately
- **All mutation points**: Check online status and add optimistic updates
- **Visual feedback**: Blue left border + opacity on pending items

## Troubleshooting

### Changes not syncing?
1. Check the offline indicator - you may still be offline
2. Look at browser console for errors
3. Check `localStorage` to see if queue exists
4. Try refreshing the page

### Lost changes?
1. Check localStorage for `offline-mutation-queue`
2. Look for errors in console
3. Changes may have been rejected by server (conflicts)

### Stuck in offline mode?
1. Check your actual internet connection
2. Refresh the page
3. Clear site data and log in again

## Future Enhancements

Planned improvements:
- Better conflict resolution UI
- Offline write support (currently read-only + queue)
- Smarter retry logic
- Background sync API support
- Service worker for better offline experience
