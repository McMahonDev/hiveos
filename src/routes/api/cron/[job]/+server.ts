import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user, events, tasks, shoppingList, customLists, customListItems, userGroupMembers } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import {
	hasPremiumAccess,
	getUsersForNotification,
	getUsersForMorningBriefing,
	getUsersForEveningWrapup
} from '$lib/server/notifications';
import {
	sendMorningBriefing,
	sendEveningWrapup,
	sendEventReminder,
	sendGroupActivityNotification
} from '$lib/server/email';

// Secret key for authenticating cron requests (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET || 'your-secure-cron-secret-change-this';

/**
 * Cron job endpoint handler
 * Supports different job types via URL parameter
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const { job } = params;

	// Authenticate the request
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		switch (job) {
			case 'morning-briefing':
				return await handleMorningBriefing();

			case 'evening-wrapup':
				return await handleEveningWrapup();

			case 'event-reminders':
				return await handleEventReminders();

			case 'group-activity':
				// This would typically be triggered by a webhook or realtime system
				// but can be run as a check for recent activity
				return await handleGroupActivity();

			default:
				return json({ error: 'Unknown job type' }, { status: 400 });
		}
	} catch (error) {
		console.error(`Error running cron job ${job}:`, error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

/**
 * Send morning briefing to all eligible users
 */
async function handleMorningBriefing() {
	const currentHour = new Date().getHours();
	const users = await getUsersForMorningBriefing(currentHour);

	let successCount = 0;
	let errorCount = 0;

	for (const u of users) {
		try {
			// Get today's events
			const today = new Date().toISOString().split('T')[0];
			const todaysEvents = await db.query.events.findMany({
				where: and(eq(events.assignedToId, u.id), eq(events.date, today))
			});

			// Get incomplete tasks
			const incompleteTasks = await db.query.tasks.findMany({
				where: and(eq(tasks.assignedToId, u.id), eq(tasks.status, false))
			});

			// Get shopping lists with items
			const shoppingLists = await db.query.shoppingList.findMany({
				where: and(eq(shoppingList.assignedToId, u.id), eq(shoppingList.status, false))
			});

			// Get custom lists with items
			const userCustomLists = await db.query.customLists.findMany({
				where: eq(customLists.createdById, u.id)
			});

			const customListsWithCounts = await Promise.all(
				userCustomLists.map(async (list) => {
					const items = await db.query.customListItems.findMany({
						where: and(eq(customListItems.customListId, list.id), eq(customListItems.status, false))
					});
					return {
						name: list.name || 'Untitled List',
						type: list.listType || 'custom',
						itemCount: items.length
					};
				})
			);

			await sendMorningBriefing({
				userEmail: u.email,
				userName: u.name,
				data: {
					todaysEvents: todaysEvents.map((e) => ({
						name: e.name || '',
						time: e.time || '',
						location: e.location || undefined
					})),
					incompleteTasks: incompleteTasks.length,
					shoppingLists: shoppingLists.map((s) => ({
						name: s.name || '',
						itemCount: 1 // Simplified - could count actual items
					})),
					customLists: customListsWithCounts.filter((l) => l.itemCount > 0)
				}
			});

			successCount++;
		} catch (error) {
			console.error(`Error sending morning briefing to ${u.email}:`, error);
			errorCount++;
		}
	}

	return json({
		success: true,
		job: 'morning-briefing',
		processed: users.length,
		successful: successCount,
		failed: errorCount
	});
}

/**
 * Send evening wrap-up to all eligible users
 */
async function handleEveningWrapup() {
	const currentHour = new Date().getHours();
	const users = await getUsersForEveningWrapup(currentHour);

	let successCount = 0;
	let errorCount = 0;

	for (const u of users) {
		try {
			const today = new Date().toISOString().split('T')[0];
			const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

			// Get today's completed tasks
			const completedTasks = await db.query.tasks.findMany({
				where: and(eq(tasks.assignedToId, u.id), eq(tasks.status, true))
			});

			// Get today's events (consider them "attended")
			const todaysEvents = await db.query.events.findMany({
				where: and(eq(events.assignedToId, u.id), eq(events.date, today))
			});

			// Get tomorrow's events
			const tomorrowsEvents = await db.query.events.findMany({
				where: and(eq(events.assignedToId, u.id), eq(events.date, tomorrow))
			});

			// Get pending tasks
			const pendingTasks = await db.query.tasks.findMany({
				where: and(eq(tasks.assignedToId, u.id), eq(tasks.status, false))
			});

			await sendEveningWrapup({
				userEmail: u.email,
				userName: u.name,
				data: {
					completedTasks: completedTasks.length,
					eventsAttended: todaysEvents.length,
					tomorrowsEvents: tomorrowsEvents.map((e) => ({
						name: e.name || '',
						time: e.time || ''
					})),
					pendingTasks: pendingTasks.length
				}
			});

			successCount++;
		} catch (error) {
			console.error(`Error sending evening wrapup to ${u.email}:`, error);
			errorCount++;
		}
	}

	return json({
		success: true,
		job: 'evening-wrapup',
		processed: users.length,
		successful: successCount,
		failed: errorCount
	});
}

