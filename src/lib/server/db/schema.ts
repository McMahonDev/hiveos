// drizzle/schema.ts
import {
  pgTable,
  text,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Users Table ---
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  password: text('password'),
});

// --- Tasks Table ---
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  name: text('name'),
  status: boolean('status'),
  createdById: text('createdById'),
  assignedToId: text('assignedToId'),
});

// --- Events Table ---
export const events = pgTable('events', {
  id: text('id').primaryKey(),
  name: text('name'),
  timestamp: integer('timestamp'), // Assuming timestamp is stored as number (e.g., Unix epoch)
  createdById: text('createdById'),
  assignedToId: text('assignedToId'),
});

// --- Relationships ---
// Users <-> Tasks
export const usersRelations = relations(users, ({ many }) => ({
  createdTasks: many(tasks, { relationName: 'createdById' }),
  assignedTasks: many(tasks, { relationName: 'assignedToId' }),
}));

// Tasks <-> Users and Events
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: 'createdById',
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: 'assignedToId',
  }),
}));

// Events <-> Users
export const eventsRelations = relations(events, ({ one }) => ({
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [events.assignedToId],
    references: [users.id],
  }),
}));
