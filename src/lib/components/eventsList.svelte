<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { Query } from 'zero-svelte';
	import { notifyContentChange } from '$lib/utils/notification';

	let { data } = $props();
	let z = data.z;
	let groupId = data.groupId;

	// groupId is now properly set to userId when no group membership exists
	// so we don't need to check for '0' fallback anymore

	const events = new Query(
		z.current.query.events.where('assignedToId', groupId).orderBy('datetime', 'asc')
	);

	// $inspect(events.current);

	function deleteItem(event: Event) {
		// console.log('deleteItem', event);
		const target = (event?.target as SVGElement)?.ownerSVGElement
			?.parentElement as HTMLElement | null;
		const id = target?.dataset?.id;
		if (!id) {
			console.error('No ID provided for deletion.');
			return;
		}
		if (id) {
			z.current.mutate.events.delete({ id });
			notifyContentChange('Events Updated', 'An event was deleted.');
		}
	}
</script>

<div>
	{#if Array.isArray(events.current) && events.current.length === 0}
		<p>No events found.</p>
	{:else if Array.isArray(events.current)}
		<ul>
			{#each events.current as event}
				<li>
					{event.name}
					<button data-id={event.id} onclick={deleteItem}><DeleteIcon /></button>
				</li>
			{/each}
		</ul>
	{:else}
		<p>Loading events...</p>
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
