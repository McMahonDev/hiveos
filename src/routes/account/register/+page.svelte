<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { user } from '$lib/state/user.svelte';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let isLoading = false;
	let showVerificationNotice = false;

	async function handleSignup() {
		error = '';

		// Validate passwords match
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		// Validate password length
		if (password.length < 6) {
			error = 'Password must be at least 6 characters long.';
			return;
		}

		isLoading = true;

		try {
			const { data, error: err } = await authClient.signUp.email({
				name,
				email,
				password,
				callbackURL: '/'
			});

			if (err) {
				error = err.message ?? 'An unknown error occurred.';
			} else {
				// Show verification notice
				showVerificationNotice = true;

				// Update user state immediately for instant UI update
				user.auth = true;
				user.isLoggedIn = true;
				user.email = email;

				// Redirect after a short delay to let user see the verification notice
				setTimeout(() => {
					goto('/', { replaceState: true, noScroll: true });
				}, 3000);
			}
		} catch (e) {
			console.error('Sign up error:', e);
			error = 'Sign up failed. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="auth-container">
	<h1>Sign Up</h1>

	<form class="auth-form" on:submit|preventDefault={handleSignup}>
		<div class="auth-input-group">
			<input
				class="auth-input"
				type="text"
				bind:value={name}
				placeholder="Full Name"
				required
				disabled={isLoading}
			/>
		</div>

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
				minlength="6"
			/>
		</div>

		<div class="auth-input-group">
			<input
				class="auth-input"
				type="password"
				bind:value={confirmPassword}
				placeholder="Confirm Password"
				required
				disabled={isLoading}
				minlength="6"
			/>
		</div>

		<button class="auth-button" type="submit" disabled={isLoading}>
			{#if isLoading}
				<span class="loading-spinner"></span>
			{/if}
			{isLoading ? 'Creating account...' : 'Sign Up'}
		</button>
	</form>

	{#if error}
		<div class="auth-error">{error}</div>
	{/if}

	{#if showVerificationNotice}
		<div class="auth-success">
			<strong>Account created successfully!</strong>
			<p>We've sent a verification email to <strong>{email}</strong>.</p>
			<p>Please check your inbox and verify your email address.</p>
			<p class="redirect-note">Redirecting you to the dashboard...</p>
		</div>
	{/if}

	<div class="auth-link">
		Already have an account? <a href="/account/login">Log in</a>
	</div>
</div>
