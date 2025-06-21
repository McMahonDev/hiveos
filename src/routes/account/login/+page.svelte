<script lang="ts">
	import { enhance } from '$app/forms';

	// Define the type for form to include an optional error property
	type FormType = {
		error?: string;
		[key: string]: any;
	};

	let { form } = $props();
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
