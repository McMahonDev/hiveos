
	import { Zero } from '@rocicorp/zero';
	import { schema } from '../../schema';

	export let z = new Zero({
		userID: 'example-user',
		server: 'http://localhost:4848',
		schema,
		kvStore: 'mem'
	});

