// src/routes/+layout.ts
import { Z } from 'zero-svelte';
import { schema, type Schema } from '../zero-schema';
import type { LayoutLoad } from './$types';

const url = import.meta.env?.VITE_CONNECTION_STRING;
if (!url) throw new Error('CONNECTION_STRING is not set');

export const load: LayoutLoad = async (event) => {
	let { auth, id, groupId, name } = event.data;
	const authenticatedUser = auth && id && groupId ? { id, groupId } : null;
	let z: Z<Schema> | undefined;

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

	} else {
		z = undefined;
	}

	return {
		auth,
		id,
		groupId,
		groupActive: false,
		name,
		z
	};
};
