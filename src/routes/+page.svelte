<script lang="ts">
	import { Query } from 'zero-svelte';
	import { z } from '$lib/z.svelte';

	const tasks = new Query(z.current.query.tasks);

	// Removed randID function as the database auto-increments the id

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const newtask = formData.get('newtask') as string;

		console.log('newtask', newtask);

		if (newtask) {
			z.current.mutate.tasks.insert({ title: newtask, status: false, description: '', userId: 1 });
			(event.target as HTMLFormElement).reset();
		}
	}

	function toggletask(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		const id = Number(checkbox.value);
		const completed = checkbox.checked;
		z.current.mutate.tasks.update({ id, completed });
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
				/>{task.title}
			</li>
		{/each}
	</ul>
</div>
