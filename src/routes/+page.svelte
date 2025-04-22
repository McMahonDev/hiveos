<script lang="ts">
	import EventsList from '$lib/components/eventsList.svelte';

	let { data } = $props();
	// }
</script>

<div class="container">
	<EventsList {data} />
</div>
