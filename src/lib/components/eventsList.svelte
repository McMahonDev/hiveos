<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { Query } from 'zero-svelte';
	import { ui, setGroupActive, getGroupActive } from '$lib/state/ui.svelte';

	let { data } = $props();
	let z = data.z;
	let groupId = data.groupId;

	let groupActive = $derived(data.groupActive);

	$effect(() => {
		console.log('groupActive:', $ui.groupActive);
	});

	// groupId is now properly set to userId when no group membership exists
	// so we don't need to check for '0' fallback anymore

	let events;
	if ($ui.groupActive) {
		events = new Query(
			z.current.query.events.where('assignedToId', data.groupId).orderBy('datetime', 'asc')
		);
	} else {
		events = new Query(
			z.current.query.events.where('assignedToId', data.id).orderBy('datetime', 'asc')
		);
	}

	$effect(() => {
		console.log('test');
		if (groupActive) {
			events = new Query(
				z.current.query.events.where('assignedToId', data.groupId).orderBy('datetime', 'asc')
			);
		} else {
			events = new Query(
				z.current.query.events.where('assignedToId', data.id).orderBy('datetime', 'asc')
			);
		}
	});

	function deleteItem(event: Event) {
		const target = (event?.target as SVGElement)?.ownerSVGElement
			?.parentElement as HTMLElement | null;
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
	{#if Array.isArray(events.current) && events.current.length === 0}
		<p>No events found.</p>
	{:else if Array.isArray(events.current)}
		<ul>
			{#each events.current as event}
				<li>
					{event.name} - {data.id}
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
