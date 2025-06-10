<script lang="ts">
	import EventsList from '$lib/components/eventsList.svelte';
	import ShoppingList from '$lib/components/shoppingList.svelte';

	let { data } = $props();
	// }
</script>

<div class="container">
	<div class="events">
		<h2><a href="/events">Events</a></h2>
		<EventsList {data} />
	</div>

	<div class="weather">
		<h2>Weather</h2>
		<p>Weather component goes here</p>
	</div>

	<div class="shoppingList">
		<h2><a href="/shopping-list">Shopping List</a></h2>
		<ShoppingList {data} />
	</div>
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto;
		gap: 20px;
		.weather {
			grid-row: 1;
		}

		@media screen and (min-width: 691px) {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto auto;
			.events {
				grid-column: 1 / 2;
				grid-row: 1 / 3;
			}
			.weather {
				grid-column: 2 / 3;
				grid-row: 1 / 2;
			}
			.shoppingList {
				grid-column: 2 / 3;
				grid-row: 2 / 3;
			}
		}
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
			.weather {
				grid-column: 1 / 2;
				grid-row: 1 / 2;
			}
			.shoppingList {
				grid-column: 1 / 2;
				grid-row: 3 / 4;
			}
		}
	}
</style>
