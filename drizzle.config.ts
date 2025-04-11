import { defineConfig } from 'drizzle-kit';

if (!process.env.VITE_DATABASE_URL) throw new Error('DATABASE_URL is not set');
console.log('DATABASE_URL', process.env.VITE_DATABASE_URL);

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dbCredentials: { url: process.env.VITE_DATABASE_URL },
	verbose: true,
	strict: true,
	dialect: 'postgresql'
});
