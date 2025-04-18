	export const ssr = false;
import { redirect } from '@sveltejs/kit';

interface Locals {
	user?: {
		id: string;
	};
}

export async function load({ locals, url, cookies }: { locals: Locals; url: URL; cookies: any }) {
	console.log(cookies.get('session'));
	let auth: boolean;
	let id: string;
	if (!locals?.user) {
		auth = false;
		id = '';
		if (url.pathname !== '/account/login' && url.pathname !== '/account/register') {
			throw redirect(302, '/account/login');
		}
	} else {
		auth = true;
		id = locals.user.id;
	}
	return { auth, id };
}
