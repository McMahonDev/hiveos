<script lang="ts">
	import { enhance } from '$app/forms';
	import { user } from '$lib/state/user.svelte';

	// Define the type for form to include an optional error property
	type FormType = {
		error?: string;
		[key: string]: any;
	};

	let { form, data } = $props();
	console.log('Form:', form);
	console.log('Data:', data);
	if (data.loggedIn === false) {
		user.auth = false;
		user.isLoggedIn = false;
		user.email = '';
		user.userID = '';
		user.groupId = '';
	}
</script>

<section>
	<h1>Login</h1>
	{#if form?.error}
		<p class="text-red-500">{form.error}</p>
	{/if}
	<form use:enhance method="POST" action="?/login">
		<input type="email" name="email" placeholder="Email" required />
		<input type="password" name="password" placeholder="Password" required />
		<button type="submit">Login</button>
	</form>
</section>
