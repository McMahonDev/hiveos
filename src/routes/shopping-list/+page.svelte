<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import type { ShoppingList } from '../../schema.js';

	let { data } = $props();
	let z = data.z;

	const shoppingList = new Query(z.current.query.shoppingList.where('assignedToId', data.id));

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const id = nanoid();
		if (name) {
			z.current.mutate.shoppingList.insert({
				id,
				name,
				status: false,
				assignedToId: data.id,
				createdById: data.id
			});
			(event.target as HTMLFormElement).reset();
		}
	}

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

<section class="shopping-list">
	<div>
		<h2>Shopping List</h2>
		<ul>
			{#each shoppingList.current as item}
				<li>
					<input type="checkbox" value={item.id} checked={item.status} oninput={toggletask} />
					{item.name}
					<button data-id={item.id} onclick={deleteItem}>Delete</button>
				</li>
			{/each}
		</ul>
	</div>
	<div>
		<h2>Add an Item</h2>
		<form {onsubmit}>
			<input type="text" id="name" name="name" />
			<button type="submit">Add</button>
		</form>
	</div>
</section>
