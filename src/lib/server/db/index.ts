export async function getDb() {
	if (!import.meta.env.VITE_DATABASE_URL) throw new Error('DATABASE_URL is not set');
	const postgres = (await import('postgres')).default;
	const { drizzle } = await import('drizzle-orm/postgres-js');
	const client = postgres(import.meta.env.VITE_DATABASE_URL);
	return drizzle(client);
}

export const db = await getDb();
