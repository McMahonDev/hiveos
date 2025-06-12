import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL)
	}
});
