<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { Query } from 'zero-svelte';
	import type { ShoppingList } from '../../schema.js';

	let { data } = $props();
	let z = data.z;

	const shoppingList = new Query(z.current.query.shoppingList.where('assignedToId', data.id));
	function deleteItem(event: Event) {
		const target = event.target as HTMLElement | null;
		const id = target?.dataset?.id;
		if (!id) {
			console.error('No ID provided for deletion.');
			return;
		}
		if (id) {
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
	{#if shoppingList.current.length === 0}
		<p>No items in the shopping list.</p>
	{:else}
		<ul>
			{#each shoppingList.current as item}
				<li>
					<input type="checkbox" value={item.id} checked={item.status} oninput={toggletask} />
					{item.name}
					<button data-id={item.id} onclick={deleteItem}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
