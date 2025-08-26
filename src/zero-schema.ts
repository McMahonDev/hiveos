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

// Better Auth tables
const user = table('user')
	.columns({
		id: string(),
		name: string(),
		email: string(),
		email_verified: boolean(), // Database uses snake_case
		image: string().optional(),
		created_at: number(), // Database uses snake_case
		updated_at: number() // Database uses snake_case
	})
	.primaryKey('id');

const session = table('session')
	.columns({
		id: string(),
		expires_at: number(), // Database uses snake_case
		token: string(),
		created_at: number(), // Database uses snake_case
		updated_at: number(), // Database uses snake_case
		ip_address: string().optional(), // Database uses snake_case
		user_agent: string().optional(), // Database uses snake_case
		user_id: string() // Database uses snake_case
	})
	.primaryKey('id');

const account = table('account')
	.columns({
		id: string(),
		account_id: string(), // Database uses snake_case
		provider_id: string(), // Database uses snake_case
		user_id: string(), // Database uses snake_case
		access_token: string().optional(), // Database uses snake_case
		refresh_token: string().optional(), // Database uses snake_case
		id_token: string().optional(), // Database uses snake_case
		access_token_expires_at: number().optional(), // Database uses snake_case
		refresh_token_expires_at: number().optional(), // Database uses snake_case
		scope: string().optional(),
		password: string().optional(),
		created_at: number(), // Database uses snake_case
		updated_at: number() // Database uses snake_case
	})
	.primaryKey('id');

const verification = table('verification')
	.columns({
		id: string(),
		identifier: string(),
		value: string(),
		expires_at: number(), // Database uses snake_case
		created_at: number().optional(), // Database uses snake_case
		updated_at: number().optional() // Database uses snake_case
	})
	.primaryKey('id');

// Application tables
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
		assignedToId: string(),
		createdAt: number()
	})
	.primaryKey('id');

const shoppingList = table('shoppingList')
	.columns({
		id: string(),
		name: string(),
		status: boolean(),
		createdById: string(),
		assignedToId: string(),
		createdAt: number() // Added missing createdAt column
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
		destSchema: user,
		destField: ['id']
	}),
	assignedTo: one({
		sourceField: ['assignedToId'],
		destSchema: user,
		destField: ['id']
	})
}));

const eventRelationships = relationships(events, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: user,
		destField: ['id']
	}),
	assignedTo: one({
		sourceField: ['assignedToId'],
		destSchema: user,
		destField: ['id']
	})
}));

const shoppingListRelationships = relationships(shoppingList, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: user,
		destField: ['id']
	}),
	assignedTo: one({
		sourceField: ['assignedToId'],
		destSchema: user,
		destField: ['id']
	})
}));

const userGroupRelationships = relationships(userGroups, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: user,
		destField: ['id']
	})
}));

const userGroupRequestsRelationships = relationships(userGroupRequests, ({ one }) => ({
	createdBy: one({
		sourceField: ['sentByEmail'],
		destSchema: user,
		destField: ['id']
	}),
	userGroup: one({
		sourceField: ['userGroupId'],
		destSchema: userGroups,
		destField: ['id']
	})
}));

// Better Auth relationships
const sessionRelationships = relationships(session, ({ one }) => ({
	user: one({
		sourceField: ['user_id'], // Database uses snake_case
		destSchema: user,
		destField: ['id']
	})
}));

const accountRelationships = relationships(account, ({ one }) => ({
	user: one({
		sourceField: ['user_id'], // Database uses snake_case
		destSchema: user,
		destField: ['id']
	})
}));

export const schema = createSchema({
	tables: [
		user,
		session,
		account,
		verification,
		tasks,
		events,
		shoppingList,
		userGroups,
		userGroupMembers,
		userGroupRequests
	],
	relationships: [
		taskRelationships,
		eventRelationships,
		shoppingListRelationships,
		userGroupRelationships,
		userGroupRequestsRelationships,
		sessionRelationships,
		accountRelationships
	]
});

export type Schema = typeof schema;
export type User = Row<typeof schema.tables.user>;
export type Session = Row<typeof schema.tables.session>;
export type Account = Row<typeof schema.tables.account>;
export type Verification = Row<typeof schema.tables.verification>;
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
		// Better Auth tables
		user: {
			row: {
				select: ANYONE_CAN,
				insert: ANYONE_CAN,
				update: {
					preMutation: ANYONE_CAN,
					postMutation: ANYONE_CAN
				}
			}
		},
		session: {
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
		account: {
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
		verification: {
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
		// Application tables
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
