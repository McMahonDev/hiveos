<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import EventsList from '$lib/components/eventsList.svelte';

	let { data } = $props();
	let z = data.z;

	// const events = z ? new Query(z.current.query.events.where('assignedToId', data.id)) : null;
	const group = z ? new Query(z.current.query.userGroups.where('id', data.groupId)) : null;
	let groupid = $derived((group && group.current[0]?.id) ?? data.groupId);
	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		let date = formData.get('date') as string;
		let time = formData.get('time') as string;

		let datetime;

		if (!date && !time) {
			datetime = 0;
		}
		if (date && !time) {
			datetime = Math.floor(new Date(`${date}T00:00`).getTime() / 1000);
		}

		if (date && time) {
			datetime = Math.floor(new Date(`${date}T${time}`).getTime() / 1000);
		}

		z.current.mutate.events.insert({
			id: nanoid(),
			name,
			datetime,
			timezone: getTimeZoneAbbreviation(),
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
	<EventsList {data} />
	<div>
		<h2>Add an event</h2>
		<form {onsubmit}>
			<label for="name"
				>Event Name
				<input type="text" id="name" name="name" />
			</label>
			<label for="date"
				>Date
				<input type="date" id="date" name="date" />
			</label>
			<label for="time"
				>Time
				<input type="time" name="time" id="time" />
			</label>
			<button type="submit">Add</button>
		</form>
	</div>
</section>

<style>
	.events {
		display: grid;
		grid-template-columns: 1fr;
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
	}

	h1 {
		grid-column: 1 / -1;
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
