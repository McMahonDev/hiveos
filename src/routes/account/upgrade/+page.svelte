<script lang="ts">
	import { goto } from '$app/navigation';
	import { Query } from 'zero-svelte';

	const { data } = $props();
	const z = data.z;
	let userId = $derived(data.id);

	const user = $derived(
		z && z.current ? new Query(z.current.query.user.where('id', userId)) : null
	);

	const currentTier = $derived(user?.current?.[0]?.subscription_tier || 'free');

	const pricingTiers = [
		{
			id: 'free',
			name: 'Free',
			price: '$0',
			interval: 'forever',
			description: 'Perfect for personal use',
			features: [
				'Personal lists only',
				'Limited data storage',
				'Single device access',
				'Join family groups via access code'
			],
			buttonText: 'Current Plan',
			buttonDisabled: true,
			color: '#666',
			bgColor: '#f5f5f5'
		},
		{
			id: 'individual',
			name: 'Individual',
			price: '$5',
			interval: 'month',
			description: 'For power users who want to collaborate',
			features: [
				'Unlimited data storage',
				'Multiple device sync',
				'Create and manage groups',
				'Collaborate with other paid users',
				'Real-time collaboration',
				'Priority support'
			],
			buttonText: 'Upgrade to Individual',
			buttonDisabled: false,
			color: '#1976d2',
			bgColor: '#e3f2fd'
		},
		{
			id: 'family',
			name: 'Family Plan',
			price: '$20',
			interval: 'month',
			description: 'Perfect for families and small teams',
			features: [
				'Everything in Individual',
				'Up to 6 family members',
				'Generate access codes for family',
				'Family members get free access',
				'Centralized family management',
				'Shared family workspace'
			],
			buttonText: 'Upgrade to Family',
			buttonDisabled: false,
			color: '#7b1fa2',
			bgColor: '#f3e5f5',
			featured: true
		}
	];

	// Filter tiers based on current subscription
	const visibleTiers = $derived(
		pricingTiers
			.filter((tier) => {
				// If user is on individual or family, hide free tier
				if (currentTier === 'individual' || currentTier === 'family') {
					return tier.id !== 'free';
				}
				return true;
			})
			.map((tier) => ({
				...tier,
				buttonText: tier.id === currentTier ? 'Current Plan' : tier.buttonText,
				buttonDisabled: tier.id === currentTier
			}))
	);

	async function handleUpgrade(tierId: string) {
		if (tierId === 'free' || tierId === currentTier) return;

		// Mock checkout redirect - in production this would create a Stripe session
		await goto(`/api/mock-checkout?session=cs_mock_${tierId}&tier=${tierId}`);
	}
</script>

<div class="upgrade-container">
	<div class="header">
		<h1 class="page-title">Choose Your Plan</h1>
		<p class="page-subtitle">Upgrade to unlock collaboration features and unlimited storage</p>
	</div>

	<div class="pricing-grid">
		{#each visibleTiers as tier}
			<div
				class="pricing-card"
				class:featured={tier.featured}
				style="--tier-color: {tier.color}; --tier-bg: {tier.bgColor};"
			>
				{#if tier.featured}
					<div class="featured-badge">Most Popular</div>
				{/if}

				<div class="tier-header">
					<h2 class="tier-name">{tier.name}</h2>
					<p class="tier-description">{tier.description}</p>
				</div>

				<div class="tier-pricing">
					<span class="price">{tier.price}</span>
					<span class="interval">/{tier.interval}</span>
				</div>

				<ul class="features-list">
					{#each tier.features as feature}
						<li class="feature-item">
							<svg
								class="check-icon"
								width="20"
								height="20"
								viewBox="0 0 20 20"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle cx="10" cy="10" r="10" fill="#4caf50" />
								<path
									d="M6 10L9 13L14 7"
									stroke="white"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
							<span>{feature}</span>
						</li>
					{/each}
				</ul>

				<button
					class="upgrade-button"
					class:current-plan={tier.buttonDisabled}
					disabled={tier.buttonDisabled}
					onclick={() => handleUpgrade(tier.id)}
				>
					{tier.buttonText}
				</button>
			</div>
		{/each}
	</div>

	<div class="footer-info">
		<div class="info-card">
			<h3>💳 Secure Payment</h3>
			<p>All payments are processed securely. Cancel anytime, no questions asked.</p>
		</div>
		<div class="info-card">
			<h3>🔒 Have an Access Code?</h3>
			<p>
				If you have a family access code, you can enter it on your <a href="/account"
					>account page</a
				> to join a family group for free.
			</p>
		</div>
	</div>

	<div class="back-link">
		<a href="/account">← Back to Account</a>
	</div>
</div>

<style>
	.upgrade-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--textColor);
		margin-bottom: 0.5rem;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: var(--grey);
		max-width: 600px;
		margin: 0 auto;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.pricing-card {
		background: white;
		border: 2px solid var(--lineColor);
		border-radius: 16px;
		padding: 2rem;
		position: relative;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
	}

	.pricing-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--level-3);
		border-color: var(--tier-color);
	}

	.pricing-card.featured {
		border-color: var(--tier-color);
		box-shadow: var(--level-2);
		border-width: 3px;
	}

	.featured-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%);
		color: white;
		padding: 0.375rem 1rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 700;
		box-shadow: 0 2px 8px rgba(123, 31, 162, 0.3);
	}

	.tier-header {
		margin-bottom: 1.5rem;
	}

	.tier-name {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--tier-color);
		margin-bottom: 0.5rem;
	}

	.tier-description {
		font-size: 0.95rem;
		color: var(--grey);
		margin: 0;
	}

	.tier-pricing {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid var(--lineColor);
	}

	.price {
		font-size: 3rem;
		font-weight: 800;
		color: var(--textColor);
	}

	.interval {
		font-size: 1.1rem;
		color: var(--grey);
		font-weight: 500;
	}

	.features-list {
		list-style: none;
		padding: 0;
		margin: 0 0 2rem 0;
		flex: 1;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0;
		color: var(--textColor);
		font-size: 0.95rem;
	}

	.check-icon {
		flex-shrink: 0;
	}

	.upgrade-button {
		width: 100%;
		padding: 1rem 1.5rem;
		background: var(--tier-color);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 1.05rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.upgrade-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		filter: brightness(1.1);
	}

	.upgrade-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.upgrade-button.current-plan {
		background: var(--backgroundGrey);
		color: var(--grey);
		cursor: not-allowed;
		box-shadow: none;
	}

	.footer-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.info-card {
		background: var(--backgroundGrey);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--lineColor);
	}

	.info-card h3 {
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
		color: var(--textColor);
	}

	.info-card p {
		margin: 0;
		color: var(--grey);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.info-card a {
		color: var(--primary);
		text-decoration: underline;
	}

	.back-link {
		text-align: center;
		margin-top: 2rem;
	}

	.back-link a {
		color: var(--grey);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s;
	}

	.back-link a:hover {
		color: var(--textColor);
	}

	@media (max-width: 768px) {
		.page-title {
			font-size: 2rem;
		}

		.pricing-grid {
			grid-template-columns: 1fr;
		}

		.footer-info {
			grid-template-columns: 1fr;
		}
	}
</style>
