<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let status: 'verifying' | 'success' | 'error' = 'verifying';
	let errorMessage = '';
	let canResend = false;
	let email = '';
	let isResending = false;
	let resendSuccess = false;

	onMount(async () => {
		// Get token from URL
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');
		email = urlParams.get('email') || '';

		if (!token) {
			status = 'error';
			errorMessage =
				'No verification token found. Please check your email for the verification link.';
			canResend = true;
			return;
		}

		try {
			// Verify the email with the token
			const response = await authClient.verifyEmail({
				query: {
					token
				}
			});

			if (response.error) {
				status = 'error';
				errorMessage =
					response.error.message || 'Failed to verify email. The link may be expired or invalid.';
				canResend = true;
			} else {
				status = 'success';
				// Redirect to login after 3 seconds
				setTimeout(() => {
					goto('/account/login?message=Email verified successfully! You can now log in.');
				}, 3000);
			}
		} catch (error) {
			console.error('Verification error:', error);
			status = 'error';
			errorMessage = 'An unexpected error occurred. Please try again.';
			canResend = true;
		}
	});

	async function resendVerification() {
		if (!email) {
			errorMessage = 'Email address not found. Please sign up again.';
			return;
		}

		isResending = true;
		resendSuccess = false;

		try {
			const response = await authClient.sendVerificationEmail({
				email,
				callbackURL: '/account/verify-email'
			});

			if (response.error) {
				errorMessage = response.error.message || 'Failed to resend verification email.';
			} else {
				resendSuccess = true;
				errorMessage = '';
			}
		} catch (error) {
			console.error('Resend error:', error);
			errorMessage = 'Failed to resend verification email. Please try again.';
		} finally {
			isResending = false;
		}
	}
</script>

<div class="auth-container">
	{#if status === 'verifying'}
		<div class="verification-status">
			<div class="loading-spinner large"></div>
			<h1>Verifying your email...</h1>
			<p>Please wait while we verify your email address.</p>
		</div>
	{:else if status === 'success'}
		<div class="verification-status success">
			<div class="success-icon">✓</div>
			<h1>Email Verified!</h1>
			<p>Your email has been successfully verified.</p>
			<p>Redirecting you to login...</p>
		</div>
	{:else if status === 'error'}
		<div class="verification-status error">
			<div class="error-icon">✕</div>
			<h1>Verification Failed</h1>
			<p class="error-message">{errorMessage}</p>

			{#if canResend && email}
				{#if resendSuccess}
					<div class="auth-success">Verification email sent! Please check your inbox.</div>
				{:else}
					<button class="auth-button" on:click={resendVerification} disabled={isResending}>
						{#if isResending}
							<span class="loading-spinner"></span>
						{/if}
						{isResending ? 'Sending...' : 'Resend Verification Email'}
					</button>
				{/if}
			{/if}

			<div class="auth-link">
				<a href="/account/register">Back to Sign Up</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.verification-status {
		text-align: center;
		padding: 2rem 0;
	}

	.verification-status h1 {
		margin: 1rem 0;
		font-size: 1.5rem;
		color: #1a1f51;
	}

	.verification-status p {
		color: #666;
		margin: 0.5rem 0;
	}

	.loading-spinner.large {
		width: 48px;
		height: 48px;
		border-width: 4px;
		margin: 0 auto;
	}

	.success-icon,
	.error-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: bold;
		margin: 0 auto 1rem;
	}

	.success-icon {
		background-color: #e8f5e9;
		color: #2e7d32;
	}

	.error-icon {
		background-color: #ffebee;
		color: #c62828;
	}

	.error-message {
		color: #d32f2f;
		margin: 1rem 0;
	}

	.auth-button {
		margin-top: 1.5rem;
	}

	.auth-link {
		margin-top: 1rem;
	}
</style>
