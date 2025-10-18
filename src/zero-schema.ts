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
	groupId: string | null;
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
		updated_at: number(), // Database uses snake_case
		subscription_tier: string(), // Database uses snake_case, values: 'free', 'individual' ($5), 'family' ($20)
		active_group_id: string().optional(), // Database uses snake_case
		// Subscription metadata for payment tracking
		subscription_status: string().optional(), // 'active', 'canceled', 'past_due', 'trialing', null
		subscription_id: string().optional(), // Stripe subscription ID
		stripe_customer_id: string().optional(), // Stripe customer ID
		current_period_end: number().optional(), // When current billing period ends (timestamp)
		cancel_at_period_end: boolean() // Whether subscription cancels at period end
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
		date: string(),
		time: string(),
		endDate: string().optional(),
		endTime: string().optional(),
		timezone: string(),
		location: string().optional(),
		description: string().optional(),
		allDay: boolean().optional(),
		createdById: string(),
		assignedToId: string(),
		createdAt: number(),
		viewMode: string() // 'personal', 'shared', or custom category ID
	})
	.primaryKey('id');

const shoppingList = table('shoppingList')
	.columns({
		id: string(),
		name: string(),
		store: string().optional(),
		status: boolean(),
		createdById: string(),
		assignedToId: string(),
		createdAt: number(), // Added missing createdAt column
		viewMode: string() // 'personal', 'shared', or custom category ID
	})
	.primaryKey('id');

const userGroups = table('userGroups')
	.columns({
		id: string(),
		name: string(),
		createdById: string(),
		groupType: string(), // 'family', 'team', etc.
		maxMembers: number().optional(), // Maximum number of members (null = unlimited for individual groups, 6 for family)
		createdAt: number() // Timestamp when group was created
	})
	.primaryKey('id');

const userGroupMembers = table('userGroupMembers')
	.columns({
		id: string(),
		userId: string(),
		userGroupId: string(),
		userGroupCreatorId: string(),
		isAdmin: boolean(), // Whether this member has admin privileges
		joinedAt: number() // Timestamp when member joined
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

const customLists = table('customLists')
	.columns({
		id: string(),
		name: string(),
		createdById: string(),
		createdAt: number(),
		viewMode: string(), // 'personal', 'shared', or custom category ID
		listType: string() // 'basic', 'shopping', 'events', 'tasks', 'recipe', 'messages', 'contacts', 'bookmarks'
	})
	.primaryKey('id');

const customListItems = table('customListItems')
	.columns({
		id: string(),
		name: string(),
		status: boolean(),
		createdById: string(),
		customListId: string(),
		createdAt: number(),
		viewMode: string(), // 'personal', 'shared', or custom category ID
		// Shopping list fields
		store: string().optional(),
		// Events fields
		date: string().optional(),
		time: string().optional(),
		endDate: string().optional(),
		endTime: string().optional(),
		timezone: string().optional(),
		location: string().optional(),
		description: string().optional(),
		allDay: boolean().optional(),
		// Task list fields
		sortOrder: number().optional(),
		// Recipe fields
		ingredients: string().optional(), // JSON array or newline-separated
		instructions: string().optional(), // Full recipe instructions
		servings: number().optional(),
		prepTime: string().optional(), // e.g., "15 mins"
		cookTime: string().optional(), // e.g., "30 mins"
		// Messages/Notes fields
		messageText: string().optional(), // Full message content
		priority: string().optional(), // 'low', 'medium', 'high', 'urgent'
		// Contacts fields
		phone: string().optional(),
		email: string().optional(),
		address: string().optional(),
		// Bookmarks fields
		url: string().optional(),
		tags: string().optional() // Comma-separated tags
	})
	.primaryKey('id');

const viewModeCategories = table('viewModeCategories')
	.columns({
		id: string(),
		name: string(),
		userId: string(),
		createdAt: number()
	})
	.primaryKey('id');

const accessCodes = table('accessCodes')
	.columns({
		id: string(),
		code: string(), // The actual access code (e.g., "FAMILY-2024-XYZ")
		groupId: string(), // Reference to userGroups
		createdById: string(), // Admin who created the code
		usesRemaining: number().optional(), // Null = unlimited, number = limited uses
		maxUses: number().optional(), // Maximum uses allowed (for tracking)
		expiresAt: number().optional(), // Timestamp when code expires (optional)
		createdAt: number() // When the code was created
	})
	.primaryKey('id');

// Relationships

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

const customListRelationships = relationships(customLists, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: user,
		destField: ['id']
	})
}));

const customListItemRelationships = relationships(customListItems, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: user,
		destField: ['id']
	}),
	customList: one({
		sourceField: ['customListId'],
		destSchema: customLists,
		destField: ['id']
	})
}));

const viewModeCategoriesRelationships = relationships(viewModeCategories, ({ one }) => ({
	user: one({
		sourceField: ['userId'],
		destSchema: user,
		destField: ['id']
	})
}));

