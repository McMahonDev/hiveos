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
import { user } from './db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Mock Stripe configuration (replace with real config later)
const MOCK_MODE = true; // Set to false when using real Stripe

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
