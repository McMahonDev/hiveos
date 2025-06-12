// src/lib/server/db.ts or schema.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import dotenv from 'dotenv';
dotenv.config();

const url = import.meta.env?.VITE_DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url);
export const db = drizzle(client);
