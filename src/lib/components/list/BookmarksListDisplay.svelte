<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import BookmarkListItem from '$lib/components/list/BookmarkListItem.svelte';
	import type { Query } from 'zero-svelte';

	interface Props {
		customListItems: Query<any, any, any> | null;
		z: any;
		onEdit: (item: any) => void;
	}

	let { customListItems, z, onEdit }: Props = $props();

	function deleteItem(itemId: string) {
		z?.current.mutate.customListItems.delete({ id: itemId });
	}
</script>

<div class="list-items">
	{#each customListItems?.current && Array.isArray(customListItems.current) ? customListItems.current : [] as item (item.id)}
		<div class="list-item">
			<div class="item-content">
				<p class="item-name">{item.name}</p>
				<BookmarkListItem {item} />
			</div>
			<div class="item-actions">
				<button class="edit-item" onclick={() => onEdit(item)} title="Edit Item"> Edit </button>
				<button class="delete-item" onclick={() => deleteItem(item.id)} title="Delete Item">
					<DeleteIcon />
				</button>
			</div>
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

		.item-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 8px;

			.item-name {
				font-weight: 600;
				font-size: 1rem;
				margin: 0;
			}
		}

		.item-actions {
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