/**
 * Send event reminders 1 hour before events start
 */
async function handleEventReminders() {
	const users = await getUsersForNotification('event_reminders');

	// Get current time + 1 hour (in user's timezone)
	const now = new Date();
	const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
	const targetDate = oneHourFromNow.toISOString().split('T')[0];
	const targetHour = oneHourFromNow.getHours();
	const targetTime = `${String(targetHour).padStart(2, '0')}:00`;

	let successCount = 0;
	let errorCount = 0;

	for (const u of users) {
		try {
			// Find events starting in approximately 1 hour
			const upcomingEvents = await db.query.events.findMany({
				where: and(
					eq(events.assignedToId, u.id),
					eq(events.date, targetDate)
					// Note: In production, you'd want more precise time matching
				)
			});

			// Filter events that start around the target time
			const eventsToRemind = upcomingEvents.filter((e) => {
				if (!e.time) return false;
				const [eventHour] = e.time.split(':').map(Number);
				return Math.abs(eventHour - targetHour) <= 1; // Within 1 hour window
			});

			for (const event of eventsToRemind) {
				await sendEventReminder({
					userEmail: u.email,
					userName: u.name,
					event: {
						name: event.name || '',
						date: event.date || '',
						time: event.time || '',
						location: event.location || undefined,
						description: event.description || undefined
					}
				});
			}

			if (eventsToRemind.length > 0) {
				successCount++;
			}
		} catch (error) {
			console.error(`Error sending event reminders to ${u.email}:`, error);
			errorCount++;
		}
	}

	return json({
		success: true,
		job: 'event-reminders',
		processed: users.length,
		successful: successCount,
		failed: errorCount
	});
}

/**
 * Check for bulk group activity and notify members
 * This checks for users who added 5+ items in the last hour
 */
async function handleGroupActivity() {
	const users = await getUsersForNotification('group_activity');

	// Get items added in the last hour
	const oneHourAgo = Date.now() - 60 * 60 * 1000;

	let successCount = 0;
	let errorCount = 0;

	// Find group members and their recent activity
	for (const u of users) {
		try {
			// Get user's groups
			const memberships = await db.query.userGroupMembers.findMany({
				where: eq(userGroupMembers.userId, u.id)
			});

			for (const membership of memberships) {
				// Find recent bulk additions by other group members
				// This is a simplified version - you'd want to track this better in production
				const recentItems = await db.query.customListItems.findMany({
					where: and(
						eq(customListItems.viewMode, 'shared'),
						gte(customListItems.createdAt, new Date(oneHourAgo))
					),
					limit: 100
				});

				// Group by creator and count
				const creatorCounts: Record<string, { count: number; items: typeof recentItems }> = {};

				for (const item of recentItems) {
					if (!item.createdById) continue; // Skip if no creator
					if (item.createdById === u.id) continue; // Skip own items
					if (!creatorCounts[item.createdById]) {
						creatorCounts[item.createdById] = { count: 0, items: [] };
					}
					creatorCounts[item.createdById].count++;
					creatorCounts[item.createdById].items.push(item);
				}

				// Send notifications for users who added 5+ items
				for (const [creatorId, data] of Object.entries(creatorCounts)) {
					if (data.count >= 5) {
						const creator = await db.query.user.findFirst({
							where: eq(user.id, creatorId)
						});

						if (creator) {
							await sendGroupActivityNotification({
								userEmail: u.email,
								userName: u.name,
								data: {
									memberName: creator.name,
									groupName: 'Shared List', // You'd get actual group name in production
									listType: 'custom',
									itemsAdded: data.count,
									items: data.items.slice(0, 10).map((i) => ({ name: i.name || '' }))
								}
							});

							successCount++;
						}
					}
				}
			}
		} catch (error) {
			console.error(`Error checking group activity for ${u.email}:`, error);
			errorCount++;
		}
	}

	return json({
		success: true,
		job: 'group-activity',
		processed: users.length,
		successful: successCount,
		failed: errorCount
	});
}
