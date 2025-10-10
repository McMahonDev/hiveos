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
						<button
							class="dropdown-item"
							class:active={viewModeState.currentMode === category.id}
							onclick={() => selectMode(category.id)}
							type="button"
						>
							{category.name}
						</button>
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
		max-width: 400px;
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
