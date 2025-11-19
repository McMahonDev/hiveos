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
	sendGroupActivityNotification,
	sendSubscriptionCancellationWarning7Days,
	sendSubscriptionCancellationWarning1Day
} from '$lib/server/email';
import { enforceSubscriptionCancellations } from '$lib/server/subscriptions';

// Secret key for authenticating cron requests (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

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
        console.log(`Running cron job: ${job}`);
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

			case 'enforce-subscriptions':
				return await handleSubscriptionEnforcement();

			case 'subscription-warning-7days':
				return await handleSubscriptionWarning7Days();

			case 'subscription-warning-1day':
				return await handleSubscriptionWarning1Day();

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
	console.log(`📧 Starting morning briefing job at hour ${currentHour}`);
	
	const users = await getUsersForMorningBriefing(currentHour);
	console.log(`Found ${users.length} users to notify`);

	let successCount = 0;
	let errorCount = 0;

	for (const u of users) {
		try {
			console.log(`Processing user: ${u.email}`);
			
			// Get today's events
			const today = new Date().toISOString().split('T')[0];
			const todaysEvents = await db.query.events.findMany({
				where: and(eq(events.assignedToId, u.id), eq(events.date, today))
			});
			console.log(`  - Events today: ${todaysEvents.length}`);

			// Get incomplete tasks
			const incompleteTasks = await db.query.tasks.findMany({
				where: and(eq(tasks.assignedToId, u.id), eq(tasks.status, false))
			});
			console.log(`  - Incomplete tasks: ${incompleteTasks.length}`);

			// Get shopping lists with items
			const shoppingLists = await db.query.shoppingList.findMany({
				where: and(eq(shoppingList.assignedToId, u.id), eq(shoppingList.status, false))
			});
			console.log(`  - Shopping lists: ${shoppingLists.length}`);

			// Get custom lists with items
			const userCustomLists = await db.query.customLists.findMany({
				where: eq(customLists.createdById, u.id)
			});
			console.log(`  - Custom lists: ${userCustomLists.length}`);

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

			console.log(`Sending morning briefing email to ${u.email}...`);
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

			console.log(`✅ Successfully sent morning briefing to ${u.email}`);
			successCount++;
		} catch (error) {
			console.error(`❌ Error sending morning briefing to ${u.email}:`, error);
			errorCount++;
		}
	}

	const result = {
		success: true,
		job: 'morning-briefing',
		processed: users.length,
		successful: successCount,
		failed: errorCount
	};
	
	console.log('Morning briefing job complete:', result);
	return json(result);
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

/**
 * Send warning emails 7 days before subscription cancellation
 */
async function handleSubscriptionWarning7Days() {
	console.log('📧 Starting 7-day subscription warning job...');

	try {
		const now = new Date();
		const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		
		// Find users with cancel_at_period_end = true and period ending in ~7 days
		const usersToWarn = await db
			.select()
			.from(user)
			.where(
				sql`${user.cancelAtPeriodEnd} = true 
				AND ${user.currentPeriodEnd} >= ${now}
				AND ${user.currentPeriodEnd} <= ${sevenDaysFromNow}
				AND ${user.subscriptionTier} != 'free'`
			);

		let successCount = 0;
		let errorCount = 0;

		for (const u of usersToWarn) {
			try {
				const endDate = u.currentPeriodEnd?.toLocaleDateString() || 'soon';
				
				await sendSubscriptionCancellationWarning7Days({
					userEmail: u.email,
					userName: u.name,
					tier: u.subscriptionTier || 'unknown',
					endDate
				});
				
				console.log(`✅ Sent 7-day warning to ${u.email}`);
				successCount++;
			} catch (error) {
				console.error(`❌ Failed to send 7-day warning to ${u.email}:`, error);
				errorCount++;
			}
		}

		return json({
			success: true,
			job: 'subscription-warning-7days',
			processed: usersToWarn.length,
			successful: successCount,
			failed: errorCount
		});
	} catch (error) {
		console.error('❌ Error in 7-day warning job:', error);
		throw error;
	}
}

/**
 * Send warning emails 1 day before subscription cancellation
 */
async function handleSubscriptionWarning1Day() {
	console.log('📧 Starting 1-day subscription warning job...');

	try {
		const now = new Date();
		const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
		
		// Find users with cancel_at_period_end = true and period ending in ~1 day
		const usersToWarn = await db
			.select()
			.from(user)
			.where(
				sql`${user.cancelAtPeriodEnd} = true 
				AND ${user.currentPeriodEnd} >= ${now}
				AND ${user.currentPeriodEnd} <= ${oneDayFromNow}
				AND ${user.subscriptionTier} != 'free'`
			);

		let successCount = 0;
		let errorCount = 0;

		for (const u of usersToWarn) {
			try {
				const endDate = u.currentPeriodEnd?.toLocaleDateString() || 'tomorrow';
				
				await sendSubscriptionCancellationWarning1Day({
					userEmail: u.email,
					userName: u.name,
					tier: u.subscriptionTier || 'unknown',
					endDate
				});
				
				console.log(`✅ Sent 1-day warning to ${u.email}`);
				successCount++;
			} catch (error) {
				console.error(`❌ Failed to send 1-day warning to ${u.email}:`, error);
				errorCount++;
			}
		}

		return json({
			success: true,
			job: 'subscription-warning-1day',
			processed: usersToWarn.length,
			successful: successCount,
			failed: errorCount
		});
	} catch (error) {
		console.error('❌ Error in 1-day warning job:', error);
		throw error;
	}
}

/**
 * Enforce subscription cancellations for expired subscriptions
 * Checks for users whose subscription period has ended and downgrades them
 */
async function handleSubscriptionEnforcement() {
	console.log('🔍 Starting subscription enforcement job...');

	try {
		const result = await enforceSubscriptionCancellations();

		console.log(`✅ Subscription enforcement complete:`);
		console.log(`   - Users downgraded: ${result.downgraded}`);

		if (result.details.length > 0) {
			console.log('   - Details:');
			for (const detail of result.details) {
				console.log(`     • ${detail.email} (${detail.tier} → free)`);
			}
		}

		return json({
			success: true,
			job: 'enforce-subscriptions',
			downgraded: result.downgraded,
			details: result.details
		});
	} catch (error) {
		console.error('❌ Error enforcing subscriptions:', error);
		throw error;
	}
}
