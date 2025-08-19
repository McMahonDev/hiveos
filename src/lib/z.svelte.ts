import { Z } from 'zero-svelte';
import { schema, type Schema } from '../../schema';

const url = import.meta.env?.VITE_DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

export function get_z_options() {
	return {
		userID: 'uu1',
		server: url,
		schema,
		kvStore: 'idb'
		// ... other options
	} as const;
}

export const z = new Z<Schema>(get_z_options());
