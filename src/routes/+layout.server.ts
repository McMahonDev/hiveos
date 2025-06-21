export const ssr = false;
import { redirect } from '@sveltejs/kit';

interface Locals {
	user?: {
		id: string;
		email: string;
		groupId: string;
	};
}

export async function load({ locals, url, cookies }: { locals: Locals; url: URL; cookies: any }) {
	let auth: boolean;
	let id: string;
	let groupId: string;

	console.log('Loading layout server');

	let sessionCookie = cookies.get('session');
	if (sessionCookie) {
		console.log('Session cookie found:', sessionCookie);
	} else {
		console.log('No session cookie found');
	}

	// const test = await locals?.user;
	if (!locals?.user) {
		console.log('No user found, redirecting to login');
		auth = false;
		id = '';
		groupId = '0';
		if (url.pathname !== '/account/login' && url.pathname !== '/account/register') {
			console.log('Redirecting to login page');
			console.log('Current URL:', url.pathname);
			throw redirect(302, '/account/login');
		}
	} else {
		console.log('User found, setting auth to true');
		auth = true;
		id = locals.user.id;
		groupId = locals.user.groupId;
	}
	return { auth, id, groupId };
}
