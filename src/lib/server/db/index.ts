export async function getDb() {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	const postgres = (await import('postgres')).default;
	const { drizzle } = await import('drizzle-orm/postgres-js');
	const client = postgres(process.env.DATABASE_URL);
	return drizzle(client);
}

export const db = await getDb();
