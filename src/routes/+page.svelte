<script lang="ts">
	import { Query } from 'zero-svelte';
	import { Z } from 'zero-svelte';
	import { schema, type Schema } from '../schema';
	import { nanoid } from 'nanoid';

	let { data } = $props();

	function get_z_options() {
		return {
			userID: data.id,
			server: import.meta.env.VITE_CONNECTION_STRING,
			schema,
			kvStore: 'idb'
			// ... other options
		} as const;
	}

	const z = new Z<Schema>(get_z_options());

	// const id = data.id;
	const tasks = new Query(z.current.query.tasks.where('createdById', data.id));

	const randID = () => Math.random().toString(36).slice(2);

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const newtask = formData.get('newtask') as string;

		console.log('newtask', newtask);

		const id = randID();
		if (newtask) {
			try {
				z.current.mutate.tasks.insert({
					id: nanoid(), // Auto-incremented by the database
					name: newtask,
					status: false,
					createdById: data.id,
					assignedToId: data.id // Default value, replace as needed
				});
			} catch (error) {
				console.error('Error inserting task:', error);
			}

			(event.target as HTMLFormElement).reset();
		}
	}

	function toggletask(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		const id = checkbox.value;
		const completed = checkbox.checked;
		z.current.mutate.tasks.update({ id, status: completed });
	}
</script>

<div>
	<h1>task</h1>
	<form {onsubmit}>
		<input type="text" id="newtask" name="newtask" />
		<button type="submit">Add</button>
	</form>
	<ul>
		{#each tasks.current as task}
			<li>
				<input
					type="checkbox"
					value={task.id}
					checked={task.status}
					oninput={toggletask}
				/>{task.name}
			</li>
		{/each}
	</ul>
</div>
