<script lang="ts">
	import ShoppingList from '$lib/components/shoppingList.svelte';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';
	import { viewPreferencesState } from '$lib/utils/viewPreferences.svelte';
	import { goto } from '$app/navigation';
	import { offlineQueue } from '$lib/utils/offlineQueue.svelte';

	let { data } = $props();

	// Redirect if shopping list is disabled for current view
	$effect(() => {
		if (!viewPreferencesState.shouldShowList(viewModeState.currentMode, 'shoppingList')) {
			goto('/');
		}
	});
	let z = data.z;
	const group = z ? new Query(z?.current.query.userGroups.where('id', data.groupId)) : null;
	let groupid = $derived((group && group.current[0]?.id) ?? data.groupId);

	let modal = $state(false);
	let selectedStore = $state('');
	let showNewStoreInput = $state(false);
	let newStoreName = $state('');

	// Query shopping list to get all items
	let shoppingListQuery = $state<Query<any, any, any>>();

	$effect(() => {
		if (z?.current) {
			const assignedId = viewModeState.currentMode === 'personal' ? data.id : groupid;
			shoppingListQuery = new Query(
				z.current.query.shoppingList
					.where('assignedToId', assignedId)
					.where('viewMode', viewModeState.currentMode)
			);
		}
	});

	// Load saved items and stores from localStorage
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

	// Combine stores from shopping list items and localStorage
	let savedStores = $derived.by(() => {
		const storesSet = new Set<string>();

		// Add stores from localStorage
		localStorageStores.forEach((store) => {
			if (store && store.trim()) {
				storesSet.add(store.trim());
			}
		});

		// Add stores from actual shopping list items
		if (shoppingListQuery?.current && Array.isArray(shoppingListQuery.current)) {
			shoppingListQuery.current.forEach((item: any) => {
				if (item.store && item.store.trim() && item.store !== 'Any Store') {
					storesSet.add(item.store.trim());
				}
			});
		}

		// Convert to array and sort alphabetically
		return Array.from(storesSet).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	});

	// Helper to check if a store is only in localStorage (can be deleted)
	function isLocalStorageOnly(storeName: string): boolean {
		const inLocalStorage = localStorageStores.includes(storeName);
		const inDatabase = shoppingListQuery?.current?.some(
			(item: any) => item.store?.trim() === storeName
		);
		return inLocalStorage && !inDatabase;
	}

	// Watch for changes to selectedStore
	$effect(() => {
		showNewStoreInput = selectedStore === '__new__';
		if (selectedStore !== '__new__') {
			newStoreName = '';
		}
	});

	function saveToLocalStorage(itemName: string, storeName: string) {
		// Save item name if not empty and not already in the list
		if (itemName && !savedItems.includes(itemName)) {
			savedItems = [...savedItems, itemName];
			localStorage.setItem('shopping-items', JSON.stringify(savedItems));
		}

		// Save store name if not empty and not already in localStorage
		if (storeName && storeName.trim() && !localStorageStores.includes(storeName)) {
			localStorageStores = [...localStorageStores, storeName];
			localStorage.setItem('shopping-stores', JSON.stringify(localStorageStores));
		}
	}

	function removeStore(storeName: string) {
		// Remove from localStorage only
		localStorageStores = localStorageStores.filter((s) => s !== storeName);
		localStorage.setItem('shopping-stores', JSON.stringify(localStorageStores));

		// If the removed store was selected, reset selection
		if (selectedStore === storeName) {
			selectedStore = '';
		}
	}

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;

		// Get the store value - either from radio selection or new store input
		let store = selectedStore === '__new__' ? newStoreName.trim() : selectedStore;

		const id = nanoid();
		if (name) {
			// In personal mode, assign to user's own ID
			// In shared mode, assign to groupId
			const assignedTo = viewModeState.currentMode === 'personal' ? data.id : groupid || data.id;

			const mutationData = {
				id,
				name,
				store,
				status: false,
				assignedToId: assignedTo,
				createdById: data.id,
				createdAt: Date.now(),
				viewMode: viewModeState.currentMode
			};

			// If online, try to insert directly
			if (offlineQueue.isOnline && z?.current) {
				z.current.mutate.shoppingList.insert(mutationData);
			} else {
				// If offline, queue the mutation
				offlineQueue.enqueue({
					type: 'insert',
					table: 'shoppingList',
					data: mutationData
				});
			}

			// Save to localStorage for autocomplete
			saveToLocalStorage(name, store);

			(event.target as HTMLFormElement).reset();
			selectedStore = '';
			newStoreName = '';
		}
	}
</script>

<section class="shopping-list">
	<h1>Shopping List</h1>
	<button class="add-event" class:modal-active={modal} onclick={() => (modal = true)}>
		Add Item
	</button>
	<button class="close-modal" class:modal-active={modal} onclick={() => (modal = false)}>
		Close
	</button>

	<div class="list-container">
		<ShoppingList {data} />
	</div>

	<div class={modal ? 'modal open' : 'modal closed'} role="dialog" aria-modal="true" tabindex="-1">
		<h2>Add an item</h2>
		<form {onsubmit}>
			<label for="name"
				>Item Name
				<input
					type="text"
					id="name"
					name="name"
					list="items-list"
					autocomplete="off"
					placeholder="e.g., Milk, Bread, Eggs"
					required
				/>
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
						class="new-store-input"
						bind:value={newStoreName}
						placeholder="Enter new store name"
						autofocus
					/>
				{/if}
			</fieldset>

			<button type="submit">Add Item</button>
		</form>
	</div>
</section>

<style>
	.shopping-list {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 20px;
		@media screen and (min-width: 690px) {
			grid-template-columns: 1fr 1fr;
		}
		div {
			grid-row: 2;
			grid-column: 1;
			@media screen and (min-width: 690px) {
				grid-column: 2;
			}
		}

		.modal {
			grid-column: 1/-1;
			grid-row: 2;
			background: var(--level-2);
			padding: 20px;
			border-radius: 10px;
			box-shadow: var(--level-3);
			transition: all 0.3s ease-in-out;
			&.closed {
				max-height: 0;
				overflow: hidden;
				padding: 0 20px;
				opacity: 0;
				box-shadow: none;
			}
			&.open {
				max-height: 800px;
				opacity: 1;
				overflow-y: auto;
			}
			@media screen and (min-width: 690px) {
			}
		}
		h1 {
			grid-column: 1;
			grid-row: 1;
		}

		button.add-event {
			display: block;
			grid-column: 2;
			grid-row: 1;
			justify-self: end;
			&:hover {
				box-shadow: var(--level-2);
			}
			&.modal-active {
				display: none;
			}
		}
		button.close-modal {
			display: none;
			&.modal-active {
				display: block;
				grid-column: 2;
				grid-row: 1;
				justify-self: end;
				&:hover {
					box-shadow: var(--level-2);
				}
			}
		}
		.list-container {
			grid-column: 1 / -1;
			grid-row: 3;
		}
	}

	h1 {
		grid-column: 1 / -1;
	}

	h2 {
		margin: 0 0 15px 0;
		font-size: 1.5rem;
		color: var(--text-primary);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
	label {
		display: flex;
		flex-direction: column;
		width: 100%;
		font-weight: 500;
		font-size: 0.95rem;
	}
	label input[type='text'] {
		margin-top: 6px;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
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

	button[type='submit'] {
		margin-top: 10px;
		padding: 10px 20px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background: #0056b3;
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
		}

		&:active {
			transform: translateY(0);
		}
	}
</style>
