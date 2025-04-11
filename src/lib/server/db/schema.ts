// drizzle/schema.ts
import { pgTable, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Users Table ---
export const users = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	email: text('email'),
	password: text('password')
});

// --- Tasks Table ---
export const tasks = pgTable('tasks', {
	id: text('id').primaryKey(),
	name: text('name'),
	status: boolean('status'),
	createdById: text('created_by_id'),
	assignedToId: text('assigned_to_id')
});

// --- Relationships ---
export const usersRelations = relations(users, ({ many }) => ({
	createdTasks: many(tasks, { relationName: 'createdBy' }),
	assignedTasks: many(tasks, { relationName: 'assignedTo' })
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
	createdBy: one(users, {
		fields: [tasks.createdById],
		references: [users.id],
		relationName: 'createdBy'
	}),
	assignedTo: one(users, {
		fields: [tasks.assignedToId],
		references: [users.id],
		relationName: 'assignedTo'
	})
}));
