// drizzle/schema.ts
import { pgTable, text, timestamp, boolean, integer, real } from 'drizzle-orm/pg-core';
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
	endDate: text('endDate'),
	endTime: text('endTime'),
	timezone: text('timezone'),
	location: text('location'),
	description: text('description'),
	allDay: boolean('allDay'),
	createdById: text('createdById'),
	assignedToId: text('assignedToId'),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
	viewMode: text('viewMode')
});

export const shoppingList = pgTable('shoppingList', {
	id: text('id').primaryKey(),
	name: text('name'),
	store: text('store'),
	status: boolean('status'),
	createdById: text('createdById'),
	assignedToId: text('assignedToId'),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
	viewMode: text('viewMode')
});

export const userGroups = pgTable('userGroups', {
	id: text('id').primaryKey(),
	name: text('name'),
	createdById: text('createdById'),
	groupType: text('groupType'), // 'family', 'team', etc.
	maxMembers: integer('maxMembers'), // Maximum number of members allowed
	createdAt: timestamp('createdAt').$defaultFn(() => new Date())
});
export const userGroupMembers = pgTable('userGroupMembers', {
	id: text('id').primaryKey(),
	userId: text('userId'),
	userGroupId: text('userGroupId'),
	userGroupCreatorId: text('userGroupCreatorId'),
	isAdmin: boolean('isAdmin').$defaultFn(() => false),
	joinedAt: timestamp('joinedAt').$defaultFn(() => new Date())
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

export const customLists = pgTable('customLists', {
	id: text('id').primaryKey(),
	name: text('name'),
	createdById: text('createdById'),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
	viewMode: text('viewMode'),
	listType: text('listType'), // 'basic', 'shopping', 'events', 'tasks', 'recipe', 'messages', 'contacts', 'bookmarks'
	groupId: text('groupId') // The group this list belongs to (for shared lists)
});

export const customListItems = pgTable('customListItems', {
	id: text('id').primaryKey(),
	name: text('name'),
	status: boolean('status'),
	createdById: text('createdById'),
	customListId: text('customListId'),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
	viewMode: text('viewMode'),
	groupId: text('groupId'), // The group this item belongs to (for shared items)
	// Shopping list fields
	store: text('store'),
	// Events fields
	date: text('date'),
	time: text('time'),
	endDate: text('endDate'),
	endTime: text('endTime'),
	timezone: text('timezone'),
	location: text('location'),
	description: text('description'),
	allDay: boolean('allDay'),
	// Task list fields
	sortOrder: integer('sortOrder'),
	// Recipe fields
	ingredients: text('ingredients'),
	instructions: text('instructions'),
	servings: integer('servings'),
	prepTime: text('prepTime'),
	cookTime: text('cookTime'),
	// Messages/Notes fields
	messageText: text('messageText'),
	priority: text('priority'),
	// Contacts fields
	phone: text('phone'),
	email: text('email'),
	address: text('address'),
	// Bookmarks fields
	url: text('url'),
	tags: text('tags')
});

export const viewModeCategories = pgTable('viewModeCategories', {
	id: text('id').primaryKey(),
	name: text('name'),
	userId: text('userId'),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date())
});

export const accessCodes = pgTable('accessCodes', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(),
	groupId: text('groupId').notNull(),
	createdById: text('createdById').notNull(),
	usesRemaining: integer('usesRemaining'),
	maxUses: integer('maxUses'),
	expiresAt: timestamp('expiresAt'),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date())
});

// --- Comparison Tool Tables ---
export const comparisons = pgTable('comparisons', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	isPriceAFactor: boolean('isPriceAFactor').$defaultFn(() => false),
	priceWeight: integer('priceWeight').$defaultFn(() => 1),
	createdById: text('createdById').notNull(),
	viewMode: text('viewMode').notNull(),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
	updatedAt: timestamp('updatedAt').$defaultFn(() => new Date())
});

export const comparisonCriteria = pgTable('comparisonCriteria', {
	id: text('id').primaryKey(),
	comparisonId: text('comparisonId').notNull(),
	name: text('name').notNull(),
	type: text('type').$defaultFn(() => 'boolean'),
	higherIsBetter: boolean('higherIsBetter'),
	weight: integer('weight').$defaultFn(() => 1),
	sortOrder: integer('sortOrder').$defaultFn(() => 0),
	createdById: text('createdById').notNull(),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date())
});

export const comparisonItems = pgTable('comparisonItems', {
	id: text('id').primaryKey(),
	comparisonId: text('comparisonId').notNull(),
	name: text('name').notNull(),
	price: integer('price'),
	notes: text('notes'),
	totalScore: integer('totalScore').$defaultFn(() => 0),
	createdById: text('createdById').notNull(),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date())
});

export const comparisonItemValues = pgTable('comparisonItemValues', {
	id: text('id').primaryKey(),
	comparisonItemId: text('comparisonItemId').notNull(),
	criterionId: text('criterionId').notNull(),
	hasFeature: boolean('hasFeature').$defaultFn(() => false),
	numericValue: real('numericValue'),
	notes: text('notes'),
	createdById: text('createdById').notNull(),
	createdAt: timestamp('createdAt').$defaultFn(() => new Date())
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

export const customListsRelations = relations(customLists, ({ one, many }) => ({
	createdBy: one(user, {
		fields: [customLists.createdById],
		references: [user.id]
	}),
	items: many(customListItems, {
		relationName: 'customListId'
	})
}));

export const customListItemsRelations = relations(customListItems, ({ one }) => ({
	customList: one(customLists, {
		fields: [customListItems.customListId],
		references: [customLists.id]
	})
}));

export const viewModeCategoriesRelations = relations(viewModeCategories, ({ one }) => ({
	user: one(user, {
		fields: [viewModeCategories.userId],
		references: [user.id]
	})
}));

export const accessCodesRelations = relations(accessCodes, ({ one }) => ({
	group: one(userGroups, {
		fields: [accessCodes.groupId],
		references: [userGroups.id]
	}),
	createdBy: one(user, {
		fields: [accessCodes.createdById],
		references: [user.id]
	})
}));

// --- Comparison Tool Relationships ---
export const comparisonsRelations = relations(comparisons, ({ one, many }) => ({
	createdBy: one(user, {
		fields: [comparisons.createdById],
		references: [user.id]
	}),
	criteria: many(comparisonCriteria),
	items: many(comparisonItems)
}));

export const comparisonCriteriaRelations = relations(comparisonCriteria, ({ one }) => ({
	comparison: one(comparisons, {
		fields: [comparisonCriteria.comparisonId],
		references: [comparisons.id]
	}),
	createdBy: one(user, {
		fields: [comparisonCriteria.createdById],
		references: [user.id]
	})
}));

export const comparisonItemsRelations = relations(comparisonItems, ({ one, many }) => ({
	comparison: one(comparisons, {
		fields: [comparisonItems.comparisonId],
		references: [comparisons.id]
	}),
	createdBy: one(user, {
		fields: [comparisonItems.createdById],
		references: [user.id]
	}),
	values: many(comparisonItemValues)
}));

export const comparisonItemValuesRelations = relations(comparisonItemValues, ({ one }) => ({
	comparisonItem: one(comparisonItems, {
		fields: [comparisonItemValues.comparisonItemId],
		references: [comparisonItems.id]
	}),
	criterion: one(comparisonCriteria, {
		fields: [comparisonItemValues.criterionId],
		references: [comparisonCriteria.id]
	}),
	createdBy: one(user, {
		fields: [comparisonItemValues.createdById],
		references: [user.id]
	})
}));
