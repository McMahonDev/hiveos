import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
const { verify } = jwt;
import { db } from '$lib/server/db/index';
import { userGroupMembers, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

const salt = import.meta.env.VITE_INTERNAL_HASH_SALT || process.env.VITE_INTERNAL_HASH_SALT;
if (!salt) {
	throw new Error('INTERNAL_HASH_SALT is not defined in environment variables');
}
interface Locals {
	user: { id: string; email: string } | null;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({
	event,
	resolve
}: {
	event: { request: Request; locals: Locals };
	resolve: Function;
}) {
	const { headers } = event.request;
	const cookies = parse(headers.get('cookie') ?? '');
	if (cookies.session) {
		const token = cookies.session;

		try {
			if (!salt) {
				throw new Error('INTERNAL_HASH_SALT is not defined in environment variables');
			}
			const jwtUser = verify(token, salt);
			if (typeof jwtUser === 'string') {
				throw new Error('Something went wrong');
			}

			const account = await db.select().from(users).where(eq(users.email, jwtUser.user)).execute();

			if (!account[0]) {
				throw new Error('User not found');
			}
			const group = await db
				.select()
				.from(userGroupMembers)
				.where(eq(userGroupMembers.userId, account[0].id))
				.execute();
			console.log('run group query');
			let groupId = group[0]?.userGroupId;
			if (!groupId) {
				groupId = '0';
			}

			if (account[0].email === null) {
				throw new Error('User email is null');
			}
			const sessionUser = {
				id: account[0].id,
				email: account[0].email as string,
				groupId: groupId
			};

			event.locals.user = sessionUser;
		} catch (error) {
			console.error(error);
		}
	} else {
		event.locals.user = null;
	}

	return await resolve(event);
}

/** @type {import('@sveltejs/kit').GetSession} */
export async function getSession({ locals }: { locals: Locals }) {
	return {
		user: locals.user
	};
}
