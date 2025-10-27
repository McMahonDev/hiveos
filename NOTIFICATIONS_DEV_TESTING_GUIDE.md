# HiveOS Notifications - Development Testing Guide

## Quick Start: Test Notifications Safely

### 1. Set Up Development Mode

In your `.env` file:

```bash
# Must be set to 'development'
NODE_ENV=development

# Your email address - all notifications will come here
DEV_EMAIL_OVERRIDE=your-email@example.com

# Your test SMTP settings (or use a service like Mailtrap)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password

# Cron secret for testing
CRON_SECRET=test-secret-12345
```

### 2. What Happens in Dev Mode

✅ **All notification emails redirect to `DEV_EMAIL_OVERRIDE`**

Example: If morning briefing is triggered for `john@example.com`:

- Email actually sent to: `your-email@example.com`
- Subject: `[DEV - To: john@example.com] ☀️ Good morning, John!`
- Email contains dev banner showing original recipient
- Console logs: `🔀 DEV MODE: Redirecting email from john@example.com to your-email@example.com`

### 3. Test Each Notification Type

#### A. Morning Briefing

```bash
# Manually trigger
curl -X POST http://localhost:5173/api/cron/morning-briefing \
  -H "Authorization: Bearer test-secret-12345"
```

**What to check:**

- [ ] Email arrives at `DEV_EMAIL_OVERRIDE`
- [ ] Subject shows original recipient: `[DEV - To: user@example.com] ☀️ Good morning...`
- [ ] Dev banner appears at top of email
- [ ] Today's events are listed correctly
- [ ] Pending tasks count is accurate
- [ ] Shopping lists appear (if any)
- [ ] Email is mobile-responsive

#### B. Evening Wrapup

```bash
curl -X POST http://localhost:5173/api/cron/evening-wrapup \
  -H "Authorization: Bearer test-secret-12345"
```

**What to check:**

- [ ] Completed tasks count
- [ ] Tomorrow's events preview
- [ ] Accomplishment stats display correctly
- [ ] Dark theme styling works

#### C. Event Reminders

**Setup:** Create a test event 1 hour from now

```bash
curl -X POST http://localhost:5173/api/cron/event-reminders \
  -H "Authorization: Bearer test-secret-12345"
```

**What to check:**

- [ ] Reminder sent for events starting ~1 hour from now
- [ ] Event details (name, time, location) are correct
- [ ] Description appears if set
- [ ] Urgent badge styling

#### D. Group Activity

**Setup:**

1. Create a test group
2. Add 5+ items as another user
3. Wait up to 30 minutes (or trigger manually)

```bash
curl -X POST http://localhost:5173/api/cron/group-activity \
  -H "Authorization: Bearer test-secret-12345"
```

**What to check:**

- [ ] Notification sent when 5+ items added
- [ ] Member name shown correctly
- [ ] Item list is accurate
- [ ] Group name displayed

---

## Testing with Different Scenarios

### Scenario 1: User with No Items

**Setup:**

- Create user with no events, tasks, or lists
- Trigger morning briefing

**Expected:**

- Email says "You have a clear schedule today! 🎉"
- Encouragement message to relax

### Scenario 2: Busy User

**Setup:**

- Create user with:
  - 3 events today
  - 10 pending tasks
  - 2 shopping lists
  - Custom lists

**Expected:**

- All sections appear in morning briefing
- Counts are accurate
- Events show times and locations

### Scenario 3: Multiple Timezones

**Setup:**

- User 1: timezone = 'America/New_York', briefing time = '08:00'
- User 2: timezone = 'America/Los_Angeles', briefing time = '09:00'
- Run cron at different hours

**Expected:**

- Each user receives briefing at their local time
- Cron checks timezone and matches against current hour

### Scenario 4: Premium vs Free Users

**Setup:**

- User 1: Free tier (no notifications)
- User 2: Individual tier (gets notifications)
- User 3: Free tier, member of paid group (gets notifications)

**Expected:**

- Only users 2 and 3 receive notifications
- User 1 is skipped (seen in API response: `processed: 2`)

---

## Recommended Testing Services

### Email Testing Tools

1. **Mailtrap** (Recommended)
   - Catches all emails in one inbox
   - No risk of real sends
   - Free tier available

   ```
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   ```

2. **MailHog** (Local)
   - Run locally with Docker
   - Web UI at http://localhost:8025

   ```bash
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

   ```
   SMTP_HOST=localhost
   SMTP_PORT=1025
   ```

3. **Your Real Email**
   - Use your actual email provider
   - Just set `DEV_EMAIL_OVERRIDE` to your address
   - All dev emails come to you

---

## Common Testing Patterns

### Pattern 1: Manual Trigger

Good for immediate testing:

```bash
curl -X POST http://localhost:5173/api/cron/morning-briefing \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Pattern 2: Local Cron

Test actual scheduling:

```bash
# Add to crontab (macOS/Linux)
0 8 * * * curl -X POST http://localhost:5173/api/cron/morning-briefing -H "Authorization: Bearer test-secret-12345"
```

### Pattern 3: Watch Logs

