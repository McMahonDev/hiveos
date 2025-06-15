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
	// console.log(locals);
	let auth: boolean;
	let id: string;
	let groupId: string;
	console.log('Loading layout server');
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
