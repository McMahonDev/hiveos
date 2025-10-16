import { fail, type Actions } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';
import { cancelSubscription, reactivateSubscription } from '$lib/server/subscriptions';

export const actions: Actions = {
	cancel: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session?.user?.id) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const immediate = data.get('immediate') === 'true';

		try {
			await cancelSubscription(session.user.id, immediate);
			return {
				success: true,
				message: immediate
					? 'Subscription canceled immediately'
					: 'Subscription will cancel at the end of the billing period'
			};
		} catch (error) {
			console.error('Cancel subscription error:', error);
			return fail(500, { error: 'Failed to cancel subscription' });
		}
	},

	reactivate: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session?.user?.id) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			await reactivateSubscription(session.user.id);
			return {
				success: true,
				message: 'Subscription reactivated successfully'
			};
		} catch (error) {
			console.error('Reactivate subscription error:', error);
			return fail(500, { error: 'Failed to reactivate subscription' });
		}
	}
};
