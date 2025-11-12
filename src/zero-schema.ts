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
		cancel_at_period_end: boolean(), // Whether subscription cancels at period end
		// Notification preferences (premium feature) - database uses snake_case
		timezone: string(), // User's timezone for scheduled notifications
		notify_morning_briefing: boolean(), // Daily morning briefing at 8 AM
		notify_evening_wrapup: boolean(), // Daily evening wrap-up at 6 PM
		notify_event_reminders: boolean(), // 1 hour before events
		notify_shopping_reminders: boolean(), // Shopping list reminders
		notify_task_followups: boolean(), // Overdue task reminders
		notify_group_activity: boolean(), // Group activity notifications
		notify_weekly_summary: boolean(), // Weekly productivity report
		notify_subscription_updates: boolean(), // Subscription/billing notifications
		morning_briefing_time: string(), // Time for morning briefing (HH:mm format)
		evening_wrapup_time: string(), // Time for evening wrap-up (HH:mm format)
		superadmin: boolean() // Superadmin access for admin dashboard (database uses snake_case)
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
		listType: string(), // 'basic', 'shopping', 'events', 'tasks', 'recipe', 'messages', 'contacts', 'bookmarks'
		groupId: string().optional() // The group this list belongs to (for shared lists)
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
		groupId: string().optional(), // The group this item belongs to (for shared items)
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

const groupActivityLog = table('groupActivityLog')
	.columns({
		id: string(),
		groupId: string(), // Reference to userGroups
		actorUserId: string(), // User who performed the action
		actionType: string(), // 'member_added', 'member_removed', 'admin_promoted', 'admin_demoted', 'access_code_generated', 'group_settings_changed'
		targetUserId: string().optional(), // User affected by the action (if applicable)
		metadata: string().optional(), // JSON string with additional data
		createdAt: number() // When the action occurred
	})
	.primaryKey('id');

// Comparison tool tables
const comparisons = table('comparisons')
	.columns({
		id: string(),
		name: string(), // e.g., "Car Comparison"
		description: string().optional(), // Optional description of what's being compared
		isPriceAFactor: boolean(), // Whether price is a consideration
		priceWeight: number(), // Weight for price bonus (1-10 scale, default 1)
		createdById: string(),
		viewMode: string(), // 'personal', 'shared', or custom category ID
		createdAt: number(),
		updatedAt: number()
	})
	.primaryKey('id');

const comparisonCriteria = table('comparisonCriteria')
	.columns({
		id: string(),
		comparisonId: string(), // Reference to comparisons
		name: string(), // e.g., "Premium Sound", "Number of Seats", "MPG"
		type: string(), // 'boolean' (has/doesn't have) or 'number' (numeric value)
		higherIsBetter: boolean().optional(), // For numeric types: true if higher is better (MPG), false if lower is better (price)
		weight: number(), // Higher weight = more important (calculated through pairwise comparisons)
		sortOrder: number(), // Display order in the UI
		createdById: string(),
		createdAt: number()
	})
	.primaryKey('id');

const comparisonItems = table('comparisonItems')
	.columns({
		id: string(),
		comparisonId: string(), // Reference to comparisons
		name: string(), // e.g., "Toyota Camry", "Honda Accord"
		price: number().optional(), // Optional price field
		notes: string().optional(), // Optional notes about this item
		totalScore: number(), // Calculated weighted score
		createdById: string(),
		createdAt: number()
	})
	.primaryKey('id');

const comparisonItemValues = table('comparisonItemValues')
	.columns({
		id: string(),
		comparisonItemId: string(), // Reference to comparisonItems
		criterionId: string(), // Reference to comparisonCriteria
		hasFeature: boolean(), // Whether this item has/meets this criterion (for boolean type)
		numericValue: number().optional(), // Numeric value for number type criteria (e.g., 7 seats, 35 MPG)
		notes: string().optional(), // Optional notes about this specific value
		createdById: string(),
		createdAt: number()
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

const groupActivityLogRelationships = relationships(groupActivityLog, ({ one }) => ({
	group: one({
		sourceField: ['groupId'],
		destSchema: userGroups,
		destField: ['id']
	}),
	actor: one({
		sourceField: ['actorUserId'],
		destSchema: user,
		destField: ['id']
	}),
	target: one({
		sourceField: ['targetUserId'],
		destSchema: user,
		destField: ['id']
	})
}));

const comparisonsRelationships = relationships(comparisons, ({ one }) => ({
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: user,
		destField: ['id']
	})
}));

const comparisonCriteriaRelationships = relationships(comparisonCriteria, ({ one }) => ({
	comparison: one({
		sourceField: ['comparisonId'],
		destSchema: comparisons,
		destField: ['id']
	}),
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: user,
		destField: ['id']
	})
}));

const comparisonItemsRelationships = relationships(comparisonItems, ({ one }) => ({
	comparison: one({
		sourceField: ['comparisonId'],
		destSchema: comparisons,
		destField: ['id']
	}),
	createdBy: one({
		sourceField: ['createdById'],
		destSchema: user,
		destField: ['id']
	})
}));

