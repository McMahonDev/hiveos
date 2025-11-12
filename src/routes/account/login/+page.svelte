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
	let needsVerification = false;
	let verificationEmail = '';
	let isResendingVerification = false;
	let resendSuccess = false;

	onMount(() => {
		// Check for success message from password reset or email verification
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
		needsVerification = false;
		resendSuccess = false;
		isLoading = true;

		try {
			const { data, error: err } = await authClient.signIn.email({
				email,
				password
			});

			if (err) {
				console.error('Login error:', err);

				// Check if error is due to unverified email (status 403 or message contains verify/verification)
				if (
					err.status === 403 ||
					err.message?.toLowerCase().includes('verify') ||
					err.message?.toLowerCase().includes('verification')
				) {
					needsVerification = true;
					verificationEmail = email;
					error =
						'Please verify your email address before logging in. Check your inbox for the verification link.';
				} else {
					error = err.message ?? 'An unknown error occurred.';
				}
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

	async function resendVerification() {
		if (!verificationEmail) return;

		isResendingVerification = true;
		resendSuccess = false;

		try {
			const response = await authClient.sendVerificationEmail({
				email: verificationEmail,
				callbackURL: '/account/verify-email'
			});

			if (response.error) {
				error = response.error.message || 'Failed to resend verification email.';
			} else {
				resendSuccess = true;
				error = '';
			}
		} catch (e) {
			console.error('Resend verification error:', e);
			error = 'Failed to resend verification email. Please try again.';
		} finally {
			isResendingVerification = false;
		}
	}
</script>

<div class="auth-container">
	<h1>Login</h1>

	<div class="info-banner free-tier-warning">
		<strong>ℹ️ Free Account Notice:</strong> Free accounts are limited to one active device. Logging
		in here will automatically log you out from other devices.
		<a href="/account/upgrade">Upgrade to Individual ($5/mo)</a> for multi-device access.
	</div>

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
		<div class="auth-error">
			{error}
			{#if needsVerification && verificationEmail}
				{#if resendSuccess}
					<div class="verification-success">
						✓ Verification email sent! Please check your inbox.
					</div>
				{:else}
					<button
						class="resend-verification-button"
						on:click={resendVerification}
						disabled={isResendingVerification}
						type="button"
					>
						{#if isResendingVerification}
							<span class="loading-spinner small"></span>
						{/if}
						{isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
					</button>
				{/if}
			{/if}
		</div>
	{/if}

	<div class="auth-link">
		Don't have an account? <a href="/account/register">Sign up</a>
	</div>
</div>

<style>
	.resend-verification-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background-color: #ffd400;
		color: #000;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		width: 100%;
	}

	.resend-verification-button:hover:not(:disabled) {
		background-color: #ffdf3d;
	}

	.resend-verification-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading-spinner.small {
		width: 16px;
		height: 16px;
		border-width: 2px;
	}

	.verification-success {
		margin-top: 1rem;
		padding: 0.75rem;
		background-color: #e8f5e9;
		color: #2e7d32;
		border-radius: 8px;
		font-weight: 500;
	}

	.free-tier-warning {
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--textColor, #333);
	}

	.free-tier-warning a {
		color: #3b82f6;
		font-weight: 600;
		text-decoration: underline;
	}
</style>
