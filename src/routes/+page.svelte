<script lang="ts">
	import { Query } from 'zero-svelte';
	import { z } from '$lib/z.svelte';

	const tasks = new Query(z.current.query.tasks);

	console.log('tasks', tasks.current);
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
					id, // Auto-incremented by the database
					name: newtask,
					status: false,
					createdById: 'uu1',
					assignedToId: 'uu1' // Default value, replace as needed
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
