<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let newPassword = '';
	let confirmPassword = '';
	let error = '';
	let isLoading = false;
	let token = '';
	let tokenError = false;

	onMount(() => {
		// Get the token from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const urlToken = urlParams.get('token');
		const errorParam = urlParams.get('error');

		if (errorParam === 'invalid_token') {
			tokenError = true;
			error = 'Invalid or expired reset token. Please request a new password reset.';
		} else if (urlToken) {
			token = urlToken;
		} else {
			tokenError = true;
			error = 'No reset token found. Please request a new password reset.';
		}
	});

	async function handleResetPassword() {
		error = '';

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		if (newPassword.length < 6) {
			error = 'Password must be at least 6 characters long.';
			return;
		}

		isLoading = true;

		try {
			const { data, error: err } = await authClient.resetPassword({
				newPassword,
				token
			});

			if (err) {
				error = err.message ?? 'Failed to reset password. Please try again.';
			} else {
				// Password reset successful, redirect to login
				goto(
					'/account/login?message=Password reset successful. Please log in with your new password.'
				);
			}
		} catch (e) {
			console.error('Reset password error:', e);
			error = 'Failed to reset password. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function goToForgotPassword() {
		goto('/account/forgot-password');
	}
</script>

<div class="auth-container">
	<h1>Reset Password</h1>

	{#if tokenError}
		{#if error}
			<div class="auth-error">{error}</div>
		{/if}

		<p style="text-align: center; color: var(--grey); margin: 2rem 0;">
			The reset link may have expired or is invalid.
		</p>

		<button class="auth-button" on:click={goToForgotPassword} style="width: 100%;">
			Request New Reset Link
		</button>

		<div class="auth-link">
			<a href="/account/login">← Back to Login</a>
		</div>
	{:else}
		<form class="auth-form" on:submit|preventDefault={handleResetPassword}>
			<div class="auth-input-group">
				<input
					class="auth-input"
					type="password"
					bind:value={newPassword}
					placeholder="New password"
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
					placeholder="Confirm new password"
					required
					disabled={isLoading}
					minlength="6"
				/>
			</div>

			<button
				class="auth-button"
				type="submit"
				disabled={isLoading || !newPassword || !confirmPassword}
			>
				{#if isLoading}
					<span class="loading-spinner"></span>
				{/if}
				{isLoading ? 'Resetting...' : 'Reset Password'}
			</button>
		</form>

		{#if error}
			<div class="auth-error">{error}</div>
		{/if}

		<div class="auth-link">
			<a href="/account/login">← Back to Login</a>
		</div>
	{/if}
</div>
