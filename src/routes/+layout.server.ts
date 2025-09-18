export const ssr = false;
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';
import { db } from '$lib/server/db/index';
import { userGroupMembers, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.ZERO_AUTH_SECRET;
if (!JWT_SECRET) {
	throw new Error('ZERO_AUTH_SECRET environment variable is not set');
}

export async function load({ request, url }) {
	let isAuthenticated: boolean;
	let userId: string;
	let groupId: string;
	let name: string = '';
	let JWT: string | undefined = undefined;

	console.log("1")

	// Use Better Auth to get the session
	const session = await auth.api.getSession({
		headers: request.headers
	});

	

	if (!session) {
		console.log("2")
		isAuthenticated = false;
		userId = '';
		groupId = '0';
		if (url.pathname !== '/account/login' && url.pathname !== '/account/register') {
			console.log("3")
			throw redirect(302, '/account/login');
		}
	} else {
		console.log("4")
		console.log(JWT_SECRET)
		isAuthenticated = true;
		userId = session.user.id;
		JWT = jwt.sign(
			{
				sub: session.user.id, // This is what Zero uses for authData.sub
				userId: session.user.id,
				email: session.user.email,
				name: session.user.name
			},
			JWT_SECRET as string,
			{
				expiresIn: '24h'
			}
		);

		console.log("Generated JWT:", JWT);
		
		// Query the user's group membership to get groupId
		try {
			console.log("5");
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

	console.log("6", { isAuthenticated, userId, groupId, name, JWT });
	
	return { 
		auth: isAuthenticated, 
		id: userId, 
		groupId,
		name,
		JWT
	};
}
