import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
	// Check if the user is already logged in using Better Auth
	const session = await auth.api.getSession({
		headers: request.headers
	});

	// If user is already logged in, redirect to home page
	if (session) {
		throw redirect(302, '/');
	}

	// Return empty object if not logged in
	return {};
}
