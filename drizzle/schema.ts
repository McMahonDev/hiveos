import { pgTable, text, boolean, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tasks = pgTable("tasks", {
	id: text().primaryKey().notNull(),
	name: text(),
	status: boolean(),
	createdById: text().notNull(),
	assignedToId: text().notNull(),
});

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	password: text(),
});

export const events = pgTable("events", {
	id: text().primaryKey().notNull(),
	name: text(),
	timestamp: integer(),
	taskId: text(),
});
