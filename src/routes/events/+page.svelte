<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';

	let { data } = $props();
	let z = data.z;

	const events = new Query(z.current.query.events.where('assignedToId', data.id));
	console.log('events', events.current);
	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const dateTime = new Date(`${date}T${time}`);
		const unixDateTime = Math.floor(dateTime.getTime() / 1000);
		console.log(name, unixDateTime);
		if (name && date) {
			try {
				console.log('About to insert event', {
					id: nanoid(),
					name,
					timestamp: unixDateTime,
					createdById: data.id,
					assignedToId: data.id
				});
				console.log('data.id', data.id);
				z.current.mutate.events.insert({
					id: nanoid(), // Auto-incremented by the database
					name,
					timestamp: 1234567890, // Convert to Unix timestamp
					// Convert to ISO string
					createdById: data.id,
					assignedToId: data.id // Default value, replace as needed
				});
				console.log('events', events.current);
			} catch (error) {
				console.error('Error inserting event:', error);
			}

			(event.target as HTMLFormElement).reset();
		}
	}

	function deleteItem(event: Event) {
		const target = event.target as HTMLElement | null;
		const id = target?.dataset?.id;
		if (!id) {
			console.error('No ID provided for deletion.');
			return;
		}
		if (id) {
			z.current.mutate.events.delete({ id });
		}
	}
</script>

<section class="events">
	<div>
		<h2>Events</h2>
		<ul>
			{#each events.current as event}
				<li>
					<h4>
						{event.name} - {new Date(event.timestamp * 1000).toLocaleString()}
						<button data-id={event.id} onclick={deleteItem}>Delete</button>
					</h4>
				</li>
			{/each}
		</ul>
	</div>
	<div>
		<h2>Add an event</h2>
		<form {onsubmit}>
			<input type="text" id="name" name="name" />
			<input type="date" id="date" name="date" />
			<input type="time" name="time" id="time" />
			<button type="submit">Add</button>
		</form>
	</div>
</section>
