<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	// Assuming `Query` is the correct way to get a Zero query object in zero-svelte
	import { Query } from 'zero-svelte';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';
	import { offlineQueue } from '$lib/utils/offlineQueue.svelte';
	import { optimisticUpdates } from '$lib/utils/optimisticUpdates.svelte';

	let { data, shortlist = false } = $props();

	let z = data.z;
	let groupId = data.groupId;
	const group = z ? new Query(z?.current.query.userGroups.where('id', data.groupId)) : null;
	let groupid = $derived(
		(group && Array.isArray(group.current) && group.current[0]?.id) ?? data.groupId
	);

	let shoppingList = $state<Query<any, any, any>>();

	$effect(() => {
		if (z?.current) {
			// In personal mode, only show items assigned to the user
			// In shared/other modes, show items assigned to the group
			const assignedId = viewModeState.currentMode === 'personal' ? data.id : groupid;

			shoppingList = new Query(
				z.current.query.shoppingList
					.where('assignedToId', assignedId)
					.where('viewMode', viewModeState.currentMode)
					.orderBy('createdAt', 'asc')
			);
		}
	});

	// Group items by store
	let groupedByStore = $derived.by(() => {
		if (!shoppingList?.current || !Array.isArray(shoppingList.current)) {
			return [];
		}

		// Merge real data with optimistic updates
		const realItems = shoppingList.current;
		const mergedItems = optimisticUpdates.mergeWithRealData('shoppingList', realItems);
		console.log('Shopping list - Real items:', realItems.length, 'Merged items:', mergedItems.length);
		
		const items = [...mergedItems];

		// Create a map of store -> items
		const storeMap = new Map<string, any[]>();

		items.forEach((item) => {
			const store = item.store?.trim() || 'Any Store';
			if (!storeMap.has(store)) {
				storeMap.set(store, []);
			}
			storeMap.get(store)!.push(item);
		});

		// Convert to array and sort stores alphabetically (with "Any Store" at the top)
		const grouped = Array.from(storeMap.entries())
			.sort(([storeA], [storeB]) => {
				if (storeA === 'Any Store') return -1;
				if (storeB === 'Any Store') return 1;
				return storeA.toLowerCase().localeCompare(storeB.toLowerCase());
			})
			.map(([store, items]) => ({
				store,
				items: items.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
			}));

		return grouped;
	});

	// Flat sorted list for shortlist view
	let sortedList = $derived.by(() => {
		return groupedByStore.flatMap((group) => group.items);
	});

	let numberOfItems = $derived(shoppingList?.current?.length ?? 0);
	let editingItemId = $state<string | null>(null);
	let editName = $state('');
	let editStore = $state('');

	function deleteItem(id: string) {
		if (!id) {
			console.error('No ID provided for deletion.');
			return;
		}
		
		if (offlineQueue.isOnline && z?.current) {
			z.current.mutate.shoppingList.delete({ id });
		} else {
			offlineQueue.enqueue({
				type: 'delete',
				table: 'shoppingList',
				data: { id }
			});
		}
	}

	function toggletask(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		const id = checkbox.value;
		const completed = checkbox.checked;
		
		if (offlineQueue.isOnline && z?.current) {
			z.current.mutate.shoppingList.update({ id, status: completed });
		} else {
			offlineQueue.enqueue({
				type: 'update',
				table: 'shoppingList',
				data: { id, status: completed }
			});
		}
	}

	function startEdit(item: any) {
		editingItemId = item.id;
		editName = item.name;
		editStore = item.store || '';
	}

	function cancelEdit() {
		editingItemId = null;
		editName = '';
		editStore = '';
	}

	function saveEdit(id: string) {
		if (editName.trim()) {
			const updateData = {
				id,
				name: editName.trim(),
				store: editStore.trim()
			};
			
			if (offlineQueue.isOnline && z?.current) {
				z.current.mutate.shoppingList.update(updateData);
			} else {
				offlineQueue.enqueue({
					type: 'update',
					table: 'shoppingList',
					data: updateData
				});
			}
		}
		cancelEdit();
	}

	function handleKeydown(event: KeyboardEvent, id: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			saveEdit(id);
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}
</script>

