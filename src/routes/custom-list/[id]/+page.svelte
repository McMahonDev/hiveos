<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { goto } from '$app/navigation';
	import { viewModeState, setViewMode } from '$lib/state/viewMode.svelte.ts';
	import { offlineQueue } from '$lib/utils/offlineQueue.svelte';

	let { data } = $props();
	const listId = $derived(data.listId);
	const z = data.z;
	const id = data.id;
	const groupId = data.groupId;

	let customList = $derived(
		z ? new Query(z?.current.query.customLists.where('id', listId).where('createdById', id)) : null
	);

	let listType = $derived(customList?.current?.[0]?.listType || 'basic');

	let hasInitialized = $state(false);
	let initialViewMode = $state<string | null>(null);

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

	let modal = $state(false);
	let allDayChecked = $state(false);
	let selectedStore = $state('');
	let showNewStoreInput = $state(false);
	let newStoreName = $state('');

	// Shopping list helpers
	let savedItems = $state<string[]>([]);
	let localStorageStores = $state<string[]>([]);

	$effect(() => {
		if (typeof window !== 'undefined' && listType === 'shopping') {
			const items = localStorage.getItem('shopping-items');
			const stores = localStorage.getItem('shopping-stores');
			savedItems = items ? JSON.parse(items) : [];
			localStorageStores = stores ? JSON.parse(stores) : [];
		}
	});

	let savedStores = $derived.by(() => {
		if (listType !== 'shopping') return [];

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

	function getTimeZoneAbbreviation(): string {
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const shortName = new Date()
			.toLocaleTimeString('en-US', { timeZoneName: 'short', timeZone })
			.split(' ')[2];
		return shortName || timeZone;
	}

	function assignedToId() {
		return viewModeState.currentMode === 'personal' ? id : groupId;
	}

	function saveToLocalStorage(itemName: string, storeName: string) {
		if (itemName && !savedItems.includes(itemName)) {
			savedItems = [...savedItems, itemName];
			localStorage.setItem('shopping-items', JSON.stringify(savedItems));
		}

		if (storeName && storeName.trim() && !localStorageStores.includes(storeName)) {
			localStorageStores = [...localStorageStores, storeName];
			localStorage.setItem('shopping-stores', JSON.stringify(localStorageStores));
		}
	}

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const itemId = nanoid();

		let itemData: any = {
			id: itemId,
			name,
			status: false,
			customListId: listId,
			createdById: data.id,
			createdAt: Date.now(),
			viewMode: viewModeState.currentMode
		};

		if (listType === 'shopping') {
			let store = selectedStore === '__new__' ? newStoreName : selectedStore;
			itemData.store = store || undefined;
			saveToLocalStorage(name, store);
		} else if (listType === 'events') {
			let date = formData.get('date') as string;
			let time = formData.get('time') as string;
			let endDate = formData.get('endDate') as string;
			let endTime = formData.get('endTime') as string;
			let location = formData.get('location') as string;
			let description = formData.get('description') as string;

			// Validate end time
			if (!allDayChecked && time && endTime && (!endDate || endDate === date)) {
				const [startHour, startMin] = time.split(':').map(Number);
				const [endHour, endMin] = endTime.split(':').map(Number);
				const startMinutes = startHour * 60 + startMin;
				const endMinutes = endHour * 60 + endMin;

				if (endMinutes <= startMinutes) {
					alert('End time must be after start time');
					return;
				}
			}

			itemData.date = date;
			itemData.time = allDayChecked ? '' : time;
			itemData.endDate = endDate || undefined;
			itemData.endTime = allDayChecked ? '' : endTime;
			itemData.timezone = getTimeZoneAbbreviation();
			itemData.location = location || undefined;
			itemData.description = description || undefined;
			itemData.allDay = allDayChecked;
		} else if (listType === 'tasks') {
			// Get the highest sortOrder and add 1
			const maxOrder =
				customListItems?.current?.reduce(
					(max: number, item: any) => Math.max(max, item.sortOrder || 0),
					0
				) || 0;
			itemData.sortOrder = maxOrder + 1;
		} else if (listType === 'recipe') {
			let ingredients = formData.get('ingredients') as string;
			let instructions = formData.get('instructions') as string;
			let servings = formData.get('servings') as string;
			let prepTime = formData.get('prepTime') as string;
			let cookTime = formData.get('cookTime') as string;

			itemData.ingredients = ingredients || undefined;
			itemData.instructions = instructions || undefined;
			itemData.servings = servings ? parseInt(servings) : undefined;
			itemData.prepTime = prepTime || undefined;
			itemData.cookTime = cookTime || undefined;
		} else if (listType === 'messages') {
			let messageText = formData.get('messageText') as string;
			let priority = formData.get('priority') as string;

			itemData.messageText = messageText || undefined;
			itemData.priority = priority || 'medium';
		} else if (listType === 'contacts') {
			let phone = formData.get('phone') as string;
			let email = formData.get('email') as string;
			let address = formData.get('address') as string;

			itemData.phone = phone || undefined;
			itemData.email = email || undefined;
			itemData.address = address || undefined;
		} else if (listType === 'bookmarks') {
			let url = formData.get('url') as string;
			let tags = formData.get('tags') as string;
			let description = formData.get('description') as string;

			itemData.url = url || undefined;
			itemData.tags = tags || undefined;
			itemData.description = description || undefined;
		}

		z?.current.mutate.customListItems.insert(itemData);
		(event.target as HTMLFormElement).reset();
		selectedStore = '';
		newStoreName = '';
		allDayChecked = false;
		modal = false;
	}

	function deleteItem(itemId: string) {
		z?.current.mutate.customListItems.delete({ id: itemId });
	}

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

	// Drag and drop for task lists
	let draggedItem = $state<any>(null);

	function handleDragStart(e: DragEvent, item: any) {
		draggedItem = item;
		e.dataTransfer!.effectAllowed = 'move';
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
	}

	function handleDrop(e: DragEvent, targetItem: any) {
		e.preventDefault();
		if (!draggedItem || draggedItem.id === targetItem.id) return;

		const items = customListItems?.current;
		if (!items || !Array.isArray(items)) return;

		const draggedIndex = items.findIndex((i: any) => i.id === draggedItem.id);
		const targetIndex = items.findIndex((i: any) => i.id === targetItem.id);

		if (draggedIndex === -1 || targetIndex === -1) return;

		// Reorder items
		const newItems = [...items];
		newItems.splice(draggedIndex, 1);
		newItems.splice(targetIndex, 0, draggedItem);

		// Update sortOrder for all items
		newItems.forEach((item: any, index: number) => {
			z?.current.mutate.customListItems.update({
				id: item.id,
				sortOrder: index
			});
		});

		draggedItem = null;
	}

	function formatTime(time: string, timezone: string): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	}
