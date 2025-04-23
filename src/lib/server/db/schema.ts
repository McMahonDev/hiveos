// drizzle/schema.ts
import { pgTable, text, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { time } from 'node:console';
import { date, datetime } from 'drizzle-orm/mysql-core';

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
	createdById: text('createdById'),
	assignedToId: text('assignedToId')
});

// --- Events Table ---
export const events = pgTable('events', {
	id: text('id').primaryKey(),
	name: text('name'),
	datetime: integer('datetime'),
	timezone: text('timezone'),
	createdById: text('createdById'),
	assignedToId: text('assignedToId')
});

export const shoppingList = pgTable('shoppingList', {
	id: text('id').primaryKey(),
	name: text('name'),
	status: boolean('status'),
	createdById: text('createdById'),
	assignedToId: text('assignedToId')
});

export const userGroups = pgTable('userGroups', {
	id: text('id').primaryKey(),
	name: text('name'),
	createdById: text('createdById')
});
export const userGroupMembers = pgTable('userGroupMembers', {
	id: text('id').primaryKey(),
	userId: text('userId'),
	userGroupId: text('userGroupId')
});

// --- Relationships ---
// Users <-> Tasks
export const usersRelations = relations(users, ({ many }) => ({
	createdTasks: many(tasks, { relationName: 'createdById' }),
	assignedTasks: many(tasks, { relationName: 'assignedToId' })
}));

// Tasks <-> Users and Events
export const tasksRelations = relations(tasks, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [tasks.createdById],
		references: [users.id],
		relationName: 'createdById'
	}),
	assignedTo: one(users, {
		fields: [tasks.assignedToId],
		references: [users.id],
		relationName: 'assignedToId'
	})
}));

// Events <-> Users
export const eventsRelations = relations(events, ({ one }) => ({
	createdBy: one(users, {
		fields: [events.createdById],
		references: [users.id]
	}),
	assignedTo: one(users, {
		fields: [events.assignedToId],
		references: [users.id]
	})
}));

// Shopping List <-> Users
export const shoppingListRelations = relations(shoppingList, ({ one }) => ({
	createdBy: one(users, {
		fields: [shoppingList.createdById],
		references: [users.id]
	}),
	assignedTo: one(users, {
		fields: [shoppingList.assignedToId],
		references: [users.id]
	})
}));
// UserGroups <-> Users
export const userGroupsRelations = relations(userGroups, ({ one }) => ({
	createdBy: one(users, {
		fields: [userGroups.createdById],
		references: [users.id]
	})
}));

// UserGroupMembers <-> Users and UserGroups
export const userGroupMembersRelations = relations(userGroupMembers, ({ one }) => ({
	user: one(users, {
		fields: [userGroupMembers.userId],
		references: [users.id]
	}),
	userGroup: one(userGroups, {
		fields: [userGroupMembers.userGroupId],
		references: [userGroups.id]
	})
}));
