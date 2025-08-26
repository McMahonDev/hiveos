export const ssr = false;
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';
import { db } from '$lib/server/db/index';
import { userGroupMembers, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function load({ request, url, cookies }) {
	let isAuthenticated: boolean;
	let userId: string;
	let groupId: string;
	let name: string = '';


	// Use Better Auth to get the session
	const session = await auth.api.getSession({
		headers: request.headers
	});

	

	if (!session) {
		isAuthenticated = false;
		userId = '';
		groupId = '0';
		if (url.pathname !== '/account/login' && url.pathname !== '/account/register') {
			throw redirect(302, '/account/login');
		}
	} else {

		isAuthenticated = true;
		userId = session.user.id;
		
		// Query the user's group membership to get groupId
		try {
			const userGroupMembership = await db
				.select()
				.from(userGroupMembers)
				.where(eq(userGroupMembers.userId, session.user.id))
				.limit(1);
			
			// If user is in a group, use that groupId, otherwise use userId as groupId
			groupId = userGroupMembership[0]?.userGroupId || session.user.id;

			const userData = await db
				.select()
				.from(user)
				.where(eq(user.id, session.user.id))
				.limit(1);

			if (userData[0]) {
				name = userData[0].name;
			} else {
				// If no user data is found, fall back to session user
				console.log("No user data found, falling back to session user");
			}
		} catch (error) {
			console.error('Error fetching user group membership:', error);
			// Fall back to userId as groupId
			groupId = session.user.id;
		}
	}
	
	return { 
		auth: isAuthenticated, 
		id: userId, 
		groupId,
		name
	};
}
