<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { user } from '$lib/state/user.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let error = '';
	let successMessage = '';
	let isLoading = false;

	onMount(() => {
		// Check for success message from password reset
		const urlParams = new URLSearchParams(window.location.search);
		const message = urlParams.get('message');
		if (message) {
			successMessage = message;
			// Clean up the URL
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	});

	async function handleLogin() {
		error = '';
		successMessage = '';
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

<div class="auth-container">
	<h1>Login</h1>

	{#if successMessage}
		<div class="auth-success">{successMessage}</div>
	{/if}

	<form class="auth-form" on:submit|preventDefault={handleLogin}>
		<div class="auth-input-group">
			<input
				class="auth-input"
				type="email"
				bind:value={email}
				placeholder="Email"
				required
				disabled={isLoading}
			/>
		</div>

		<div class="auth-input-group">
			<input
				class="auth-input"
				type="password"
				bind:value={password}
				placeholder="Password"
				required
				disabled={isLoading}
			/>
			<div class="forgot-password-link">
				<a href="/account/forgot-password">Forgot password?</a>
			</div>
		</div>

		<button class="auth-button" type="submit" disabled={isLoading}>
			{#if isLoading}
				<span class="loading-spinner"></span>
			{/if}
			{isLoading ? 'Logging in...' : 'Login'}
		</button>
	</form>

	{#if error}
		<div class="auth-error">{error}</div>
	{/if}

	<div class="auth-link">
		Don't have an account? <a href="/account/register">Sign up</a>
	</div>
</div>
