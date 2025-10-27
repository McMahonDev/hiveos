import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasPremiumAccess } from '$lib/server/notifications';
import { auth } from '$lib/auth/auth';

export const GET: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user?.id) {
		return json({ hasPremium: false }, { status: 401 });
	}

	const premium = await hasPremiumAccess(session.user.id);

	return json({ hasPremium: premium });
};
