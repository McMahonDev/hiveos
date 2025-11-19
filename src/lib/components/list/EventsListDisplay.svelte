<script lang="ts">
	import { nanoid } from 'nanoid';
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import EventListItem from '$lib/components/list/EventListItem.svelte';
	import { getTimeZoneAbbreviation } from '$lib/utils/timezoneUtils';
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
	let allDayChecked = $state(false);

	function startEdit(item: any) {
		editingItem = { ...item };
		editModal = true;
	}

	function cancelEdit() {
		editModal = false;
		editingItem = null;
	}

	async function saveEdit() {
		if (!editingItem || !z?.current) return;

		const updateData: any = {
			id: editingItem.id,
			name: editingItem.name,
			date: editingItem.date || null,
			time: editingItem.allDay ? '' : editingItem.time || null,
			endTime: editingItem.allDay ? null : editingItem.endTime || null,
			location: editingItem.location || null,
			description: editingItem.description || null,
			allDay: editingItem.allDay || false
		};

		try {
			await z.current.mutate.customListItems.update(updateData);
			cancelEdit();
		} catch (error) {
			console.error('Failed to update item:', error);
		}
	}

	function deleteItem(itemId: string) {
		z?.current.mutate.customListItems.delete({ id: itemId });
	}

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const endDate = formData.get('endDate') as string;
		const endTime = formData.get('endTime') as string;
		const location = formData.get('location') as string;
		const description = formData.get('description') as string;

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

		const itemData: any = {
			id: nanoid(),
			name,
			status: false,
			customListId: listId,
			createdById: userId,
			createdAt: Date.now(),
			viewMode: viewMode,
			groupId: viewMode === 'shared' ? groupId : null,
			date,
			time: allDayChecked ? '' : time,
			endDate: endDate || undefined,
			endTime: allDayChecked ? '' : endTime,
			timezone: getTimeZoneAbbreviation(),
			location: location || undefined,
			description: description || undefined,
			allDay: allDayChecked
		};

		z?.current.mutate.customListItems.insert(itemData);
		(event.target as HTMLFormElement).reset();
		allDayChecked = false;
		addModal = false;
	}
</script>

<div class="list-header">
	<button class="add-item-btn" onclick={() => (addModal = true)}>Add Event</button>
</div>

<div class="list-items">
	{#each customListItems?.current && Array.isArray(customListItems.current) ? customListItems.current : [] as item (item.id)}
		<div class="list-item">
			<div class="item-content">
				<p class="item-name">{item.name}</p>
				<EventListItem {item} />
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
				<h2>Add Event</h2>
				<button type="button" class="close-button" onclick={() => (addModal = false)}>
					<CloseIcon />
				</button>
			</div>

			<form {onsubmit}>
				<label for="name">
					Event Name
					<input type="text" id="name" name="name" required />
				</label>

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
					<input type="text" id="location" name="location" placeholder="e.g., Conference Room A" />
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

				<div class="modal-actions">
					<button type="button" class="cancel-btn" onclick={() => (addModal = false)}>Cancel</button
					>
					<button type="submit" class="save-btn">Add Event</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if editModal && editingItem}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => (editModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Edit Event</h2>
				<button type="button" class="close-button" onclick={() => (editModal = false)}>
					<CloseIcon />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveEdit();
				}}
			>
				<label for="edit-name">
					Event Name *
					<input
						type="text"
						id="edit-name"
						bind:value={editingItem.name}
						placeholder="Enter event name"
						required
					/>
				</label>

				<label for="edit-date">
					Date *
					<input type="date" id="edit-date" bind:value={editingItem.date} required />
				</label>

				<label class="checkbox-label">
					<input type="checkbox" bind:checked={editingItem.allDay} />
					All Day Event
				</label>

				{#if !editingItem.allDay}
					<div class="time-inputs">
						<label for="edit-time">
							Start Time
							<input type="time" id="edit-time" bind:value={editingItem.time} />
						</label>

						<label for="edit-endtime">
							End Time
							<input type="time" id="edit-endtime" bind:value={editingItem.endTime} />
						</label>
					</div>
				{/if}

				<label for="edit-location">
					Location (optional)
					<input
						type="text"
						id="edit-location"
						bind:value={editingItem.location}
						placeholder="e.g., Conference Room A"
					/>
				</label>

				<label for="edit-description">
					Description (optional)
					<textarea
						id="edit-description"
						bind:value={editingItem.description}
						rows="3"
						placeholder="Add details about this event..."
					></textarea>
				</label>

				<div class="modal-actions">
					<button type="button" class="cancel-btn" onclick={() => (editModal = false)}>
						Cancel
					</button>
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
		cursor: pointer;
		margin: 8px 0;

		input[type='checkbox'] {
			width: 18px;
			height: 18px;
			cursor: pointer;
		}
	}

	.time-inputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
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
