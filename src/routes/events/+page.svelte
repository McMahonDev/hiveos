<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import EventsList from '$lib/components/eventsList.svelte';
	import { ui, setGroupActive, getGroupActive } from '$lib/state/ui.svelte';

	let { data } = $props();
	let z = data.z;

	// If you want to log groupActive changes, use a reactive statement:
	$effect(() => {
		console.log('groupActive:', $ui.groupActive);
	});
	// const events = z ? new Query(z.current.query.events.where('assignedToId', data.id)) : null;
	const group = z ? new Query(z.current.query.userGroups.where('id', data.groupId)) : null;
	let groupid = $derived((group && group.current[0]?.id) ?? data.groupId);
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
		// if (groupid === '0') {
		// 	groupid = data.id;
		// }

		if (name && date && z) {
			z.current.mutate.events.insert({
				id: nanoid(),
				name,
				datetime,
				timezone: getTimeZoneAbbreviation(),
				createdById: data.id,
				assignedToId: assignedToId()
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

	function assignedToId(): string {
		if ($ui.groupActive) {
			console.log('Using groupId:', data.groupId);
			return data.groupId;
		} else {
			console.log('Using userId:', data.id);
			return data.id;
		}
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
