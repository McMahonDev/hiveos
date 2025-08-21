<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { user } from '$lib/state/user.svelte';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let error = '';
	let isLoading = false;

	async function handleLogin() {
		error = '';
		isLoading = true;

		try {
			const { data, error: err } = await authClient.signIn.email({
				email,
				password
			});

			if (err) {
				console.error('Login error:', err);
				error = err.message ?? 'An unknown error occurred.';
			} else {
				// Update user state immediately for instant UI update
				user.auth = true;
				user.isLoggedIn = true;
				user.email = email;
				goto('/', { replaceState: true, noScroll: true });
			}
		} catch (e) {
			console.error('Login catch error:', e);
			error = 'Login failed. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<h1>Login</h1>
<form on:submit|preventDefault={handleLogin}>
	<input type="email" bind:value={email} placeholder="Email" required disabled={isLoading} />
	<input
		type="password"
		bind:value={password}
		placeholder="Password"
		required
		disabled={isLoading}
	/>
	<button type="submit" disabled={isLoading}>
		{isLoading ? 'Logging in...' : 'Login'}
	</button>
</form>
{#if error}
	<p style="color: red;">{error}</p>
{/if}
<p>
	Don't have an account? <a href="/account/register">Sign up</a>
</p>
