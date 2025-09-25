<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	// Assuming `Query` is the correct way to get a Zero query object in zero-svelte
	import { Query } from 'zero-svelte';

	let { data, shortlist = false } = $props();

	let z = data.z;
	let groupId = data.groupId;
	const group = z ? new Query(z?.current.query.userGroups.where('id', data.groupId)) : null;
	let groupid = $derived((group && group.current[0]?.id) ?? data.groupId);

	let shoppingList = $derived(
		new Query(
			z?.current.query.shoppingList.where('assignedToId', groupid).orderBy('createdAt', 'asc')
		)
	);

	let numberOfItems = $derived(shoppingList.current?.length ?? 0);

	function deleteItem(id: string) {
		if (!id) {
			console.error('No ID provided for deletion.');
			return;
		}
		if (id) {
			z?.current.mutate.shoppingList.delete({ id });
		}
	}

	function toggletask(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		const id = checkbox.value;
		const completed = checkbox.checked;
		z?.current.mutate.shoppingList.update({ id, status: completed });
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
							{item.store ? ` - ${item.store}` : ''}
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
					{item.store ? ` - ${item.store}` : ''}
					<button data-id={item.id} onclick={() => deleteItem(item.id)}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
