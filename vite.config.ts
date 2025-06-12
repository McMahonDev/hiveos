import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.env.VITE_DATABASE_URL': JSON.stringify(process.env.VITE_DATABASE_URL),
		'import.meta.env.VITE_INTERNAL_HASH_SALT': JSON.stringify(process.env.VITE_INTERNAL_HASH_SALT),
		'import.meta.env.VITE_INTERNAL_HASH': JSON.stringify(process.env.VITE_INTERNAL_HASH)
	}
});
