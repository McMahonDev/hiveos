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
	console.log(locals);
	let auth: boolean;
	let id: string;
	let groupId: string;
	if (!locals?.user) {
		auth = false;
		id = '';
		groupId = '0';
		if (url.pathname !== '/account/login' && url.pathname !== '/account/register') {
			throw redirect(302, '/account/login');
		}
	} else {
		auth = true;
		id = locals.user.id;
		groupId = locals.user.groupId;
	}
	return { auth, id, groupId };
}
