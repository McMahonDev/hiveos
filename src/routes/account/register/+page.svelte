<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { user } from '$lib/state/user.svelte';

	let name = '';
	let email = '';
	let password = '';
	let error = '';
	let isLoading = false;

	async function handleSignup() {
		error = '';
		isLoading = true;

		try {
			const { data, error: err } = await authClient.signUp.email({
				name,
				email,
				password
			});

			if (err) {
				error = err.message ?? 'An unknown error occurred.';
			} else {
				// Update user state immediately for instant UI update
				user.auth = true;
				user.isLoggedIn = true;
				user.email = email;

				// Use client-side navigation without page refresh
				goto('/', { replaceState: true, noScroll: true });
			}
		} catch (e) {
			error = 'Sign up failed. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<h1>Sign Up</h1>
<form on:submit|preventDefault={handleSignup}>
	<input type="text" bind:value={name} placeholder="Name" required disabled={isLoading} />
	<input type="email" bind:value={email} placeholder="Email" required disabled={isLoading} />
	<input
		type="password"
		bind:value={password}
		placeholder="Password"
		required
		disabled={isLoading}
	/>
	<button type="submit" disabled={isLoading}>
		{isLoading ? 'Signing up...' : 'Sign Up'}
	</button>
</form>
{#if error}
	<p style="color: red;">{error}</p>
{/if}
<p>
	Already have an account? <a href="/account/login">Log in</a>
</p>
