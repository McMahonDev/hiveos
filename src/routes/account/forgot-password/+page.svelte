<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';

	let email = '';
	let message = '';
	let error = '';
	let isLoading = false;
	let emailSent = false;

	async function handleForgotPassword() {
		error = '';
		message = '';
		isLoading = true;

		try {
			const { data, error: err } = await authClient.requestPasswordReset({
				email,
				redirectTo: `${window.location.origin}/account/reset-password`
			});

			if (err) {
				error = err.message ?? 'Failed to send reset email. Please try again.';
			} else {
				emailSent = true;
				message = 'Password reset email sent! Please check your inbox and follow the instructions.';
			}
		} catch (e) {
			console.error('Forgot password error:', e);
			error = 'Failed to send reset email. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function goBackToLogin() {
		goto('/account/login');
	}
</script>

<div class="auth-container">
	<h1>Forgot Password</h1>

	{#if !emailSent}
		<form class="auth-form" on:submit|preventDefault={handleForgotPassword}>
			<div class="auth-input-group">
				<input
					class="auth-input"
					type="email"
					bind:value={email}
					placeholder="Enter your email address"
					required
					disabled={isLoading}
				/>
			</div>

			<button class="auth-button" type="submit" disabled={isLoading || !email}>
				{#if isLoading}
					<span class="loading-spinner"></span>
				{/if}
				{isLoading ? 'Sending...' : 'Send Reset Email'}
			</button>
		</form>

		{#if error}
			<div class="auth-error">{error}</div>
		{/if}

		<div class="auth-link">
			<a href="/account/login">← Back to Login</a>
		</div>
	{:else}
		{#if message}
			<div class="auth-success">{message}</div>
		{/if}

		<p style="text-align: center; color: var(--grey); margin: 2rem 0;">
			Didn't receive the email? Check your spam folder or try again in a few minutes.
		</p>

		<button class="auth-button" on:click={goBackToLogin} style="width: 100%;">
			Return to Login
		</button>
	{/if}
</div>
