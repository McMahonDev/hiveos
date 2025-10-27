import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/auth/auth';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});
	
	if (!session?.user) {
		throw redirect(303, '/account/login');
	}

	return {
		user: session.user
	};
};