Monitor what's happening:

```bash
# Terminal 1: Run dev server
pnpm dev

# Terminal 2: Trigger cron
curl -X POST http://localhost:5173/api/cron/morning-briefing \
  -H "Authorization: Bearer test-secret-12345"

# Watch terminal 1 for:
# - 🔀 DEV MODE: Redirecting email from...
# - ✅ Email sent successfully
# - API response with processed counts
```

---

## Debugging Checklist

### Email Not Arriving?

- [ ] `NODE_ENV=development` is set
- [ ] `DEV_EMAIL_OVERRIDE` has valid email address
- [ ] SMTP credentials are correct
- [ ] Check dev server console for "🔀 DEV MODE" log
- [ ] Check for "✅ Email sent successfully" or error messages
- [ ] If using Mailtrap/MailHog, check their web UI

### Wrong Recipients in Production?

- [ ] `NODE_ENV=production` (not 'development')
- [ ] `DEV_EMAIL_OVERRIDE` is empty or removed
- [ ] Double-check environment in Coolify

### Cron Not Running?

- [ ] Correct CRON_SECRET in both .env and curl command
- [ ] Authorization header format: `Bearer YOUR_SECRET`
- [ ] Endpoint URL is correct (check domain)
- [ ] User has premium access (check subscription tier)
- [ ] User has notification enabled in settings

### No Users Receiving Notifications?

Check API response:

```json
{
	"success": true,
	"job": "morning-briefing",
	"processed": 0, // ← This means no eligible users
	"successful": 0,
	"failed": 0
}
```

Possible reasons:

- No users have premium access
- No users have this notification type enabled
- Wrong time (timezone/hour doesn't match any user)

---

## Example Testing Session

```bash
# 1. Start dev server
pnpm dev

# 2. Open email testing tool (Mailtrap, MailHog, etc.)

# 3. Create test user with premium subscription
# (Use web UI at http://localhost:5173)

# 4. Set user preferences
# Go to /account/notifications
# Enable morning briefing
# Set timezone to your current timezone
# Set briefing time to next hour

# 5. Create some test data
# Add 2-3 events today
# Add some tasks
# Add a shopping list

# 6. Trigger morning briefing manually
curl -X POST http://localhost:5173/api/cron/morning-briefing \
  -H "Authorization: Bearer test-secret-12345"

# 7. Check response
# Should see: "processed": 1, "successful": 1

# 8. Check your email tool
# Should receive email with:
# - Subject: [DEV - To: testuser@example.com] ☀️ Good morning...
# - Dev banner at top
# - Your test events, tasks, and lists

# 9. Verify email content
# - Is formatting correct?
# - Are all items listed?
# - Does it look good on mobile?
# - Are links working?

# Success! 🎉
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in Coolify
- [ ] Remove or comment out `DEV_EMAIL_OVERRIDE`
- [ ] Use strong `CRON_SECRET` (32+ characters)
- [ ] Verify SMTP credentials are production-ready
- [ ] Test with 1-2 real users first
- [ ] Monitor logs for first 24 hours
- [ ] Check email delivery rates
- [ ] Verify timezone handling for international users

---

## Tips & Tricks

### Quick Email Preview

Want to see what the email looks like?

1. Trigger notification in dev mode
2. Open email in your tool
3. Copy HTML source
4. Paste into https://htmlemail.io/ to test rendering

### Test All Notification Types at Once

```bash
#!/bin/bash
SECRET="test-secret-12345"
BASE_URL="http://localhost:5173/api/cron"

echo "Testing morning briefing..."
curl -X POST $BASE_URL/morning-briefing -H "Authorization: Bearer $SECRET"

echo "Testing evening wrapup..."
curl -X POST $BASE_URL/evening-wrapup -H "Authorization: Bearer $SECRET"

echo "Testing event reminders..."
curl -X POST $BASE_URL/event-reminders -H "Authorization: Bearer $SECRET"

echo "Testing group activity..."
curl -X POST $BASE_URL/group-activity -H "Authorization: Bearer $SECRET"

echo "Done! Check your email tool."
```

### Generate Realistic Test Data

Use the web UI to:

1. Create events with realistic times and locations
2. Add variety of tasks (completed and pending)
3. Create shopping lists with multiple items
4. Test with different user states (empty, busy, etc.)

---

## Need Help?

Common issues and solutions:

| Issue                | Solution                                              |
| -------------------- | ----------------------------------------------------- |
| "Unauthorized" error | Check CRON_SECRET matches in .env and curl            |
| Emails in production | Set NODE_ENV=production and remove DEV_EMAIL_OVERRIDE |
| No emails in dev     | Check SMTP settings and console logs                  |
| Wrong content        | Verify test data was created correctly                |
| Timezone issues      | Ensure user timezone is set in /account/notifications |

---

## Summary

Development mode is **already built in** and ready to use! Just set two environment variables:

- `NODE_ENV=development`
- `DEV_EMAIL_OVERRIDE=your-email@example.com`

All notification emails will be safely redirected to your test address with the original recipient clearly labeled. No code changes needed! 🎉