<div>
	{#if shortlist}
		{#if sortedList.length > 0}
			<ul class="shortlist">
				{#each sortedList as item, i}
					{#if i < 3}
						<li>
							{item.name}
							{item.store ? ` - ${item.store}` : ''}
						</li>
					{/if}
				{/each}
				{#if numberOfItems > 3}
					<li>and {numberOfItems - 3} more...</li>
				{/if}
			</ul>
		{/if}
	{:else if sortedList.length === 0}
		<p>No items in the shopping list.</p>
	{:else}
		<div class="list-container">
			{#each groupedByStore as group (group.store)}
				<div class="store-group">
					<h3 class="store-header">{group.store}</h3>
			{#each group.items as item (item.id)}
				<div class="list-item" class:pending={optimisticUpdates.hasPendingChanges(item.id)}>
					<input type="checkbox" value={item.id} checked={item.status} oninput={toggletask} />							{#if editingItemId === item.id}
								<div class="item-content editing">
									<input
										type="text"
										class="edit-input"
										bind:value={editName}
										placeholder="Item name"
										onkeydown={(e) => handleKeydown(e, item.id)}
										autofocus
									/>
									<input
										type="text"
										class="edit-input store-input"
										bind:value={editStore}
										placeholder="Store (optional)"
										onkeydown={(e) => handleKeydown(e, item.id)}
									/>
								</div>
								<div class="edit-actions">
									<button class="save-item" onclick={() => saveEdit(item.id)} title="Save">
										Save
									</button>
									<button class="cancel-item" onclick={cancelEdit} title="Cancel"> Cancel </button>
								</div>
							{:else}
								<div class="item-content">
									<p class:completed={item.status}>{item.name}</p>
								</div>
								<div class="item-actions">
									<button class="edit-item" onclick={() => startEdit(item)} title="Edit Item">
										Edit
									</button>
									<button
										class="delete-item"
										data-id={item.id}
										onclick={() => deleteItem(item.id)}
										title="Delete Item"
									>
										<DeleteIcon />
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.list-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.store-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.store-header {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 8px 0;
		padding-bottom: 8px;
		border-bottom: 2px solid var(--level-3, #ddd);
		color: var(--text-primary, #333);
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 15px;
		background: var(--level-2);
		border-radius: 8px;
		box-shadow: var(--level-1);
		transition: all 0.2s ease;

		&.pending {
			opacity: 0.7;
			border-left: 3px solid #4dabf7;
		}

		&:hover {
			box-shadow: var(--level-3);
			transform: translateY(-1px);
		}

		input[type='checkbox'] {
			flex-shrink: 0;
			width: 20px;
			height: 20px;
			cursor: pointer;
		}

		.item-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4px;

			p {
				margin: 0;
				font-weight: 500;
				transition: all 0.2s ease;

				&.completed {
					text-decoration: line-through;
					opacity: 0.6;
				}
			}

			.store {
				font-size: 0.875rem;
				color: var(--text-secondary, #666);
				font-style: italic;
			}

			&.editing {
				gap: 8px;
			}

			.edit-input {
				padding: 8px;
				border: 1px solid #ccc;
				border-radius: 4px;
				font-size: 1rem;
				font-weight: 500;
				width: 100%;

				&:focus {
					outline: none;
					border-color: #007bff;
					box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
				}

				&.store-input {
					font-size: 0.875rem;
					font-weight: 400;
				}
			}
		}

		.item-actions {
			display: flex;
			gap: 8px;
			align-items: center;
			flex-shrink: 0;
		}

		.edit-actions {
			display: flex;
			gap: 8px;
			align-items: center;
			flex-shrink: 0;
		}

		.edit-item {
			background: #007bff;
			color: white;
			border: none;
			padding: 6px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 0.875rem;
			transition: all 0.2s ease;
			white-space: nowrap;

			&:hover {
				background: #0056b3;
				transform: scale(1.05);
			}

			&:active {
				transform: scale(0.95);
			}
		}

		.save-item {
			background: #28a745;
			color: white;
			border: none;
			padding: 6px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 0.875rem;
			transition: all 0.2s ease;
			white-space: nowrap;

			&:hover {
				background: #218838;
				transform: scale(1.05);
			}

			&:active {
				transform: scale(0.95);
			}
		}

		.cancel-item {
			background: #6c757d;
			color: white;
			border: none;
			padding: 6px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 0.875rem;
			transition: all 0.2s ease;
			white-space: nowrap;

			&:hover {
				background: #5a6268;
				transform: scale(1.05);
			}

			&:active {
				transform: scale(0.95);
			}
		}

		.delete-item {
			background: #dc3545;
			color: white;
			border: none;
			padding: 6px 8px;
			border-radius: 4px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			min-width: 32px;
			height: 32px;
			flex-shrink: 0;

			&:hover {
				background: #c82333;
				transform: scale(1.1);
			}

			&:active {
				transform: scale(0.9);
			}
		}
	}

	.shortlist {
		list-style: none;
		padding: 0;
		margin: 0;
	}
</style>
