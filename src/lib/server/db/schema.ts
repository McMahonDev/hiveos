// drizzle/schema.ts
import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Import and re-export the Better Auth tables
import { user, session, account, verification } from '../../../../auth-schema';

// Re-export Better Auth tables so Drizzle can see them
export { user, session, account, verification };

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
	date: text('date'),
	time: text('time'),
	timezone: text('timezone'),
	createdById: text('createdById'),
	assignedToId: text('assignedToId'),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date())
});

export const shoppingList = pgTable('shoppingList', {
	id: text('id').primaryKey(),
	name: text('name'),
	status: boolean('status'),
	createdById: text('createdById'),
	assignedToId: text('assignedToId'),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date())
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

// --- UserGroupRequests Table ---
export const userGroupRequests = pgTable('userGroupRequests', {
	id: text('id').primaryKey(),
	email: text('email'),
	userGroupId: text('userGroupId'),
	status: boolean('status'),
	sentByEmail: text('sentByEmail'),
	groupName: text('groupName')
});

// --- Relationships ---
// Users <-> Tasks
export const usersRelations = relations(user, ({ many }) => ({
	createdTasks: many(tasks, { relationName: 'createdById' }),
	assignedTasks: many(tasks, { relationName: 'assignedToId' })
}));

// Tasks <-> Users and Events
export const tasksRelations = relations(tasks, ({ one, many }) => ({
	createdBy: one(user, {
		fields: [tasks.createdById],
		references: [user.id],
		relationName: 'createdById'
	}),
	assignedTo: one(user, {
		fields: [tasks.assignedToId],
		references: [user.id],
		relationName: 'assignedToId'
	})
}));

// Events <-> Users
export const eventsRelations = relations(events, ({ one }) => ({
	createdBy: one(user, {
		fields: [events.createdById],
		references: [user.id]
	}),
	assignedTo: one(user, {
		fields: [events.assignedToId],
		references: [user.id]
	})
}));

// Shopping List <-> Users
export const shoppingListRelations = relations(shoppingList, ({ one }) => ({
	createdBy: one(user, {
		fields: [shoppingList.createdById],
		references: [user.id]
	}),
	assignedTo: one(user, {
		fields: [shoppingList.assignedToId],
		references: [user.id]
	})
}));
// UserGroups <-> Users
export const userGroupsRelations = relations(userGroups, ({ one }) => ({
	createdBy: one(user, {
		fields: [userGroups.createdById],
		references: [user.id]
	})
}));

// UserGroupMembers <-> Users and UserGroups
export const userGroupMembersRelations = relations(userGroupMembers, ({ one }) => ({
	user: one(user, {
		fields: [userGroupMembers.userId],
		references: [user.id]
	}),
	userGroup: one(userGroups, {
		fields: [userGroupMembers.userGroupId],
		references: [userGroups.id]
	})
}));

// UserGroupRequests <-> Users and UserGroups
export const userGroupRequestsRelations = relations(userGroupRequests, ({ one }) => ({
	createdBy: one(user, {
		fields: [userGroupRequests.sentByEmail],
		references: [user.id]
	}),
	userGroup: one(userGroups, {
		fields: [userGroupRequests.userGroupId],
		references: [userGroups.id]
	})
}));
