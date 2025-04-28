import {
	createSchema,
	definePermissions,
	type Row,
	table,
	string,
	relationships,
	number,
	boolean,
	ANYONE_CAN,
	type ExpressionBuilder
} from '@rocicorp/zero';

type AuthData = {
	// The logged-in user.
	sub: string;
};
const users = table('users')
	.columns({
		id: string(),
		name: string(),
		email: string(),
		password: string()
	})
	.primaryKey('id');

const tasks = table('tasks')
	.columns({
		id: string(),
		name: string(),
		status: boolean(),
		createdById: string(),
		assignedToId: string()
	})
	.primaryKey('id');

const events = table('events')
	.columns({
		id: string(),
		name: string(),
		datetime: number(),
		timezone: string(),
		createdById: string(),
		assignedToId: string()
	})
	.primaryKey('id');

const shoppingList = table('shoppingList')
	.columns({
		id: string(),
		name: string(),
		status: boolean(),
		createdById: string(),
		assignedToId: string()
	})
	.primaryKey('id');

const userGroups = table('userGroups')
	.columns({
		id: string(),
		name: string(),
		createdById: string()
	})
	.primaryKey('id');

const userGroupMembers = table('userGroupMembers')
	.columns({
		id: string(),
		userId: string(),
		userGroupId: string()
	})
	.primaryKey('id');

const userGroupRequests = table('userGroupRequests')
	.columns({
		id: string(),
		email: string(),
		userGroupId: string(),
		status: boolean(),
		sentByEmail: string(),
		groupName: string()
	})
	.primaryKey('id');

const taskRelationships = relationships(tasks, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: users,
		destField: ['id']
	}),
	assignedTo: one({
		sourceField: ['assignedToId'],
		destSchema: users,
		destField: ['id']
	})
}));

const eventRelationships = relationships(events, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: users,
		destField: ['id']
	}),
	assignedTo: one({
		sourceField: ['assignedToId'],
		destSchema: users,
		destField: ['id']
	})
}));

const shoppingListRelationships = relationships(shoppingList, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: users,
		destField: ['id']
	}),
	assignedTo: one({
		sourceField: ['assignedToId'],
		destSchema: users,
		destField: ['id']
	})
}));

const userGroupRelationships = relationships(userGroups, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: users,
		destField: ['id']
	})
}));

const userGroupRequestsRelationships = relationships(userGroupRequests, ({ one }) => ({
	createdBy: one({
		sourceField: ['sentByEmail'],
		destSchema: users,
		destField: ['id']
	}),
	userGroup: one({
		sourceField: ['userGroupId'],
		destSchema: userGroups,
		destField: ['id']
	})
}));

export const schema = createSchema({
	tables: [users, tasks, events, shoppingList, userGroups, userGroupMembers, userGroupRequests],
	relationships: [
		taskRelationships,
		eventRelationships,
		shoppingListRelationships,
		userGroupRelationships,
		userGroupRequestsRelationships
	]
});

export type Schema = typeof schema;
export type User = Row<typeof schema.tables.users>;
export type Task = Row<typeof schema.tables.tasks>;
export type Event = Row<typeof schema.tables.events>;
export type ShoppingList = Row<typeof schema.tables.shoppingList>;
export type UserGroup = Row<typeof schema.tables.userGroups>;
export type UserGroupMember = Row<typeof schema.tables.userGroupMembers>;
export type UserGroupRequest = Row<typeof schema.tables.userGroupRequests>;

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
	const allowIfIssueCreator = (authData: AuthData, { cmp }: ExpressionBuilder<Schema, 'tasks'>) =>
		cmp('id', authData.sub);
	return {
		tasks: {
			row: {
				select: ANYONE_CAN,
				insert: ANYONE_CAN,
				update: {
					preMutation: ANYONE_CAN,
					postMutation: ANYONE_CAN
				}
			}
		},
		users: {
			row: {
				select: ANYONE_CAN,
				insert: ANYONE_CAN,
				update: {
					preMutation: ANYONE_CAN,
					postMutation: ANYONE_CAN
				}
			}
		},
		events: {
			row: {
				select: ANYONE_CAN,
				insert: ANYONE_CAN,
				update: {
					preMutation: ANYONE_CAN,
					postMutation: ANYONE_CAN
				},
				delete: ANYONE_CAN
			}
		},
		shoppingList: {
			row: {
				select: ANYONE_CAN,
				insert: ANYONE_CAN,
				update: {
					preMutation: ANYONE_CAN,
					postMutation: ANYONE_CAN
				},
				delete: ANYONE_CAN
			}
		},
		userGroups: {
			row: {
				select: ANYONE_CAN,
				insert: ANYONE_CAN,
				update: {
					preMutation: ANYONE_CAN,
					postMutation: ANYONE_CAN
				},
				delete: ANYONE_CAN
			}
		},
		userGroupMembers: {
			row: {
				select: ANYONE_CAN,
				insert: ANYONE_CAN,
				update: {
					preMutation: ANYONE_CAN,
					postMutation: ANYONE_CAN
				},
				delete: ANYONE_CAN
			}
		},
		userGroupRequests: {
			row: {
				select: ANYONE_CAN,
				insert: ANYONE_CAN,
				update: {
					preMutation: ANYONE_CAN,
					postMutation: ANYONE_CAN
				},
				delete: ANYONE_CAN
			}
		}
	};
});
