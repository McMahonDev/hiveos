export const ssr = false;
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';
import { db } from '$lib/server/db/index';
import { userGroupMembers, user, events, customLists } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
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
	let isSuperadmin: boolean = false;
	let JWT: string | undefined = undefined;

	// Use Better Auth to get the session
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		isAuthenticated = false;
		userId = '';
		groupId = '0';
		if (
			url.pathname !== '/' &&
			url.pathname !== '/account/login' &&
			url.pathname !== '/account/register' &&
			url.pathname !== '/account/forgot-password' &&
			!url.pathname.includes('/reset-password')
		) {
			throw redirect(302, '/');
		}
	} else {
		isAuthenticated = true;
		userId = session.user.id;
		// We'll compute groupId below and then sign the JWT so it contains groupId

		// Query the user's group membership to get groupId
		try {
			const userGroupMembership = await db
				.select()
				.from(userGroupMembers)
				.where(eq(userGroupMembers.userId, session.user.id))
				.limit(1);
			console.log('User group membership:', userGroupMembership);

			// If user is in a group, use that groupId, otherwise use userId as groupId
			groupId = userGroupMembership[0]?.userGroupId || session.user.id;

			const userData = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

			if (userData[0]) {
				name = userData[0].name;
				isSuperadmin = userData[0].superadmin || false;
			} else {
				// If no user data is found, fall back to session user
				console.log('No user data found, falling back to session user');
			}

			// Sign JWT after computing groupId so the token's auth payload includes groupId
			JWT = jwt.sign(
				{
					sub: session.user.id, // This is what Zero uses for authData.sub
					groupId: groupId,
					userId: session.user.id,
					email: session.user.email,
					name: session.user.name
				},
				JWT_SECRET as string,
				{
					expiresIn: '24h'
				}
			);
			try {
				const eventsForGroup = await db
					.select()
					.from(events)
					.where(eq(events.assignedToId, groupId))
					.limit(5);
				console.log(
					'DEBUG events assigned to group',
					groupId,
					'count:',
					eventsForGroup.length,
					'sample:',
					eventsForGroup.map((e) => ({ id: e.id, assignedToId: e.assignedToId })).slice(0, 3)
				);
			} catch (err) {
				console.error('DEBUG: error querying events for groupId', groupId, err);
			}

			// Create default lists if they don't exist for this user
			try {
				// Check for existing Events list
				const existingEventsList = await db
					.select()
					.from(customLists)
					.where(
						and(eq(customLists.createdById, session.user.id), eq(customLists.listType, 'events'))
					)
					.limit(1);

				if (existingEventsList.length === 0) {
					// Create default Events list
					await db.insert(customLists).values({
						id: nanoid(),
						name: 'Events',
						createdById: session.user.id,
						createdAt: new Date(),
						viewMode: 'personal',
						listType: 'events'
					});
					console.log('Created default Events list for user:', session.user.id);
				}

				// Check for existing Shopping list
				const existingShoppingList = await db
					.select()
					.from(customLists)
					.where(
						and(eq(customLists.createdById, session.user.id), eq(customLists.listType, 'shopping'))
					)
					.limit(1);

				if (existingShoppingList.length === 0) {
					// Create default Shopping List
					await db.insert(customLists).values({
						id: nanoid(),
						name: 'Shopping List',
						createdById: session.user.id,
						createdAt: new Date(),
						viewMode: 'personal',
						listType: 'shopping'
					});
					console.log('Created default Shopping List for user:', session.user.id);
				}
			} catch (error) {
				console.error('Error creating default lists:', error);
				// Don't fail the load if list creation fails
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
		name,
		isSuperadmin,
		JWT
	};
}
