<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authClient } from '$lib/auth/client';

	let verificationStatus = $state<'loading' | 'success' | 'error'>('loading');
	let errorMessage = $state('');
	let countdown = $state(5);

	onMount(() => {
		// Get the token from URL query params
		const token = $page.url.searchParams.get('token');
		const callbackURL = $page.url.searchParams.get('callbackURL') || '/';

		if (!token) {
			verificationStatus = 'error';
			errorMessage = 'No verification token provided';
			return;
		}

		let interval: ReturnType<typeof setInterval>;

		// Async verification
		(async () => {
			try {
				// Verify the email with the token
				const result = await authClient.verifyEmail({
					query: {
						token: token
					}
				});

				if (result.error) {
					verificationStatus = 'error';
					errorMessage = result.error.message || 'Failed to verify email';
					return;
				}

				verificationStatus = 'success';

				// Start countdown and redirect
				interval = setInterval(() => {
					countdown--;
					if (countdown <= 0) {
						clearInterval(interval);
						goto(callbackURL);
					}
				}, 1000);
			} catch (error) {
				verificationStatus = 'error';
				errorMessage = 'An unexpected error occurred';
				console.error('Verification error:', error);
			}
		})();

		// Cleanup function
		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	});
</script>

<div class="verify-container">
	<div class="verify-card">
		{#if verificationStatus === 'loading'}
			<div class="loading-state">
				<div class="spinner"></div>
				<h1>Verifying your email...</h1>
				<p>Please wait while we verify your email address.</p>
			</div>
		{:else if verificationStatus === 'success'}
			<div class="success-state">
				<div class="success-icon">✓</div>
				<h1>Email Verified!</h1>
				<p>Your email has been successfully verified.</p>
				<p class="redirect-text">
					Redirecting you in {countdown} second{countdown !== 1 ? 's' : ''}...
				</p>
				<a href="/" class="button-link">Go to Dashboard Now</a>
			</div>
		{:else}
			<div class="error-state">
				<div class="error-icon">✕</div>
				<h1>Verification Failed</h1>
				<p class="error-message">{errorMessage}</p>
				<p>The verification link may have expired or is invalid.</p>
				<div class="action-buttons">
					<a href="/account" class="button-link">Go to Account</a>
					<a href="/" class="button-link secondary">Go to Home</a>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.verify-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, var(--primary) 0%, #ffa500 100%);
	}

	.verify-card {
		background: white;
		border-radius: 16px;
		padding: 3rem 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		text-align: center;
	}

	.loading-state,
	.success-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 60px;
		height: 60px;
		border: 4px solid rgba(0, 0, 0, 0.1);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.success-icon {
		width: 80px;
		height: 80px;
		background: var(--green);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		font-weight: bold;
		animation: scaleIn 0.3s ease-out;
	}

	.error-icon {
		width: 80px;
		height: 80px;
		background: var(--danger);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		font-weight: bold;
		animation: scaleIn 0.3s ease-out;
	}

	@keyframes scaleIn {
		from {
			transform: scale(0);
		}
		to {
			transform: scale(1);
		}
	}

	h1 {
		font-size: 2rem;
		font-weight: 800;
		color: var(--textColor);
		margin: 0;
	}

	p {
		font-size: 1.1rem;
		color: var(--grey);
		margin: 0;
		line-height: 1.6;
	}

	.error-message {
		color: var(--danger);
		font-weight: 600;
	}

	.redirect-text {
		font-size: 0.95rem;
		color: var(--grey);
		font-style: italic;
	}

	.button-link {
		display: inline-block;
		padding: 0.875rem 2rem;
		background: var(--primary);
		color: #000;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 700;
		font-size: 1rem;
		margin-top: 1rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(255, 212, 0, 0.3);
	}

	.button-link:hover {
		background: #e6c000;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 212, 0, 0.4);
	}

	.button-link.secondary {
		background: transparent;
		color: var(--textColor);
		border: 2px solid var(--lineColor);
		box-shadow: none;
	}

	.button-link.secondary:hover {
		background: var(--backgroundGrey);
		border-color: var(--primary);
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	@media (max-width: 640px) {
		.verify-card {
			padding: 2rem 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		p {
			font-size: 1rem;
		}

		.action-buttons {
			flex-direction: column;
			width: 100%;
		}

		.button-link {
			width: 100%;
		}
	}
</style>
