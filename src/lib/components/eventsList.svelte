<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';

	let { data } = $props();
	let z = data.z;

	const events = new Query(z.current.query.events.where('assignedToId', data.id));

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

<div>
	<h1>Events</h1>
	<ul>
		{#each events.current as event}
			<li>
				<h2>
					{event.name}
					<button data-id={event.id} onclick={deleteItem}>Delete</button>
				</h2>
			</li>
		{/each}
	</ul>
</div>
