<script lang="ts">
	import { Query } from 'zero-svelte';

	let { data } = $props();
	let z = data.z;
	const groupId = data.groupId;

	// Time range options in hours
	const timeRanges = [
		{ label: '2 Hours', hours: 2 },
		{ label: '6 Hours', hours: 6 },
		{ label: '12 Hours', hours: 12 },
		{ label: '24 Hours', hours: 24 }
	];

	let selectedRange = $state(12); // Default to 12 hours
	let currentDate = $state(new Date());
	let currentTime = $state(new Date());

	// Update current time every minute
	$effect(() => {
		const interval = setInterval(() => {
			currentTime = new Date();
		}, 60000); // Update every minute

		return () => clearInterval(interval);
	});

	// Query all events for today
	const events = z ? new Query(
		z.current.query.events.where('assignedToId', groupId).orderBy('createdAt', 'asc')
	) : null;

	// Filter events for today and calculate their position
	let todaysEvents = $derived(() => {
		if (!Array.isArray(events?.current)) return [];

		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];

		return events.current
			.filter((event) => {
				// Check if event is today
				return event.date === todayStr;
			})
			.map((event) => {
				// Calculate position and duration
				const startTime = event.time || '00:00';
				const endTime = event.endTime || null;
				const [startHour, startMin] = startTime.split(':').map(Number);
				
				let duration = 60; // Default 1 hour
				if (endTime) {
					const [endHour, endMin] = endTime.split(':').map(Number);
					duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
				}

				return {
					...event,
					startHour,
					startMin,
					duration,
					topPosition: ((startHour + startMin / 60) / selectedRange) * 100
				};
			})
			.filter((event) => {
				// Only show events within the selected time range
				const now = currentTime;
				const currentHour = now.getHours();
				const eventHour = event.startHour;
				
				// For ranges less than 24 hours, show events within range of current time
				if (selectedRange < 24) {
					return eventHour >= currentHour && eventHour < (currentHour + selectedRange);
				}
				return true; // Show all events for 24 hour view
			});
	});

	// Generate time slots for the timeline
	let timeSlots = $derived(() => {
		const slots = [];
		const now = new Date();
		const startHour = selectedRange < 24 ? now.getHours() : 0;
		
		for (let i = 0; i < selectedRange; i++) {
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
		const currentHour = now.getHours();
		const currentMin = now.getMinutes();
		
		if (selectedRange < 24) {
			const startHour = now.getHours();
			const relativePosition = (currentMin / 60) / selectedRange;
			return relativePosition * 100;
		} else {
			return ((currentHour + currentMin / 60) / 24) * 100;
		}
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
					onclick={() => (selectedRange = range.hours)}
				>
					{range.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="timeline-container">
		<div class="time-labels">
			{#each timeSlots() as slot}
				<div class="time-label">
					{slot.display}
				</div>
			{/each}
		</div>

		<div class="timeline">
			<!-- Time grid lines -->
			{#each timeSlots() as slot, index}
				<div class="time-slot" style="top: {(index / selectedRange) * 100}%">
					<div class="grid-line"></div>
				</div>
			{/each}

			<!-- Current time indicator -->
			<div class="current-time-indicator" style="top: {currentTimePosition()}%">
				<div class="time-line"></div>
				<div class="time-dot"></div>
			</div>

			<!-- Events -->
			<div class="events-track">
				{#each todaysEvents() as event (event.id)}
					<div
						class="timeline-event"
						class:all-day={event.allDay}
						style="top: {event.topPosition}%; height: {(event.duration / 60) * (100 / selectedRange)}%"
					>
						<div class="event-time">{formatTime(event.time)}</div>
						<div class="event-name">{event.name}</div>
						{#if event.location}
							<div class="event-location">📍 {event.location}</div>
						{/if}
					</div>
				{/each}

				{#if todaysEvents().length === 0}
					<div class="no-events">
						<p>No events scheduled for this time range</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

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
	}

	.time-slot {
		position: absolute;
		left: 0;
		right: 0;
		height: 0;
	}

	.grid-line {
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		width: 100%;
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
		position: relative;
		min-height: 100%;
		padding-left: 20px;
	}

	.timeline-event {
		position: absolute;
		left: 20px;
		right: 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 8px;
		padding: 12px;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		min-height: 60px;
		overflow: hidden;

		&:hover {
			transform: translateX(5px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		}

		&.all-day {
			background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		}
	}

	.event-time {
		font-size: 0.75rem;
		font-weight: 700;
		opacity: 0.9;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.event-name {
		font-size: 1rem;
		font-weight: 700;
		margin-top: 4px;
		line-height: 1.3;
	}

	.event-location {
		font-size: 0.875rem;
		margin-top: 4px;
		opacity: 0.9;
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
		.timeline-container {
			grid-template-columns: 80px 1fr;
		}

		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		.range-selector {
			width: 100%;
		}

		.range-btn {
			flex: 1;
			min-width: 0;
		}
	}
</style>
