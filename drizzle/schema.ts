import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const task = pgTable("task", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	userId: integer("user_id").notNull(),
	status: boolean().default(false).notNull(),
});

export const user = pgTable("user", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
});
