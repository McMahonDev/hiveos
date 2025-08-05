<script lang="ts">
	import ShoppingList from '$lib/components/shoppingList.svelte';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';

	let { data } = $props();
	let z = data.z;
	let groupId = data.groupId;

	console.log('test', data);

	let modalOpen = $state(false);

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
				assignedToId: groupId,
				createdById: data.id,
				createdAt: Date.now()
			});
			(event.target as HTMLFormElement).reset();
		}
	}
</script>

<section class="shopping-list">
	<h1>Shopping List</h1>
	<ShoppingList {data} />
	<div>
		<button onclick={() => (modalOpen = true)}> Add Item </button>
	</div>

	{#if modalOpen}
		<div class="modal" role="dialog" aria-modal="true" tabindex="-1">
			<!-- Overlay for closing modal with click or keyboard -->
			<div
				class="modal-overlay"
				role="button"
				tabindex="0"
				onclick={() => (modalOpen = false)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						modalOpen = false;
					}
				}}
				aria-label="Close modal"
			></div>
			<form {onsubmit}>
				<label for="name"
					>Item Name
					<input type="text" id="name" name="name" />
				</label>
				<button type="submit">Add</button>
				<button
					type="button"
					class="button close"
					onclick={() => (modalOpen = false)}
					aria-label="Close modal"
				>
					Close
				</button>
			</form>
		</div>
	{/if}
</section>

<style>
	.shopping-list {
		display: grid;
		grid-template-columns: 1fr;
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

	@media screen and (min-width: 690px) {
		.modal {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background-color: rgba(0, 0, 0, 0.5);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			z-index: 1000;
		}
		.modal-overlay {
			position: absolute;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: transparent;
			z-index: 1001;
		}
		.modal form {
			position: relative;
			z-index: 1002;
			background: white;
			padding: 20px;
			border-radius: 8px;
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
			width: 300px;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
	}
</style>
