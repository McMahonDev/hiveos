import { db } from './db';
import { user, userGroupMembers, userGroups } from './db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a user has premium notification access
 * Premium access is granted if:
 * 1. User has an active paid subscription (individual or family tier)
 * 2. User is a member of a group where the creator has a paid subscription
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
	try {
		// Check if user has paid subscription
		const userRecord = await db.query.user.findFirst({
			where: eq(user.id, userId)
		});

		if (!userRecord) return false;

		// User has direct paid subscription
		if (
			userRecord.subscriptionTier &&
			['individual', 'family'].includes(userRecord.subscriptionTier) &&
			userRecord.subscriptionStatus === 'active'
		) {
			return true;
		}

		// Check if user is member of a paid group
		const memberships = await db
			.select({
				groupId: userGroupMembers.userGroupId,
				creatorId: userGroups.createdById
			})
			.from(userGroupMembers)
			.innerJoin(userGroups, eq(userGroupMembers.userGroupId, userGroups.id))
			.where(eq(userGroupMembers.userId, userId));

		for (const membership of memberships) {
			if (!membership.creatorId) continue;

			// Get the group creator's subscription status
			const groupCreator = await db.query.user.findFirst({
				where: eq(user.id, membership.creatorId)
			});

			if (
				groupCreator &&
				groupCreator.subscriptionTier &&
				['individual', 'family'].includes(groupCreator.subscriptionTier) &&
				groupCreator.subscriptionStatus === 'active'
			) {
				return true;
			}
		}

		return false;
	} catch (error) {
		console.error('Error checking premium access:', error);
		return false;
	}
}

/**
 * Get all users who should receive a specific notification type
 * Only returns users with premium access and the notification enabled
 */
export async function getUsersForNotification(
	notificationType:
		| 'morning_briefing'
		| 'evening_wrapup'
		| 'event_reminders'
		| 'shopping_reminders'
		| 'task_followups'
		| 'group_activity'
		| 'weekly_summary'
		| 'subscription_updates'
): Promise<Array<{ id: string; email: string; name: string; timezone: string }>> {
	try {
		// Map notification type to database column
		const columnMap = {
			morning_briefing: 'notifyMorningBriefing',
			evening_wrapup: 'notifyEveningWrapup',
			event_reminders: 'notifyEventReminders',
			shopping_reminders: 'notifyShoppingReminders',
			task_followups: 'notifyTaskFollowups',
			group_activity: 'notifyGroupActivity',
			weekly_summary: 'notifyWeeklySummary',
			subscription_updates: 'notifySubscriptionUpdates'
		};

		// Get all users with the notification enabled
		const allUsers = await db.query.user.findMany();

		const eligibleUsers = [];

		for (const u of allUsers) {
			// Check if notification is enabled for this user
			const notifyColumn = columnMap[notificationType];
			// @ts-ignore - dynamic column access
			const isEnabled = u[notifyColumn];

			if (!isEnabled) continue;

			// Check if user has premium access
			const premium = await hasPremiumAccess(u.id);
			if (!premium) continue;

			eligibleUsers.push({
				id: u.id,
				email: u.email,
				name: u.name,
				timezone: u.timezone || 'America/New_York'
			});
		}

		return eligibleUsers;
	} catch (error) {
		console.error('Error getting users for notification:', error);
		return [];
	}
}

/**
 * Get users whose morning briefing should be sent at the current time
 * Checks timezone and preferred briefing time
 */
export async function getUsersForMorningBriefing(currentHour: number): Promise<
	Array<{
		id: string;
		email: string;
		name: string;
		timezone: string;
		briefingTime: string;
	}>
> {
	try {
		const allUsers = await getUsersForNotification('morning_briefing');

		// Filter users whose briefing time matches current hour in their timezone
		return allUsers
			.map((u) => {
				const briefingTime = u.timezone || '08:00';
				return {
					...u,
					briefingTime
				};
			})
			.filter((u) => {
				// Parse briefing time (HH:mm format)
				const [hour] = u.briefingTime.split(':').map(Number);
				return hour === currentHour;
			});
	} catch (error) {
		console.error('Error getting users for morning briefing:', error);
		return [];
	}
}

/**
 * Get users whose evening wrap-up should be sent at the current time
 */
export async function getUsersForEveningWrapup(currentHour: number): Promise<
	Array<{
		id: string;
		email: string;
		name: string;
		timezone: string;
		wrapupTime: string;
	}>
> {
	try {
		const allUsers = await getUsersForNotification('evening_wrapup');

		return allUsers
			.map((u) => {
				const wrapupTime = u.timezone || '18:00';
				return {
					...u,
					wrapupTime
				};
			})
			.filter((u) => {
				const [hour] = u.wrapupTime.split(':').map(Number);
				return hour === currentHour;
			});
	} catch (error) {
		console.error('Error getting users for evening wrapup:', error);
		return [];
	}
}
