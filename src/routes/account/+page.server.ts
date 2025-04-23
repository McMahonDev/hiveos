import { db } from '$lib/server/db/index';
import { eq } from 'drizzle-orm';
import { users, userGroupMembers, userGroups } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';

import { nanoid } from 'nanoid';

export async function load({ locals }: { locals: { user: any } }) {
	// get the user group id
	const groupid = await db
		.select()
		.from(userGroupMembers)
		.where(eq(userGroupMembers.userId, locals.user.id))
		.execute();

	// 	let group;
	// 	if (groupid[0]?.userGroupId) {
	// 		group = await db
	// 			.select()
	// 			.from(userGroups)
	// 			.where(eq(userGroups.id, groupid[0].userGroupId))
	// 			.execute();
	// 	} else {
	// 		group = false;
	// 	}

	// 	console.log(group);

	// 	let groupName = false;
	// 	if (group) {
	// 		groupName = group[0].name;
	// 	}

	return {
		groupid: groupid[0]?.userGroupId
	};
}

// /** @type {import('./$types').Actions} */
// export const actions = {
// 	createGroup: async ({ locals, request }) => {
// 		const data = await request.formData();
// 		const groupName = data.get('groupName') as string;
// 		console.log(groupName);
// 		// create a new group
// 		const groupId = nanoid();
// 		try {
// 			await db
// 				.insert(userGroups)
// 				.values({
// 					id: groupId,
// 					createdById: locals.user.id,
// 					name: groupName
// 				})
// 				.execute();

// 			await db
// 				.insert(userGroupMembers)
// 				.values({
// 					id: nanoid(),
// 					userId: locals.user.id,
// 					userGroupId: groupId
// 				})
// 				.execute();
// 		} catch (error) {
// 			console.log(error);
// 		}
// 		// redirect the user
// 		throw redirect(307, '/account');
// 	},
// 	deleteGroup: async ({ locals }) => {
// 		// get the user group id
// 		const groupid = await db
// 			.select()
// 			.from(userGroupMembers)
// 			.where(eq(userGroupMembers.userId, locals.user.id))
// 			.execute();
// 		const groupId = groupid[0].userGroupId;
// 		console.log(groupId);
// 		try {
// 			await db.delete(userGroups).where(eq(userGroups.id, groupId)).execute();
// 			await db.delete(userGroupMembers).where(eq(userGroupMembers.userGroupId, groupId)).execute();
// 		} catch (error) {
// 			console.log(error);
// 		}
// 		// redirect the user
// 		// refresh the page

// 		throw redirect(307, '/account');
// 	}
// };
