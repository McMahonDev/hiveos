import { defineConfig } from 'drizzle-kit';

const url = process.env.VITE_DATABASE_URL;

if (!url) throw new Error('DATABASE_URL is not set');
console.log('DATABASE_URL', url);

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dbCredentials: { url: process.env.VITE_DATABASE_URL },
	verbose: true,
	strict: true,
	dialect: 'postgresql'
});
