<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { Query } from 'zero-svelte';
	import { isPast } from '$lib/utils/isPast';
	import { isToday } from '$lib/utils/isToday';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';
	import { offlineQueue } from '$lib/utils/offlineQueue.svelte';
	import { optimisticUpdates } from '$lib/utils/optimisticUpdates.svelte';

	let { data, shortlist = false } = $props();
	let z = data.z;
	const groupId = data.groupId;
	$inspect(groupId);

	// Query events (ordered by createdAt for a deterministic replica order).
	// Filter by viewMode
	let events = $state<Query<any, any, any>>();

	$effect(() => {
		if (z?.current) {
			// In personal mode, only show items assigned to the user
			// In shared/other modes, show items assigned to the group
			const assignedId = viewModeState.currentMode === 'personal' ? data.id : groupId;

			events = new Query(
				z.current.query.events
					.where('assignedToId', assignedId)
					.where('viewMode', viewModeState.currentMode)
					.orderBy('createdAt', 'asc')
			);
		}
	});

	$inspect(events?.current);

	// Merge with optimistic updates
	let eventsWithOptimistic = $derived.by(() => {
		if (!events?.current || !Array.isArray(events.current)) {
			return [];
		}
		return optimisticUpdates.mergeWithRealData('events', events.current);
	});

	let numberOfItems = $derived(eventsWithOptimistic.length);

	let sortedEvents = $derived(
		Array.isArray(eventsWithOptimistic)
			? eventsWithOptimistic.slice().sort((a, b) => {
					const hasDate = (x: any) => typeof x?.date === 'string' && x.date.trim() !== '';
					const hasTime = (x: any) => typeof x?.time === 'string' && x.time.trim() !== '';

					const parseDateMs = (d: string) => {
						if (!d) return NaN;
						const ms = Date.parse(d);
						return Number.isFinite(ms) ? ms : NaN;
					};

					const parseDateTimeMs = (d: string, t: string) => {
						if (!d || !t) return NaN;
						const dt = new Date(`${d}T${t}`);
						return Number.isFinite(dt.getTime()) ? dt.getTime() : NaN;
					};

					const getCreatedAt = (x: any) => {
						const v = x?.createdAt;
						if (typeof v === 'number') return v;
						if (typeof v === 'string') {
							const n = Number(v);
							if (!Number.isNaN(n) && Number.isFinite(n)) return n;
							const parsed = Date.parse(v);
							if (!Number.isNaN(parsed)) return parsed;
						}
						return 0;
					};

					const aHasDate = hasDate(a);
					const bHasDate = hasDate(b);

					// Both have a date
					if (aHasDate && bHasDate) {
						const aHasTime = hasTime(a);
						const bHasTime = hasTime(b);

						// If both have date+time compare full datetime
						if (aHasTime && bHasTime) {
							const adt = parseDateTimeMs(a.date, a.time);
							const bdt = parseDateTimeMs(b.date, b.time);
							if (!Number.isNaN(adt) && !Number.isNaN(bdt) && adt !== bdt) return adt - bdt;
						}

						// Compare by date only
						const ad = parseDateMs(a.date);
						const bd = parseDateMs(b.date);
						if (!Number.isNaN(ad) && !Number.isNaN(bd) && ad !== bd) return ad - bd;

						// Same date (or invalid parses) -> tie-breaker by createdAt
						return getCreatedAt(a) - getCreatedAt(b);
					}

					// One has a date -> it comes first
					if (aHasDate) return -1;
					if (bHasDate) return 1;

					// Neither has a date -> ignore time and sort by createdAt
					return getCreatedAt(a) - getCreatedAt(b);
				})
			: undefined
	);

	function formatDate(dateString: string) {
		// convert date string to a more readable format
		if (!dateString) return '';

		console.log('Formatting date string:', dateString);

		// Parse plain YYYY-MM-DD and format without timezone conversion
		const isoDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (isoDateMatch) {
			const y = Number(isoDateMatch[1]);
			const m = Number(isoDateMatch[2]) - 1;
			const d = Number(isoDateMatch[3]);

			// Create date at noon local time to avoid any timezone edge cases
			const date = new Date(y, m, d, 12, 0, 0);

			const options: Intl.DateTimeFormatOptions = {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			};

			return date.toLocaleDateString(undefined, options);
		}

		// fallback for other formats
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		return date.toLocaleDateString(undefined, options);
	}

	function formatTime(timeString: string, timezone?: string) {
		// convert time string to a more readable format
		if (!timeString) return '';
		const [hours, minutes] = timeString.split(':').map(Number);
		const date = new Date();
		date.setHours(hours, minutes, 0, 0);
		const options: Intl.DateTimeFormatOptions = {
			hour: '2-digit',
			minute: '2-digit'
			// timeZoneName: timezone ? 'short' : undefined
		};
		return date.toLocaleTimeString(undefined, options);
	}

	function getDateClass(dateString: string, timeString?: string): string {
		if (isToday(dateString, timeString)) return 'today';
		if (isPast(dateString, timeString)) return 'past';
		return '';
	}

	function deleteItem(id: number) {
		if (!id) {
			console.error('No ID provided for deletion.');
			return;
		}

		if (offlineQueue.isOnline && z?.current) {
			z.current.mutate.events.delete({ id });
		} else {
			offlineQueue.enqueue({
				type: 'delete',
				table: 'events',
				data: { id }
			});
		}
	}

	let editingItemId = $state<string | null>(null);
	let editName = $state('');
	let editDate = $state('');
	let editTime = $state('');
	let editEndDate = $state('');
	let editEndTime = $state('');
	let editLocation = $state('');
	let editDescription = $state('');
	let editAllDay = $state(false);

	function startEdit(event: any) {
		editingItemId = event.id;
		editName = event.name;
		editDate = event.date || '';
		editTime = event.time || '';
		editEndDate = event.endDate || '';
		editEndTime = event.endTime || '';
		editLocation = event.location || '';
		editDescription = event.description || '';
		editAllDay = event.allDay || false;
	}

	function cancelEdit() {
		editingItemId = null;
		editName = '';
		editDate = '';
		editTime = '';
		editEndDate = '';
		editEndTime = '';
		editLocation = '';
		editDescription = '';
		editAllDay = false;
	}

	function saveEdit(id: string) {
		if (editName.trim()) {
			// Validate end time is after start time (for same day events)
			if (!editAllDay && editTime && editEndTime && (!editEndDate || editEndDate === editDate)) {
				const [startHour, startMin] = editTime.split(':').map(Number);
				const [endHour, endMin] = editEndTime.split(':').map(Number);
				const startMinutes = startHour * 60 + startMin;
				const endMinutes = endHour * 60 + endMin;

				if (endMinutes <= startMinutes) {
					alert('End time must be after start time');
					return;
				}
			}

			const updateData = {
				id,
				name: editName.trim(),
				date: editDate.trim(),
				time: editAllDay ? '' : editTime.trim(),
				endDate: editEndDate.trim() || undefined,
				endTime: editAllDay ? '' : editEndTime.trim() || undefined,
				location: editLocation.trim() || undefined,
				description: editDescription.trim() || undefined,
				allDay: editAllDay
			};

			if (offlineQueue.isOnline && z?.current) {
				z.current.mutate.events.update(updateData);
			} else {
				offlineQueue.enqueue({
					type: 'update',
					table: 'events',
					data: updateData
				});
			}
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

<div>
	{#if shortlist}
		{#if Array.isArray(sortedEvents)}
			<ul class="shortlist">
				{#each sortedEvents as event, i}
					{#if i < 3}
						<li class={getDateClass(event.date, event.time)}>
							<span class="event-name">{event.name}</span>
							<!-- {#if event.date}
								<span class="event-date">{formatDate(event.date)}</span>
								{#if event.time}
									<span class="event-time"> - {formatTime(event.time, event.timezone)}</span>
								{/if}
							{/if} -->
						</li>
					{/if}
				{/each}
				{#if numberOfItems > 3}
					<li>and {numberOfItems - 3} more...</li>
				{/if}
			</ul>
		{/if}
	{:else if Array.isArray(sortedEvents) && sortedEvents.length === 0}
		<p>No events found.</p>
	{:else if Array.isArray(sortedEvents)}
		<ul class="longList">
			{#each sortedEvents as event}
				<li
					class={editingItemId === event.id ? 'editing' : getDateClass(event.date, event.time)}
					class:pending={optimisticUpdates.hasPendingChanges(event.id)}
				>
					{#if editingItemId === event.id}
						<div class="edit-content">
							<input
								type="text"
								class="edit-input"
								bind:value={editName}
								placeholder="Event name"
								onkeydown={(e) => handleKeydown(e, event.id)}
								autofocus
							/>

							<label class="checkbox-label">
								<input type="checkbox" bind:checked={editAllDay} />
								All-day event
							</label>

							<div class="date-time-inputs">
								<input
									type="date"
									class="edit-input"
									bind:value={editDate}
									placeholder="Start date"
								/>
								{#if !editAllDay}
									<input
										type="time"
										class="edit-input"
										bind:value={editTime}
										placeholder="Start time"
									/>
								{/if}
							</div>

							<div class="date-time-inputs">
								<input
									type="date"
									class="edit-input"
									bind:value={editEndDate}
									placeholder="End date (optional)"
								/>
								{#if !editAllDay}
									<input
										type="time"
										class="edit-input"
										bind:value={editEndTime}
										placeholder="End time (optional)"
									/>
								{/if}
							</div>

							<input
								type="text"
								class="edit-input"
								bind:value={editLocation}
								placeholder="Location (optional)"
							/>

							<textarea
								class="edit-input"
								bind:value={editDescription}
								placeholder="Description (optional)"
								rows="2"
							></textarea>
						</div>
						<div class="edit-actions">
							<button class="save-btn" onclick={() => saveEdit(event.id)} title="Save">
								Save
							</button>
							<button class="cancel-btn" onclick={cancelEdit} title="Cancel"> Cancel </button>
						</div>
					{:else}
						<div class="event-info">
							<span class="event-name">{event.name}</span>

							{#if event.allDay}
								<span class="event-badge">All Day</span>
							{/if}

							<div class="event-datetime">
								{#if event.date}
									<span class="event-date">
										📅 {formatDate(event.date)}
										{#if !event.allDay && event.time}
											<span class="event-time">at {formatTime(event.time, event.timezone)}</span>
										{/if}
									</span>
								{/if}

								{#if event.endDate || event.endTime}
									<span class="event-end">
										→ {event.endDate ? formatDate(event.endDate) : ''}
										{#if !event.allDay && event.endTime}
											<span class="event-time">at {formatTime(event.endTime, event.timezone)}</span>
										{/if}
									</span>
								{/if}
							</div>

							{#if event.location}
								<span class="event-location">📍 {event.location}</span>
							{/if}

							{#if event.description}
								<span class="event-description">{event.description}</span>
							{/if}
						</div>

						<div class="item-actions">
							<button class="edit-btn" onclick={() => startEdit(event)} title="Edit"> Edit </button>
							<button class="delete-btn" onclick={() => deleteItem(event.id)} title="Delete">
								<DeleteIcon />
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p>Loading events...</p>
	{/if}
</div>

<style>
	button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		box-shadow: none;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.longList li {
		display: grid;
		grid-template-columns: 1fr auto;
		background: var(--level-2);
		box-shadow: var(--level-1);
		border-radius: 8px;
		border-left: 4px solid transparent;
		padding: 15px;
		margin-bottom: 15px;
		transition: all 0.2s ease;

		&.pending {
			opacity: 0.7;
			border-left: 4px solid #4dabf7;
		}

		&:hover {
			box-shadow: var(--level-3);
			transform: translateY(-1px);
		}

		&.editing {
			padding: 20px;
		}

		.event-info {
			grid-column: 1;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}

		.event-name {
			font-weight: 700;
			font-family: var(--headerFont);
			font-size: 1.25em;
			display: flex;
			align-items: center;
			gap: 10px;
			line-height: 1.3;
			color: var(--text-color, #222);
		}

		.event-badge {
			display: inline-block;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 4px 10px;
			border-radius: 14px;
			font-size: 0.65em;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}

		.event-datetime {
			display: flex;
			flex-direction: column;
			gap: 6px;
			font-size: 0.95em;
			padding: 8px 0;
		}

		.event-date {
			color: var(--text-color, #333);
			font-weight: 600;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.event-end {
			color: var(--text-color, #333);
			font-weight: 600;
			margin-left: 24px;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.event-time {
			color: var(--color-tertiary, #666);
			font-weight: 500;
			margin-left: 0;
		}

		.event-location {
			color: var(--text-color, #444);
			font-size: 0.9em;
			font-weight: 500;
			background: rgba(0, 123, 255, 0.08);
			padding: 6px 10px;
			border-radius: 6px;
			display: inline-block;
			align-self: flex-start;
		}

		.event-description {
			color: var(--text-color, #555);
			font-size: 0.9em;
			line-height: 1.5;
			padding: 10px;
			background: rgba(0, 0, 0, 0.03);
			border-radius: 6px;
			border-left: 3px solid rgba(0, 123, 255, 0.3);
		}

		.edit-content {
			grid-column: 1;
			display: flex;
			flex-direction: column;
			gap: 12px;

			.edit-input {
				padding: 8px;
				border: 1px solid #ccc;
				border-radius: 4px;
				font-size: 1rem;
				width: 100%;
				font-family: inherit;

				&:focus {
					outline: none;
					border-color: #007bff;
					box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
				}
			}

			textarea.edit-input {
				resize: vertical;
				min-height: 60px;
			}

			.checkbox-label {
				display: flex;
				align-items: center;
				gap: 8px;
				cursor: pointer;
				font-size: 0.95rem;

				input[type='checkbox'] {
					width: 18px;
					height: 18px;
					cursor: pointer;
				}
			}

			.date-time-inputs {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 10px;

				@media screen and (max-width: 690px) {
					grid-template-columns: 1fr;
				}
			}
		}

		.item-actions {
			grid-column: 2;
			grid-row: 1;
			justify-self: end;
			align-self: start;
			display: flex;
			gap: 8px;
			align-items: center;
		}

		.edit-actions {
			grid-column: 2;
			grid-row: 1;
			justify-self: end;
			align-self: start;
			display: flex;
			gap: 8px;
			align-items: flex-start;
		}

		.edit-btn {
			background: #007bff;
			color: white;
			border: none;
			padding: 8px 14px;
			border-radius: 6px;
			cursor: pointer;
			font-size: 0.875rem;
			font-weight: 600;
			transition: all 0.2s ease;
			white-space: nowrap;
			box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);

			&:hover {
				background: #0056b3;
				transform: translateY(-1px);
				box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
			}

			&:active {
				transform: translateY(0);
			}
		}

		.save-btn {
			background: #28a745;
			color: white;
			border: none;
			padding: 8px 14px;
			border-radius: 6px;
			cursor: pointer;
			font-size: 0.875rem;
			font-weight: 600;
			transition: all 0.2s ease;
			white-space: nowrap;
			box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);

			&:hover {
				background: #218838;
				transform: translateY(-1px);
				box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
			}

			&:active {
				transform: translateY(0);
			}
		}

		.cancel-btn {
			background: #6c757d;
			color: white;
			border: none;
			padding: 8px 14px;
			border-radius: 6px;
			cursor: pointer;
			font-size: 0.875rem;
			font-weight: 600;
			transition: all 0.2s ease;
			white-space: nowrap;
			box-shadow: 0 2px 4px rgba(108, 117, 125, 0.2);

			&:hover {
				background: #5a6268;
				transform: translateY(-1px);
				box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
			}

			&:active {
				transform: translateY(0);
			}
		}

		.delete-btn {
			background: #dc3545;
			color: white;
			border: none;
			padding: 8px;
			border-radius: 6px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			min-width: 36px;
			height: 36px;
			box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);

			&:hover {
				background: #c82333;
				transform: translateY(-1px);
				box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
			}

			&:active {
				transform: translateY(0);
			}
		}

		button {
			grid-column: 2;
			justify-self: end;
			grid-row: 1;
			&:hover {
				box-shadow: none;
			}
		}
	}
	ul.shortlist {
		list-style: circle;
		padding-left: 20px;
		margin: 0;
	}
	.shortlist {
		border-bottom: 1px solid var(--text-color);
		.event-name {
			font-weight: 800;
			font-family: var(--headerFont);
			font-size: 1.1em;
			margin-right: 10px;
		}
		.today {
			color: var(--color-primary, #007acc);
		}
		.past {
			color: var(--color-tertiary, #dc3545);
		}
	}
	.longList {
		.today {
			background-color: var(--level-2);
			border-left: 4px solid var(--color-primary, #007acc);
			box-shadow: 0 0 0 1px var(--color-primary, #007acc);

			.event-name {
				color: var(--color-primary, #007acc);
			}

			&::before {
				content: '● ';
				color: var(--color-primary, #007acc);
				font-size: 1.2em;
				margin-right: 5px;
			}
		}

		.past {
			background-color: var(--level-2);
			opacity: 0.7;
			border-left: 4px solid #dc3545;

			.event-name {
				color: #dc3545;
				text-decoration: line-through;
			}
		}

		.editing {
			border-left: 4px solid #28a745;
			background-color: var(--level-2);
		}
	}
</style>
