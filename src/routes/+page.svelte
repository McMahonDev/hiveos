<script lang="ts">
	import { Query } from 'zero-svelte';
	import NewTab from '$lib/static/icons/newTab.svelte';

	import EventsList from '$lib/components/eventsList.svelte';
	import ShoppingList from '$lib/components/shoppingList.svelte';
	import { isPast } from '$lib/utils/isPast';
	import { isToday } from '$lib/utils/isToday';

	let { data } = $props();
	let shortlist: boolean = true;

	let z = data.z;
	const events = z ? new Query(z?.current.query.events.where('assignedToId', data.groupId)) : null;
	const shoppingList = z
		? new Query(z?.current.query.shoppingList.where('assignedToId', data.groupId))
		: null;

	let shoppingListCount = $state(0);
	let eventNumber = $state(0);
	$effect(() => {
		eventNumber = events?.current.length ?? 0;
		shoppingListCount = shoppingList?.current.length ?? 0;
	});

	function getEventsString(): string {
		// calculate how many past due events, future events and events today
		let pastDue = 0;
		let future = 0;
		let today = 0;

		for (const event of events?.current ?? []) {
			if (isPast(event.date, event.time)) {
				pastDue++;
			} else if (isToday(event.date, event.time)) {
				today++;
			} else {
				future++;
			}
		}

		return `You have ${future} upcoming events, ${today} happening today, and ${pastDue} past due events.`;
	}

	function getShoppingListString(): string {
		// lets break it down by stores
		const itemsByStore = new Map<string, number>();
		for (const item of shoppingList?.current ?? []) {
			const store = item.store || 'any store';
			itemsByStore.set(store, (itemsByStore.get(store) || 0) + 1);
		}

		// create a string from the map
		let shoppingListCount = shoppingList?.current.length ?? 0;
		if (shoppingListCount === 0) {
			return 'No items in your shopping list.';
		}

		const itemsList = Array.from(itemsByStore.entries())
			.map(([store, count]) => `${count} item${count > 1 ? 's' : ''} to get from ${store}`)
			.join(', ');

		return `You have ${shoppingListCount} item${shoppingListCount > 1 ? 's' : ''} in your shopping list: ${itemsList}.`;
	}
</script>

<div class="container">
	<h1>Welcome{data.name ? `, ${data.name}` : ''}!</h1>

	<a class="card events" href="/events">
		<div>
			<h2>Events</h2>
			<NewTab />
			<p>
				{eventNumber === 0 ? 'No upcoming events.' : getEventsString()}
			</p>
		</div>

		{#if eventNumber > 0}
			<EventsList {data} {shortlist} />
		{/if}
	</a>

	<a class="card shoppingList" href="/shopping-list">
		<div>
			<h2>Shopping List</h2>
			<NewTab />
			<p>
				{shoppingListCount === 0 ? 'No items in your shopping list.' : getShoppingListString()}
			</p>
		</div>
		{#if shoppingListCount > 0}
			<ShoppingList {data} {shortlist} />
		{/if}
	</a>
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto;
		gap: 20px;

		@media screen and (min-width: 740px) {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto auto;
			.events {
				grid-column: 1 / 2;
				grid-row: 2 / 3;
			}
			.shoppingList {
				grid-column: 2 / 3;
				grid-row: 2 / 3;
			}
			h1 {
				grid-column: 1 / -1;
				grid-row: 1 / 2;
			}
		}
		.card {
			padding: 20px;
			background-color: var(--background);
			border: 1px solid var(--border);
			border-radius: 5px;
			box-shadow: var(--level-3);
			div {
				display: grid;
				grid-template-columns: 1fr auto;
				align-items: center;
			}
		}
	}
	h1 {
		font-size: 1.25rem;
		text-align: center;
	}
	/* h2 {
		font-size: 1.2rem;
		margin-bottom: 10px;
	} */
	a.card {
		text-decoration: none;
		color: inherit;
	}
	h1 {
		font-size: 1.25rem;
		text-align: center;
	}
	/* h2 {
		font-size: 1.2rem;
		margin-bottom: 10px;
	} */
	a.card {
		text-decoration: none;
		color: inherit;
	}

	a {
		text-decoration: underline;
		color: inherit;
	}
	@container (max-width: 690px) {
		.container {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto auto;
			.events {
				grid-column: 1 / 2;
				grid-row: 2 / 3;
			}
			.shoppingList {
				grid-column: 1 / 2;
				grid-row: 3 / 4;
			}
		}
	}
</style>
