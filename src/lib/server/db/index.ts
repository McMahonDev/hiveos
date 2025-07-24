// src/lib/server/db.ts or schema.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import dotenv from 'dotenv';
import { schema } from '../../combinedSchema';
dotenv.config();

const url = import.meta.env?.VITE_DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!url) throw new Error('DATABASE_URL is not set');

// Export a singleton db instance for Better Auth and other libraries that require a stable db
const client = postgres(url);
export const db = drizzle(client, { schema });

// Optionally, export a per-request db factory for your own queries
export function getDb() {
	const client = postgres(url);
	return drizzle(client, { schema });
}
