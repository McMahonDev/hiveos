/**
 * Subscription Service
 *
 * This module handles subscription management with a mock implementation that can be
 * replaced with real Stripe integration later.
 *
 * To add real Stripe:
 * 1. npm install stripe
 * 2. Add STRIPE_SECRET_KEY to .env
 * 3. Replace mock functions with real Stripe API calls
 * 4. Set up webhook endpoint at /api/webhooks/stripe
 */

import { db } from './db';
import { user, userGroups, userGroupMembers, customLists, customListItems, events, shoppingList, tasks, accessCodes, groupActivityLog } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendSubscriptionDowngradeNotification, sendGroupMemberRemovedNotification } from './email';

// Mock Stripe configuration (replace with real config later)
const MOCK_MODE = true; // Set to false when using real Stripe

// Grace period: Give users 48 hours after period end before enforcing cancellation
// This prevents accidental data loss from payment processing delays
const GRACE_PERIOD_HOURS = 48;

// Price IDs (in real implementation, these come from Stripe dashboard)
export const PRICE_IDS = {
	individual: 'price_individual_monthly', // $5/month
	family: 'price_family_monthly', // $20/month
	team: 'price_team_monthly' // Custom pricing
} as const;

export type SubscriptionTier = 'free' | 'individual' | 'family';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

interface CheckoutSessionData {
	sessionId: string;
	checkoutUrl: string;
	customerId: string;
}

interface SubscriptionData {
	subscriptionId: string;
	customerId: string;
	status: SubscriptionStatus;
	currentPeriodEnd: Date;
	tier: SubscriptionTier;
}

/**
 * Create a checkout session for a subscription
 * Mock implementation returns fake data immediately
 * Real implementation would call stripe.checkout.sessions.create()
 */
export async function createCheckoutSession(
	userId: string,
	tier: 'individual' | 'family' | 'team',
	successUrl: string,
	cancelUrl: string
): Promise<CheckoutSessionData> {
	if (MOCK_MODE) {
		// Mock implementation - simulate instant success
		const mockCustomerId = `cus_mock_${nanoid(12)}`;
		const mockSessionId = `cs_mock_${nanoid(16)}`;

		return {
			sessionId: mockSessionId,
			checkoutUrl: `/api/mock-checkout?session=${mockSessionId}&tier=${tier}`,
			customerId: mockCustomerId
		};
	}

	// Real Stripe implementation would go here:
	// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	// const session = await stripe.checkout.sessions.create({
	//   customer_email: userEmail,
	//   mode: 'subscription',
	//   payment_method_types: ['card'],
	//   line_items: [{
	//     price: PRICE_IDS[tier],
	//     quantity: 1,
	//   }],
	//   success_url: successUrl,
	//   cancel_url: cancelUrl,
	//   metadata: { userId, tier }
	// });
	// return {
	//   sessionId: session.id,
	//   checkoutUrl: session.url!,
	//   customerId: session.customer as string
	// };

	throw new Error('Real Stripe not configured yet');
}

/**
 * Activate a subscription after successful payment
 * Called by webhook handler or mock checkout completion
 */
export async function activateSubscription(
	userId: string,
	tier: SubscriptionTier,
	subscriptionId?: string,
	customerId?: string
): Promise<void> {
	const now = new Date();
	const nextBillingDate = new Date(now);
	nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

	// Generate mock IDs if not provided
	const finalSubscriptionId = subscriptionId || `sub_mock_${nanoid(16)}`;
	const finalCustomerId = customerId || `cus_mock_${nanoid(12)}`;

	await db
		.update(user)
		.set({
			subscriptionTier: tier,
			subscriptionStatus: 'active',
			subscriptionId: finalSubscriptionId,
			stripeCustomerId: finalCustomerId,
			currentPeriodEnd: nextBillingDate,
			cancelAtPeriodEnd: false
		})
		.where(eq(user.id, userId));
}

