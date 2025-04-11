<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';

	let { data } = $props();
	let z = data.z;

	const tasks = new Query(z.current.query.tasks.where('createdById', data.id));

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const newtask = formData.get('newtask') as string;
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
