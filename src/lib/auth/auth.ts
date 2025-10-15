import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../server/db/index.ts';
import { schema } from '../combinedSchema.ts';

// Simple email sending function for development
// In production, replace this with your actual email service (SendGrid, Mailgun, etc.)
async function sendEmail({
	to,
	subject,
	text,
	html
}: {
	to: string;
	subject: string;
	text: string;
	html?: string;
}) {
	// For development, we'll just log the email
	// In production, integrate with your email service
	console.log('--- EMAIL TO SEND ---');
	console.log(`To: ${to}`);
	console.log(`Subject: ${subject}`);
	console.log(`Text: ${text}`);
	console.log('--- END EMAIL ---');

	// Return success for development
	return Promise.resolve();
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg', // or "pg" or "mysql"
		schema: schema
	}),

	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url, token }, request) => {
			await sendEmail({
				to: user.email,
				subject: 'Reset your password - HiveOS',
				text: `Click the link to reset your password: ${url}`,
				html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1f51;">Reset Your Password</h2>
            <p>We received a request to reset your password for your HiveOS account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${url}" style="display: inline-block; background-color: #ffd400; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p style="color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser: ${url}</p>
          </div>
        `
			});
		}
	},

	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url, token }, request) => {
			await sendEmail({
				to: user.email,
				subject: 'Verify your email - HiveOS',
				text: `Click the link to verify your email: ${url}`,
				html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1f51;">Verify Your Email</h2>
            <p>Welcome to HiveOS! Please verify your email address to complete your account setup.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${url}" style="display: inline-block; background-color: #ffd400; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Verify Email</a>
            <p>This verification link will expire in 24 hours.</p>
            <p style="color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser: ${url}</p>
          </div>
        `
			});
		}
	},

	advanced: {
		cookiePrefix: 'hiveos' // Prefix for cookies
	},
	trustedOrigins: ['http://localhost:5173', 'http://localhost:5174']
});
