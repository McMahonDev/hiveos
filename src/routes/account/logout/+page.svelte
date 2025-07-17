<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// This logout page is no longer needed since logout is handled client-side
	// Add a small delay to ensure proper rendering
	onMount(() => {
		setTimeout(() => {
			goto('/account/login', { replaceState: true });
		}, 100);
	});
</script>

<h1>Logging out...</h1>
<p>Please wait while we log you out.</p>
