<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import type { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import {
		saveToLocalStorage as saveShoppingItemToLocalStorage,
		isLocalStorageOnly as checkIsLocalStorageOnly,
		removeStore as removeStoreFromStorage
	} from '$lib/utils/shoppingListHelpers';

	interface Props {
		customListItems: Query<any, any, any> | null;
		z: any;
		listId: string;
		userId: string;
		viewMode: string;
	}

	let { customListItems, z, listId, userId, viewMode }: Props = $props();

	let addModal = $state(false);
	let selectedStore = $state('');
	let showNewStoreInput = $state(false);
	let newStoreName = $state('');

	// Shopping list helpers
	let savedItems = $state<string[]>([]);
	let localStorageStores = $state<string[]>([]);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const items = localStorage.getItem('shopping-items');
			const stores = localStorage.getItem('shopping-stores');
			savedItems = items ? JSON.parse(items) : [];
			localStorageStores = stores ? JSON.parse(stores) : [];
		}
	});

	let savedStores = $derived.by(() => {
		const storesSet = new Set<string>();
		localStorageStores.forEach((store) => {
			if (store && store.trim()) storesSet.add(store.trim());
		});

		if (customListItems?.current && Array.isArray(customListItems.current)) {
			customListItems.current.forEach((item: any) => {
				if (item.store && item.store.trim() && item.store !== 'Any Store') {
					storesSet.add(item.store.trim());
				}
			});
		}

		return Array.from(storesSet).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	});

	$effect(() => {
		showNewStoreInput = selectedStore === '__new__';
		if (selectedStore !== '__new__') {
			newStoreName = '';
		}
	});

	function isLocalStorageOnly(storeName: string): boolean {
		const items =
			customListItems?.current && Array.isArray(customListItems.current)
				? customListItems.current
				: null;
		return checkIsLocalStorageOnly(storeName, items, localStorageStores);
	}

	function removeStore(storeName: string) {
		localStorageStores = removeStoreFromStorage(storeName, localStorageStores);
		if (selectedStore === storeName) {
			selectedStore = '';
		}
	}

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;

		let store = selectedStore === '__new__' ? newStoreName : selectedStore;

		const itemData = {
			id: nanoid(),
			name,
			status: false,
			customListId: listId,
			createdById: userId,
			createdAt: Date.now(),
			viewMode: viewMode,
			store: store || undefined
		};

		const updated = saveShoppingItemToLocalStorage(name, store, savedItems, localStorageStores);
		savedItems = updated.savedItems;
		localStorageStores = updated.localStorageStores;

		z?.current.mutate.customListItems.insert(itemData);
		(event.target as HTMLFormElement).reset();
		selectedStore = '';
		newStoreName = '';
		addModal = false;
	}

	// Group shopping items by store
	let groupedShoppingItems = $derived.by(() => {
		if (!customListItems?.current || !Array.isArray(customListItems.current)) {
			return [];
		}

		const items = customListItems.current;
		const storeMap = new Map<string, any[]>();

		items.forEach((item) => {
			const store = item.store?.trim() || 'Any Store';
			if (!storeMap.has(store)) {
				storeMap.set(store, []);
			}
			storeMap.get(store)!.push(item);
		});

		// Convert to array and sort stores (Any Store first, then alphabetically)
		return Array.from(storeMap.entries())
			.sort(([storeA], [storeB]) => {
				if (storeA === 'Any Store') return -1;
				if (storeB === 'Any Store') return 1;
				return storeA.toLowerCase().localeCompare(storeB.toLowerCase());
			})
			.map(([store, items]) => ({
				store,
				items: items.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
			}));
	});

	let editingItemId = $state<string | null>(null);
	let editName = $state('');

	function startEdit(item: any) {
		editingItemId = item.id;
		editName = item.name;
	}

	function cancelEdit() {
		editingItemId = null;
		editName = '';
	}

	function saveEdit(id: string) {
		if (editName.trim()) {
			z?.current.mutate.customListItems.update({
				id,
				name: editName.trim()
			});
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

	function toggleItemStatus(itemId: string) {
		const item = customListItems?.current?.find((i: any) => i.id === itemId);
		if (item) {
			z?.current.mutate.customListItems.update({
				id: itemId,
				status: !item.status
			});
		}
	}

	function deleteItem(itemId: string) {
		z?.current.mutate.customListItems.delete({ id: itemId });
	}
</script>

<div class="list-header">
	<button class="add-item-btn" onclick={() => (addModal = true)}>Add Item</button>
</div>

<div class="shopping-groups">
	{#each groupedShoppingItems as group (group.store)}
		<div class="store-group">
			<h3 class="store-header">{group.store}</h3>
			{#each group.items as item (item.id)}
				<div class="list-item">
					{#if editingItemId === item.id}
						<div class="item-content editing">
							<input
								type="text"
								class="edit-input"
								bind:value={editName}
								placeholder="Item name"
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
						<input
							type="checkbox"
							checked={item.status}
							onchange={() => toggleItemStatus(item.id)}
						/>
						<div class="item-content">
							<p class="item-name" class:completed={item.status}>{item.name}</p>
						</div>
						<div class="item-actions">
							<button class="edit-item" onclick={() => startEdit(item)} title="Edit Item">
								Edit
							</button>
							<button class="delete-item" onclick={() => deleteItem(item.id)} title="Delete Item">
								<DeleteIcon />
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>

{#if addModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => (addModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Add Item</h2>
				<button
					class="close-button"
					onclick={() => (addModal = false)}
					type="button"
					aria-label="Close"
				>
					<CloseIcon />
				</button>
			</div>
			<form {onsubmit}>
				<label for="name">
					Item Name
					<input type="text" id="name" name="name" list="items-list" autocomplete="off" required />
				</label>

				<datalist id="items-list">
					{#each savedItems as item}
						<option value={item}></option>
					{/each}
				</datalist>

				<fieldset class="store-selection">
					<legend>Select Store</legend>

					<label class="radio-label">
						<input type="radio" name="store-radio" value="" bind:group={selectedStore} />
						<span>Any Store</span>
					</label>

					{#each savedStores as store}
						<div class="radio-label-wrapper">
							<label class="radio-label">
								<input type="radio" name="store-radio" value={store} bind:group={selectedStore} />
								<span>{store}</span>
							</label>
							{#if isLocalStorageOnly(store)}
								<button
									type="button"
									class="remove-store-btn"
									onclick={() => removeStore(store)}
									title="Remove store from saved list"
									aria-label="Remove {store}"
								>
									×
								</button>
							{/if}
						</div>
					{/each}

					<label class="radio-label">
						<input type="radio" name="store-radio" value="__new__" bind:group={selectedStore} />
						<span>Add New Store</span>
					</label>

					{#if showNewStoreInput}
						<input
							type="text"
							bind:value={newStoreName}
							placeholder="Enter store name"
							class="new-store-input"
						/>
					{/if}
				</fieldset>

				<div class="modal-actions">
					<button type="button" class="cancel-btn" onclick={() => (addModal = false)}>Cancel</button
					>
					<button type="submit" class="save-btn">Add</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.list-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 15px;
	}

	.add-item-btn {
		background: #28a745;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background: #218838;
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.shopping-groups {
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
		justify-content: space-between;
		align-items: center;
		padding: 15px;
		background: var(--level-2);
		border-radius: 8px;
		box-shadow: var(--level-1);
		transition: all 0.2s ease;
		gap: 12px;

		&:hover {
			box-shadow: var(--level-3);
			transform: translateY(-1px);
		}

		input[type='checkbox'] {
			width: 20px;
			height: 20px;
			cursor: pointer;
			flex-shrink: 0;
		}

		.item-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 8px;

			&.editing {
				gap: 8px;
			}

			.item-name {
				font-weight: 600;
				font-size: 1rem;
				margin: 0;

				&.completed {
					text-decoration: line-through;
					opacity: 0.6;
				}
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

			&:hover {
				background: #c82333;
				transform: scale(1.1);
			}

			&:active {
				transform: scale(0.9);
			}
		}
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
		backdrop-filter: blur(2px);
	}

	.modal-content {
		background: var(--background);
		padding: 20px;
		border-radius: 10px;
		box-shadow: var(--level-3);
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		animation: slideUp 0.3s ease-out;

		@media screen and (max-width: 690px) {
			max-height: 85vh;
			padding: 16px;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;

		h2 {
			margin: 0;
			color: var(--textColor);
		}
	}

	.close-button {
		background: transparent;
		border: none;
		padding: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background 0.2s ease;

		&:hover {
			background: rgba(0, 0, 0, 0.05);
		}

		&:active {
			transform: scale(0.95);
		}
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 15px;

		label {
			display: flex;
			flex-direction: column;
			width: 100%;
			font-weight: 600;
			color: var(--textColor);

			input {
				margin-top: 5px;
				padding: 10px;
				border: 1px solid #ccc;
				border-radius: 4px;
				font-size: 1rem;
				font-family: inherit;

				&:focus {
					outline: none;
					border-color: #007bff;
					box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
				}
			}
		}
	}

	.store-selection {
		border: 1px solid #ccc;
		border-radius: 8px;
		padding: 12px;
		background: var(--level-1);
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 300px;
		overflow-y: auto;

		legend {
			font-weight: 600;
			padding: 0 8px;
			color: var(--text-primary);
			font-size: 0.95rem;
		}
	}

	.radio-label-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
		border-radius: 4px;
		transition: background 0.2s ease;

		&:hover {
			background: var(--level-2);
		}
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		cursor: pointer;
		flex-direction: row;
		margin: 0;
		flex: 1;

		input[type='radio'] {
			width: 18px;
			height: 18px;
			cursor: pointer;
			margin: 0;
			flex-shrink: 0;
		}

		span {
			font-size: 0.95rem;
			flex: 1;
		}
	}

	.remove-store-btn {
		background: none;
		border: none;
		color: #dc3545;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		padding: 4px 8px;
		margin-right: 4px;
		opacity: 0.6;
		transition: opacity 0.2s ease;
		flex-shrink: 0;

		&:hover {
			opacity: 1;
		}

		&:active {
			transform: scale(0.9);
		}
	}

	.new-store-input {
		margin-top: 5px;
		margin-left: 28px;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.95rem;
		background: white;
	}

	.modal-actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		margin-top: 10px;
	}

	.cancel-btn,
	.save-btn {
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-btn {
		background: #6c757d;
		color: white;

		&:hover {
			background: #5a6268;
		}
	}

	.save-btn {
		background: #007bff;
		color: white;

		&:hover {
			background: #0056b3;
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
