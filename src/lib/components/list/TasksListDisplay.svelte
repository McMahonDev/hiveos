<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import type { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';

	interface Props {
		customListItems: Query<any, any, any> | null;
		z: any;
		listId: string;
		userId: string;
		viewMode: string;
		groupId: string;
	}

	let { customListItems, z, listId, userId, viewMode, groupId }: Props = $props();

	let addModal = $state(false);

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;

		// Get the highest sortOrder and add 1
		const maxOrder =
			customListItems?.current?.reduce(
				(max: number, item: any) => Math.max(max, item.sortOrder || 0),
				0
			) || 0;

		const itemData = {
			id: nanoid(),
			name,
			status: false,
			customListId: listId,
			createdById: userId,
			createdAt: Date.now(),
			viewMode: viewMode,
			groupId: viewMode === 'shared' ? groupId : null,
			sortOrder: maxOrder + 1
		};

		z?.current.mutate.customListItems.insert(itemData);
		(event.target as HTMLFormElement).reset();
		addModal = false;
	}

	let editingItemId = $state<string | null>(null);
	let editName = $state('');
	let draggedItem = $state<any>(null);

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
</script>

<div class="list-header">
	<button class="add-item-btn" onclick={() => (addModal = true)}>Add Task</button>
</div>

<div class="list-items task-list">
	{#each customListItems?.current && Array.isArray(customListItems.current) ? customListItems.current : [] as item (item.id)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="list-item draggable"
			draggable={true}
			ondragstart={(e) => handleDragStart(e, item)}
			ondragover={handleDragOver}
			ondrop={(e) => handleDrop(e, item)}
			role="button"
			tabindex="0"
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
					<button class="save-item" onclick={() => saveEdit(item.id)} title="Save"> Save </button>
					<button class="cancel-item" onclick={cancelEdit} title="Cancel"> Cancel </button>
				</div>
			{:else}
				<span class="drag-handle">☰</span>
				<input type="checkbox" checked={item.status} onchange={() => toggleItemStatus(item.id)} />
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

{#if addModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => (addModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Add Task</h2>
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
					Task Name
					<input type="text" id="name" name="name" autocomplete="off" required />
				</label>
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

	.list-items {
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
		height: calc(100% - var(--headerHeight));
	}

	.modal-content {
		background: var(--background);
		padding: 20px;
		border-radius: 10px;
		box-shadow: var(--level-3);
		width: 100%;
		max-width: 600px;
		max-height: calc(90vh - 60px);
		overflow-y: auto;
		animation: slideUp 0.3s ease-out;

		@media screen and (max-width: 690px) {
			max-height: calc(85vh - 60px);
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
