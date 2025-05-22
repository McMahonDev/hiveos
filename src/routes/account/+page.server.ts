import { db } from '$lib/server/db/index';
import { eq } from 'drizzle-orm';
import { users, userGroupMembers, userGroups } from '$lib/server/db/schema';

export async function load({ locals }: { locals: { user: any } }) {
	// get the user group id
	const groupid =
		(await db
			.select()
			.from(userGroupMembers)
			.where(eq(userGroupMembers.userId, locals.user.id))
			.execute()) ?? '0';

	const email = await db.select().from(users).where(eq(users.id, locals.user.id)).execute();

	return {
		groupid: groupid[0]?.userGroupId,
		email: email[0]?.email
	};
}
