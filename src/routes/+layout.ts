// src/routes/+layout.ts
import { Z } from 'zero-svelte';
import { schema, type Schema } from '../schema';
import { user } from '$lib/state/user.svelte';
import type { LayoutLoad } from './$types';

const url = import.meta.env?.VITE_CONNECTION_STRING;
if (!url) throw new Error('CONNECTION_STRING is not set');

export const load: LayoutLoad = async (event) => {
	let { auth, id, groupId, user: sessionUser, session } = event.data;
	const authenticatedUser = auth && id && groupId ? { id, groupId } : null;
	let z: Z<Schema> | undefined;
	// Defaults
	//  // Use userId as fallback for groupId

	if (authenticatedUser) {
		auth = true;
		id = authenticatedUser.id;
		groupId = authenticatedUser.groupId;

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
		user.email = sessionUser?.email || '';

		console.log('User session found:', authenticatedUser);
	} else {
		console.log('No session, skipping Z init');
		z = undefined;
	}

	return {
		auth,
		id,
		groupId,
		user: sessionUser,
		session,
		z
	};
};
