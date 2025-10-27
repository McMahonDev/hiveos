import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth/auth';

// Get user preferences
export const GET: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const userRecord = await db.query.user.findFirst({
			where: eq(user.id, session.user.id)
		});

		if (!userRecord) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({
			timezone: userRecord.timezone,
			notify_morning_briefing: userRecord.notifyMorningBriefing,
			notify_evening_wrapup: userRecord.notifyEveningWrapup,
			notify_event_reminders: userRecord.notifyEventReminders,
			notify_shopping_reminders: userRecord.notifyShoppingReminders,
			notify_task_followups: userRecord.notifyTaskFollowups,
			notify_group_activity: userRecord.notifyGroupActivity,
			notify_weekly_summary: userRecord.notifyWeeklySummary,
			notify_subscription_updates: userRecord.notifySubscriptionUpdates,
			morning_briefing_time: userRecord.morningBriefingTime,
			evening_wrapup_time: userRecord.eveningWrapupTime
		});
	} catch (error) {
		console.error('Error fetching user preferences:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// Update user preferences
export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		await db
			.update(user)
			.set({
				timezone: data.timezone,
				notifyMorningBriefing: data.notify_morning_briefing,
				notifyEveningWrapup: data.notify_evening_wrapup,
				notifyEventReminders: data.notify_event_reminders,
				notifyShoppingReminders: data.notify_shopping_reminders,
				notifyTaskFollowups: data.notify_task_followups,
				notifyGroupActivity: data.notify_group_activity,
				notifyWeeklySummary: data.notify_weekly_summary,
				notifySubscriptionUpdates: data.notify_subscription_updates,
				morningBriefingTime: data.morning_briefing_time,
				eveningWrapupTime: data.evening_wrapup_time,
				updatedAt: new Date()
			})
			.where(eq(user.id, session.user.id));

		return json({ success: true });
	} catch (error) {
		console.error('Error updating user preferences:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