const comparisonItemValuesRelationships = relationships(comparisonItemValues, ({ one }) => ({
	comparisonItem: one({
		sourceField: ['comparisonItemId'],
		destSchema: comparisonItems,
		destField: ['id']
	}),
	criterion: one({
		sourceField: ['criterionId'],
		destSchema: comparisonCriteria,
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
		accessCodes,
		groupActivityLog,
		comparisons,
		comparisonCriteria,
		comparisonItems,
		comparisonItemValues
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
		accessCodesRelationships,
		groupActivityLogRelationships,
		comparisonsRelationships,
		comparisonCriteriaRelationships,
		comparisonItemsRelationships,
		comparisonItemValuesRelationships
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
export type GroupActivityLog = Row<typeof schema.tables.groupActivityLog>;
export type Comparison = Row<typeof schema.tables.comparisons>;
export type ComparisonCriterion = Row<typeof schema.tables.comparisonCriteria>;
export type ComparisonItem = Row<typeof schema.tables.comparisonItems>;
export type ComparisonItemValue = Row<typeof schema.tables.comparisonItemValues>;

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

	// Custom lists permissions - user must be creator OR it's shared with their group
	const isCustomListCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'customLists'>
	) => cmp('createdById', '=', authData.sub);

	const canViewOrMutateCustomList = (
		authData: AuthData,
		{ or, cmp, and }: ExpressionBuilder<Schema, 'customLists'>
	) =>
		or(
			cmp('createdById', '=', authData.sub),
			authData.groupId
				? and(cmp('viewMode', '=', 'shared'), cmp('groupId', '=', authData.groupId))
				: cmp('id', '=', '__never__')
		);

	// Custom list items - must have access to parent list
	const isCustomListItemCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'customListItems'>
	) => cmp('createdById', '=', authData.sub);

	const canViewOrMutateCustomListItem = (
		authData: AuthData,
		{ or, cmp, and }: ExpressionBuilder<Schema, 'customListItems'>
	) =>
		or(
			cmp('createdById', '=', authData.sub),
			authData.groupId
				? and(cmp('viewMode', '=', 'shared'), cmp('groupId', '=', authData.groupId))
				: cmp('id', '=', '__never__')
		);

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

	// GroupActivityLog - viewable by group members
	const canViewGroupActivityLog = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'groupActivityLog'>
	) => (authData.groupId ? cmp('groupId', '=', authData.groupId) : cmp('id', '=', '__never__'));

	// Comparisons - user must be creator OR it's shared with their group
	const isComparisonCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'comparisons'>
	) => cmp('createdById', '=', authData.sub);

	const canViewOrMutateComparison = (
		authData: AuthData,
		{ or, cmp }: ExpressionBuilder<Schema, 'comparisons'>
	) =>
		or(
			cmp('createdById', '=', authData.sub),
			authData.groupId ? cmp('viewMode', '=', 'shared') : cmp('id', '=', '__never__')
		);

	// Comparison Criteria - must have access to parent comparison
	const isComparisonCriteriaCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'comparisonCriteria'>
	) => cmp('createdById', '=', authData.sub);

	// Comparison Items - must have access to parent comparison
	const isComparisonItemCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'comparisonItems'>
	) => cmp('createdById', '=', authData.sub);

	// Comparison Item Values - must have access to parent comparison
	const isComparisonItemValueCreator = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'comparisonItemValues'>
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
				select: [canViewOrMutateCustomList],
				insert: [canViewOrMutateCustomList],
				update: {
					preMutation: [canViewOrMutateCustomList],
					postMutation: [canViewOrMutateCustomList]
				},
				delete: [isCustomListCreator]
			}
		},
		customListItems: {
			row: {
				select: [canViewOrMutateCustomListItem],
				insert: [canViewOrMutateCustomListItem],
				update: {
					preMutation: [canViewOrMutateCustomListItem],
					postMutation: [canViewOrMutateCustomListItem]
				},
				delete: [canViewOrMutateCustomListItem]
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
		},
		groupActivityLog: {
			row: {
				select: [canViewGroupActivityLog], // Only group members can view
				insert: ANYONE_CAN, // System can log activities
				update: {
					preMutation: [], // Activity logs are immutable - deny all updates
					postMutation: []
				},
				delete: [canViewGroupActivityLog] // Group members can delete old logs
			}
		},
		comparisons: {
			row: {
				select: [canViewOrMutateComparison],
				insert: [canViewOrMutateComparison],
				update: {
					preMutation: [canViewOrMutateComparison],
					postMutation: [canViewOrMutateComparison]
				},
				delete: [canViewOrMutateComparison]
			}
		},
		comparisonCriteria: {
			row: {
				select: [isComparisonCriteriaCreator],
				insert: [isComparisonCriteriaCreator],
				update: {
					preMutation: [isComparisonCriteriaCreator],
					postMutation: [isComparisonCriteriaCreator]
				},
				delete: [isComparisonCriteriaCreator]
			}
		},
		comparisonItems: {
			row: {
				select: [isComparisonItemCreator],
				insert: [isComparisonItemCreator],
				update: {
					preMutation: [isComparisonItemCreator],
					postMutation: [isComparisonItemCreator]
				},
				delete: [isComparisonItemCreator]
			}
		},
		comparisonItemValues: {
			row: {
				select: [isComparisonItemValueCreator],
				insert: [isComparisonItemValueCreator],
				update: {
					preMutation: [isComparisonItemValueCreator],
					postMutation: [isComparisonItemValueCreator]
				},
				delete: [isComparisonItemValueCreator]
			}
		}
	};
});
