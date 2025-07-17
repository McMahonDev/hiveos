export const ssr = false;
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';
import { db } from '$lib/server/db/index';
import { userGroupMembers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function load({ request, url, cookies }) {
	let isAuthenticated: boolean;
	let userId: string;
	let groupId: string;

	console.log('Loading layout server');

	// Use Better Auth to get the session
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (session) {
		console.log('Session found:', session);
	} else {
		console.log('No session found');
	}

	if (!session) {
		console.log('No user found, redirecting to login');
		isAuthenticated = false;
		userId = '';
		groupId = '0';
		if (url.pathname !== '/account/login' && url.pathname !== '/account/register') {
			console.log('Redirecting to login page');
			console.log('Current URL:', url.pathname);
			throw redirect(302, '/account/login');
		}
	} else {
		console.log('User found, setting auth to true');
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
			console.log('User groupId:', groupId);
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
		user: session?.user || null,
		session: session || null
	};
}
