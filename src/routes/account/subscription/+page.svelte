<script lang="ts">
	import { Query } from 'zero-svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	const { data, form } = $props();
	const z = data.z;
	let userId = $derived(data.id);

	const user = $derived(
		z && z.current ? new Query(z.current.query.user.where('id', userId)) : null
	);

	const userData = $derived(user?.current?.[0]);
	const tier = $derived(userData?.subscription_tier || 'free');
	const subscriptionStatus = $derived(userData?.subscription_status);
	const currentPeriodEnd = $derived(userData?.current_period_end);
	const cancelAtPeriodEnd = $derived(userData?.cancel_at_period_end);

	const isActive = $derived(subscriptionStatus === 'active');
	const isPastDue = $derived(subscriptionStatus === 'past_due');
	const isCanceled = $derived(subscriptionStatus === 'canceled');

	const formattedEndDate = $derived(() => {
		if (!currentPeriodEnd) return 'N/A';
		return new Date(currentPeriodEnd).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	});

	const tierNames: Record<string, string> = {
		free: 'Free Plan',
		individual: 'Individual Plan',
		family: 'Family Plan'
	};

	const tierPrices: Record<string, string> = {
		free: '$0/month',
		individual: '$5/month',
		family: '$20/month'
	};

	let showCancelConfirm = $state(false);
	let isProcessing = $state(false);
</script>

<svelte:head>
	<title>Subscription Management | HiveOS</title>
</svelte:head>

<div class="subscription-container">
	<div class="page-header">
		<h1>Subscription Management</h1>
		<a href="/account" class="back-link">← Back to Account</a>
	</div>

	{#if form?.success}
		<div class="alert alert-success">
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error">
			{form.error}
		</div>
	{/if}

	<div class="subscription-card">
		<div class="card-header">
			<h2>Current Plan</h2>
			{#if isActive && !cancelAtPeriodEnd}
				<span class="status-badge status-active">Active</span>
			{:else if cancelAtPeriodEnd}
				<span class="status-badge status-canceling">Canceling</span>
			{:else if isPastDue}
				<span class="status-badge status-past-due">Past Due</span>
			{:else if isCanceled}
				<span class="status-badge status-canceled">Canceled</span>
			{/if}
		</div>

		<div class="plan-info">
			<div class="plan-name">{tierNames[tier] || tier}</div>
			{#if tier !== 'free' && tier !== 'family_member' && tier !== 'team_member'}
				<div class="plan-price">{tierPrices[tier]}</div>
			{/if}
		</div>

		{#if isActive || cancelAtPeriodEnd}
			<div class="billing-info">
				<div class="info-row">
					<span class="label">Status:</span>
					<span class="value">{cancelAtPeriodEnd ? 'Cancels at period end' : 'Active'}</span>
				</div>
				<div class="info-row">
					<span class="label">{cancelAtPeriodEnd ? 'Ends on:' : 'Renews on:'}</span>
					<span class="value">{formattedEndDate()}</span>
				</div>
			</div>
		{/if}
	</div>

	{#if tier !== 'free' && (tier === 'individual' || tier === 'family')}
		<div class="actions-card">
			<h3>Manage Subscription</h3>

			{#if cancelAtPeriodEnd}
				<p class="description">
					Your subscription is scheduled to cancel on {formattedEndDate()}. You can reactivate it to
					continue service.
				</p>
				<form method="POST" action="?/reactivate" use:enhance>
					<button type="submit" class="btn btn-primary" disabled={isProcessing}>
						Reactivate Subscription
					</button>
				</form>
			{:else if isActive}
				<p class="description">
					You can cancel your subscription at any time. You'll continue to have access until the end
					of your billing period.
				</p>

				{#if !showCancelConfirm}
					<button onclick={() => (showCancelConfirm = true)} class="btn btn-danger">
						Cancel Subscription
					</button>
				{:else}
					<div class="cancel-confirm">
						<p class="warning">
							<strong>Are you sure?</strong> Your subscription will remain active until
							{formattedEndDate()}.
						</p>
						<div class="button-group">
							<form method="POST" action="?/cancel" use:enhance>
								<input type="hidden" name="immediate" value="false" />
								<button type="submit" class="btn btn-danger" disabled={isProcessing}>
									Yes, Cancel Subscription
								</button>
							</form>
							<button onclick={() => (showCancelConfirm = false)} class="btn btn-secondary">
								Nevermind
							</button>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	{#if tier === 'free'}
		<div class="upgrade-card">
			<h3>Upgrade Your Plan</h3>
			<p>Get access to premium features and unlimited storage.</p>
			<a href="/account" class="btn btn-primary">View Plans</a>
		</div>
	{/if}

	<div class="mock-notice">
		<p>
			<strong>🔧 Development Mode</strong><br />
			This is a mock subscription management page. In production, billing details and payment history
			would be managed through Stripe's Customer Portal.
		</p>
	</div>
</div>

<style>
	.subscription-container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
		color: #333;
	}

	.back-link {
		color: #1976d2;
		text-decoration: none;
		font-weight: 600;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.alert-success {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		color: #155724;
	}

	.alert-error {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
	}

	.subscription-card,
	.actions-card,
	.upgrade-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #f0f0f0;
	}

	.card-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}

	.status-badge {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.status-active {
		background: #d4edda;
		color: #155724;
	}

	.status-canceling {
		background: #fff3cd;
		color: #856404;
	}

	.status-past-due {
		background: #f8d7da;
		color: #721c24;
	}

	.status-canceled {
		background: #f0f0f0;
		color: #666;
	}

	.plan-info {
		margin-bottom: 1.5rem;
	}

	.plan-name {
		font-size: 1.75rem;
		font-weight: 700;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.plan-price {
		font-size: 1.25rem;
		color: #666;
		font-weight: 600;
	}

	.billing-info {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e0e0e0;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-row .label {
		font-weight: 600;
		color: #666;
	}

	.info-row .value {
		color: #333;
		font-weight: 500;
	}

	.actions-card h3,
	.upgrade-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #333;
	}

	.description {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.btn {
		padding: 0.875rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-danger {
		background: #dc3545;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #c82333;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #5a6268;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel-confirm {
		background: #fff3cd;
		border: 1px solid #ffc107;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.cancel-confirm .warning {
		margin-bottom: 1rem;
		color: #856404;
	}

	.button-group {
		display: flex;
		gap: 1rem;
	}

	.mock-notice {
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 8px;
		padding: 1rem;
		margin-top: 2rem;
	}

	.mock-notice p {
		margin: 0;
		color: #856404;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.button-group {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}
	}
</style>
