<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import EventsList from '$lib/components/eventsList.svelte';

	let { data } = $props();
	let z = data.z;

	const events = new Query(z.current.query.events.where('assignedToId', data.id));
	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		let date = formData.get('date') as string;
		let time = formData.get('time') as string;

		if (!date) {
			date = new Date().toISOString().split('T')[0];
		}
		if (!time) {
			time = '00:00';
		}
		const datetime = Math.floor(new Date(`${date}T${time}`).getTime() / 1000);

		console.log(datetime);

		if (name && date) {
			z.current.mutate.events.insert({
				id: nanoid(),
				name,
				datetime,
				timezone: getTimeZoneAbbreviation(),
				createdById: data.id,
				assignedToId: data.id
			});

			(event.target as HTMLFormElement).reset();
		}
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
		grid-template-columns: 1fr 1fr;
		gap: 20px;
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
