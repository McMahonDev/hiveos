import { Z } from 'zero-svelte';
import { schema, type Schema } from '../schema';
import { user } from '$lib/state/user.svelte';

const url = import.meta.env?.VITE_CONNECTION_STRING;
if (!url) throw new Error('CONNECTION_STRING is not set');

let z: Z<Schema> | undefined;

export async function load(event) {
	// console.log(cookies.get('session'));
	if (event.data.auth) {
		function get_z_options() {
			return {
				userID: event.data.id,
				server: url,
				schema,
				kvStore: 'idb'
				// ... other options
			} as const;
		}

		z = new Z<Schema>(get_z_options());

		// console.log(event.data);
		user.userID = event.data.id;
		user.groupId = event.data.groupId;
		user.auth = event.data.auth;
		user.isLoggedIn = true;
	} else {
		console.log('No auth, no z');
		z = undefined;
	}
	return {
		auth: event.data.auth,
		id: event.data.id,
		groupId: event.data.groupId,
		z
	};
}
