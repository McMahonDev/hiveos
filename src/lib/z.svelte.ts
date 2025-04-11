import { Z } from 'zero-svelte';
import { schema, type Schema } from '../schema';

export function get_z_options() {
	return {
		userID: 'uu1',
		server: import.meta.env.VITE_CONNECTION_STRING,
		schema,
		kvStore: 'idb'
		// ... other options
	} as const;
}

export const z = new Z<Schema>(get_z_options());
