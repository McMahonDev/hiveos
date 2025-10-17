import { json, redirect, type RequestHandler } from '@sveltejs/kit';
import { activateSubscription } from '$lib/server/subscriptions';
import { auth } from '$lib/auth/auth';

/**
 * Mock checkout completion endpoint
 * Simulates successful Stripe payment
 *
 * In production, this would be handled by Stripe webhooks
 */
export const GET: RequestHandler = async ({ url, request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user?.id) {
		throw redirect(303, '/account/login');
	}

	const tier = url.searchParams.get('tier');
	const sessionId = url.searchParams.get('session');

	if (!tier || !sessionId) {
		throw redirect(303, '/account?error=invalid_checkout');
	}

	// Validate tier
	const validTiers = ['individual', 'family', 'team'];
	if (!validTiers.includes(tier)) {
		throw redirect(303, '/account?error=invalid_tier');
	}

	try {
		// Determine subscription tier based on plan type
		let subscriptionTier: 'individual' | 'family';
		if (tier === 'individual') {
			subscriptionTier = 'individual';
		} else {
			subscriptionTier = 'family';
		}

		// Activate the subscription with mock data
		await activateSubscription(
			session.user.id,
			subscriptionTier,
			sessionId.replace('cs_mock_', 'sub_mock_'), // Convert session to subscription ID
			`cus_mock_${session.user.id.slice(0, 12)}`
		);

		// Redirect to success page with tier info so user can create group
		const successParam =
			tier === 'family' ? 'family_subscription_activated' : 'subscription_activated';
		throw redirect(303, `/account?success=${successParam}`);
	} catch (error) {
		console.error('Mock checkout error:', error);
		throw redirect(303, '/account?error=checkout_failed');
	}
};
