import nodemailer from 'nodemailer';

// SMTP Configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SMTP_FROM = process.env.SMTP_FROM || 'HiveOS <noreply@hiveos.app>';

// Development email override
const DEV_EMAIL_OVERRIDE = process.env.DEV_EMAIL_OVERRIDE || '';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
	host: SMTP_HOST,
	port: SMTP_PORT,
	secure: SMTP_PORT === 465,
	auth: {
		user: SMTP_USER,
		pass: SMTP_PASSWORD
	}
});

// Base email sending function
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
	// In development, redirect all emails to DEV_EMAIL_OVERRIDE if configured
	const originalTo = to;
	if (IS_DEVELOPMENT && DEV_EMAIL_OVERRIDE) {
		to = DEV_EMAIL_OVERRIDE;
		console.log(`🔀 DEV MODE: Redirecting email from ${originalTo} to ${to}`);

		// Prepend original recipient info to subject and content
		subject = `[DEV - To: ${originalTo}] ${subject}`;
		text = `ORIGINAL RECIPIENT: ${originalTo}\n\n${text}`;
		if (html) {
			html = `<div style="background: #fff3cd; border: 2px solid #ffc107; padding: 12px; margin-bottom: 16px; border-radius: 4px;">
        <strong>🔧 DEVELOPMENT MODE</strong><br>
        Original recipient: <strong>${originalTo}</strong>
      </div>${html}`;
		}
	}

	try {
		// For development without SMTP configured, just log
		if (!SMTP_USER || !SMTP_PASSWORD) {
			console.log('📧 EMAIL TO SEND (SMTP not configured):');
			console.log(`To: ${to}`);
			console.log(`Subject: ${subject}`);
			console.log(`Text: ${text}`);
			return Promise.resolve();
		}

		// Send mail with defined transport object
		const info = await transporter.sendMail({
			from: SMTP_FROM,
			to,
			subject,
			text,
			html
		});

		console.log('✅ Email sent successfully:', info.messageId);
		return info;
	} catch (error) {
		console.error('❌ Error sending email:', error);
		throw error;
	}
}

// Send notification when someone joins a group
export async function sendGroupJoinNotification({
	adminEmail,
	adminName,
	newMemberName,
	newMemberEmail,
	groupName
}: {
	adminEmail: string;
	adminName: string;
	newMemberName: string;
	newMemberEmail: string;
	groupName: string;
}) {
	const subject = `New member joined ${groupName}`;

	const text = `Hi ${adminName},

${newMemberName} (${newMemberEmail}) has joined your group "${groupName}" using an access code.

You can view and manage your group members at: ${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/groups

Best regards,
The HiveOS Team`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FFD400 0%, #FFC700 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: 800;">HiveOS</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #000; margin-top: 0; font-size: 22px;">👥 New member joined ${groupName}</h2>
    
    <p style="font-size: 16px; margin: 20px 0;">Hi ${adminName},</p>
    
    <div style="background: #f5f5f5; border-left: 4px solid #FFD400; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px;">
        <strong>${newMemberName}</strong><br>
        <span style="color: #666;">${newMemberEmail}</span>
      </p>
    </div>
    
    <p style="font-size: 16px;">has joined your group <strong>"${groupName}"</strong> using an access code.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/groups" 
         style="display: inline-block; background: #FFD400; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Group Members
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
    
    <p style="font-size: 14px; color: #666; margin: 0;">
      Best regards,<br>
      The HiveOS Team
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">This is an automated notification from HiveOS.</p>
  </div>
</body>
</html>`;

	await sendEmail({
		to: adminEmail,
		subject,
		text,
		html
	});
}
