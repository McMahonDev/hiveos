# Coolify Scheduled Tasks Setup for HiveOS Notifications

This guide shows you how to configure cron jobs/scheduled tasks in Coolify to power HiveOS's notification system.

## Prerequisites

1. Your HiveOS app deployed to Coolify
2. Environment variable `CRON_SECRET` set in Coolify (generate a secure random string)
3. SMTP configured for email delivery

## Setting Up Scheduled Tasks in Coolify

### 1. Access Your Coolify Dashboard

1. Log into your Coolify instance
2. Navigate to your HiveOS project
3. Go to the **Scheduled Tasks** or **Cron Jobs** section

### 2. Add Environment Variables

Before creating scheduled tasks, ensure these environment variables are set:

**Required:**

```bash
CRON_SECRET=your-very-secure-random-string-here
```

**For Development/Testing:**

```bash
# Redirect all emails to this address in development
DEV_EMAIL_OVERRIDE=dev@example.com
NODE_ENV=development
```

**Generate a secure secret:**

```bash
openssl rand -base64 32
```

**Important:** When `NODE_ENV=development` and `DEV_EMAIL_OVERRIDE` is set, ALL notification emails (morning briefings, event reminders, etc.) will be redirected to the specified email address with the original recipient shown in the subject and body. This is perfect for testing without spamming real users!

### 3. Configure Scheduled Tasks

Coolify allows you to add cron jobs that will hit HTTP endpoints. For each notification type, create a new scheduled task:

---

#### **Morning Briefing** (Daily at 8 AM UTC)

- **Schedule**: `0 8 * * *` (runs every day at 8:00 AM UTC)
- **Command Type**: HTTP Request (curl)
- **Command**:
  ```bash
  curl -X POST https://your-domain.com/api/cron/morning-briefing \
    -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
  ```

**Note:** The cron runs hourly and checks each user's timezone and preferred time. You can run it every hour to catch all users:

- **Schedule**: `0 * * * *` (runs every hour on the hour)

---

#### **Evening Wrap-up** (Daily at 6 PM UTC)

- **Schedule**: `0 18 * * *` or `0 * * * *` (every hour)
- **Command**:
  ```bash
  curl -X POST https://your-domain.com/api/cron/evening-wrapup \
    -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
  ```

---

#### **Event Reminders** (Every hour)

- **Schedule**: `0 * * * *` (runs every hour)
- **Command**:
  ```bash
  curl -X POST https://your-domain.com/api/cron/event-reminders \
    -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
  ```

---

#### **Group Activity Check** (Every 30 minutes)

- **Schedule**: `*/30 * * * *` (runs every 30 minutes)
- **Command**:
  ```bash
  curl -X POST https://your-domain.com/api/cron/group-activity \
    -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
  ```

---

### 4. Coolify UI Steps

If Coolify provides a UI for scheduled tasks:

1. Click **"Add Scheduled Task"** or **"New Cron Job"**
2. **Name**: Give it a descriptive name (e.g., "Morning Briefing Notifications")
3. **Schedule**: Enter the cron expression (e.g., `0 * * * *`)
4. **Command**: Paste the curl command with your actual domain and CRON_SECRET
5. **Save**

Repeat for each notification type.

---

## Alternative: Using Coolify's Built-in Cron Service

If your Coolify setup supports running Node.js scripts directly:

### Create a cron runner script

Create `src/cron/runner.ts`:

```typescript
import { config } from 'dotenv';
config();

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

const job = process.argv[2];

if (!job) {
	console.error('Usage: node runner.js <job-name>');
	process.exit(1);
}

async function runJob() {
	const response = await fetch(`${APP_URL}/api/cron/${job}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${CRON_SECRET}`
		}
	});

	const result = await response.json();
	console.log(result);
}

runJob().catch(console.error);
```

Then in Coolify, schedule:

```bash
# Morning briefing (hourly)
0 * * * * cd /app && node src/cron/runner.js morning-briefing

# Evening wrapup (hourly)
0 * * * * cd /app && node src/cron/runner.js evening-wrapup

# Event reminders (hourly)
0 * * * * cd /app && node src/cron/runner.js event-reminders

# Group activity (every 30 mins)
*/30 * * * * cd /app && node src/cron/runner.js group-activity
```

