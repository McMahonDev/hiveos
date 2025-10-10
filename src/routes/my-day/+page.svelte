<script lang="ts">
	import { Query } from 'zero-svelte';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();
	let z = data.z;
	const groupId = data.groupId;

	// Time range options in hours
	const timeRanges = [
		{ label: '2 Hours', hours: 2 },
		{ label: '6 Hours', hours: 6 },
		{ label: '12 Hours', hours: 12 },
		{ label: '24 Hours', hours: 24 },
		{ label: 'Custom', hours: 0 } // 0 indicates custom
	];

	let selectedRange = $state(12); // Default to 12 hours
	let customHours = $state(4); // Default custom value
	let showCustomInput = $state(false);
	let currentDate = $state(new Date());
	let currentTime = $state(new Date());
	let selectedEvent = $state<any>(null);
	let showModal = $state(false);
	let isEditMode = $state(false);
	let editForm = $state<any>({});
	let showCreateModal = $state(false);
	let createForm = $state<any>({});

	// Get the actual hours to use (either selected or custom)
	let activeHours = $derived(selectedRange === 0 ? customHours : selectedRange);

	// Update current time every minute
	$effect(() => {
		const interval = setInterval(() => {
			currentTime = new Date();
		}, 60000); // Update every minute

		return () => clearInterval(interval);
	});

	// Query all events for today
	let events = $state<Query<any, any, any> | null>(null);

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
		} else {
			events = null;
		}
	});

	// Filter all-day events for today
	let allDayEvents = $derived(() => {
		if (!Array.isArray(events?.current)) return [];

		// Get today's date in local timezone (YYYY-MM-DD format)
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		const todayStr = `${year}-${month}-${day}`;

		return events.current.filter((event) => {
			return event.date === todayStr && event.allDay;
		});
	});

	// Filter timed events for today and calculate their position
	let todaysEvents = $derived(() => {
		if (!Array.isArray(events?.current)) return [];

		// Get today's date in local timezone (YYYY-MM-DD format)
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		const todayStr = `${year}-${month}-${day}`;

		const now = currentTime;
		const currentHour = now.getHours();
		const currentMin = now.getMinutes();
		const hours = activeHours;
		const startHour = hours < 24 ? currentHour : 0;
		const endHour = hours < 24 ? currentHour + hours : 24;

		return events.current
			.filter((event) => {
				// Check if event is today and NOT all-day
				return event.date === todayStr && !event.allDay;
			})
			.map((event) => {
				// Calculate position and duration
				const startTime = event.time || '00:00';
				const [startHour, startMin] = startTime.split(':').map(Number);

				// Default end time to 1 hour after start if not set
				let endTime = event.endTime;
				if (!endTime) {
					const defaultEndHour = Math.floor((startHour * 60 + startMin + 60) / 60) % 24;
					const defaultEndMin = (startMin + 60) % 60;
					endTime = `${String(defaultEndHour).padStart(2, '0')}:${String(defaultEndMin).padStart(2, '0')}`;
				}

				let duration = 60; // Default 1 hour
				if (endTime) {
					const [endHour, endMin] = endTime.split(':').map(Number);
					duration = endHour * 60 + endMin - (startHour * 60 + startMin);
				}

				// Calculate top position relative to the visible time range
				// Timeline always starts at the beginning of the current hour
				const timelineStartHour = currentHour; // e.g., 12 for 12:xx PM
				const eventTimeInHours = startHour + startMin / 60; // e.g., 16.0 for 4:00 PM
				const hoursFromStart = eventTimeInHours - timelineStartHour;
				const topPosition = (hoursFromStart / hours) * 100;

				return {
					...event,
					endTime, // Include calculated/default end time
					startHour,
					startMin,
					duration,
					topPosition
				};
			})
			.filter((event) => {
				// Show events if any part of the event is visible in the time range
				const eventStartMinutes = event.startHour * 60 + event.startMin;
				const eventEndMinutes = eventStartMinutes + event.duration;
				const hours = activeHours;

				// Timeline starts at the current hour (not minute)
				const timelineStartMinutes = currentHour * 60;
				const timelineEndMinutes = timelineStartMinutes + hours * 60;

				// Show event if it starts before timeline ends AND ends after timeline starts
				// This means any overlap with the visible range will show the event
				return eventStartMinutes < timelineEndMinutes && eventEndMinutes > timelineStartMinutes;
			});
	});

	// Calculate columns for overlapping events
	let eventsWithColumns = $derived(() => {
		const eventsArray = todaysEvents();
		if (eventsArray.length === 0) return [];

		// Sort by start time
		const sorted = [...eventsArray].sort((a, b) => {
			const aStart = a.startHour * 60 + a.startMin;
			const bStart = b.startHour * 60 + b.startMin;
			return aStart - bStart;
		});

		// Detect overlaps and assign columns
		const columns: any[][] = [];

		sorted.forEach((event) => {
			const eventStart = event.startHour * 60 + event.startMin;
			const eventEnd = eventStart + event.duration;

			// Find a column where this event doesn't overlap
			let placed = false;
			for (let i = 0; i < columns.length; i++) {
				const column = columns[i];
				const hasOverlap = column.some((e) => {
					const eStart = e.startHour * 60 + e.startMin;
					const eEnd = eStart + e.duration;
					return eventStart < eEnd && eventEnd > eStart;
				});

				if (!hasOverlap) {
					column.push(event);
					event.column = i;
					placed = true;
					break;
				}
			}

			// If no suitable column, create a new one
			if (!placed) {
				event.column = columns.length;
				columns.push([event]);
			}
		});

		// Set total columns for width calculation
		const totalColumns = columns.length;
		return sorted.map((event) => ({
			...event,
			totalColumns
		}));
	});

	// Generate time slots for the timeline
	let timeSlots = $derived(() => {
		const slots = [];
		const now = currentTime;
		const hours = activeHours;
		// Always start from current hour, even for 24-hour view
		const startHour = now.getHours();

		// Start from current hour and wrap around for 24-hour view
		for (let i = 0; i < hours; i++) {
			const hour = (startHour + i) % 24;
			const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
			const ampm = hour >= 12 ? 'PM' : 'AM';

			slots.push({
				hour,
				display: `${displayHour}:00 ${ampm}`
			});
		}

		return slots;
	});

	// Calculate current time indicator position
	let currentTimePosition = $derived(() => {
		const now = currentTime;
		const currentMin = now.getMinutes();
		const hours = activeHours;

		// Current time is always at the top (within first hour)
		// Show position based on minutes within the first hour of the timeline
		const relativePosition = currentMin / 60 / hours;
		return relativePosition * 100;
	});

	function formatTime(timeString: string) {
		if (!timeString) return '';
		const [hours, minutes] = timeString.split(':').map(Number);
		const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		const ampm = hours >= 12 ? 'PM' : 'AM';
		return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
	}

	function getTodayString() {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		return currentDate.toLocaleDateString(undefined, options);
	}

	function openEventModal(event: any) {
		selectedEvent = event;
		showModal = true;
		isEditMode = false;
		editForm = { ...event };
	}

	function closeModal() {
		showModal = false;
		selectedEvent = null;
		isEditMode = false;
	}

	function startEdit() {
		isEditMode = true;
		editForm = { ...selectedEvent };
	}

	function cancelEdit() {
		isEditMode = false;
		editForm = { ...selectedEvent };
	}

	async function saveEdit() {
		if (!z?.current || !editForm.id) return;

		// Validate end time is after start time
		if (!editForm.allDay && editForm.time && editForm.endTime) {
			const [startHour, startMin] = editForm.time.split(':').map(Number);
			const [endHour, endMin] = editForm.endTime.split(':').map(Number);
			const startMinutes = startHour * 60 + startMin;
			const endMinutes = endHour * 60 + endMin;

			if (endMinutes <= startMinutes) {
				alert('End time must be after start time');
				return;
			}
		}

		try {
			await z.current.mutate.events.update({
				id: editForm.id,
				name: editForm.name,
				date: editForm.date,
				time: editForm.allDay ? '' : editForm.time || null,
				endTime: editForm.allDay ? null : editForm.endTime || null,
				location: editForm.location || null,
				description: editForm.description || null,
				allDay: editForm.allDay
			});

			selectedEvent = editForm;
			isEditMode = false;
		} catch (error) {
			console.error('Failed to update event:', error);
		}
	}

	function openCreateModal(hour: number) {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		const dateStr = `${year}-${month}-${day}`;
		const timeStr = `${String(hour).padStart(2, '0')}:00`;

		createForm = {
			name: '',
			date: dateStr,
			time: timeStr,
			endTime: '',
			location: '',
			description: '',
			allDay: false
		};

		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
		createForm = {};
	}

	async function saveNewEvent() {
		if (!z?.current || !createForm.name || !data.id) return;

		// Validate end time is after start time
		if (!createForm.allDay && createForm.time && createForm.endTime) {
			const [startHour, startMin] = createForm.time.split(':').map(Number);
			const [endHour, endMin] = createForm.endTime.split(':').map(Number);
			const startMinutes = startHour * 60 + startMin;
			const endMinutes = endHour * 60 + endMin;

			if (endMinutes <= startMinutes) {
				alert('End time must be after start time');
				return;
			}
		}

		try {
			const { nanoid } = await import('nanoid');
			const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

			// In personal mode, assign to user's own ID
			// In shared mode, assign to groupId
			const assignedTo = viewModeState.currentMode === 'personal' ? data.id : groupId;

			await z.current.mutate.events.insert({
				id: nanoid(),
				name: createForm.name,
				date: createForm.date,
				time: createForm.allDay ? '' : createForm.time || '',
				endDate: createForm.endDate || null,
				endTime: createForm.allDay ? null : createForm.endTime || null,
				timezone: timezone,
				location: createForm.location || null,
				description: createForm.description || null,
				allDay: createForm.allDay,
				createdById: data.id,
				assignedToId: assignedTo,
				createdAt: Date.now(),
				viewMode: viewModeState.currentMode
			});

			closeCreateModal();
		} catch (error) {
			console.error('Failed to create event:', error);
		}
	}

	function formatDate(dateString: string) {
		if (!dateString) return '';
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function getDuration(startTime: string, endTime: string) {
		if (!startTime || !endTime) return '';
		const [startHour, startMin] = startTime.split(':').map(Number);
		const [endHour, endMin] = endTime.split(':').map(Number);
		const durationMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);

		if (durationMinutes < 60) {
			return `${durationMinutes} min`;
		}
		const hours = Math.floor(durationMinutes / 60);
		const mins = durationMinutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
</script>

<section class="my-day">
	<div class="header">
		<div class="title-section">
			<h1>My Day</h1>
			<p class="date">{getTodayString()}</p>
		</div>

		<div class="range-selector">
			{#each timeRanges as range}
				<button
					class="range-btn"
					class:active={selectedRange === range.hours}
					onclick={() => {
						selectedRange = range.hours;
						if (range.hours === 0) {
							showCustomInput = true;
						} else {
							showCustomInput = false;
						}
					}}
				>
					{range.label}
				</button>
			{/each}

			{#if showCustomInput}
				<div class="custom-input-wrapper">
					<input
						type="number"
						class="custom-input"
						bind:value={customHours}
						min="1"
						max="24"
						placeholder="Hours"
					/>
					<span class="custom-label">hours</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- All-Day Events Section -->
	{#if allDayEvents().length > 0}
		<div class="all-day-section">
			<h3 class="all-day-header">All Day</h3>
			<div class="all-day-events">
				{#each allDayEvents() as event (event.id)}
					<button class="all-day-event-card" onclick={() => openEventModal(event)} type="button">
						<div class="all-day-event-name">{event.name}</div>
						{#if event.location}
							<div class="all-day-event-location">📍 {event.location}</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="timeline-container">
		<div class="time-labels">
			{#each timeSlots() as slot}
				<div class="time-label">
					{slot.display}
				</div>
			{/each}
		</div>

		<div class="timeline">
			<!-- Grid lines (visual only) -->
			{#each timeSlots() as slot, index}
				<div class="grid-line" style="top: {(index / activeHours) * 100}%"></div>
			{/each}

			<!-- Clickable time slots (between lines) -->
			{#each timeSlots() as slot, index}
				<button
					class="time-slot"
					style="top: {(index / activeHours) * 100}%; height: {(1 / activeHours) * 100}%"
					onclick={() => openCreateModal(slot.hour)}
					type="button"
					aria-label="Create event at {slot.display}"
				>
				</button>
			{/each}

			<!-- Current time indicator -->
			<div class="current-time-indicator" style="top: {currentTimePosition()}%">
				<div class="time-line"></div>
				<div class="time-dot"></div>
			</div>

			<!-- Events -->
			<div class="events-track">
				{#each eventsWithColumns() as event (event.id)}
					{@const eventHeightPercent = (event.duration / 60) * (100 / activeHours)}
					{@const isCompact = event.duration < 45 || eventHeightPercent < 5}
					{@const columnWidth = 100 / event.totalColumns}
					{@const leftOffset = event.column * columnWidth}
					<button
						class="timeline-event"
						class:all-day={event.allDay}
						class:compact={isCompact}
						class:has-overlap={event.totalColumns > 1}
						style="top: {event.topPosition}%; height: {eventHeightPercent}%; left: {leftOffset}%; width: {columnWidth}%"
						onclick={() => openEventModal(event)}
						type="button"
					>
						{#if isCompact}
							<div class="event-inline">
								<span class="event-time">{formatTime(event.time)}</span>
								<span class="event-name">{event.name}</span>
							</div>
						{:else}
							<div class="event-time">{formatTime(event.time)}</div>
							<div class="event-name">{event.name}</div>
							{#if event.location}
								<div class="event-location">{event.location}</div>
							{/if}
						{/if}
					</button>
				{/each}

				{#if eventsWithColumns().length === 0}
					<div class="no-events">
						<p>No events scheduled for this time range</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<!-- Event Details Modal -->
{#if showModal && selectedEvent}
	<div
		class="modal-overlay"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="-1"
		aria-label="Close modal"
	>
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="0"
		>
			<div class="modal-header">
				<h2 id="modal-title">{isEditMode ? 'Edit Event' : selectedEvent.name}</h2>
				<div class="header-actions">
					{#if isEditMode}
						<button class="btn btn-primary btn-save" onclick={saveEdit} type="button">
							Save Changes
						</button>
					{:else}
						<button class="edit-btn" onclick={startEdit} type="button" aria-label="Edit event">
							✏️
						</button>
					{/if}
					<button class="close-btn" onclick={closeModal} type="button" aria-label="Close modal">
						×
					</button>
				</div>
			</div>

			<div class="modal-body">
				{#if isEditMode}
					<!-- Edit Mode -->
					<div class="form-group">
						<label for="edit-name">Event Name:</label>
						<input
							id="edit-name"
							type="text"
							bind:value={editForm.name}
							class="form-input"
							required
						/>
					</div>

					<div class="form-group">
						<label for="edit-date">Date:</label>
						<input
							id="edit-date"
							type="date"
							bind:value={editForm.date}
							class="form-input"
							required
						/>
					</div>

					<div class="form-group">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={editForm.allDay} />
							All Day Event
						</label>
					</div>

					{#if !editForm.allDay}
						<div class="form-row">
							<div class="form-group">
								<label for="edit-time">Start Time:</label>
								<input id="edit-time" type="time" bind:value={editForm.time} class="form-input" />
							</div>

							<div class="form-group">
								<label for="edit-endtime">End Time:</label>
								<input
									id="edit-endtime"
									type="time"
									bind:value={editForm.endTime}
									class="form-input"
								/>
							</div>
						</div>
					{/if}

					<div class="form-group">
						<label for="edit-location">Location:</label>
						<input
							id="edit-location"
							type="text"
							bind:value={editForm.location}
							class="form-input"
						/>
					</div>

					<div class="form-group">
						<label for="edit-description">Description:</label>
						<textarea
							id="edit-description"
							bind:value={editForm.description}
							class="form-input"
							rows="3"
						></textarea>
					</div>
				{:else}
					<!-- View Mode -->
					<div class="detail-row">
						<span class="detail-label">Date:</span>
						<span class="detail-value">{formatDate(selectedEvent.date)}</span>
					</div>

					{#if selectedEvent.allDay}
						<div class="detail-row">
							<span class="detail-label">Time:</span>
							<span class="detail-value all-day-badge">All Day</span>
						</div>
					{:else if selectedEvent.time}
						<div class="detail-row">
							<span class="detail-label">Time:</span>
							<span class="detail-value">
								{formatTime(selectedEvent.time)}
								{#if selectedEvent.endTime}
									→ {formatTime(selectedEvent.endTime)}
								{/if}
							</span>
						</div>
					{/if}

					{#if selectedEvent.location}
						<div class="detail-row">
							<span class="detail-label">Location:</span>
							<span class="detail-value">{selectedEvent.location}</span>
						</div>
					{/if}

					{#if selectedEvent.description}
						<div class="detail-row description">
							<span class="detail-label">Description:</span>
							<p class="detail-value">{selectedEvent.description}</p>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Create Event Modal -->
{#if showCreateModal}
	<div
		class="modal-overlay"
		onclick={closeCreateModal}
		onkeydown={(e) => e.key === 'Escape' && closeCreateModal()}
		role="button"
		tabindex="-1"
		aria-label="Close modal"
	>
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-modal-title"
			tabindex="0"
		>
			<div class="modal-header">
				<h2 id="create-modal-title">Create Event</h2>
				<button class="close-btn" onclick={closeCreateModal} type="button" aria-label="Close modal">
					×
				</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label for="create-name">Event Name:</label>
					<input
						id="create-name"
						type="text"
						bind:value={createForm.name}
						class="form-input"
						placeholder="Event name"
						required
					/>
				</div>

				<div class="form-group">
					<label for="create-date">Date:</label>
					<input
						id="create-date"
						type="date"
						bind:value={createForm.date}
						class="form-input"
						required
					/>
				</div>

				<div class="form-group">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={createForm.allDay} />
						All Day Event
					</label>
				</div>

				{#if !createForm.allDay}
					<div class="form-row">
						<div class="form-group">
							<label for="create-time">Start Time:</label>
							<input id="create-time" type="time" bind:value={createForm.time} class="form-input" />
						</div>

						<div class="form-group">
							<label for="create-endtime">End Time:</label>
							<input
								id="create-endtime"
								type="time"
								bind:value={createForm.endTime}
								class="form-input"
							/>
						</div>
					</div>
				{/if}

				<div class="form-group">
					<label for="create-location">Location:</label>
					<input
						id="create-location"
						type="text"
						bind:value={createForm.location}
						class="form-input"
						placeholder="Optional"
					/>
				</div>

				<div class="form-group">
					<label for="create-description">Description:</label>
					<textarea
						id="create-description"
						bind:value={createForm.description}
						class="form-input"
						rows="3"
						placeholder="Optional"
					></textarea>
				</div>

				<div class="modal-actions">
					<button class="btn btn-secondary" onclick={closeCreateModal} type="button">
						Cancel
					</button>
					<button class="btn btn-primary" onclick={saveNewEvent} type="button">
						Create Event
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.my-day {
		display: flex;
		flex-direction: column;
		gap: 20px;
		height: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 20px;
		padding-bottom: 20px;
		border-bottom: 2px solid var(--level-1);
	}

	.title-section {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-color, #222);
	}

	.date {
		margin: 0;
		font-size: 1rem;
		color: var(--color-secondary, #666);
		font-weight: 500;
	}

	.range-selector {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		align-items: center;
	}

	.range-btn {
		padding: 8px 16px;
		border: 2px solid var(--level-1);
		background: var(--level-2);
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s ease;
		color: var(--text-color, #444);

		&:hover {
			background: var(--level-1);
			transform: translateY(-1px);
		}

		&.active {
			background: #007bff;
			color: white;
			border-color: #007bff;
			box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
		}
	}

	.custom-input-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: var(--level-2);
		border: 2px solid #007bff;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
	}

	.custom-input {
		width: 60px;
		padding: 6px 8px;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		text-align: center;
		background: white;

		&:focus {
			outline: none;
			border-color: #007bff;
			box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
		}
	}

	.custom-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-color, #444);
	}

	/* All-Day Events Section */
	.all-day-section {
		background: var(--level-2);
		border-radius: 12px;
		padding: 16px 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		margin-bottom: 20px;
	}

	.all-day-header {
		margin: 0 0 12px 0;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-secondary, #666);
	}

	.all-day-events {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.all-day-event-card {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		border: none;
		border-radius: 8px;
		padding: 12px 16px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
		width: 100%;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}

		&:focus {
			outline: 2px solid #f5576c;
			outline-offset: 2px;
		}
	}

	.all-day-event-name {
		font-size: 0.95rem;
		font-weight: 700;
		color: white;
		margin-bottom: 4px;
	}

	.all-day-event-location {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.9);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.timeline-container {
		display: grid;
		grid-template-columns: 100px 1fr;
		gap: 10px;
		position: relative;
		min-height: 600px;
		background: var(--level-2);
		border-radius: 12px;
		padding: 20px;
		box-shadow: var(--level-1);
	}

	.time-labels {
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.time-label {
		flex: 1;
		display: flex;
		align-items: flex-start;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-secondary, #666);
		padding-top: 5px;
	}

	.timeline {
		position: relative;
		flex: 1;
		border-left: 3px solid var(--level-1);
		min-height: 600px;
		/* overflow: hidden; */
	}

	.grid-line {
		position: absolute;
		left: 0;
		right: 0;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		width: 100%;
		pointer-events: none;
		z-index: 0;
	}

	.time-slot {
		position: absolute;
		left: 0;
		right: 0;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: background-color 0.2s ease;
		width: 100%;
		z-index: 1;

		&:hover {
			background-color: rgba(0, 123, 255, 0.05);
		}

		&:focus {
			outline: 2px solid rgba(0, 123, 255, 0.3);
			outline-offset: -2px;
			z-index: 2;
		}
	}

	.current-time-indicator {
		position: absolute;
		left: -3px;
		right: 0;
		height: 0;
		z-index: 10;
	}

	.time-line {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: #dc3545;
		box-shadow: 0 0 8px rgba(220, 53, 69, 0.5);
	}

	.time-dot {
		position: absolute;
		left: -6px;
		top: -6px;
		width: 12px;
		height: 12px;
		background: #dc3545;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 0 8px rgba(220, 53, 69, 0.5);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
	}

	.events-track {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		padding-left: 20px;
		pointer-events: none;
		z-index: 5;
		overflow: hidden;
	}

	.timeline-event {
		position: absolute;
		pointer-events: auto;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 8px;
		padding: 8px 12px;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 36px;
		border: none;
		text-align: left;
		overflow: hidden;

		&:hover {
			transform: translateX(5px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			z-index: 10;
		}

		&:focus {
			outline: 2px solid white;
			outline-offset: 2px;
		}

		&.all-day {
			background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		}

		&.compact {
			padding: 4px 10px;
			min-height: 28px;
		}

		&.has-overlap {
			border: 2px solid rgba(255, 255, 255, 0.3);
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);

			&:hover {
				border-color: rgba(255, 255, 255, 0.6);
				transform: translateX(2px) scale(1.02);
			}
		}
	}

	.event-inline {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: nowrap;
		overflow: hidden;
		width: 100%;
		min-width: 0;
	}

	.event-time {
		font-size: 0.65rem;
		font-weight: 700;
		opacity: 0.95;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		flex-shrink: 0;
		line-height: 1;
		white-space: nowrap;
	}

	.event-name {
		font-size: 0.9rem;
		font-weight: 700;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		word-break: break-word;

		.event-inline & {
			margin: 0;
			white-space: nowrap;
			flex: 1;
			min-width: 0;
			display: block;
			-webkit-line-clamp: unset;
			line-clamp: unset;
			font-size: 0.85rem;
			line-height: 1.1;
		}

		.timeline-event:not(.compact) & {
			margin-top: 2px;
		}
	}

	.event-location {
		font-size: 0.875rem;
		margin-top: 4px;
		opacity: 0.9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.no-events {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: var(--color-secondary, #999);
		font-style: italic;
	}

	@media screen and (max-width: 768px) {
		.all-day-section {
			padding: 12px 16px;
		}

		.all-day-header {
			font-size: 0.8rem;
			margin-bottom: 10px;
		}

		.all-day-event-card {
			padding: 10px 14px;
		}

		.all-day-event-name {
			font-size: 0.875rem;
		}

		.all-day-event-location {
			font-size: 0.8rem;
		}

		.timeline-container {
			grid-template-columns: 70px 1fr;
			padding: 15px;
		}

		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		h1 {
			font-size: 1.75rem;
		}

		.range-selector {
			width: 100%;
		}

		.range-btn {
			flex: 1;
			min-width: 0;
			padding: 8px 12px;
			font-size: 0.875rem;
			white-space: nowrap;
		}

		.custom-input-wrapper {
			padding: 6px 10px;
			width: 100%;
			justify-content: center;
		}

		.timeline-event {
			left: 10px;
			right: 10px;
			padding: 8px 10px;
			font-size: 0.875rem;
		}

		.event-name {
			font-size: 0.875rem;
		}

		.event-time {
			font-size: 0.7rem;
		}

		.event-location {
			font-size: 0.75rem;
		}

		.time-label {
			font-size: 0.75rem;
		}

		.events-track {
			padding-left: 10px;
		}
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideIn 0.2s ease-out;
		border: 2px solid var(--level-1);
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 24px;
		border-bottom: 2px solid #e8e8e8;
		gap: 16px;
		background: white;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 800;
		color: #222;
		flex: 1;
	}

	.header-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.btn-save {
		padding: 8px 16px;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.edit-btn {
		background: transparent;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover {
			background: #f5f5f5;
		}
	}

	.close-btn {
		background: transparent;
		border: none;
		font-size: 2rem;
		line-height: 1;
		cursor: pointer;
		color: #666;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: all 0.2s ease;
		flex-shrink: 0;

		&:hover {
			background: #f5f5f5;
			color: #222;
		}
	}

	.modal-body {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		background: white;
	}

	.detail-row {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px;
		background: #f9f9f9;
		border-radius: 8px;
		border-left: 3px solid #007bff;

		&.description {
			flex-direction: column;
			gap: 8px;
		}
	}

	.detail-label {
		font-weight: 700;
		color: #222;
		min-width: 100px;
		font-size: 0.95rem;
	}

	.detail-value {
		flex: 1;
		color: #555;
		font-size: 0.95rem;
		line-height: 1.5;

		&.all-day-badge {
			display: inline-block;
			padding: 4px 12px;
			background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
			color: white;
			border-radius: 20px;
			font-size: 0.85rem;
			font-weight: 600;
		}
	}

	.detail-row.description .detail-value {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	/* Form Styles */
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.form-group label {
		font-weight: 600;
		color: #222;
		font-size: 0.95rem;
	}

	.form-input {
		padding: 10px 12px;
		border: 2px solid #e8e8e8;
		border-radius: 8px;
		font-size: 0.95rem;
		font-family: inherit;
		transition: border-color 0.2s ease;
		background: white;

		&:focus {
			outline: none;
			border-color: #007bff;
			box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
		}
	}

	textarea.form-input {
		resize: vertical;
		min-height: 80px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-weight: 500;

		input[type='checkbox'] {
			width: 18px;
			height: 18px;
			cursor: pointer;
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

	.btn {
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

	.btn-primary {
		background: #007bff;
		color: white;

		&:hover {
			background: #0056b3;
		}
	}

	.btn-secondary {
		background: #e8e8e8;
		color: #222;

		&:hover {
			background: #d4d4d4;
		}
	}

	@media screen and (max-width: 768px) {
		.modal-content {
			max-width: 100%;
			margin: 0;
		}

		.modal-header {
			padding: 20px;
		}

		.modal-header h2 {
			font-size: 1.25rem;
		}

		.modal-body {
			padding: 20px;
		}

		.detail-label {
			min-width: 100px;
			font-size: 0.875rem;
		}

		.detail-value {
			font-size: 0.875rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.form-input {
			font-size: 0.9rem;
		}

		.modal-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}
	}
</style>
