<script lang="ts">
	import { Query } from 'zero-svelte';
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { goto } from '$app/navigation';
	import { viewModeState, setViewMode } from '$lib/state/viewMode.svelte.ts';
	import ShoppingListDisplay from '$lib/components/list/ShoppingListDisplay.svelte';
	import BasicListDisplay from '$lib/components/list/BasicListDisplay.svelte';
	import TasksListDisplay from '$lib/components/list/TasksListDisplay.svelte';
	import EventsListDisplay from '$lib/components/list/EventsListDisplay.svelte';
	import RecipesListDisplay from '$lib/components/list/RecipesListDisplay.svelte';
	import MessagesListDisplay from '$lib/components/list/MessagesListDisplay.svelte';
	import ContactsListDisplay from '$lib/components/list/ContactsListDisplay.svelte';
	import BookmarksListDisplay from '$lib/components/list/BookmarksListDisplay.svelte';

	let { data } = $props();
	const listId = $derived(data.listId);
	const z = data.z;
	const id = data.id;
	const groupId = data.groupId;

	let customList = $derived(z ? new Query(z?.current.query.customLists.where('id', listId)) : null);

	let listType = $derived(customList?.current?.[0]?.listType || 'basic');

	let hasInitialized = $state(false);
	let initialViewMode = $state<string | null>(null);

	// Reset initialization when listId changes
	$effect(() => {
		listId; // Track listId changes
		hasInitialized = false;
		initialViewMode = null;
	});

	// Auto-switch to the list's view mode if needed
	$effect(() => {
		if (customList?.current?.[0] && !hasInitialized) {
			const listViewMode = customList.current[0].viewMode;
			initialViewMode = listViewMode;

			if (listViewMode !== viewModeState.currentMode) {
				if (listViewMode === 'personal' || listViewMode === 'shared') {
					setViewMode(listViewMode);
					hasInitialized = true;
				} else {
					const categoryQuery = z?.current.query.viewModeCategories
						.where('userId', id)
						.where('id', listViewMode);

					if (categoryQuery) {
						const categoryList = new Query(categoryQuery);
						if (categoryList.current && categoryList.current.length > 0) {
							setViewMode(listViewMode);
							hasInitialized = true;
						} else if (categoryList.current !== null) {
							goto('/');
							hasInitialized = true;
						}
					}
				}
			} else {
				hasInitialized = true;
			}
		}
	});

	// Navigate home if user switches view mode
	$effect(() => {
		const currentMode = viewModeState.currentMode;
		if (hasInitialized && initialViewMode !== null && currentMode !== initialViewMode) {
			goto('/');
		}
	});

	// Filter custom list items by viewMode
	let customListItems = $state<Query<any, any, any> | null>(null);

	$effect(() => {
		if (z?.current) {
			const query = z.current.query.customListItems
				.where('customListId', listId)
				.where('viewMode', viewModeState.currentMode);

			// For task lists, order by sortOrder
			if (listType === 'tasks') {
				customListItems = new Query(query.orderBy('sortOrder', 'asc'));
			} else {
				customListItems = new Query(query.orderBy('createdAt', 'asc'));
			}
		} else {
			customListItems = null;
		}
	});

	function deleteCustomList() {
		if (
			confirm('Are you sure you want to delete this list? This will also delete all items in it.')
		) {
			if (customListItems?.current && Array.isArray(customListItems.current)) {
				customListItems.current.forEach((item: any) => {
					z?.current.mutate.customListItems.delete({ id: item.id });
				});
			}
			z?.current.mutate.customLists.delete({ id: listId });
			goto('/');
		}
	}
</script>

<section class="custom-list">
	<div class="header">
		<h1>{customList?.current ? customList.current[0]?.name : 'Loading...'}</h1>
		<div class="header-buttons">
			<button class="delete-list" onclick={deleteCustomList} title="Delete List">
				<DeleteIcon />
			</button>
		</div>
	</div>

	<div class="list-container">
		{#if customListItems?.current && Array.isArray(customListItems.current)}
			{#if listType === 'shopping'}
				<ShoppingListDisplay
					{customListItems}
					{z}
					{listId}
					userId={id}
					{groupId}
					viewMode={viewModeState.currentMode}
				/>
			{:else if listType === 'basic'}
				<BasicListDisplay
					{customListItems}
					{z}
					{listId}
					userId={id}
					{groupId}
					viewMode={viewModeState.currentMode}
				/>
			{:else if listType === 'tasks'}
				<TasksListDisplay
					{customListItems}
					{z}
					{listId}
					userId={id}
					{groupId}
					viewMode={viewModeState.currentMode}
				/>
			{:else if listType === 'events'}
				<EventsListDisplay
					{customListItems}
					{z}
					{listId}
					userId={id}
					{groupId}
					viewMode={viewModeState.currentMode}
				/>
			{:else if listType === 'recipe'}
				<RecipesListDisplay
					{customListItems}
					{z}
					{listId}
					userId={id}
					{groupId}
					viewMode={viewModeState.currentMode}
				/>
			{:else if listType === 'messages'}
				<MessagesListDisplay
					{customListItems}
					{z}
					{listId}
					userId={id}
					{groupId}
					viewMode={viewModeState.currentMode}
				/>
			{:else if listType === 'contacts'}
				<ContactsListDisplay
					{customListItems}
					{z}
					{listId}
					userId={id}
					{groupId}
					viewMode={viewModeState.currentMode}
				/>
			{:else if listType === 'bookmarks'}
				<BookmarksListDisplay
					{customListItems}
					{z}
					{listId}
					userId={id}
					{groupId}
					viewMode={viewModeState.currentMode}
				/>
			{/if}
		{:else}
			<p>Loading items...</p>
		{/if}
	</div>
</section>

<style>
	.custom-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;

		.header {
			display: flex;
			justify-content: space-between;
			flex-direction: column;
			align-items: center;
			flex-wrap: wrap;
			gap: 10px;

			@media screen and (min-width: 640px) {
				flex-direction: row;
			}

			h1 {
				margin: 0;
				flex: 1;
			}

			.header-buttons {
				display: flex;
				gap: 10px;
				align-items: center;
			}
		}

		button.delete-list {
			background: #dc3545;
			color: white;
			border: none;
			padding: 8px 12px;
			border-radius: 4px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;

			&:hover {
				background: #c82333;
				transform: scale(1.05);
			}

			&:active {
				transform: scale(0.95);
			}
		}

		.list-container {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
	}
</style>