const accessCodesRelationships = relationships(accessCodes, ({ one }) => ({
	group: one({
		sourceField: ['groupId'],
		destSchema: userGroups,
		destField: ['id']
	}),
	createdBy: one({
		sourceField: ['createdById'],
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
		userGroupRequests,
		customLists,
		customListItems,
		viewModeCategories,
		accessCodes
	],
	relationships: [
		taskRelationships,
		eventRelationships,
		shoppingListRelationships,
		userGroupRelationships,
		userGroupRequestsRelationships,
		sessionRelationships,
		accountRelationships,
		customListRelationships,
		customListItemRelationships,
		viewModeCategoriesRelationships,
		accessCodesRelationships
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
export type CustomList = Row<typeof schema.tables.customLists>;
export type CustomListItem = Row<typeof schema.tables.customListItems>;
export type ViewModeCategory = Row<typeof schema.tables.viewModeCategories>;
export type AccessCode = Row<typeof schema.tables.accessCodes>;

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
	const isUser = (authData: AuthData, { cmp }: ExpressionBuilder<Schema, 'user'>) =>
		cmp('id', '=', authData.sub);

	const isEventsCreator = (authData: AuthData, { cmp }: ExpressionBuilder<Schema, 'events'>) =>
		cmp('createdById', '=', authData.sub);
	const isEventsAssignedTo = (authData: AuthData, { cmp }: ExpressionBuilder<Schema, 'events'>) =>
		cmp('assignedToId', '=', authData.groupId ?? '__never__');

	// Explicit OR: allow if user created the event OR the event is assigned to the user (personal) OR assigned to their group (shared)
	const canViewOrMutateEvents = (
		authData: AuthData,
		{ or, cmp }: ExpressionBuilder<Schema, 'events'>
	) =>
		or(
			cmp('createdById', '=', authData.sub),
			cmp('assignedToId', '=', authData.sub), // Personal mode items
			authData.groupId ? cmp('assignedToId', '=', authData.groupId) : cmp('id', '=', '__never__') // Shared mode items
		);

	const isShoppingListCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'shoppingList'>
	) => cmp('createdById', '=', authData.sub);
	const canViewOrMutateShoppingList = (
		authData: AuthData,
		{ or, cmp }: ExpressionBuilder<Schema, 'shoppingList'>
	) =>
		or(
			cmp('createdById', '=', authData.sub),
			cmp('assignedToId', '=', authData.sub), // Personal mode items
			authData.groupId ? cmp('assignedToId', '=', authData.groupId) : cmp('id', '=', '__never__') // Shared mode items
		);

	const isUserGroupCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'userGroups'>
	) => cmp('createdById', '=', authData.sub);
	const isUserGroupMember = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'userGroupMembers'>
	) => cmp('userId', '=', authData.sub);

	const canViewUserGroupMembers = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'userGroupMembers'>
	) => cmp('userGroupCreatorId', '=', authData.sub);

	// Custom lists permissions - user must be creator OR assigned to it
	const isCustomListCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'customLists'>
	) => cmp('createdById', '=', authData.sub);

	// Custom list items - must have access to parent list
	const isCustomListItemCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'customListItems'>
	) => cmp('createdById', '=', authData.sub);

	// ViewModeCategories - user must be the owner
	const isViewModeCategoryOwner = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'viewModeCategories'>
	) => cmp('userId', '=', authData.sub);

	// AccessCodes - created by admins, viewable by group members
	const isAccessCodeCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'accessCodes'>
	) => cmp('createdById', '=', authData.sub);

	return {
		// Application tables
		user: {
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
		events: {
			row: {
				select: [canViewOrMutateEvents],
				insert: [canViewOrMutateEvents],
				update: {
					preMutation: [canViewOrMutateEvents],
					postMutation: [canViewOrMutateEvents]
				},
				delete: [canViewOrMutateEvents]
			}
		},
		shoppingList: {
			row: {
				select: [canViewOrMutateShoppingList],
				insert: [canViewOrMutateShoppingList],
				update: {
					preMutation: [canViewOrMutateShoppingList],
					postMutation: [canViewOrMutateShoppingList]
				},
				delete: [canViewOrMutateShoppingList]
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
				delete: [isUserGroupCreator]
			}
		},
		userGroupMembers: {
			row: {
				select: ANYONE_CAN,
				insert: [canViewUserGroupMembers, isUserGroupMember],
				update: {
					preMutation: [canViewUserGroupMembers, isUserGroupMember],
					postMutation: [canViewUserGroupMembers, isUserGroupMember]
				},
				delete: [canViewUserGroupMembers]
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
		},
		customLists: {
			row: {
				select: [isCustomListCreator],
				insert: [isCustomListCreator],
				update: {
					preMutation: [isCustomListCreator],
					postMutation: [isCustomListCreator]
				},
				delete: [isCustomListCreator]
			}
		},
		customListItems: {
			row: {
				select: [isCustomListItemCreator],
				insert: [isCustomListItemCreator],
				update: {
					preMutation: [isCustomListItemCreator],
					postMutation: [isCustomListItemCreator]
				},
				delete: [isCustomListItemCreator]
			}
		},
		viewModeCategories: {
			row: {
				select: [isViewModeCategoryOwner],
				insert: [isViewModeCategoryOwner],
				update: {
					preMutation: [isViewModeCategoryOwner],
					postMutation: [isViewModeCategoryOwner]
				},
				delete: [isViewModeCategoryOwner]
			}
		},
		accessCodes: {
			row: {
				select: ANYONE_CAN, // Anyone can view codes (needed for signup flow)
				insert: [isAccessCodeCreator], // Only creator/admin can create
				update: {
					preMutation: [isAccessCodeCreator], // Only creator/admin can update
					postMutation: [isAccessCodeCreator]
				},
				delete: [isAccessCodeCreator] // Only creator/admin can delete
			}
		}
	};
});
