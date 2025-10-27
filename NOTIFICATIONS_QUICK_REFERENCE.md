# HiveOS Notifications - Quick Reference

## Coolify Setup (Copy-Paste Ready)

### 1. Generate Secret

```bash
openssl rand -base64 32
```

### 2. Add to Coolify Environment

**Production:**

```
CRON_SECRET=paste-your-generated-secret-here
NODE_ENV=production
```

**Development/Testing:**

```
CRON_SECRET=paste-your-generated-secret-here
NODE_ENV=development
DEV_EMAIL_OVERRIDE=your-test-email@example.com
```

**Dev Mode Behavior:**

- All notification emails redirect to `DEV_EMAIL_OVERRIDE`
- Original recipient shown in subject: `[DEV - To: user@example.com] ☀️ Good morning...`
- Dev banner added to email body
- Perfect for testing without spamming real users!

### 3. Create Scheduled Tasks

Replace `YOUR_DOMAIN` and `YOUR_CRON_SECRET` with actual values:

```bash
# Morning Briefing (hourly - checks all timezones)
Schedule: 0 * * * *
Command: curl -X POST https://YOUR_DOMAIN/api/cron/morning-briefing -H "Authorization: Bearer YOUR_CRON_SECRET"

# Evening Wrapup (hourly - checks all timezones)
Schedule: 0 * * * *
Command: curl -X POST https://YOUR_DOMAIN/api/cron/evening-wrapup -H "Authorization: Bearer YOUR_CRON_SECRET"

# Event Reminders (hourly - 1h before events)
Schedule: 0 * * * *
Command: curl -X POST https://YOUR_DOMAIN/api/cron/event-reminders -H "Authorization: Bearer YOUR_CRON_SECRET"

# Group Activity (every 30 mins - detects bulk additions)
Schedule: */30 * * * *
Command: curl -X POST https://YOUR_DOMAIN/api/cron/group-activity -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Test Commands

```bash
# Test morning briefing
curl -X POST https://YOUR_DOMAIN/api/cron/morning-briefing \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test evening wrapup
curl -X POST https://YOUR_DOMAIN/api/cron/evening-wrapup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test event reminders
curl -X POST https://YOUR_DOMAIN/api/cron/event-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test group activity
curl -X POST https://YOUR_DOMAIN/api/cron/group-activity \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:

```json
{
	"success": true,
	"job": "morning-briefing",
	"processed": 5,
	"successful": 5,
	"failed": 0
}
```

---

## URLs

- **Notification Settings**: `https://YOUR_DOMAIN/account/notifications`
- **Premium Check API**: `https://YOUR_DOMAIN/api/check-premium`
- **Cron Endpoints**: `https://YOUR_DOMAIN/api/cron/[job]`

---

## Notification Types

| Type             | Schedule              | What It Does                        |
| ---------------- | --------------------- | ----------------------------------- |
| Morning Briefing | User's preferred time | Today's events, tasks, lists        |
| Evening Wrapup   | User's preferred time | Completed tasks, tomorrow's preview |
| Event Reminders  | 1 hour before         | Upcoming event details              |
| Group Activity   | Real-time             | When member adds 5+ items           |

---

## Premium Access Rules

✅ User has paid subscription (`individual` or `family`)  
✅ User is member of group with paid creator

❌ Free users (not in paid group)

---

## Cron Schedule Cheat Sheet

```
0 * * * *       Every hour
*/30 * * * *    Every 30 minutes
0 8 * * *       Daily at 8 AM UTC
0 18 * * *      Daily at 6 PM UTC
0 9 * * 1       Every Monday at 9 AM
```

---

## Troubleshooting

**No emails sent?**

- Check SMTP settings in .env
- Verify users have premium access
- Check cron execution logs

**401 Unauthorized?**

- Verify CRON_SECRET matches in .env and curl command
- Check Authorization header format

**Wrong times?**

- Cron runs in UTC
- User timezone is handled in app
- User sets timezone in /account/notifications

**Emails not formatted?**

- Check email client (HTML support)
- View raw email source
- Test with different email providers

---

## Quick Stats

- **Database fields added**: 11
- **API endpoints created**: 5
- **Email templates**: 4
- **Notification types**: 8
- **Cron jobs needed**: 4

---

## Development Mode

If SMTP not configured, emails are logged to console:

```
📧 EMAIL TO SEND (SMTP not configured):
To: user@example.com
Subject: ☀️ Good morning, John! Your day at a glance
...
```

---

## Support Files

- `NOTIFICATIONS_IMPLEMENTATION_COMPLETE.md` - Full implementation guide
- `COOLIFY_SCHEDULED_TASKS.md` - Detailed Coolify setup
- `src/lib/server/notifications.ts` - Premium access logic
- `src/lib/server/email.ts` - Email templates
- `src/routes/api/cron/[job]/+server.ts` - Cron endpoints
