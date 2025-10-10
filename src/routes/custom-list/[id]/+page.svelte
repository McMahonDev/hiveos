<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { goto } from '$app/navigation';
	import { viewModeState, setViewMode } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props(); // repo style (Svelte 5)
	const listId = $derived(data.listId);

	const z = data.z;
	const id = data.id;
	const groupId = data.groupId;

	let customList = $derived(
		z ? new Query(z?.current.query.customLists.where('id', listId).where('createdById', id)) : null
	);

	let hasInitialized = $state(false);
	let initialViewMode = $state<string | null>(null);

	// On initial load/bookmark access: auto-switch to the list's view mode if needed
	$effect(() => {
		if (customList?.current?.[0] && !hasInitialized) {
			const listViewMode = customList.current[0].viewMode;
			initialViewMode = listViewMode;

			// If the list's viewMode doesn't match current mode, try to switch to it
			if (listViewMode !== viewModeState.currentMode) {
				if (listViewMode === 'personal' || listViewMode === 'shared') {
					// Always have access to personal/shared modes
					setViewMode(listViewMode);
					hasInitialized = true;
				} else {
					// It's a custom category - check if user has access
					const categoryQuery = z?.current.query.viewModeCategories
						.where('userId', id)
						.where('id', listViewMode);

					if (categoryQuery) {
						const categoryList = new Query(categoryQuery);
						if (categoryList.current && categoryList.current.length > 0) {
							// User has access to this category, switch to it
							setViewMode(listViewMode);
							hasInitialized = true;
						} else if (categoryList.current !== null) {
							// Query resolved but user doesn't have access, navigate home
							goto('/');
							hasInitialized = true;
						}
					}
				}
			} else {
				// Already in correct view mode
				hasInitialized = true;
			}
		}
	});

	// If user manually switches view mode while on this page, navigate home
	$effect(() => {
		const currentMode = viewModeState.currentMode;
		if (hasInitialized && initialViewMode !== null && currentMode !== initialViewMode) {
			console.log(
				'View mode changed, navigating home. Initial:',
				initialViewMode,
				'Current:',
				currentMode
			);
			goto('/');
		}
	});

	// Filter custom list items by viewMode
	let customListItems = $state<Query<any, any, any> | null>(null);

	$effect(() => {
		if (z?.current) {
			customListItems = new Query(
				z.current.query.customListItems
					.where('customListId', listId)
					.where('viewMode', viewModeState.currentMode)
					.orderBy('createdAt', 'asc')
			);
		} else {
			customListItems = null;
		}
	});

	let modal = $state(false);

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const id = nanoid();
		if (name) {
			z?.current.mutate.customListItems.insert({
				id,
				name,
				status: false,
				customListId: listId,
				createdById: data.id,
				createdAt: Date.now(),
				viewMode: viewModeState.currentMode
			});
			(event.target as HTMLFormElement).reset();
		}
	}

	function deleteItem(itemId: string) {
		z?.current.mutate.customListItems.delete({ id: itemId });
	}

	function deleteCustomList() {
		if (
			confirm('Are you sure you want to delete this list? This will also delete all items in it.')
		) {
			// Delete all items first
			if (customListItems?.current && Array.isArray(customListItems.current)) {
				customListItems.current.forEach((item: any) => {
					z?.current.mutate.customListItems.delete({ id: item.id });
				});
			}

			// Then delete the list itself
			z?.current.mutate.customLists.delete({ id: listId });

			// Navigate back to home or lists page
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
	<div class={modal ? 'modal open' : 'modal closed'} role="dialog" aria-modal="true" tabindex="-1">
		<h2>Add an item</h2>
		<form {onsubmit}>
			<label for="name"
				>Item Name
				<input type="text" id="name" name="name" />
			</label>
			<button type="submit">Add</button>
		</form>
	</div>
	<div class="list-container">
		{#if customListItems?.current && Array.isArray(customListItems.current)}
			<div class="list-items">
				{#each customListItems.current as item (item.id)}
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
							<p>{item.name}</p>
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

		.modal {
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
				max-height: 500px;
				opacity: 1;
			}
		}

		button.add-event {
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
				&:hover {
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

			&:hover {
				box-shadow: var(--level-3);
				transform: translateY(-1px);
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
				gap: 4px;

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
		gap: 10px;
	}

	label {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	label input {
		margin-top: 5px;
		padding: 5px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
