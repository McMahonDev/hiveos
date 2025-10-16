import { redirect, fail, type Actions } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';
import { db } from '$lib/server/db';
import { accessCodes, userGroups, userGroupMembers, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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

export const actions: Actions = {
	validateAccessCode: async ({ request }) => {
		const data = await request.formData();
		const code = data.get('code')?.toString().trim();

		if (!code) {
			return fail(400, { error: 'Access code is required' });
		}

		try {
			// Find the access code
			const [accessCodeRecord] = await db
				.select()
				.from(accessCodes)
				.where(eq(accessCodes.code, code))
				.limit(1);

			if (!accessCodeRecord) {
				return fail(404, { error: 'Invalid access code' });
			}

			// Check if code has expired
			if (accessCodeRecord.expiresAt && new Date(accessCodeRecord.expiresAt) < new Date()) {
				return fail(400, { error: 'This access code has expired' });
			}

			// Check if code has remaining uses
			if (
				accessCodeRecord.usesRemaining !== null &&
				accessCodeRecord.usesRemaining !== undefined &&
				accessCodeRecord.usesRemaining <= 0
			) {
				return fail(400, { error: 'This access code has no remaining uses' });
			}

			// Get the group info
			const [group] = await db
				.select()
				.from(userGroups)
				.where(eq(userGroups.id, accessCodeRecord.groupId))
				.limit(1);

			if (!group) {
				return fail(404, { error: 'Group not found' });
			}

			// Check if group is at capacity
			if (group.maxMembers) {
				const memberCount = await db
					.select()
					.from(userGroupMembers)
					.where(eq(userGroupMembers.userGroupId, group.id));

				if (memberCount.length >= group.maxMembers) {
					return fail(400, { error: 'This group is at full capacity' });
				}
			}

			return {
				success: true,
				accessCodeId: accessCodeRecord.id,
				groupName: group.name,
				groupType: group.groupType
			};
		} catch (error) {
			console.error('Error validating access code:', error);
			return fail(500, { error: 'Failed to validate access code' });
		}
	},

	enrollUserInGroup: async ({ request }) => {
		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		const accessCodeId = data.get('accessCodeId')?.toString();

		if (!userId || !accessCodeId) {
			return fail(400, { error: 'Missing required data' });
		}

		try {
			// Get access code details
			const [accessCodeRecord] = await db
				.select()
				.from(accessCodes)
				.where(eq(accessCodes.id, accessCodeId))
				.limit(1);

			if (!accessCodeRecord) {
				return fail(404, { error: 'Access code not found' });
			}

			const groupId = accessCodeRecord.groupId;

			// Get group details
			const [group] = await db
				.select()
				.from(userGroups)
				.where(eq(userGroups.id, groupId))
				.limit(1);

			if (!group) {
				return fail(404, { error: 'Group not found' });
			}

			// Add user to group
			await db.insert(userGroupMembers).values({
				id: nanoid(),
				userId: userId,
				userGroupId: groupId,
				userGroupCreatorId: group.createdById,
				isAdmin: false,
				joinedAt: new Date()
			});

			// Update user's active group and subscription tier
			const tierToSet = group.groupType === 'family' ? 'family_member' : 'team_member';

			await db
				.update(user)
				.set({
					activeGroupId: groupId,
					subscriptionTier: tierToSet
				})
				.where(eq(user.id, userId));

			// Decrement uses remaining if applicable
			if (
				accessCodeRecord.usesRemaining !== null &&
				accessCodeRecord.usesRemaining !== undefined
			) {
				await db
					.update(accessCodes)
					.set({
						usesRemaining: accessCodeRecord.usesRemaining - 1
					})
					.where(eq(accessCodes.id, accessCodeId));
			}

			return {
				success: true,
				groupId: groupId,
				groupName: group.name
			};
		} catch (error) {
			console.error('Error enrolling user in group:', error);
			return fail(500, { error: 'Failed to enroll user in group' });
		}
	}
};
