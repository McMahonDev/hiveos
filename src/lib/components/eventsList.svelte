<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { Query } from 'zero-svelte';

	let { data, shortlist = false } = $props();
	let z = data.z;
	const groupId = data.groupId;

	// Query events (ordered by createdAt for a deterministic replica order).
	const events = z
		? new Query(z.current.query.events.where('assignedToId', groupId).orderBy('createdAt', 'asc'))
		: null;

	// Client-side derived sort:
	// 1) Events that have a datetime (truthy) come first, sorted by datetime ascending
	// 2) Events without datetime come after, sorted by createdAt ascending
	let sortedEvents = $derived(
		Array.isArray(events?.current)
			? events.current.slice().sort((a, b) => {
					const aHas = !!a.datetime;
					const bHas = !!b.datetime;
					if (aHas && bHas) return (a.datetime ?? 0) - (b.datetime ?? 0);
					if (aHas) return -1;
					if (bHas) return 1;
					return (a.createdAt ?? 0) - (b.createdAt ?? 0);
				})
			: undefined
	);
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
	{#if shortlist}
		{#if Array.isArray(sortedEvents)}
			<ul class="shortlist">
				{#each sortedEvents as event, i}
					{#if i < 3}
						<li>
							{event.name}
						</li>
					{/if}
				{/each}
			</ul>
		{/if}
	{:else if Array.isArray(sortedEvents) && sortedEvents.length === 0}
		<p>No events found.</p>
	{:else if Array.isArray(sortedEvents)}
		<ul>
			{#each sortedEvents as event}
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
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li {
		display: flex;
		justify-content: flex-start;
		gap: 10px;
		align-items: center;
	}
</style>
