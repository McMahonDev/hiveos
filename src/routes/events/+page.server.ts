import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { customLists } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '$lib/auth/auth';

export async function load({ request }) {
	// Get the current user session
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		throw redirect(302, '/account/login');
	}

	// Find the user's first Events list
	const eventsList = await db
		.select()
		.from(customLists)
		.where(and(eq(customLists.createdById, session.user.id), eq(customLists.listType, 'events')))
		.limit(1);

	if (eventsList.length > 0) {
		// Redirect to the first events list
		throw redirect(302, `/custom-list/${eventsList[0].id}`);
	}

	// If no events list exists (shouldn't happen with default creation), redirect home
	throw redirect(302, '/');
}
