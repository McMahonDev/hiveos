import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
		'import.meta.env.CONNECTION_STRING': JSON.stringify(process.env.CONNECTION_STRING),
		'import.meta.env.INTERNAL_HASH_SALT': JSON.stringify(process.env.INTERNAL_HASH_SALT),
		'import.meta.env.INTERNAL_HASH': JSON.stringify(process.env.INTERNAL_HASH)
	}
});
