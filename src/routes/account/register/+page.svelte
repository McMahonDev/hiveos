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
	let registrationSuccess = false;
	let registeredEmail = '';

	async function handleSignup() {
		error = '';
		registrationSuccess = false;

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
				callbackURL: '/account/verify-email'
			});

			if (err) {
				error = err.message ?? 'An unknown error occurred.';
			} else {
				// With email verification enabled, show success message instead of auto-login
				registrationSuccess = true;
				registeredEmail = email;

				// Clear form
				name = '';
				email = '';
				password = '';
				confirmPassword = '';
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

	{#if registrationSuccess}
		<div class="auth-success-message">
			<div class="success-icon">✓</div>
			<h2>Registration Successful!</h2>
			<p>We've sent a verification email to <strong>{registeredEmail}</strong></p>
			<p>Please check your inbox and click the verification link to activate your account.</p>
			<div class="auth-info">
				<p><strong>Didn't receive the email?</strong></p>
				<p>Check your spam folder or contact support if you need assistance.</p>
			</div>
			<div class="auth-link">
				<a href="/account/login">Go to Login</a>
			</div>
		</div>
	{:else}
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

		<div class="auth-link">
			Already have an account? <a href="/account/login">Log in</a>
		</div>
	{/if}
</div>

<style>
	.auth-success-message {
		text-align: center;
		padding: 1rem 0;
	}

	.success-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background-color: #e8f5e9;
		color: #2e7d32;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: bold;
		margin: 0 auto 1rem;
	}

	.auth-success-message h2 {
		color: #1a1f51;
		margin: 1rem 0;
		font-size: 1.5rem;
	}

	.auth-success-message p {
		color: #666;
		margin: 0.5rem 0;
		line-height: 1.5;
	}

	.auth-success-message strong {
		color: #1a1f51;
	}

	.auth-info {
		background-color: #f5f5f5;
		border-radius: 8px;
		padding: 1rem;
		margin: 1.5rem 0;
	}

	.auth-info p {
		margin: 0.25rem 0;
		font-size: 0.9rem;
	}

	.auth-link {
		margin-top: 1.5rem;
	}
</style>
