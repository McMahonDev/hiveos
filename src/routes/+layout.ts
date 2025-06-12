import { Z } from 'zero-svelte';
import { schema, type Schema } from '../schema';
import dotenv from 'dotenv';
dotenv.config();

const url = import.meta.env?.VITE_CONNECTION_STRING || process.env.VITE_CONNECTION_STRING;
if (!url) throw new Error('CONNECTION_STRING is not set');

let z: Z<Schema>;

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
