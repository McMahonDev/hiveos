// import { PUBLIC_SERVER } from '$env/static/public';
import { Z } from 'zero-svelte';
import { schema, type Schema } from '../schema';
// Schema is imported from wherever your Schema type lives.
// via export type Schema = typeof schema;

export function get_z_options() {
	return {
		userID: 'anon',
		server: 'http://localhost:4848',
		schema,
        kvStore: 'mem',
		// ... other options
	} as const;
}

export const z = new Z<Schema>(get_z_options());