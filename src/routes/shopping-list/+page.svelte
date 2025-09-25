<script lang="ts">
	import ShoppingList from '$lib/components/shoppingList.svelte';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';

	let { data } = $props();
	let z = data.z;
	const group = z ? new Query(z?.current.query.userGroups.where('id', data.groupId)) : null;
	let groupid = $derived((group && group.current[0]?.id) ?? data.groupId);

	let modal = $state(false);

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const store = formData.get('store') as string;
		const id = nanoid();
		if (name) {
			z?.current.mutate.shoppingList.insert({
				id,
				name,
				store,
				status: false,
				assignedToId: groupid,
				createdById: data.id,
				createdAt: Date.now()
			});
			(event.target as HTMLFormElement).reset();
		}
	}
</script>

<section class="shopping-list">
	<h1>Shopping List</h1>
	<button class="add-event" class:modal-active={modal} onclick={() => (modal = true)}>
		Add Item
	</button>
	<button class="close-modal" class:modal-active={modal} onclick={() => (modal = false)}>
		Close
	</button>

	<div class="list-container">
		<ShoppingList {data} />
	</div>

	<div class={modal ? 'modal open' : 'modal closed'} role="dialog" aria-modal="true" tabindex="-1">
		<h2>Add an item</h2>
		<form {onsubmit}>
			<label for="name"
				>Item Name
				<input type="text" id="name" name="name" />
			</label>
			<label for="store"
				>Store
				<input type="text" id="store" name="store" />
			</label>
			<button type="submit">Add</button>
		</form>
	</div>
</section>

<style>
	.shopping-list {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 20px;
		@media screen and (min-width: 690px) {
			grid-template-columns: 1fr 1fr;
		}
		div {
			grid-row: 2;
			grid-column: 1;
			@media screen and (min-width: 690px) {
				grid-column: 2;
			}
		}

		.modal {
			grid-column: 1/-1;
			grid-row: 2;
			background: var(--level-2);
			padding: 20px;
			border-radius: 10px;
			box-shadow: var(--level-3);
			transition: all 0.3s ease-in-out;
			&.closed {
				max-height: 0;
				overflow: hidden;
				padding: 0 20px;
				opacity: 0;
				box-shadow: none;
			}
			&.open {
				max-height: 500px;
				opacity: 1;
			}
			@media screen and (min-width: 690px) {
			}
		}
		h1 {
			grid-column: 1;
			grid-row: 1;
		}

		button.add-event {
			display: block;
			grid-column: 2;
			grid-row: 1;
			justify-self: end;
			&:hover {
				box-shadow: var(--level-2);
			}
			&.modal-active {
				display: none;
			}
		}
		button.close-modal {
			display: none;
			&.modal-active {
				display: block;
				grid-column: 2;
				grid-row: 1;
				justify-self: end;
				&:hover {
					box-shadow: var(--level-2);
				}
			}
		}
		.list-container {
			grid-column: 1 / -1;
			grid-row: 3;
		}
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
