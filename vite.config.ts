import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL)
	}
});
