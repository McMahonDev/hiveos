<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	// Assuming `Query` is the correct way to get a Zero query object in zero-svelte
	import { Query } from 'zero-svelte';
	import { notifyContentChange } from '$lib/utils/notification';

	let { data } = $props();
	// `data` from `$props()` is reactive and should correctly propagate `data.z` and `data.groupId`.
	let z = data.z;
	let groupId = data.groupId;

	let shoppingList = new Query(z.current.query.shoppingList);

	$inspect(shoppingList.current, 'shoppingList');

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
			notifyContentChange('Shopping List Updated', 'An item was deleted from the shopping list.');
		}
	}

	function toggletask(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		const id = checkbox.value;
		const completed = checkbox.checked;
		z.current.mutate.shoppingList.update({ id, status: completed });
		notifyContentChange('Shopping List Updated', 'An item was updated in the shopping list.');
	}
</script>

<div>
	{#if shoppingList.current.length === 0}
		<p>No items in the shopping list.</p>
	{:else}
		<ul>
			{#each shoppingList.current as item (item.id)}
				<!-- --- BEST PRACTICE: Add a key to {#each} block --- -->
				<li>
					<input type="checkbox" value={item.id} checked={item.status} oninput={toggletask} />
					{item.name}
					<button data-id={item.id} onclick={deleteItem}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
