<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';

	let { data } = $props();
	let z = data.z;

	const events = new Query(z.current.query.events.where('assignedToId', data.id));
	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const dateTime = new Date(`${date}T${time}`);
		const unixDateTime = Math.floor(dateTime.getTime() / 1000);

		if (name && date) {
			z.current.mutate.events.insert({
				id: nanoid(),
				name,
				timestamp: unixDateTime,
				createdById: data.id,
				assignedToId: data.id
			});

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
		<h1>Events</h1>
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
			<label for="name"
				>Event Name
				<input type="text" id="name" name="name" placeholder="Event Name" />
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
	.events h1 {
		grid-column: 1 / -1;
	}
	.events form {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.events ul {
		list-style-type: none;
		padding: 0;
	}
	.events li {
		margin: 10px 0;
	}
	.events li h4 {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.events label {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	.events label input {
		margin-top: 5px;
		padding: 5px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
