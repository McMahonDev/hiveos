# Development Email Override System

## Overview

The email system now supports redirecting all emails to a specific address during development, preventing accidental emails to real users while testing.

## How It Works

### Environment Variables

- `DEV_EMAIL_OVERRIDE`: Set this to your test email address (e.g., `dev@example.com`)
- `NODE_ENV`: Set to `development` (or leave unset, defaults to development)

### Behavior

When both conditions are met:

1. `NODE_ENV` is `development` (or not set)
2. `DEV_EMAIL_OVERRIDE` is configured

All emails will be:

- Sent to the override email address instead of the original recipient
- Modified to include the original recipient information:
  - Subject line: `[DEV - To: original@email.com] Original Subject`
  - Email body: Includes a banner showing the original recipient
  - Plain text: Prepended with `ORIGINAL RECIPIENT: original@email.com`

### Setup

1. Open `.env` file
2. Uncomment and set your development email:

   ```bash
   DEV_EMAIL_OVERRIDE=your-dev-email@example.com
   NODE_ENV=development
   ```

3. All emails will now be redirected to your address

### Production

In production:

- Set `NODE_ENV=production`
- Or simply don't set `DEV_EMAIL_OVERRIDE`
- Emails will be sent to actual recipients

### Example

**Original email to:** `user@example.com`  
**Dev override set to:** `dev@company.com`

**Result:**

- Email sent to: `dev@company.com`
- Subject: `[DEV - To: user@example.com] Verify your email - HiveOS`
- Body includes: Yellow banner showing "Original recipient: user@example.com"

### Testing Email Flows

This is perfect for:

- Testing email verification flows
- Testing password reset emails
- Testing invitation emails
- QA testing without spamming real users
- Demoing the app safely

### Console Output

When email override is active, you'll see:

```
🔀 DEV MODE: Redirecting email from user@example.com to dev@company.com
```

## Code Location

The email override logic is in `/src/lib/auth/auth.ts` in the `sendEmail()` function.