</script>

<section class="custom-list">
	<div class="header">
		<h1>{customList?.current ? customList.current[0]?.name : 'Loading...'}</h1>
		<div class="header-buttons">
			<button class="delete-list" onclick={deleteCustomList} title="Delete List">
				<DeleteIcon />
			</button>
			<button class="add-event" class:modal-active={modal} onclick={() => (modal = true)}>
				Add Item
			</button>
			<button class="close-modal" class:modal-active={modal} onclick={() => (modal = false)}>
				Close
			</button>
		</div>
	</div>

	<div class="list-container">
		{#if customListItems?.current && Array.isArray(customListItems.current)}
			<div class="list-items" class:task-list={listType === 'tasks'}>
				{#each customListItems.current as item (item.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div
						class="list-item"
						class:draggable={listType === 'tasks'}
						draggable={listType === 'tasks'}
						ondragstart={(e) => handleDragStart(e, item)}
						ondragover={handleDragOver}
						ondrop={(e) => handleDrop(e, item)}
						role={listType === 'tasks' ? 'button' : undefined}
						tabindex={listType === 'tasks' ? 0 : undefined}
					>
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
							{#if listType === 'tasks'}
								<span class="drag-handle">☰</span>
							{/if}

							{#if listType === 'basic' || listType === 'shopping' || listType === 'tasks'}
								<input
									type="checkbox"
									checked={item.status}
									onchange={() => toggleItemStatus(item.id)}
								/>
							{/if}

							<div class="item-content">
								<p class="item-name" class:completed={item.status}>{item.name}</p>

								{#if listType === 'shopping' && item.store}
									<span class="item-store">📍 {item.store}</span>
								{/if}

								{#if listType === 'events'}
									<div class="event-details">
										{#if item.date}
											<span class="event-date">📅 {new Date(item.date).toLocaleDateString()}</span>
										{/if}
										{#if !item.allDay && item.time}
											<span class="event-time">🕐 {formatTime(item.time, item.timezone)}</span>
										{/if}
										{#if item.allDay}
											<span class="event-all-day">All Day</span>
										{/if}
										{#if item.location}
											<span class="event-location">📍 {item.location}</span>
										{/if}
										{#if item.description}
											<p class="event-description">{item.description}</p>
										{/if}
									</div>
								{/if}

								{#if listType === 'recipe'}
									<div class="recipe-details">
										{#if item.servings}
											<span class="recipe-servings">🍽️ Serves {item.servings}</span>
										{/if}
										{#if item.prepTime}
											<span class="recipe-time">⏱️ Prep: {item.prepTime}</span>
										{/if}
										{#if item.cookTime}
											<span class="recipe-time">🔥 Cook: {item.cookTime}</span>
										{/if}
										{#if item.ingredients}
											<details class="recipe-section">
												<summary>Ingredients</summary>
												<pre class="recipe-text">{item.ingredients}</pre>
											</details>
										{/if}
										{#if item.instructions}
											<details class="recipe-section">
												<summary>Instructions</summary>
												<pre class="recipe-text">{item.instructions}</pre>
											</details>
										{/if}
									</div>
								{/if}

								{#if listType === 'messages'}
									<div class="message-details">
										{#if item.messageText}
											<p class="message-text">{item.messageText}</p>
										{/if}
										{#if item.priority}
											<span class="message-priority priority-{item.priority}">{item.priority}</span>
										{/if}
										{#if item.tags}
											<div class="message-tags">
												{#each item.tags.split(',').map((t: string) => t.trim()) as tag}
													<span class="tag">{tag}</span>
												{/each}
											</div>
										{/if}
									</div>
								{/if}

								{#if listType === 'contacts'}
									<div class="contact-details">
										{#if item.phone}
											<span class="contact-info">📱 {item.phone}</span>
										{/if}
										{#if item.email}
											<span class="contact-info">✉️ {item.email}</span>
										{/if}
										{#if item.address}
											<span class="contact-info">🏠 {item.address}</span>
										{/if}
										{#if item.company}
											<span class="contact-info">🏢 {item.company}</span>
										{/if}
										{#if item.notes}
											<p class="contact-notes">{item.notes}</p>
										{/if}
									</div>
								{/if}

								{#if listType === 'bookmarks'}
									<div class="bookmark-details">
										{#if item.url}
											<a
												href={item.url}
												target="_blank"
												rel="noopener noreferrer"
												class="bookmark-url"
											>
												🔗 {item.url}
											</a>
										{/if}
										{#if item.description}
											<p class="bookmark-description">{item.description}</p>
										{/if}
										{#if item.tags}
											<div class="bookmark-tags">
												{#each item.tags.split(',').map((t: string) => t.trim()) as tag}
													<span class="tag">{tag}</span>
												{/each}
											</div>
										{/if}
									</div>
								{/if}
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
		{:else}
			<p>Loading items...</p>
		{/if}
	</div>
</section>

{#if modal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => (modal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Add an item</h2>
				<button type="button" class="close-button" onclick={() => (modal = false)}>
					<CloseIcon />
				</button>
			</div>

			<form {onsubmit}>
				<label for="name">
					{listType === 'events' ? 'Event Name' : 'Item Name'}
					<input
						type="text"
						id="name"
						name="name"
						list={listType === 'shopping' ? 'items-list' : undefined}
						autocomplete="off"
						required
					/>
				</label>

				{#if listType === 'shopping'}
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
				{:else if listType === 'events'}
					<label for="date">
						Date
						<input type="date" id="date" name="date" required />
					</label>

					<label class="checkbox-label">
						<input type="checkbox" bind:checked={allDayChecked} />
						<span>All Day Event</span>
					</label>

					{#if !allDayChecked}
						<label for="time">
							Start Time
							<input type="time" id="time" name="time" required={!allDayChecked} />
						</label>

						<label for="endTime">
							End Time
							<input type="time" id="endTime" name="endTime" />
						</label>
					{/if}

					<label for="endDate">
						End Date (optional)
						<input type="date" id="endDate" name="endDate" />
					</label>

					<label for="location">
						Location (optional)
						<input
							type="text"
							id="location"
							name="location"
							placeholder="e.g., Conference Room A"
						/>
					</label>

					<label for="description">
						Description (optional)
						<textarea
							id="description"
							name="description"
							rows="3"
							placeholder="Add details about this event..."
						></textarea>
					</label>
				{:else if listType === 'recipe'}
					<label for="ingredients">
						Ingredients *
						<textarea
							id="ingredients"
							name="ingredients"
							rows="5"
							placeholder="Enter each ingredient on a new line&#10;e.g.&#10;2 cups flour&#10;1 tsp salt&#10;3 eggs"
							required
						></textarea>
					</label>

					<label for="instructions">
						Instructions *
						<textarea
							id="instructions"
							name="instructions"
							rows="6"
							placeholder="Step-by-step cooking instructions..."
							required
						></textarea>
					</label>

					<div class="recipe-metadata">
						<label for="servings">
							Servings
							<input type="number" id="servings" name="servings" min="1" placeholder="4" />
						</label>

						<label for="prepTime">
							Prep Time
							<input type="text" id="prepTime" name="prepTime" placeholder="15 mins" />
						</label>

						<label for="cookTime">
							Cook Time
							<input type="text" id="cookTime" name="cookTime" placeholder="30 mins" />
						</label>
					</div>
				{:else if listType === 'messages'}
					<label for="messageText">
						Message *
						<textarea
							id="messageText"
							name="messageText"
							rows="4"
							placeholder="Write your message or note here..."
							required
						></textarea>
					</label>

					<label for="priority">
						Priority
						<select id="priority" name="priority">
							<option value="low">Low</option>
							<option value="medium" selected>Medium</option>
							<option value="high">High</option>
							<option value="urgent">Urgent</option>
						</select>
					</label>
				{:else if listType === 'contacts'}
					<label for="phone">
						Phone
						<input type="tel" id="phone" name="phone" placeholder="+1 (555) 123-4567" />
					</label>

					<label for="email">
						Email
						<input type="email" id="email" name="email" placeholder="contact@example.com" />
					</label>

					<label for="address">
						Address
						<textarea id="address" name="address" rows="3" placeholder="Street, City, State, ZIP"
						></textarea>
					</label>
				{:else if listType === 'bookmarks'}
					<label for="url">
						URL *
						<input type="url" id="url" name="url" placeholder="https://example.com" required />
					</label>

					<label for="description">
						Description (optional)
						<textarea
							id="description"
							name="description"
							rows="2"
							placeholder="What is this bookmark for?"
						></textarea>
					</label>

					<label for="tags">
						Tags (optional)
						<input type="text" id="tags" name="tags" placeholder="work, reference, tutorial" />
					</label>
				{/if}

				<button type="submit">Add</button>
			</form>
		</div>
	</div>
{/if}

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

		button.add-event {
			background: #007bff;
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 4px;
			cursor: pointer;
			font-weight: 600;

			&:hover {
				background: #0056b3;
				box-shadow: var(--level-2);
			}
			&.modal-active {
				display: none;
			}
		}

		button.close-modal {
			display: none;
			background: #6c757d;
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 4px;
			cursor: pointer;

			&.modal-active {
				display: block;
				&:hover {
					background: #5a6268;
					box-shadow: var(--level-2);
				}
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

			&.draggable {
				cursor: move;
			}

			.drag-handle {
				font-size: 1.2rem;
				color: #999;
				cursor: grab;
				user-select: none;

				&:active {
					cursor: grabbing;
				}
			}

			input[type='checkbox'] {
				width: 20px;
				height: 20px;
				cursor: pointer;
				flex-shrink: 0;
			}

			p {
				margin: 0;
				flex: 1;
				font-weight: 500;
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

					&.completed {
						text-decoration: line-through;
						opacity: 0.6;
					}
				}

				.item-store {
					font-size: 0.875rem;
					color: var(--color-tertiary, #666);
				}

				.event-details {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					font-size: 0.875rem;

					.event-date,
					.event-time,
					.event-location,
					.event-all-day {
						padding: 4px 8px;
						background: rgba(0, 123, 255, 0.08);
						border-radius: 4px;
						color: var(--text-color, #333);
					}

					.event-description {
						width: 100%;
						margin: 4px 0 0 0;
						padding: 8px;
						background: rgba(0, 0, 0, 0.02);
						border-radius: 4px;
						font-size: 0.875rem;
						line-height: 1.4;
					}
				}

				.recipe-details {
					display: flex;
					flex-direction: column;
					gap: 10px;
					font-size: 0.875rem;

					.recipe-servings,
					.recipe-time {
						padding: 4px 8px;
						background: rgba(255, 152, 0, 0.08);
						border-radius: 4px;
						display: inline-block;
						margin-right: 8px;
					}

					.recipe-section {
						margin-top: 8px;

						summary {
							cursor: pointer;
							font-weight: 600;
							padding: 6px 0;
							user-select: none;

							&:hover {
								color: #007bff;
							}
						}

						.recipe-text {
							margin: 8px 0 0 0;
							padding: 12px;
							background: rgba(0, 0, 0, 0.02);
							border-radius: 4px;
							white-space: pre-wrap;
							font-family: inherit;
							line-height: 1.6;
						}
					}
				}

				.message-details {
					display: flex;
					flex-direction: column;
					gap: 8px;
					font-size: 0.875rem;

					.message-text {
						margin: 0;
						padding: 10px;
						background: rgba(0, 0, 0, 0.02);
						border-radius: 4px;
						line-height: 1.5;
					}

					.message-priority {
						display: inline-block;
						padding: 4px 10px;
						border-radius: 12px;
						font-size: 0.75rem;
						font-weight: 600;
						text-transform: uppercase;

						&.priority-low {
							background: #e3f2fd;
							color: #1976d2;
						}

						&.priority-medium {
							background: #fff3e0;
							color: #f57c00;
						}

						&.priority-high {
							background: #fce4ec;
							color: #c2185b;
						}

						&.priority-urgent {
							background: #ffebee;
							color: #d32f2f;
						}
					}

					.message-tags {
						display: flex;
						flex-wrap: wrap;
						gap: 6px;
					}
				}

				.contact-details {
					display: flex;
					flex-direction: column;
					gap: 6px;
					font-size: 0.875rem;

					.contact-info {
						display: flex;
						align-items: center;
						gap: 6px;
					}

					.contact-notes {
						margin: 6px 0 0 0;
						padding: 8px;
						background: rgba(0, 0, 0, 0.02);
						border-radius: 4px;
						font-size: 0.875rem;
						line-height: 1.4;
						font-style: italic;
					}
				}

				.bookmark-details {
					display: flex;
					flex-direction: column;
					gap: 8px;
					font-size: 0.875rem;

					.bookmark-url {
						color: #007bff;
						text-decoration: none;
						word-break: break-all;

						&:hover {
							text-decoration: underline;
						}
					}

					.bookmark-description {
						margin: 0;
						color: var(--color-tertiary, #666);
						line-height: 1.4;
					}

					.bookmark-tags {
						display: flex;
						flex-wrap: wrap;
						gap: 6px;
					}
				}

				.tag {
					display: inline-block;
					padding: 3px 8px;
					background: rgba(76, 175, 80, 0.12);
					color: #2e7d32;
					border-radius: 12px;
					font-size: 0.75rem;
					font-weight: 500;
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
		font-weight: 600;
		color: var(--textColor);

		input,
		textarea {
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

	.checkbox-label {
		flex-direction: row;
		align-items: center;
		gap: 8px;

		input[type='checkbox'] {
			width: 18px;
			height: 18px;
			margin: 0;
		}

		span {
			font-weight: 500;
		}
	}

	.store-selection {
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		padding: 15px;
		display: flex;
		flex-direction: column;
		gap: 10px;

		legend {
			font-weight: 600;
			padding: 0 8px;
			color: var(--text-primary);
			font-size: 0.95rem;
		}

		.radio-label {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 8px;
			cursor: pointer;
			border-radius: 4px;
			transition: background 0.2s ease;

			&:hover {
				background: var(--level-2);
			}

			input[type='radio'] {
				width: 18px;
				height: 18px;
				cursor: pointer;
				margin: 0;
			}
		}

		.new-store-input {
			margin-top: 8px;
			padding: 8px;
			border: 1px solid #ccc;
			border-radius: 4px;
			font-size: 1rem;
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

	.recipe-metadata {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 15px;

		label {
			margin: 0;
		}
	}

	button[type='submit'] {
		padding: 12px;
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
