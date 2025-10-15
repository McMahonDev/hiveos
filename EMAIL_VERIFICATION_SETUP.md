# Email Verification Setup

This document describes the email verification system implemented for HiveOS authentication.

## Overview

Email verification has been added to the authentication flow to ensure users verify their email addresses before they can log in. The system uses SMTP for sending emails and Better Auth's built-in email verification functionality.

## Changes Made

### 1. Environment Variables (.env)

Added SMTP configuration variables:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=HiveOS <noreply@hiveos.app>
```

**Action Required:** Update these values with your actual SMTP server credentials.

### 2. Dependencies

Installed:

- `nodemailer` - For SMTP email sending
- `@types/nodemailer` - TypeScript types for nodemailer

### 3. Authentication Configuration (src/lib/auth/auth.ts)

**Key Changes:**

- Integrated nodemailer with SMTP configuration
- Enabled `requireEmailVerification: true`
- Set `autoSignIn: false` to prevent auto-login after registration
- Implemented `sendVerificationEmail` function with branded HTML emails
- Updated `sendResetPassword` function to use SMTP
- Fallback to console logging when SMTP is not configured (for development)

**Email Templates:**
Both verification and password reset emails include:

- Branded HTML formatting with HiveOS colors
- Clear call-to-action buttons
- Fallback text for email clients that don't support HTML
- Security messaging about link expiration (24 hours)

### 4. Email Verification Page (src/routes/account/verify-email/+page.svelte)

Created a new page that:

- Extracts the verification token from URL query parameters
- Automatically verifies the email on page load
- Shows loading state during verification
- Displays success message and auto-redirects to login
- Handles errors gracefully with the option to resend verification email
- Includes proper styling with success/error icons

**Features:**

- ✓ Automatic verification on page load
- ✓ Loading spinner during verification
- ✓ Success confirmation with auto-redirect
- ✓ Error handling with resend option
- ✓ Visual feedback (icons, colors)

### 5. Registration Page Updates (src/routes/account/register/+page.svelte)

**Changes:**

- Added `callbackURL` to sign-up request pointing to verify-email page
- Replaced auto-login behavior with success message
- Shows email verification instructions after registration
- Displays the registered email address for confirmation
- Clears form after successful registration
- Added styled success message component

**User Flow:**

1. User fills out registration form
2. On success, form is hidden
3. Success message appears with:
   - Checkmark icon
   - Confirmation message
   - Registered email address
   - Instructions to check inbox
   - Reminder to check spam folder
   - Link to login page

### 6. Login Page Updates (src/routes/account/login/+page.svelte)

**Changes:**

- Added detection for email verification errors
- Displays user-friendly message when email is not verified
- Added "Resend Verification Email" button in error state
- Shows success confirmation when verification email is resent
- Handles success messages from URL parameters (e.g., after email verification)

**User Flow:**

1. User attempts to log in with unverified email
2. Error message explains verification is required
3. "Resend Verification Email" button appears
4. User can click to receive a new verification email
5. Success message confirms email was sent

## Complete User Journey

### Registration Flow

1. **User visits `/account/register`**
   - Fills out registration form (name, email, password)
2. **After clicking "Sign Up"**
   - Account is created in database
   - Verification email is automatically sent
   - User sees success message on same page
   - Form is hidden, instructions are shown

3. **User checks email**
   - Receives branded verification email
   - Clicks verification link

4. **User clicks verification link**
   - Redirected to `/account/verify-email?token=xxx&email=xxx`
   - Token is automatically verified
   - Success message is shown
   - Auto-redirected to login page after 3 seconds

5. **User logs in**
   - Can now successfully log in with verified email

### Login with Unverified Email Flow

1. **User attempts login with unverified email**
   - Login fails with verification required error
   - Error message explains the issue
   - "Resend Verification Email" button appears

2. **User clicks "Resend Verification Email"**
   - New verification email is sent
   - Success confirmation is shown
   - User checks email and follows verification link

3. **After verification**
   - User can successfully log in

## Email Templates

### Verification Email

- **Subject:** "Verify your email - HiveOS"
- **Content:** Welcome message with branded button
- **Colors:** HiveOS brand colors (#1a1f51, #ffd400)
- **Expiration:** 24 hours

### Password Reset Email

- **Subject:** "Reset your password - HiveOS"
- **Content:** Reset instructions with branded button
- **Colors:** HiveOS brand colors (#1a1f51, #ffd400)
- **Expiration:** 24 hours

## SMTP Configuration Guide

### Common SMTP Providers

#### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
SMTP_FROM=HiveOS <your-email@gmail.com>
```

#### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=HiveOS <noreply@yourdomain.com>
```

#### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=HiveOS <noreply@yourdomain.com>
```

#### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=HiveOS <noreply@yourdomain.com>
```

## Development vs Production

### Development Mode (SMTP not configured)

When SMTP credentials are not provided, the system will:

- Log email content to console instead of sending
- Allow you to test the flow without email delivery
- Show all email details in server logs

### Production Mode (SMTP configured)

When SMTP credentials are provided, the system will:

- Send actual emails via SMTP
- Log successful sends with message IDs
- Log errors if sending fails

## Testing

### Test Email Verification Flow

1. **Start the development server:**

   ```bash
   pnpm dev
   ```

2. **Register a new account:**
   - Go to `http://localhost:5173/account/register`
   - Fill out the form
   - Submit registration

3. **Check console logs:**
   - If SMTP is not configured, you'll see the verification email in console
   - Copy the verification URL from the logs

4. **Verify email:**
   - Paste the verification URL in browser
   - Confirm verification succeeds
   - Check redirect to login page

5. **Test login:**
   - Log in with the verified account
   - Should succeed immediately

### Test Unverified Email Login

1. **Manually mark an account as unverified in database**

2. **Attempt to log in:**
   - Should see verification required error
   - "Resend Verification Email" button should appear

3. **Click resend button:**
   - Should see success message
   - Check console/email for new verification link

## Security Considerations

1. **Token Expiration:** Verification tokens expire after 24 hours
2. **HTTPS Required:** Use HTTPS in production for secure token transmission
3. **SMTP Credentials:** Keep SMTP credentials secure, never commit to version control
4. **Rate Limiting:** Consider adding rate limiting to prevent email spam
5. **Email Validation:** Both client and server validate email format

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials:**
   - Verify all SMTP environment variables are set
   - Test credentials with your SMTP provider

2. **Check logs:**
   - Look for error messages in server console
   - Check if emails are being logged instead of sent

3. **Firewall issues:**
   - Ensure port 587 (or 465) is not blocked
   - Some hosting providers block SMTP ports

4. **Authentication:**
   - Gmail requires App Passwords (not regular password)
   - Some providers require explicit sending authorization

### Verification Not Working

1. **Check token in URL:**
   - Verify token is present in URL query parameters
   - Check token hasn't expired (24 hours)

2. **Database:**
   - Verify user record exists
   - Check emailVerified field in database

3. **Console errors:**
   - Check browser console for JavaScript errors
   - Check server logs for API errors

## Files Modified

- `.env` - Added SMTP configuration
- `src/lib/auth/auth.ts` - Updated with email verification and SMTP
- `src/routes/account/verify-email/+page.svelte` - New verification page
- `src/routes/account/register/+page.svelte` - Updated registration flow
- `src/routes/account/login/+page.svelte` - Updated login with verification handling
- `package.json` - Added nodemailer dependencies

## Next Steps

1. **Configure SMTP:**
   - Update `.env` with real SMTP credentials
   - Test email sending in development

2. **Customize Email Templates:**
   - Update email HTML to match brand
   - Add company logo if desired
   - Adjust colors and styling

3. **Production Deployment:**
   - Ensure SMTP credentials are in production environment
   - Update BETTER_AUTH_URL to production domain
   - Test complete flow in production

4. **Optional Enhancements:**
   - Add rate limiting to prevent spam
   - Implement email verification reminders
   - Add analytics for verification tracking
   - Create admin panel to manage unverified users

## Support

For issues or questions:

1. Check Better Auth documentation: https://better-auth.com
2. Review nodemailer documentation: https://nodemailer.com
3. Check SMTP provider documentation for specific configuration
