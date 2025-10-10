<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import EventsList from '$lib/components/eventsList.svelte';
	import AddIcon from '$lib/static/icons/addIcon.svelte';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';

	let { data } = $props();
	let z = data.z;

	let modal = $state(false);

	// const events = z ? new Query(z?.current.query.events.where('assignedToId', data.id)) : null;
	const group = z ? new Query(z?.current.query.userGroups.where('id', data.groupId)) : null;
	let groupid = $derived((group && group.current[0]?.id) ?? data.groupId);

	$inspect(groupid);

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		let date = formData.get('date') as string;
		let time = formData.get('time') as string;
		let endDate = formData.get('endDate') as string;
		let endTime = formData.get('endTime') as string;
		let location = formData.get('location') as string;
		let description = formData.get('description') as string;
		let allDay = formData.get('allDay') === 'on';

		z?.current.mutate.events.insert({
			id: nanoid(),
			name,
			date,
			time: allDay ? '' : time,
			endDate: endDate || undefined,
			endTime: allDay ? '' : endTime,
			timezone: getTimeZoneAbbreviation(),
			location: location || undefined,
			description: description || undefined,
			allDay: allDay || undefined,
			createdById: data.id,
			assignedToId: assignedToId(),
			createdAt: Date.now()
		});

		(event.target as HTMLFormElement).reset();
	}

	function getTimeZoneAbbreviation(): string {
		const date = new Date();
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZoneName: 'short'
		});
		const parts = formatter.formatToParts(date);
		const tzPart = parts.find((part) => part.type === 'timeZoneName');
		return tzPart?.value ?? 'UTC'; // fallback just in case
	}

	function assignedToId(): string {
		// If groupId is '0' or null, assign to personal (data.id)
		if (!groupid || groupid === '0') {
			return data.id;
		}
		return groupid;
	}
</script>

<section class="events">
	<h1>Events</h1>
	<button class="add-event" class:modal-active={modal} onclick={() => (modal = true)}
		><AddIcon /></button
	>
	<button class="close-modal" class:modal-active={modal} onclick={() => (modal = false)}
		><CloseIcon /></button
	>
	<div class="list-container">
		<EventsList {data} />
	</div>

	<div class={modal ? 'modal open' : 'modal closed'}>
		<h2>Add an event</h2>

		<form {onsubmit}>
			<label for="name"
				>Event Name
				<input type="text" id="name" name="name" required />
			</label>
			
			<label class="checkbox-label">
				<input type="checkbox" name="allDay" id="allDay" />
				All-day event
			</label>

			<div class="date-time-group">
				<div class="date-time-row">
					<label for="date"
						>Start Date
						<input type="date" id="date" name="date" required />
					</label>
					<label for="time"
						>Start Time
						<input type="time" name="time" id="time" />
					</label>
				</div>
				
				<div class="date-time-row">
					<label for="endDate"
						>End Date
						<input type="date" id="endDate" name="endDate" />
					</label>
					<label for="endTime"
						>End Time
						<input type="time" name="endTime" id="endTime" />
					</label>
				</div>
			</div>

			<label for="location"
				>Location (optional)
				<input type="text" id="location" name="location" placeholder="Venue, address, or meeting link" />
			</label>

			<label for="description"
				>Description (optional)
				<textarea id="description" name="description" rows="3" placeholder="Event details, agenda, notes..."></textarea>
			</label>

			<button type="submit">Add Event</button>
		</form>
	</div>
</section>

<style>
	.events {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 20px;
		@media screen and (min-width: 690px) {
			grid-template-columns: 1fr 1fr;
		}
		div {
			grid-row: 2;
			grid-column: 1;
			@media screen and (min-width: 690px) {
				grid-column: 2;
			}
		}

		.modal {
			grid-column: 1/-1;
			grid-row: 2;
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
				max-height: 800px;
				opacity: 1;
				overflow-y: auto;
			}
			@media screen and (min-width: 690px) {
			}
		}
		h1 {
			grid-column: 1;
			grid-row: 1;
		}

		button.add-event {
			display: block;
			grid-column: 2;
			grid-row: 1;
			justify-self: end;
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
				grid-column: 2;
				grid-row: 1;
				justify-self: end;
				&:hover {
					box-shadow: var(--level-2);
				}
			}
		}
		.list-container {
			grid-column: 1 / -1;
			grid-row: 3;
		}
	}

	h1 {
		grid-column: 1 / -1;
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
		font-weight: 500;
	}

	label input,
	label textarea {
		margin-top: 5px;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: inherit;
		font-size: 1rem;

		&:focus {
			outline: none;
			border-color: #007bff;
			box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
		}
	}

	textarea {
		resize: vertical;
		min-height: 60px;
	}

	.checkbox-label {
		flex-direction: row;
		align-items: center;
		gap: 8px;
		cursor: pointer;

		input[type='checkbox'] {
			margin: 0;
			width: 18px;
			height: 18px;
			cursor: pointer;
		}
	}

	.date-time-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 6px;
	}

	.date-time-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;

		@media screen and (max-width: 690px) {
			grid-template-columns: 1fr;
		}
	}
</style>