---

## Monitoring & Testing

### Development Mode Email Testing

When testing notifications in development:

1. **Set environment variables:**

   ```bash
   NODE_ENV=development
   DEV_EMAIL_OVERRIDE=your-test-email@example.com
   ```

2. **All notification emails will be redirected** to `DEV_EMAIL_OVERRIDE`

3. **Original recipient info is preserved** in:
   - Email subject: `[DEV - To: user@example.com] ☀️ Good morning...`
   - Email body: Banner showing original recipient
   - Email text: `ORIGINAL RECIPIENT: user@example.com`

4. **Example redirected email:**

   ```
   To: your-test-email@example.com
   Subject: [DEV - To: john@example.com] ☀️ Good morning, John!

   🔧 DEVELOPMENT MODE
   Original recipient: john@example.com

   [... rest of email content ...]
   ```

This allows you to:

- Test all notification types safely
- See exactly what each user would receive
- Verify email content and formatting
- Debug without spamming real users

### Test Your Endpoints

You can test the cron endpoints manually with curl:

```bash
curl -X POST https://your-domain.com/api/cron/morning-briefing \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
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

### Check Logs

Monitor your Coolify logs for:

- Cron execution times
- Success/failure rates
- Email delivery status
- Any errors from the notification system

### Common Issues

1. **401 Unauthorized**: Check that CRON_SECRET matches in both .env and curl command
2. **No emails sent**: Verify SMTP settings and that users have premium access
3. **Wrong times**: Remember cron runs in UTC; user timezones are handled in the app
4. **Rate limits**: If sending many emails, consider spacing out the cron jobs

---

## Production Recommendations

### Security

- ✅ Use a strong, random CRON_SECRET (32+ characters)
- ✅ Never commit CRON_SECRET to version control
- ✅ Use HTTPS for all cron webhook calls
- ✅ Rotate CRON_SECRET periodically

### Reliability

- ✅ Set up monitoring/alerting for failed cron jobs
- ✅ Log all cron execution results
- ✅ Consider adding retry logic for failed email sends
- ✅ Test with a small group before rolling out to all users

### Performance

- ✅ Run hourly crons to distribute load across the day
- ✅ Consider batching email sends if you have many users
- ✅ Monitor database query performance
- ✅ Use connection pooling for DB queries

---

## Cron Schedule Quick Reference

```
# Every hour at minute 0
0 * * * *

# Every day at 8 AM UTC
0 8 * * *

# Every day at 6 PM UTC
0 18 * * *

# Every 30 minutes
*/30 * * * *

# Every Monday at 9 AM UTC
0 9 * * 1

# First day of month at midnight
0 0 1 * *
```

---

## User Timezone Handling

The system handles timezones automatically:

1. Users set their timezone in `/account/notifications`
2. Cron jobs run every hour (UTC)
3. The API checks each user's timezone and preferred time
4. Only users whose local time matches their preference receive notifications

Example:

- User in `America/New_York` wants morning briefing at 8:00 AM
- Cron runs at 12:00 PM UTC (8 AM Eastern)
- User receives their briefing

---

## Summary

Your scheduled tasks setup should look like this in Coolify:

| Task Name        | Schedule       | Endpoint                     |
| ---------------- | -------------- | ---------------------------- |
| Morning Briefing | `0 * * * *`    | `/api/cron/morning-briefing` |
| Evening Wrapup   | `0 * * * *`    | `/api/cron/evening-wrapup`   |
| Event Reminders  | `0 * * * *`    | `/api/cron/event-reminders`  |
| Group Activity   | `*/30 * * * *` | `/api/cron/group-activity`   |

All authenticated with `Authorization: Bearer YOUR_CRON_SECRET`.

---

## Need Help?

- Check Coolify documentation for platform-specific cron configuration
- Review server logs in Coolify dashboard
- Test endpoints manually with curl before setting up cron
- Monitor email delivery in your SMTP provider's dashboard
