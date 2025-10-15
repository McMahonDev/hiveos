import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../server/db/index.ts";
import { schema } from "../combinedSchema.ts";
import nodemailer from "nodemailer";

// SMTP Configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SMTP_FROM = process.env.SMTP_FROM || 'HiveOS <noreply@hiveos.app>';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

// Email sending function using nodemailer
async function sendEmail({ to, subject, text, html }: { 
  to: string; 
  subject: string; 
  text: string; 
  html?: string; 
}) {
  console.log('=== sendEmail CALLED ===');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('SMTP_USER configured:', !!SMTP_USER);
  console.log('SMTP_PASSWORD configured:', !!SMTP_PASSWORD);
  console.log('SMTP_HOST:', SMTP_HOST);
  console.log('SMTP_PORT:', SMTP_PORT);
  
  try {
    // For development without SMTP configured, just log
    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.log('--- EMAIL TO SEND (SMTP not configured) ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('--- END EMAIL ---');
      return Promise.resolve();
    }

    console.log('Attempting to send email via SMTP...');
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}
 
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
    schema: schema
  }), 
 
  emailAndPassword: { 
    enabled: true,
    requireEmailVerification: true, // Require email verification before login
    autoSignIn: false, // Don't auto sign in after registration
    sendResetPassword: async ({ user, url, token }: { user: any; url: string; token: string }, request?: any) => {
      console.log('🔔 sendResetPassword triggered for:', user.email);
      await sendEmail({
        to: user.email,
        subject: "Reset your password - HiveOS",
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
        `,
      });
    },
  },
  
  emailVerification: {
    sendOnSignUp: true, // Automatically send verification email on signup
    sendVerificationEmail: async ({ user, url, token }: { user: any; url: string; token: string }, request?: any) => {
      console.log('🔔 sendVerificationEmail triggered for:', user.email);
      await sendEmail({
        to: user.email,
        subject: "Verify your email - HiveOS",
        text: `Welcome to HiveOS! Please verify your email address by clicking this link: ${url}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1f51;">Welcome to HiveOS!</h2>
            <p>Thank you for signing up. To complete your registration, please verify your email address.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${url}" style="display: inline-block; background-color: #ffd400; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Verify Email</a>
            <p>If you didn't create an account with HiveOS, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p style="color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser: ${url}</p>
          </div>
        `,
      });
    },
  },
  advanced:{
    cookiePrefix: "hiveos", // Prefix for cookies
  },
  trustedOrigins: ["http://localhost:5173", "http://localhost:5174"]
  
});