// src/routes/+layout.ts
import { Z } from 'zero-svelte';
import { schema, type Schema } from '../schema';
import { user } from '$lib/state/user.svelte';
import type { LayoutLoad } from './$types';

const url = import.meta.env?.VITE_CONNECTION_STRING;
if (!url) throw new Error('CONNECTION_STRING is not set');

export const load: LayoutLoad = async (event) => {
	let { auth, id, groupId } = event.data;
	const sessionUser = auth && id && groupId ? { id, groupId } : null;
	let z: Z<Schema> | undefined;
	// Defaults
	auth = false;
	id = '';
	groupId = '0';

	if (sessionUser) {
		auth = true;
		id = sessionUser.id;
		groupId = sessionUser.groupId;

		// Z init
		function get_z_options() {
			return {
				userID: id,
				server: url,
				schema,
				kvStore: 'idb'
			} as const;
		}
		z = new Z<Schema>(get_z_options());

		// Set user state
		user.userID = id;
		user.groupId = groupId;
		user.auth = auth;
		user.isLoggedIn = true;

		console.log('User session found:', sessionUser);
	} else {
		console.log('No session, skipping Z init');
		z = undefined;
	}

	return {
		auth,
		id,
		groupId,
		z
	};
};
