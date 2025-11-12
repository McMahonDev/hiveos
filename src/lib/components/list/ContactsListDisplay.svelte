<script lang="ts">
	import { nanoid } from 'nanoid';
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import ContactListItem from '$lib/components/list/ContactListItem.svelte';
	import type { Query } from 'zero-svelte';

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
	let editModal = $state(false);
	let editingItem = $state<any>(null);

	function deleteItem(itemId: string) {
		z?.current.mutate.customListItems.delete({ id: itemId });
	}

	function startEdit(item: any) {
		editingItem = { ...item };
		editModal = true;
	}

	function cancelEdit() {
		editModal = false;
		editingItem = null;
	}

	function saveEdit() {
		if (editingItem) {
			z?.current.mutate.customListItems.update({
				id: editingItem.id,
				name: editingItem.name,
				phone: editingItem.phone,
				email: editingItem.email,
				address: editingItem.address
			});
			cancelEdit();
		}
	}

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const phone = formData.get('phone') as string;
		const email = formData.get('email') as string;
		const address = formData.get('address') as string;

		const itemData: any = {
			id: nanoid(),
			name,
			status: false,
			customListId: listId,
			createdById: userId,
			createdAt: Date.now(),
			viewMode: viewMode,
			groupId: viewMode === 'shared' ? groupId : null,
			phone: phone || undefined,
			email: email || undefined,
			address: address || undefined
		};

		z?.current.mutate.customListItems.insert(itemData);
		(event.target as HTMLFormElement).reset();
		addModal = false;
	}
</script>

<div class="list-header">
	<button class="add-item-btn" onclick={() => (addModal = true)}>Add Contact</button>
</div>

<div class="list-items">
	{#each customListItems?.current && Array.isArray(customListItems.current) ? customListItems.current : [] as item (item.id)}
		<div class="list-item">
			<div class="item-content">
				<p class="item-name">{item.name}</p>
				<ContactListItem {item} />
			</div>
			<div class="item-actions">
				<button class="edit-item" onclick={() => startEdit(item)} title="Edit Item"> Edit </button>
				<button class="delete-item" onclick={() => deleteItem(item.id)} title="Delete Item">
					<DeleteIcon />
				</button>
			</div>
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
				<h2>Add Contact</h2>
				<button type="button" class="close-button" onclick={() => (addModal = false)}>
					<CloseIcon />
				</button>
			</div>

			<form {onsubmit}>
				<label for="name">
					Name
					<input type="text" id="name" name="name" required />
				</label>

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

				<div class="modal-actions">
					<button type="button" class="cancel-btn" onclick={() => (addModal = false)}>Cancel</button
					>
					<button type="submit" class="save-btn">Add Contact</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if editModal && editingItem}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={cancelEdit}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Edit Contact</h2>
				<button class="close-button" onclick={cancelEdit} type="button" aria-label="Close">
					<CloseIcon />
				</button>
			</div>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveEdit();
				}}
			>
				<label>
					Name
					<input type="text" bind:value={editingItem.name} required />
				</label>
				<label>
					Phone
					<input type="tel" bind:value={editingItem.phone} />
				</label>
				<label>
					Email
					<input type="email" bind:value={editingItem.email} />
				</label>
				<label>
					Address
					<textarea bind:value={editingItem.address} rows="3"></textarea>
				</label>
				<div class="modal-actions">
					<button type="button" class="cancel-btn" onclick={cancelEdit}>Cancel</button>
					<button type="submit" class="save-btn">Save Changes</button>
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

	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		margin-top: 20px;
		padding-top: 20px;
		border-top: 2px solid #e8e8e8;
	}

	.cancel-btn,
	.save-btn {
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;

		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.cancel-btn {
		background: #e8e8e8;
		color: #222;

		&:hover {
			background: #d4d4d4;
		}
	}

	.save-btn {
		background: #28a745;
		color: white;

		&:hover {
			background: #218838;
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
