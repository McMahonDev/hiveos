<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { Query } from 'zero-svelte';

	let { data } = $props();
	let z = data.z;

	const events = new Query(
		z.current.query.events.where('assignedToId', data.id).orderBy('datetime', 'asc')
	);

	$inspect(events.current);

	function deleteItem(event: Event) {
		console.log('deleteItem', event);
		const target = event?.target?.ownerSVGElement?.parentElement as HTMLElement | null;
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
	{#if events.current.length === 0}
		<p>No events found.</p>
	{:else}
		<ul>
			{#each events.current as event}
				<li>
					{event.name}
					<button data-id={event.id} onclick={deleteItem}><DeleteIcon /></button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		box-shadow: none;
	}
	li {
		display: flex;
		justify-content: flex-start;
		gap: 10px;
		align-items: center;
	}
</style>
