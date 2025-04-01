import { pgTable, text, integer, boolean, serial, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(), // Corrected: Use `serial` for auto-increment
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(), // Corrected: Use `serial` for auto-increment
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: boolean('status').notNull().default(false),
});

// Relations (optional but useful for ORM operations)
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));
