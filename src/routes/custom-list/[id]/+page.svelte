<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';

	let { data } = $props(); // repo style (Svelte 5)
	const listId = data.listId;
	const z = data.z;
	const id = data.id;
	const groupId = data.groupId;

	let customList = z
		? new Query(z?.current.query.customLists.where('id', listId).where('createdById', id))
		: null;

	let customListItems = z
		? new Query(
				z?.current.query.customListItems.where('customListId', listId).orderBy('createdAt', 'asc')
			)
		: null;

	let modal = $state(false);

	function onsubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;
		const id = nanoid();
		if (name) {
			z?.current.mutate.customListItems.insert({
				id,
				name,
				status: false,
				customListId: listId,
				createdById: data.id,
				createdAt: Date.now()
			});
			(event.target as HTMLFormElement).reset();
		}
	}
</script>

<section class="custom-list">
	<h1>{customList?.current ? customList.current[0]?.name : 'Loading...'}</h1>
	<button class="add-event" class:modal-active={modal} onclick={() => (modal = true)}>
		Add Item
	</button>
	<button class="close-modal" class:modal-active={modal} onclick={() => (modal = false)}>
		Close
	</button>

	<div class="list-container">
		{#if customListItems?.current}
			{#each customListItems.current as item (item.id)}
				<div class="list-item">
					<p>{item.name}</p>
				</div>
			{/each}
		{:else}
			<p>Loading items...</p>
		{/if}
	</div>
	<div class={modal ? 'modal open' : 'modal closed'} role="dialog" aria-modal="true" tabindex="-1">
		<h2>Add an item</h2>
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
	.custom-list {
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
