<script lang="ts">
	import ShoppingList from '$lib/components/shoppingList.svelte';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';

	let { data } = $props();
	let z = data.z;

	const group = new Query(z.current.query.userGroups.where('id', data.groupId));
	let groupid = $derived(group.current[0]?.id ?? data.groupId);

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const id = nanoid();
		if (name) {
			if (groupid === '0') {
				groupid = data.id;
			}
			z.current.mutate.shoppingList.insert({
				id,
				name,
				status: false,
				assignedToId: groupid,
				createdById: data.id
			});
			(event.target as HTMLFormElement).reset();
		}
	}
</script>

<section class="shopping-list">
	<h1>Shopping List</h1>
	<ShoppingList {data} />

	<div>
		<h2>Add an Item</h2>
		<form {onsubmit}>
			<label for="name"
				>Item Name
				<input type="text" id="name" name="name" />
			</label>
			<button type="submit">Add</button>
		</form>
	</div>
</section>

<style>
	.shopping-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	h1 {
		grid-column: 1 / -1;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	label {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	label input {
		margin-top: 5px;
		padding: 5px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
