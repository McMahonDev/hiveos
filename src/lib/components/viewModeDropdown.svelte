<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import {
		viewModeState,
		setViewMode,
		addAvailableMode,
		setAvailableModes,
		type ViewMode
	} from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();
	let z = $derived(data.z);
	let inGroup = $derived(data.groupId !== data.id);

	let isOpen = $state(false);
	let showAddModal = $state(false);
	let newCategoryName = $state('');
	let showDeleteModal = $state(false);
	let categoryToDelete = $state<{ id: string; name: string } | null>(null);
	let deleteMigrationChoice = $state<'personal' | 'delete'>('personal');

	// Query custom categories
	let customCategories = $state<Query<any, any, any> | undefined>(undefined);

	$effect(() => {
		if (data.auth && z?.current) {
			customCategories = new Query(
				z.current.query.viewModeCategories.where('userId', data.id).orderBy('createdAt', 'asc')
			);
		} else {
			customCategories = undefined;
		}
	});

	// Update available modes based on group status and custom categories
	$effect(() => {
		const modes: ViewMode[] = ['personal'];

		// Add shared if user is in a group
		if (inGroup) {
			modes.push('shared');
		}

		// Add custom categories
		if (customCategories?.current && Array.isArray(customCategories.current)) {
			customCategories.current.forEach((cat: any) => {
				modes.push(cat.id);
			});
		}

		setAvailableModes(modes);

		// If current mode is 'shared' but user is no longer in a group, switch to personal
		if (viewModeState.currentMode === 'shared' && !inGroup) {
			setViewMode('personal');
		}
	});

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectMode(mode: ViewMode) {
		setViewMode(mode);
		isOpen = false;
	}

	function getModeName(mode: ViewMode): string {
		if (mode === 'personal') return 'Personal';
		if (mode === 'shared') return 'Shared';
		// Find custom category name
		if (customCategories?.current && Array.isArray(customCategories.current)) {
			const cat = customCategories.current.find((c: any) => c.id === mode);
			if (cat) return cat.name;
		}
		return 'Unknown';
	}

	function openAddModal() {
		showAddModal = true;
		isOpen = false;
	}

	function closeAddModal() {
		showAddModal = false;
		newCategoryName = '';
	}

	async function addNewCategory() {
		if (!newCategoryName.trim()) return;

		const id = nanoid();
		try {
			await z?.current?.mutate.viewModeCategories.insert({
				id,
				name: newCategoryName.trim(),
				userId: data.id,
				createdAt: Date.now()
			});
			closeAddModal();
		} catch (err) {
			console.error('Failed to create category:', err);
		}
	}

	function openDeleteModal(categoryId: string, categoryName: string, e: MouseEvent) {
		e.stopPropagation();
		categoryToDelete = { id: categoryId, name: categoryName };
		showDeleteModal = true;
		isOpen = false;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		categoryToDelete = null;
		deleteMigrationChoice = 'personal';
	}

	async function deleteCategory() {
		if (!categoryToDelete || !z?.current) return;

		try {
			const categoryId = categoryToDelete.id;
			const zInstance = z.current;

			if (deleteMigrationChoice === 'personal') {
				// Migrate all items to personal mode using direct queries
				// We'll use the Zero query API directly without creating Query objects

				// Get and update all events
				const events = await zInstance.query.events.where('viewMode', categoryId).run();
				for (const event of events) {
					await zInstance.mutate.events.update({
						id: event.id,
						viewMode: 'personal',
						assignedToId: data.id
					});
				}

				// Get and update all shopping list items
				const shoppingItems = await zInstance.query.shoppingList
					.where('viewMode', categoryId)
					.run();
				for (const item of shoppingItems) {
					await zInstance.mutate.shoppingList.update({
						id: item.id,
						viewMode: 'personal',
						assignedToId: data.id
					});
				}

				// Get and update all custom lists
				const customLists = await zInstance.query.customLists.where('viewMode', categoryId).run();
				for (const list of customLists) {
					await zInstance.mutate.customLists.update({
						id: list.id,
						viewMode: 'personal'
					});
				}

				// Get and update all custom list items
				const customListItems = await zInstance.query.customListItems
					.where('viewMode', categoryId)
					.run();
				for (const item of customListItems) {
					await zInstance.mutate.customListItems.update({
						id: item.id,
						viewMode: 'personal'
					});
				}
			} else {
				// Delete all items

				// Get and delete all events
				const events = await zInstance.query.events.where('viewMode', categoryId).run();
				for (const event of events) {
					await zInstance.mutate.events.delete({ id: event.id });
				}

				// Get and delete all shopping list items
				const shoppingItems = await zInstance.query.shoppingList
					.where('viewMode', categoryId)
					.run();
				for (const item of shoppingItems) {
					await zInstance.mutate.shoppingList.delete({ id: item.id });
				}

				// Get and delete all custom list items first
				const customListItems = await zInstance.query.customListItems
					.where('viewMode', categoryId)
					.run();
				for (const item of customListItems) {
					await zInstance.mutate.customListItems.delete({ id: item.id });
				}

				// Then get and delete all custom lists
				const customLists = await zInstance.query.customLists.where('viewMode', categoryId).run();
				for (const list of customLists) {
					await zInstance.mutate.customLists.delete({ id: list.id });
				}
			}

			// Finally, delete the category itself
			await zInstance.mutate.viewModeCategories.delete({ id: categoryId });

			// If user was in this view mode, switch to personal
			if (viewModeState.currentMode === categoryId) {
				setViewMode('personal');
			}

			closeDeleteModal();
		} catch (err) {
			console.error('Failed to delete category:', err);
			alert('Failed to delete category. Please try again.');
		}
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.view-mode-dropdown')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

{#if data.auth}
	<div class="view-mode-dropdown">
		<button class="view-mode-button" onclick={toggleDropdown} type="button">
			<span class="mode-label">{getModeName(viewModeState.currentMode)}</span>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class:rotated={isOpen}
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</button>

		{#if isOpen}
			<div class="dropdown-menu">
				<button
					class="dropdown-item"
					class:active={viewModeState.currentMode === 'personal'}
					onclick={() => selectMode('personal')}
					type="button"
				>
					Personal
				</button>

				{#if inGroup}
					<button
						class="dropdown-item"
						class:active={viewModeState.currentMode === 'shared'}
						onclick={() => selectMode('shared')}
						type="button"
					>
						Shared
					</button>
				{/if}

				{#if customCategories?.current && Array.isArray(customCategories.current)}
					{#each customCategories.current as category (category.id)}
						<div class="dropdown-item-wrapper">
							<button
								class="dropdown-item"
								class:active={viewModeState.currentMode === category.id}
								onclick={() => selectMode(category.id)}
								type="button"
							>
								{category.name}
							</button>
							<button
								class="delete-category-btn"
								onclick={(e) => openDeleteModal(category.id, category.name, e)}
								type="button"
								title="Delete category"
							>
								×
							</button>
						</div>
					{/each}
				{/if}

				<div class="dropdown-divider"></div>
				<button class="dropdown-item add-new" onclick={openAddModal} type="button">
					+ Add Category
				</button>
			</div>
		{/if}
	</div>

	{#if showAddModal}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-overlay" onclick={closeAddModal}>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-content" onclick={(e) => e.stopPropagation()}>
				<h3>Add New Category</h3>
				<input
					type="text"
					bind:value={newCategoryName}
					placeholder="Category name (e.g., Work)"
					maxlength="50"
					onkeydown={(e) => e.key === 'Enter' && addNewCategory()}
				/>
				<div class="modal-buttons">
					<button onclick={addNewCategory} disabled={!newCategoryName.trim()}>Create</button>
					<button onclick={closeAddModal} class="cancel">Cancel</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showDeleteModal && categoryToDelete}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-overlay" onclick={closeDeleteModal}>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-content delete-modal" onclick={(e) => e.stopPropagation()}>
				<h3>Delete "{categoryToDelete.name}" Category</h3>
				<p class="warning-text">What would you like to do with all items in this category?</p>

				<div class="migration-options">
					<label class="radio-option">
						<input
							type="radio"
							name="migration"
							value="personal"
							checked={deleteMigrationChoice === 'personal'}
							onchange={() => (deleteMigrationChoice = 'personal')}
						/>
						<div class="option-content">
							<strong>Move to Personal</strong>
							<span
								>All events, shopping items, and custom lists will be moved to your personal view</span
							>
						</div>
					</label>

					<label class="radio-option">
						<input
							type="radio"
							name="migration"
							value="delete"
							checked={deleteMigrationChoice === 'delete'}
							onchange={() => (deleteMigrationChoice = 'delete')}
						/>
						<div class="option-content">
							<strong>Delete Everything</strong>
							<span class="danger">All items in this category will be permanently deleted</span>
						</div>
					</label>
				</div>

				<div class="modal-buttons">
					<button
						onclick={deleteCategory}
						class={deleteMigrationChoice === 'delete' ? 'danger' : ''}
					>
						{deleteMigrationChoice === 'delete' ? 'Delete All' : 'Move & Delete Category'}
					</button>
					<button onclick={closeDeleteModal} class="cancel">Cancel</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.view-mode-dropdown {
		position: relative;
		display: inline-block;
	}

	.view-mode-button {
		background-color: rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		padding: 8px 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.95rem;
		font-weight: 500;
		color: #000;
		transition: all 0.2s ease;
	}

	.view-mode-button:hover {
		background-color: rgba(0, 0, 0, 0.15);
	}

	.view-mode-button svg {
		transition: transform 0.2s ease;
	}

	.view-mode-button svg.rotated {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 180px;
		z-index: 1000;
		overflow: hidden;
	}

	.dropdown-item {
		display: block;
		width: 100%;
		padding: 12px 16px;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: 0.95rem;
		color: #333;
		transition: background-color 0.15s ease;
	}

	.dropdown-item:hover {
		background-color: #f5f5f5;
	}

	.dropdown-item.active {
		background-color: var(--primary);
		color: #000;
		font-weight: 600;
	}

	.dropdown-item.add-new {
		color: var(--primary);
		font-weight: 500;
	}

	.dropdown-divider {
		height: 1px;
		background-color: #e0e0e0;
		margin: 4px 0;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		padding: 24px;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.modal-content h3 {
		margin: 0 0 16px 0;
		font-size: 1.25rem;
		color: #333;
	}

	.modal-content input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		margin-bottom: 16px;
	}

	.modal-content input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.modal-buttons {
		display: flex;
		gap: 8px;
	}

	.modal-buttons button {
		flex: 1;
		padding: 10px;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.modal-buttons button:first-child {
		background-color: var(--primary);
		color: #000;
	}

	.modal-buttons button:first-child:hover:not(:disabled) {
		filter: brightness(0.95);
	}

	.modal-buttons button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.modal-buttons button.cancel {
		background-color: #e0e0e0;
		color: #333;
	}

	.modal-buttons button.cancel:hover {
		background-color: #d0d0d0;
	}

	.modal-buttons button.danger {
		background-color: #dc3545;
		color: white;
	}

	.modal-buttons button.danger:hover {
		background-color: #c82333;
	}

	.dropdown-item-wrapper {
		display: flex;
		align-items: center;
		gap: 2px;
		position: relative;
	}

	.dropdown-item-wrapper .dropdown-item {
		flex: 1;
		padding-right: 4px;
	}

	.delete-category-btn {
		background: rgba(0, 0, 0, 0.05);
		border: none;
		color: #999;
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: all 0.2s ease;
		flex-shrink: 0;
		min-width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.delete-category-btn:hover {
		background-color: #fee;
		color: #dc3545;
	}

	.delete-modal {
		max-width: 600px;
		width: 95%;
	}

	.warning-text {
		margin: 0 0 20px 0;
		color: #666;
		font-size: 0.95rem;
	}

	.migration-options {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}

	.radio-option {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border: 2px solid #ddd;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		background-color: white;
		width: 100%;
	}

	.radio-option:hover {
		border-color: var(--primary);
		background-color: #fffef5;
	}

	.radio-option:has(input[type='radio']:checked) {
		border-color: var(--primary);
		background-color: #fffef5;
		box-shadow: 0 0 0 1px var(--primary);
	}

	.radio-option input[type='radio'] {
		margin-top: 3px;
		cursor: pointer;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.option-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
	}

	.option-content strong {
		color: #333;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.option-content span {
		color: #666;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.option-content span.danger {
		color: #dc3545;
		font-weight: 600;
	}

	@media screen and (max-width: 690px) {
		.view-mode-button {
			font-size: 0.85rem;
			padding: 6px 12px;
		}

		.dropdown-menu {
			min-width: 150px;
		}
	}
</style>
