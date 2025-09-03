<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	// Assuming `Query` is the correct way to get a Zero query object in zero-svelte
	import { Query } from 'zero-svelte';


	let { data, shortlist = false } = $props();

	let z = data.z;
	let groupId = data.groupId;

	let shoppingList = new Query(
		z.current.query.shoppingList.where('assignedToId', groupId).orderBy('createdAt', 'asc')
	);

	let numberOfItems = $derived(shoppingList.current?.length ?? 0);

	function deleteItem(event: Event) {
		const target = event.target as HTMLElement | null;
		const id = target?.dataset?.id;
		if (!id) {
			console.error('No ID provided for deletion.');
			return;
		}
		if (id) {
			// This mutator call will trigger Zero's internal synchronization.
			// If the deletion succeeds in your backend, Zero should automatically
			// update the local query result that `shoppingList` is observing.
			z.current.mutate.shoppingList.delete({ id });
		}
	}

	function toggletask(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		const id = checkbox.value;
		const completed = checkbox.checked;
		z.current.mutate.shoppingList.update({ id, status: completed });
	}
</script>

<div>
	{#if shortlist}
		{#if Array.isArray(shoppingList.current)}
			<ul class="shortlist">
				{#each shoppingList.current as item, i}
					{#if i < 3}
						<li>
							{item.name}
						</li>
					{/if}
				{/each}
				{#if numberOfItems > 3}
					<li>and {numberOfItems - 3} more...</li>
				{/if}
			</ul>
		{/if}
	{:else if Array.isArray(shoppingList.current) && shoppingList.current.length === 0}
		<p>No items in the shopping list.</p>
	{:else}
		<ul>
			{#each Array.isArray(shoppingList.current) ? shoppingList.current : [] as item (item.id)}
				<li>
					<input type="checkbox" value={item.id} checked={item.status} oninput={toggletask} />
					{item.name}
					<button data-id={item.id} onclick={deleteItem}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
