import { Z } from 'zero-svelte';
import { schema, type Schema } from '../schema';
import dotenv from 'dotenv';
dotenv.config();

export function get_z_options() {
	return {
		userID: 'uu1',
		server: process.env.CONNECTION_STRING,
		schema,
		kvStore: 'idb'
		// ... other options
	} as const;
}

export const z = new Z<Schema>(get_z_options());
