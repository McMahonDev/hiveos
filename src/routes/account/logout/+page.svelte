<script lang="ts">
	import { user } from '$lib/state/user.svelte';
	let { data } = $props();

	if (data.auth === false) {
		user.auth = false;
		user.isLoggedIn = false;
		user.email = '';
		user.userID = '';
		user.groupId = '';
		window.location.href = '/account/login';
	} else {
		window.location.href = '/';
	}
</script>
