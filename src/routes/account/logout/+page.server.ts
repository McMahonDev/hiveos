import { redirect } from '@sveltejs/kit';
import dotenv from 'dotenv';
dotenv.config();

export async function load({ cookies }) {
	// Clear the session cookie
	cookies.set('session', '', {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 0
	});

	// return {
	// 	loggedIn: false
	// };

	// Redirect to the login page
	throw redirect(302, '/account/login');
}
