<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import type { Query } from 'zero-svelte';

	interface Props {
		customListItems: Query<any, any, any> | null;
		z: any;
	}

	let { customListItems, z }: Props = $props();

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

<div class="list-items">
	{#each Array.isArray(customListItems?.current) ? customListItems.current : [] as item (item.id)}
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
					<button class="save-item" onclick={() => saveEdit(item.id)} title="Save"> Save </button>
					<button class="cancel-item" onclick={cancelEdit} title="Cancel"> Cancel </button>
				</div>
			{:else}
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

<style>
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
</style>
