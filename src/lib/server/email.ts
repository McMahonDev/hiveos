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

// === NOTIFICATION EMAIL TEMPLATES ===

/**
 * Send morning briefing email with today's events, tasks, and lists
 */
export async function sendMorningBriefing({
	userEmail,
	userName,
	data
}: {
	userEmail: string;
	userName: string;
	data: {
		todaysEvents: Array<{ name: string; time: string; location?: string }>;
		incompleteTasks: number;
		shoppingLists: Array<{ name: string; itemCount: number }>;
		customLists: Array<{ name: string; type: string; itemCount: number }>;
	};
}) {
	const subject = `☀️ Good morning, ${userName}! Your day at a glance`;

	const hasContent =
		data.todaysEvents.length > 0 ||
		data.incompleteTasks > 0 ||
		data.shoppingLists.length > 0 ||
		data.customLists.length > 0;

	const text = `Good morning, ${userName}!

${hasContent ? "Here's what's on your plate today:" : "You have a clear schedule today! 🎉"}

${
	data.todaysEvents.length > 0
		? `📅 TODAY'S EVENTS (${data.todaysEvents.length})
${data.todaysEvents
	.map(
		(event) =>
			`• ${event.time} - ${event.name}${event.location ? ` at ${event.location}` : ''}`
	)
	.join('\n')}

`
		: ''
}${data.incompleteTasks > 0 ? `✅ TASKS: ${data.incompleteTasks} pending\n\n` : ''}${
		data.shoppingLists.length > 0
			? `🛒 SHOPPING LISTS
${data.shoppingLists.map((list) => `• ${list.name} (${list.itemCount} items)`).join('\n')}

`
			: ''
	}${
		data.customLists.length > 0
			? `📋 OTHER LISTS
${data.customLists.map((list) => `• ${list.name} (${list.itemCount} items)`).join('\n')}

`
			: ''
	}
View your full schedule: ${process.env.VITE_APP_URL || 'https://hiveos.app'}/my-day

Have a productive day!
The HiveOS Team`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #FFD400 0%, #FFC700 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 800;">☀️ Good Morning!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${userName},</p>
    
    ${
			hasContent
				? `<p style="font-size: 16px;">Here's what's on your plate today:</p>`
				: `<div style="text-align: center; padding: 40px 20px;">
        <p style="font-size: 20px; margin: 0;">You have a clear schedule today! 🎉</p>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">Perfect day to relax or start something new.</p>
      </div>`
		}
    
    ${
			data.todaysEvents.length > 0
				? `
    <div style="background: #f8f9fa; border-left: 4px solid #4A90E2; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #000; font-size: 18px;">📅 Today's Events (${data.todaysEvents.length})</h3>
      ${data.todaysEvents
				.map(
					(event) => `
        <div style="margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
          <div style="font-weight: 600; color: #333;">${event.name}</div>
          <div style="font-size: 14px; color: #666;">
            🕐 ${event.time}${event.location ? ` • 📍 ${event.location}` : ''}
          </div>
        </div>`
				)
				.join('')}
    </div>`
				: ''
		}
    
    ${
			data.incompleteTasks > 0
				? `
    <div style="background: #f8f9fa; border-left: 4px solid #50C878; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0; color: #000; font-size: 18px;">✅ Tasks</h3>
      <p style="margin: 8px 0 0 0; font-size: 16px; color: #666;">You have <strong>${data.incompleteTasks} pending tasks</strong></p>
    </div>`
				: ''
		}
    
    ${
			data.shoppingLists.length > 0
				? `
    <div style="background: #f8f9fa; border-left: 4px solid #FF6B6B; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #000; font-size: 18px;">🛒 Shopping Lists</h3>
      ${data.shoppingLists
				.map(
					(list) => `
        <div style="margin: 8px 0;">• ${list.name} <span style="color: #666;">(${list.itemCount} items)</span></div>`
				)
				.join('')}
    </div>`
				: ''
		}
    
    ${
			data.customLists.length > 0
				? `
    <div style="background: #f8f9fa; border-left: 4px solid #9B59B6; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #000; font-size: 18px;">📋 Other Lists</h3>
      ${data.customLists
				.map(
					(list) => `
        <div style="margin: 8px 0;">• ${list.name} <span style="color: #666;">(${list.itemCount} items)</span></div>`
				)
				.join('')}
    </div>`
				: ''
		}
    
    ${
			hasContent
				? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/my-day" 
         style="display: inline-block; background: #FFD400; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Full Schedule
      </a>
    </div>`
				: ''
		}
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
    
    <p style="font-size: 14px; color: #666; margin: 0;">
      Have a productive day!<br>
      The HiveOS Team
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">You're receiving this because you enabled morning briefings.</p>
    <p style="margin: 5px 0 0 0;"><a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/notifications" style="color: #666;">Manage notification settings</a></p>
  </div>
</body>
</html>`;

	await sendEmail({
		to: userEmail,
		subject,
		text,
		html
	});
}

/**
 * Send evening wrap-up email with today's accomplishments
 */
export async function sendEveningWrapup({
	userEmail,
	userName,
	data
}: {
	userEmail: string;
	userName: string;
	data: {
		completedTasks: number;
		eventsAttended: number;
		tomorrowsEvents: Array<{ name: string; time: string }>;
		pendingTasks: number;
	};
}) {
	const subject = `🌙 ${userName}, here's your day in review`;

	const text = `Good evening, ${userName}!

Here's how your day went:

${data.completedTasks > 0 ? `✅ Completed ${data.completedTasks} tasks` : ''}
${data.eventsAttended > 0 ? `📅 Attended ${data.eventsAttended} events` : ''}
${data.completedTasks === 0 && data.eventsAttended === 0 ? 'No completed tasks or events today.' : ''}

${
	data.tomorrowsEvents.length > 0
		? `
TOMORROW'S SCHEDULE:
${data.tomorrowsEvents.map((event) => `• ${event.time} - ${event.name}`).join('\n')}
`
		: ''
}
${data.pendingTasks > 0 ? `You have ${data.pendingTasks} pending tasks.\n` : ''}

View your schedule: ${process.env.VITE_APP_URL || 'https://hiveos.app'}/my-day

Rest well!
The HiveOS Team`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e;">
  <div style="background: linear-gradient(135deg, #16213E 0%, #0F3460 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #FFD400; font-size: 24px; font-weight: 800;">🌙 Day in Review</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Good evening, ${userName}!</p>
    
    <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 16px 0; color: #000; font-size: 18px;">Today's Accomplishments</h3>
      ${
				data.completedTasks > 0 || data.eventsAttended > 0
					? `
      <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
        ${
					data.completedTasks > 0
						? `
        <div style="text-align: center; padding: 16px;">
          <div style="font-size: 32px; font-weight: bold; color: #50C878;">${data.completedTasks}</div>
          <div style="font-size: 14px; color: #666;">Tasks Completed</div>
        </div>`
						: ''
				}
        ${
					data.eventsAttended > 0
						? `
        <div style="text-align: center; padding: 16px;">
          <div style="font-size: 32px; font-weight: bold; color: #4A90E2;">${data.eventsAttended}</div>
          <div style="font-size: 14px; color: #666;">Events Attended</div>
        </div>`
						: ''
				}
      </div>`
					: `<p style="text-align: center; color: #666; margin: 0;">No completed tasks or events today.</p>`
			}
    </div>
    
    ${
			data.tomorrowsEvents.length > 0
				? `
    <div style="background: #fff8e1; border-left: 4px solid #FFD400; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #000; font-size: 18px;">📅 Tomorrow's Schedule</h3>
      ${data.tomorrowsEvents
				.map(
					(event) => `
        <div style="margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="font-weight: 600; color: #333;">${event.name}</div>
          <div style="font-size: 14px; color: #666;">🕐 ${event.time}</div>
        </div>`
				)
				.join('')}
    </div>`
				: ''
		}
    
    ${
			data.pendingTasks > 0
				? `
    <div style="text-align: center; padding: 16px; margin: 20px 0;">
      <p style="font-size: 14px; color: #666; margin: 0;">You have <strong>${data.pendingTasks} pending tasks</strong> to tackle.</p>
    </div>`
				: ''
		}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/my-day" 
         style="display: inline-block; background: #FFD400; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Tomorrow's Schedule
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
    
    <p style="font-size: 14px; color: #666; margin: 0;">
      Rest well!<br>
      The HiveOS Team
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">You're receiving this because you enabled evening wrap-ups.</p>
    <p style="margin: 5px 0 0 0;"><a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/notifications" style="color: #666;">Manage notification settings</a></p>
  </div>
</body>
</html>`;

	await sendEmail({
		to: userEmail,
		subject,
		text,
		html
	});
}

/**
 * Send event reminder email
 */
export async function sendEventReminder({
	userEmail,
	userName,
	event
}: {
	userEmail: string;
	userName: string;
	event: {
		name: string;
		date: string;
		time: string;
		location?: string;
		description?: string;
	};
}) {
	const subject = `⏰ Reminder: ${event.name} in 1 hour`;

	const text = `Hi ${userName},

This is a reminder that your event "${event.name}" starts in 1 hour.

📅 Date: ${event.date}
🕐 Time: ${event.time}
${event.location ? `📍 Location: ${event.location}` : ''}
${event.description ? `\nDetails: ${event.description}` : ''}

View event: ${process.env.VITE_APP_URL || 'https://hiveos.app'}/events

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
  <div style="background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 800;">⏰ Event Reminder</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${userName},</p>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px; text-align: center;">
      <p style="margin: 0; font-size: 18px; font-weight: 600;">Your event starts in <span style="color: #ff6b6b;">1 hour</span></p>
    </div>
    
    <div style="background: #f8f9fa; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <h2 style="margin: 0 0 16px 0; color: #000; font-size: 22px;">${event.name}</h2>
      
      <div style="margin: 12px 0;">
        <span style="font-weight: 600;">📅 Date:</span> ${event.date}
      </div>
      <div style="margin: 12px 0;">
        <span style="font-weight: 600;">🕐 Time:</span> ${event.time}
      </div>
      ${event.location ? `<div style="margin: 12px 0;"><span style="font-weight: 600;">📍 Location:</span> ${event.location}</div>` : ''}
      ${event.description ? `<div style="margin: 16px 0; padding-top: 16px; border-top: 1px solid #e0e0e0;"><div style="font-weight: 600; margin-bottom: 8px;">Details:</div><div style="color: #666;">${event.description}</div></div>` : ''}
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/my-day" 
         style="display: inline-block; background: #4A90E2; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Event
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
    
    <p style="font-size: 14px; color: #666; margin: 0;">
      Best regards,<br>
      The HiveOS Team
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">You're receiving this because you enabled event reminders.</p>
    <p style="margin: 5px 0 0 0;"><a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/notifications" style="color: #666;">Manage notification settings</a></p>
  </div>
</body>
</html>`;

	await sendEmail({
		to: userEmail,
		subject,
		text,
		html
	});
}

/**
 * Send group activity notification when someone adds multiple items
 */
export async function sendGroupActivityNotification({
	userEmail,
	userName,
	data
}: {
	userEmail: string;
	userName: string;
	data: {
		memberName: string;
		groupName: string;
		listType: string; // 'events', 'shopping', 'tasks', etc.
		itemsAdded: number;
		items: Array<{ name: string }>;
	};
}) {
	const subject = `📋 ${data.memberName} added ${data.itemsAdded} items to ${data.groupName}`;

	const listTypeEmoji: Record<string, string> = {
		events: '📅',
		shopping: '🛒',
		tasks: '✅',
		custom: '📋'
	};

	const emoji = listTypeEmoji[data.listType] || '📋';

	const text = `Hi ${userName},

${data.memberName} just added ${data.itemsAdded} items to "${data.groupName}":

${data.items.map((item) => `• ${item.name}`).join('\n')}

View in HiveOS: ${process.env.VITE_APP_URL || 'https://hiveos.app'}

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
  <div style="background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 800;">${emoji} Group Activity</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${userName},</p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #9B59B6; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px;">
        <strong>${data.memberName}</strong> just added <strong>${data.itemsAdded} items</strong> to <strong>"${data.groupName}"</strong>
      </p>
    </div>
    
    <div style="background: #fafafa; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; color: #000; font-size: 18px;">New Items:</h3>
      ${data.items.map((item) => `<div style="margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">• ${item.name}</div>`).join('')}
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}" 
         style="display: inline-block; background: #9B59B6; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View in HiveOS
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
    
    <p style="font-size: 14px; color: #666; margin: 0;">
      Best regards,<br>
      The HiveOS Team
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">You're receiving this because you enabled group activity notifications.</p>
    <p style="margin: 5px 0 0 0;"><a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/notifications" style="color: #666;">Manage notification settings</a></p>
  </div>
</body>
</html>`;

	await sendEmail({
		to: userEmail,
		subject,
		text,
		html
	});
}

/**
 * Send notification when a user's subscription is downgraded
 */
export async function sendSubscriptionDowngradeNotification({
	userEmail,
	userName,
	previousTier,
	reason
}: {
	userEmail: string;
	userName: string;
	previousTier: string;
	reason: 'expired' | 'canceled';
}) {
	const tierNames: Record<string, string> = {
		individual: 'Individual Plan ($5/month)',
		family: 'Family Plan ($20/month)'
	};

	const tierName = tierNames[previousTier] || previousTier;
	const reasonText = reason === 'expired' 
		? 'your subscription period has ended' 
		: 'your subscription was canceled';

	const subject = `Your HiveOS subscription has ended`;

	const text = `Hi ${userName},

This is to confirm that your ${tierName} subscription has ended because ${reasonText}.

Your account has been downgraded to the Free plan. You still have access to HiveOS, but some premium features are no longer available:

What you've lost:
• Group collaboration features
• Unlimited storage
• Premium notification settings
• Priority support

${previousTier === 'family' ? `\nYour family group has been deleted and all members have been removed.\n` : ''}

What you still have:
• All your personal lists, tasks, and events
• Access to all 8 list types
• Basic notification features
• Web and mobile access

Want to keep your premium features? You can resubscribe anytime at:
${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/upgrade

Questions? Reply to this email or visit our support page.

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
  <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 800;">📋 Subscription Update</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${userName},</p>
    
    <div style="background: #fff3cd; border-left: 4px solid #f39c12; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px;">
        Your <strong>${tierName}</strong> subscription has ended because ${reasonText}.
      </p>
    </div>
    
    <p style="font-size: 16px;">Your account has been downgraded to the <strong>Free plan</strong>. You still have access to HiveOS, but some premium features are no longer available.</p>
    
    <div style="background: #fee; padding: 20px; margin: 24px 0; border-radius: 8px; border: 1px solid #fcc;">
      <h3 style="margin: 0 0 12px 0; color: #c00; font-size: 18px;">What you've lost:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Group collaboration features</li>
        <li>Unlimited storage</li>
        <li>Premium notification settings</li>
        <li>Priority support</li>
      </ul>
      ${previousTier === 'family' ? `<p style="margin: 12px 0 0 0; color: #c00;"><strong>⚠️ Your family group has been deleted and all members have been removed.</strong></p>` : ''}
    </div>
    
    <div style="background: #efe; padding: 20px; margin: 24px 0; border-radius: 8px; border: 1px solid #cfc;">
      <h3 style="margin: 0 0 12px 0; color: #060; font-size: 18px;">What you still have:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>All your personal lists, tasks, and events</li>
        <li>Access to all 8 list types</li>
        <li>Basic notification features</li>
        <li>Web and mobile access</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <p style="font-size: 16px; margin-bottom: 16px;">Want to keep your premium features?</p>
      <a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/upgrade" 
         style="display: inline-block; background: #f39c12; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Resubscribe Now
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
    
    <p style="font-size: 14px; color: #666; margin: 0;">
      Questions? Reply to this email or visit our support page.<br><br>
      Best regards,<br>
      The HiveOS Team
    </p>
  </div>
</body>
</html>`;

	await sendEmail({
		to: userEmail,
		subject,
		text,
		html
	});
}

/**
 * Send notification to group member when they are removed due to owner's subscription ending
 */
export async function sendGroupMemberRemovedNotification({
	userEmail,
	userName,
	groupName,
	ownerName
}: {
	userEmail: string;
	userName: string;
	groupName: string;
	ownerName: string;
}) {
	const subject = `You've been removed from "${groupName}"`;

	const text = `Hi ${userName},

This is to inform you that you have been removed from the group "${groupName}" because ${ownerName}'s Family Plan subscription has ended.

What this means for you:
• You no longer have access to "${groupName}"
• All shared lists, tasks, and events from this group are no longer visible to you
• Your personal lists and data remain intact
• You've been switched back to personal mode

If you need group collaboration features, you can:
• Upgrade to an Individual Plan ($5/month) to join other groups
• Subscribe to a Family Plan ($20/month) to create your own groups

We're sorry to see the group go! If you have any questions, please don't hesitate to reach out.

Best regards,
The HiveOS Team

${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/upgrade`;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 800;">👥 Group Update</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${userName},</p>
    
    <div style="background: #ffebee; border-left: 4px solid #e74c3c; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px;">
        You have been removed from the group <strong>"${groupName}"</strong> because ${ownerName}'s Family Plan subscription has ended.
      </p>
    </div>
    
    <div style="background: #fafafa; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; color: #000; font-size: 18px;">What this means for you:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>You no longer have access to "${groupName}"</li>
        <li>All shared lists, tasks, and events from this group are no longer visible to you</li>
        <li>Your personal lists and data remain intact</li>
        <li>You've been switched back to personal mode</li>
      </ul>
    </div>
    
    <div style="background: #e3f2fd; padding: 20px; margin: 24px 0; border-radius: 8px; border: 1px solid #90caf9;">
      <h3 style="margin: 0 0 12px 0; color: #1976d2; font-size: 18px;">Need group features?</h3>
      <p style="margin: 0;">If you need group collaboration features, you can:</p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>Upgrade to an Individual Plan ($5/month) to join other groups</li>
        <li>Subscribe to a Family Plan ($20/month) to create your own groups</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/upgrade" 
         style="display: inline-block; background: #1976d2; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Plans
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
    
    <p style="font-size: 14px; color: #666; margin: 0;">
      We're sorry to see the group go! If you have any questions, please don't hesitate to reach out.<br><br>
      Best regards,<br>
      The HiveOS Team
    </p>
  </div>
</body>
</html>`;

	await sendEmail({
		to: userEmail,
		subject,
		text,
		html
	});
}



/**
 * Send warning email 7 days before subscription cancellation
 */
export async function sendSubscriptionCancellationWarning7Days({
userEmail,
userName,
tier,
endDate
}: {
userEmail: string;
userName: string;
tier: string;
endDate: string;
}) {
const tierNames: Record<string, string> = {
individual: 'Individual Plan ($5/month)',
family: 'Family Plan ($20/month)'
};

const tierName = tierNames[tier] || tier;

const subject = 'Your HiveOS subscription ends in 7 days';

const text = `Hi ${userName},

This is a friendly reminder that your ${tierName} subscription is set to cancel on ${endDate}.

Want to keep your premium features?
You can reactivate your subscription anytime before ${endDate} by visiting:
${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/subscription

Best regards,
The HiveOS Team`;

await sendEmail({
to: userEmail,
subject,
text
});
}

/**
 * Send warning email 1 day before subscription cancellation
 */
export async function sendSubscriptionCancellationWarning1Day({
userEmail,
userName,
tier,
endDate
}: {
userEmail: string;
userName: string;
tier: string;
endDate: string;
}) {
const tierNames: Record<string, string> = {
individual: 'Individual Plan ($5/month)',
family: 'Family Plan ($20/month)'
};

const tierName = tierNames[tier] || tier;

const subject = 'Last chance! Your HiveOS subscription ends tomorrow';

const text = `Hi ${userName},

This is your final reminder that your ${tierName} subscription ends TOMORROW on ${endDate}.

This is your last chance to keep your premium features!

Reactivate now:
${process.env.VITE_APP_URL || 'https://hiveos.app'}/account/subscription

Best regards,
The HiveOS Team`;

await sendEmail({
to: userEmail,
subject,
text
});
}
