import { redirect } from '@sveltejs/kit';
import { hash } from '$lib/utils/hash.js';
import { db } from '$lib/server/db/index';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db/schema';
import dotenv from 'dotenv';
dotenv.config();

// Ensure the user schema includes the email field
import jwt from 'jsonwebtoken';
const { sign } = jwt;

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }: { locals: { user: any } }) {
	// Check if the user is already logged in
	if (locals?.user) {
		throw redirect(302, '/');
	}
	return {
		props: {
			user: locals.user
		}
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const email = data.get('email') as string | null;
		if (!email) {
			// TODO: add error handling for missing email
			throw redirect(302, '/account/login');
		}
		const password = data.get('password') as string;
		let token;

		const account = await db.select().from(users).where(eq(users.email, email)).execute();
		const hashedPassword = hash(password);
		if (account[0] && account[0].password === hashedPassword) {
			token = sign(
				{
					user: email
				},
				process.env.INTERNAL_HASH_SALT,
				{ expiresIn: '30d' }
			);
		} else {
			console.log('wrong password');
			// TODO: add error
			// throw redirect(302, '/account/login');
		}

		if (token) {
			cookies.set('session', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});
		}

		// redirect the user
		throw redirect(302, '/');
	}
};
