import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';
import { db } from '$lib/server/db/index';
import { user, userGroups, userGroupMembers, events, shoppingList, tasks } from '$lib/server/db/schema';
import { eq, gte, sql, and, count, isNotNull } from 'drizzle-orm';

export async function load({ request }: { request: Request }) {
	// Check if user is authenticated
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		throw redirect(302, '/account/login');
	}

	// Check if user is superadmin
	const userData = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

	if (!userData[0] || !userData[0].superadmin) {
		// Not a superadmin, redirect to home
		throw redirect(302, '/');
	}

	// Fetch analytics data
	try {
		// Total users
		const totalUsersResult = await db.select({ count: count() }).from(user);
		const totalUsers = totalUsersResult[0]?.count || 0;

		// Users by subscription tier
		const usersByTier = await db
			.select({
				tier: user.subscriptionTier,
				count: count()
			})
			.from(user)
			.groupBy(user.subscriptionTier);

		// Active users (users who have created events, shopping items, or tasks in last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();

		// Get unique user IDs from events
		const activeFromEvents = await db
			.selectDistinct({ userId: events.createdById })
			.from(events)
			.where(gte(events.createdAt, thirtyDaysAgo));

		// Get unique user IDs from shopping list
		const activeFromShopping = await db
			.selectDistinct({ userId: shoppingList.createdById })
			.from(shoppingList)
			.where(gte(shoppingList.createdAt, thirtyDaysAgo));

		// Combine and deduplicate active users
		const activeUserIds = new Set([
			...activeFromEvents.map(u => u.userId),
			...activeFromShopping.map(u => u.userId)
		]);
		const activeUsersCount = activeUserIds.size;

		// Total groups
		const totalGroupsResult = await db.select({ count: count() }).from(userGroups);
		const totalGroups = totalGroupsResult[0]?.count || 0;

		// Groups by type
		const groupsByType = await db
			.select({
				type: userGroups.groupType,
				count: count()
			})
			.from(userGroups)
			.groupBy(userGroups.groupType);

		// Total events
		const totalEventsResult = await db.select({ count: count() }).from(events);
		const totalEvents = totalEventsResult[0]?.count || 0;

		// Total shopping items
		const totalShoppingItemsResult = await db.select({ count: count() }).from(shoppingList);
		const totalShoppingItems = totalShoppingItemsResult[0]?.count || 0;

		// Total tasks
		const totalTasksResult = await db.select({ count: count() }).from(tasks);
		const totalTasks = totalTasksResult[0]?.count || 0;

		// Recent users (last 10)
		const recentUsers = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				createdAt: user.createdAt,
				subscriptionTier: user.subscriptionTier
			})
			.from(user)
			.orderBy(sql`${user.createdAt} DESC`)
			.limit(10);

		// Users with active subscriptions
		const paidUsersResult = await db
			.select({ count: count() })
			.from(user)
			.where(
				and(
					isNotNull(user.subscriptionStatus),
					sql`${user.subscriptionStatus} IN ('active', 'trialing')`
				)
			);
		const paidUsers = paidUsersResult[0]?.count || 0;

		// Average group size
		const groupMembersResult = await db
			.select({
				groupId: userGroupMembers.userGroupId,
				memberCount: count()
			})
			.from(userGroupMembers)
			.groupBy(userGroupMembers.userGroupId);

		const avgGroupSize = groupMembersResult.length > 0
			? Math.round(groupMembersResult.reduce((sum, g) => sum + Number(g.memberCount), 0) / groupMembersResult.length * 10) / 10
			: 0;

		return {
			analytics: {
				totalUsers,
				activeUsers: activeUsersCount,
				paidUsers,
				totalGroups,
				totalEvents,
				totalShoppingItems,
				totalTasks,
				avgGroupSize,
				usersByTier: usersByTier.map(t => ({
					tier: t.tier || 'free',
					count: Number(t.count)
				})),
				groupsByType: groupsByType.map(g => ({
					type: g.type || 'unknown',
					count: Number(g.count)
				})),
				recentUsers: recentUsers.map(u => ({
					id: u.id,
					name: u.name,
					email: u.email,
					createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date(u.createdAt).toISOString(),
					subscriptionTier: u.subscriptionTier || 'free'
				}))
			}
		};
	} catch (error) {
		console.error('Error fetching admin analytics:', error);
		throw redirect(302, '/');
	}
};