/**
 * Cancel a subscription
 * Can be immediate or at period end
 */
export async function cancelSubscription(
	userId: string,
	immediate: boolean = false
): Promise<void> {
	const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (!userData?.subscriptionId) {
		throw new Error('No active subscription found');
	}

	if (MOCK_MODE) {
		// Mock implementation
		if (immediate) {
			const previousTier = userData.subscriptionTier;

			// For family tier users, clean up their groups before downgrade
			if (previousTier === 'family') {
				console.log(`🧹 Immediate cancellation: cleaning up family groups for ${userData.email}...`);
				await cleanupGroupsForDowngradedUser(userId);
			}

			// Cancel immediately
			await db
				.update(user)
				.set({
					subscriptionTier: 'free',
					subscriptionStatus: 'canceled',
					cancelAtPeriodEnd: false,
					// Keep subscription IDs for records
					currentPeriodEnd: new Date()
				})
				.where(eq(user.id, userId));
		} else {
			// Cancel at period end
			await db
				.update(user)
				.set({
					cancelAtPeriodEnd: true
				})
				.where(eq(user.id, userId));
		}
		return;
	}

	// Real Stripe implementation:
	// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	// if (immediate) {
	//   await stripe.subscriptions.cancel(userData.subscriptionId);
	// } else {
	//   await stripe.subscriptions.update(userData.subscriptionId, {
	//     cancel_at_period_end: true
	//   });
	// }
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(userId: string): Promise<void> {
	const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (!userData?.subscriptionId) {
		throw new Error('No subscription found');
	}

	if (MOCK_MODE) {
		await db
			.update(user)
			.set({
				cancelAtPeriodEnd: false,
				subscriptionStatus: 'active'
			})
			.where(eq(user.id, userId));
		return;
	}

	// Real Stripe:
	// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	// await stripe.subscriptions.update(userData.subscriptionId, {
	//   cancel_at_period_end: false
	// });
}

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
	const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (!userData) return false;

	// Check if subscription is active and not expired
	const isActive =
		userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'trialing';
	const notExpired = userData.currentPeriodEnd
		? new Date(userData.currentPeriodEnd) > new Date()
		: false;

	return isActive && notExpired;
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(userId: string): Promise<SubscriptionData | null> {
	const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (!userData?.subscriptionId) {
		return null;
	}

	return {
		subscriptionId: userData.subscriptionId,
		customerId: userData.stripeCustomerId || '',
		status: (userData.subscriptionStatus as SubscriptionStatus) || 'active',
		currentPeriodEnd: userData.currentPeriodEnd || new Date(),
		tier: userData.subscriptionTier as SubscriptionTier
	};
}

/**
 * Handle subscription renewal (called by webhook or cron job)
 */
export async function handleSubscriptionRenewed(subscriptionId: string): Promise<void> {
	const [userData] = await db
		.select()
		.from(user)
		.where(eq(user.subscriptionId, subscriptionId))
		.limit(1);

	if (!userData) return;

	const nextBillingDate = new Date();
	nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

	await db
		.update(user)
		.set({
			subscriptionStatus: 'active',
			currentPeriodEnd: nextBillingDate,
			cancelAtPeriodEnd: false
		})
		.where(eq(user.id, userData.id));
}

/**
 * Handle subscription payment failure
 */
export async function handlePaymentFailed(subscriptionId: string): Promise<void> {
	const [userData] = await db
		.select()
		.from(user)
		.where(eq(user.subscriptionId, subscriptionId))
		.limit(1);

	if (!userData) return;

	await db
		.update(user)
		.set({
			subscriptionStatus: 'past_due'
		})
		.where(eq(user.id, userData.id));
}

/**
 * Create a customer portal session (for managing billing)
 * Mock returns a fake URL, real Stripe creates a session
 */
export async function createPortalSession(userId: string, returnUrl: string): Promise<string> {
	const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (!userData?.stripeCustomerId) {
		throw new Error('No Stripe customer ID found');
	}

	if (MOCK_MODE) {
		return `/account/subscription?mock=portal`;
	}

	// Real Stripe:
	// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	// const session = await stripe.billingPortal.sessions.create({
	//   customer: userData.stripeCustomerId,
	//   return_url: returnUrl,
	// });
	// return session.url;

	throw new Error('Real Stripe not configured yet');
}

/**
 * Enforce subscription cancellations for expired subscriptions
 * Called by cron job to check for subscriptions that should be downgraded
 * Returns count of users affected
 */
export async function enforceSubscriptionCancellations(): Promise<{
	downgraded: number;
	details: Array<{ userId: string; email: string; tier: string }>;
}> {
	const now = new Date();
	const gracePeriodEnd = new Date(now.getTime() - GRACE_PERIOD_HOURS * 60 * 60 * 1000);
	const gracePeriodEndTimestamp = gracePeriodEnd.toISOString();

	console.log(`\u23F0 Checking for subscriptions expired before ${gracePeriodEndTimestamp} (${GRACE_PERIOD_HOURS}h grace period)`);

	// Find all users with:
	// 1. cancel_at_period_end = true
	// 2. current_period_end is past the grace period
	// 3. subscription_tier is not 'free'
	const usersToDowngrade = await db
		.select()
		.from(user)
		.where(
			sql`${user.cancelAtPeriodEnd} = true 
			AND ${user.currentPeriodEnd} < ${gracePeriodEndTimestamp} 
			AND ${user.subscriptionTier} != 'free'`
		);

	const details: Array<{ userId: string; email: string; tier: string }> = [];

	for (const userData of usersToDowngrade) {
		const previousTier = userData.subscriptionTier;

		// For family tier users, clean up their groups
		if (previousTier === 'family') {
			console.log(`🧹 Cleaning up family groups for ${userData.email}...`);
			await cleanupGroupsForDowngradedUser(userData.id);
		}

		// Downgrade to free tier
		await db
			.update(user)
			.set({
				subscriptionTier: 'free',
				subscriptionStatus: 'canceled',
				cancelAtPeriodEnd: false
				// Keep subscriptionId, customerId, currentPeriodEnd for records
			})
			.where(eq(user.id, userData.id));

		details.push({
			userId: userData.id,
			email: userData.email,
			tier: previousTier || 'unknown'
		});

		console.log(
			`✅ Downgraded user ${userData.email} from ${previousTier} to free (period ended ${userData.currentPeriodEnd})`
		);

		// Send notification email to downgraded user
		try {
			await sendSubscriptionDowngradeNotification({
				userEmail: userData.email,
				userName: userData.name,
				previousTier: previousTier || 'unknown',
				reason: 'expired'
			});
			console.log(`   📧 Sent downgrade notification to ${userData.email}`);
		} catch (emailError) {
			console.error(`   ❌ Failed to send downgrade email to ${userData.email}:`, emailError);
			// Don't fail the whole process if email fails
		}
	}

	return {
		downgraded: details.length,
		details
	};
}

/**
 * Clean up all groups owned by a downgraded user
 * Removes all group content, members, and the group itself
 */
async function cleanupGroupsForDowngradedUser(userId: string): Promise<void> {
	// Find all groups created by this user
	const userCreatedGroups = await db
		.select()
		.from(userGroups)
		.where(eq(userGroups.createdById, userId));

	console.log(`   Found ${userCreatedGroups.length} groups to clean up`);

	for (const group of userCreatedGroups) {
		await deleteGroupAndContent(group.id);
	}
}

/**
 * Delete a group and all its associated content
 * This includes: custom lists, list items, events, shopping lists, tasks, access codes, activity logs, and members
 */
async function deleteGroupAndContent(groupId: string): Promise<void> {
	console.log(`   Deleting group ${groupId}...`);

	// Get group info for notifications
	const [groupInfo] = await db.select().from(userGroups).where(eq(userGroups.id, groupId)).limit(1);
	const groupName = groupInfo?.name || 'Unknown Group';

	// Get group creator info
	const [creatorInfo] = await db.select().from(user).where(eq(user.id, groupInfo?.createdById || '')).limit(1);
	const creatorName = creatorInfo?.name || 'Group owner';

	// Get all members before deletion so we can reset their active_group_id and notify them
	const members = await db
		.select()
		.from(userGroupMembers)
		.where(eq(userGroupMembers.userGroupId, groupId));

	// Delete custom list items for lists belonging to this group
	const groupCustomLists = await db
		.select()
		.from(customLists)
		.where(eq(customLists.groupId, groupId));

	for (const list of groupCustomLists) {
		await db.delete(customListItems).where(eq(customListItems.customListId, list.id));
		console.log(`     Deleted items from custom list ${list.id}`);
	}

	// Delete custom lists
	await db.delete(customLists).where(eq(customLists.groupId, groupId));
	console.log(`     Deleted custom lists`);

	// Delete events assigned to this group
	await db.delete(events).where(eq(events.assignedToId, groupId));
	console.log(`     Deleted events`);

	// Delete shopping list items assigned to this group
	await db.delete(shoppingList).where(eq(shoppingList.assignedToId, groupId));
	console.log(`     Deleted shopping list items`);

	// Delete tasks assigned to this group
	await db.delete(tasks).where(eq(tasks.assignedToId, groupId));
	console.log(`     Deleted tasks`);

	// Delete access codes
	await db.delete(accessCodes).where(eq(accessCodes.groupId, groupId));
	console.log(`     Deleted access codes`);

	// Delete activity logs
	await db.delete(groupActivityLog).where(eq(groupActivityLog.groupId, groupId));
	console.log(`     Deleted activity logs`);

	// Reset active_group_id for all members to their own userId (personal mode) and notify them
	for (const member of members) {
		// Skip the creator
		if (member.userId === groupInfo?.createdById) continue;

		await db
			.update(user)
			.set({ activeGroupId: member.userId })
			.where(eq(user.id, member.userId));
		console.log(`     Reset active_group_id for member ${member.userId}`);

		// Get member info and send notification
		const [memberInfo] = await db.select().from(user).where(eq(user.id, member.userId)).limit(1);
		if (memberInfo) {
			try {
				await sendGroupMemberRemovedNotification({
					userEmail: memberInfo.email,
					userName: memberInfo.name,
					groupName: groupName,
					ownerName: creatorName
				});
				console.log(`     📧 Sent removal notification to ${memberInfo.email}`);
			} catch (emailError) {
				console.error(`     ❌ Failed to send removal email to ${memberInfo.email}:`, emailError);
				// Don't fail the whole process if email fails
			}
		}
	}

	// Delete all group members
	await db.delete(userGroupMembers).where(eq(userGroupMembers.userGroupId, groupId));
	console.log(`     Removed all ${members.length} members`);

	// Finally, delete the group itself
	await db.delete(userGroups).where(eq(userGroups.id, groupId));
	console.log(`   ✅ Group ${groupId} and all content deleted`);
}

/**
 * Get pricing information for display
 */
export function getPricing() {
	return {
		individual: {
			name: 'Individual',
			price: 5,
			currency: 'USD',
			interval: 'month',
			features: [
				'Unlimited data storage',
				'Multiple device sync',
				'Create groups with other $5 users',
				'Real-time collaboration',
				'Priority support'
			]
		},
		family: {
			name: 'Family Plan',
			price: 20,
			currency: 'USD',
			interval: 'month',
			features: [
				'Everything in Individual',
				'Up to 6 family members',
				'Generate access codes for family',
				'Family members get free access',
				'Manage all members'
			]
		}
	};
}
