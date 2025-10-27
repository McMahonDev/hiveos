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
		console.log(`🌅 Getting users for morning briefing at hour ${currentHour}`);
		
		// Get all users from database with notification preferences
		const allUsersFromDb = await db.query.user.findMany();
		console.log(`Total users in database: ${allUsersFromDb.length}`);
		
		const eligibleUsers = [];
		
		for (const u of allUsersFromDb) {
			// Check if morning briefing is enabled
			if (!u.notifyMorningBriefing) {
				console.log(`User ${u.email}: morning briefing disabled`);
				continue;
			}
			
			// Check premium access
			const premium = await hasPremiumAccess(u.id);
			if (!premium) {
				console.log(`User ${u.email}: no premium access`);
				continue;
			}
			
			const briefingTime = u.morningBriefingTime || '08:00';
			const [hour] = briefingTime.split(':').map(Number);
			
			console.log(`User ${u.email}: briefing time ${briefingTime}, target hour ${hour}, current hour ${currentHour}`);
			
			if (hour === currentHour) {
				console.log(`✅ User ${u.email} qualifies for morning briefing`);
				eligibleUsers.push({
					id: u.id,
					email: u.email,
					name: u.name,
					timezone: u.timezone || 'America/New_York',
					briefingTime
				});
			}
		}
		
		console.log(`Found ${eligibleUsers.length} eligible users for morning briefing`);
		return eligibleUsers;
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
		console.log(`🌙 Getting users for evening wrapup at hour ${currentHour}`);
		
		const allUsersFromDb = await db.query.user.findMany();
		const eligibleUsers = [];
		
		for (const u of allUsersFromDb) {
			if (!u.notifyEveningWrapup) continue;
			
			const premium = await hasPremiumAccess(u.id);
			if (!premium) continue;
			
			const wrapupTime = u.eveningWrapupTime || '18:00';
			const [hour] = wrapupTime.split(':').map(Number);
			
			if (hour === currentHour) {
				eligibleUsers.push({
					id: u.id,
					email: u.email,
					name: u.name,
					timezone: u.timezone || 'America/New_York',
					wrapupTime
				});
			}
		}
		
		console.log(`Found ${eligibleUsers.length} eligible users for evening wrapup`);
		return eligibleUsers;
	} catch (error) {
		console.error('Error getting users for evening wrapup:', error);
		return [];
	}
}
