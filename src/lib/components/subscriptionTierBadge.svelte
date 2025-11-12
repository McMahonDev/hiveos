<script lang="ts">
	import type { User } from '../../zero-schema';
	import SubscriptionUpgradeModal from './subscriptionUpgradeModal.svelte';
	import { goto } from '$app/navigation';

	type Props = {
		user: User | null;
		showUpgradeButton?: boolean;
	};

	let { user, showUpgradeButton = true }: Props = $props();
	let showUpgradeModal = $state(false);

	const tierInfo: Record<
		string,
		{
			name: string;
			color: string;
			bgColor: string;
			features: string[];
			price?: string;
		}
	> = {
		free: {
			name: 'Free',
			color: '#666',
			bgColor: '#f5f5f5',
			features: [
				'Personal lists only',
				'Limited data storage',
				'Single device access',
				'Access to family groups (via invite)'
			],
			price: 'Free'
		},
		individual: {
			name: 'Individual',
			color: '#1976d2',
			bgColor: '#e3f2fd',
			features: [
				'Unlimited data storage',
				'Multiple devices',
				'Create groups with other $5 users',
				'Real-time collaboration'
			],
			price: '$5/month'
		},
		family: {
			name: 'Family Plan',
			color: '#7b1fa2',
			bgColor: '#f3e5f5',
			features: [
				'Everything in Individual',
				'Up to 6 family members',
				'Generate access codes',
				'Family gets free access'
			],
			price: '$20/month'
		}
	};

	const tier = $derived(user?.subscription_tier || 'free');
	const isInGroup = $derived(!!user?.active_group_id && user.active_group_id !== user.id);
	const isFamilyGuest = $derived(tier === 'free' && isInGroup);

	// Special info for family guests
	const displayInfo = $derived(() => {
		if (isFamilyGuest) {
			return {
				name: 'Family Guest',
				color: '#7b1fa2',
				bgColor: '#f3e5f5',
				features: [
					'Access to group features',
					'Free via family access code',
					'Sync with group members',
					'Real-time collaboration'
				],
				price: 'Free (via family)'
			};
		}
		return tierInfo[tier] || tierInfo.free;
	});

	const info = $derived(displayInfo());
	const isFreeTier = $derived(tier === 'free');
	const isPaidTier = $derived(tier === 'individual' || tier === 'family');

	async function handleUpgrade() {
		showUpgradeModal = true;
	}

	async function handleUpgradeConfirm() {
		// In real implementation, this would call createCheckoutSession
		// For now, redirect to mock checkout
		await goto('/api/mock-checkout?session=cs_mock_test&tier=individual');
	}
</script>

<SubscriptionUpgradeModal
	bind:show={showUpgradeModal}
	planType="individual"
	onClose={() => (showUpgradeModal = false)}
	onConfirm={handleUpgradeConfirm}
/>

<div class="tier-badge" style="background-color: {info.bgColor}; border-color: {info.color};">
	<div class="tier-header">
		<div class="tier-name" style="color: {info.color};">{info.name}</div>
		<div class="tier-price">{info.price}</div>
	</div>
	<ul class="tier-features">
		{#each info.features as feature}
			<li>{feature}</li>
		{/each}
	</ul>

	{#if isFamilyGuest}
		<div class="status-explainer">
			<h4>Your Access Status</h4>
			<p>You're a guest in a family group and have free access to group features.</p>
			<ul class="status-list">
				<li>✓ No payment required</li>
				<li>✓ Full group collaboration access</li>
				<li>ℹ️ Access ends if you leave the group</li>
			</ul>
			<p class="upgrade-note">Want to create your own groups? Upgrade to Individual plan.</p>
		</div>
	{:else if isFreeTier && user?.active_group_id}
		<div class="group-notice">
			<p>✨ You're in a group! Upgrade to Individual to create your own groups and collaborate.</p>
		</div>
	{/if}

	<div class="tier-actions">
		{#if showUpgradeButton && isFreeTier}
			<button onclick={handleUpgrade} class="upgrade-button"> Upgrade to Individual ($5) </button>
		{/if}

		{#if isPaidTier || (isFreeTier && user?.active_group_id)}
			<a href="/account/groups" class="manage-button">
				{#if tier === 'family'}
					Manage Group & Access Codes
				{:else if isPaidTier}
					Manage Groups
				{:else}
					View Group
				{/if}
			</a>
		{/if}
	</div>
</div>

<style>
	.tier-badge {
		border: 2px solid;
		border-radius: 12px;
		padding: 1.25rem;
		margin: 1rem 0;
	}

	.tier-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.tier-name {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.tier-price {
		font-size: 1rem;
		font-weight: 600;
		color: #666;
	}

	.tier-features {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem 0;
	}

	.tier-features li {
		padding: 0.5rem 0;
		padding-left: 1.5rem;
		position: relative;
		color: #555;
		font-size: 0.95rem;
	}

	.tier-features li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: #4caf50;
		font-weight: bold;
	}

	.group-notice {
		background: #e3f2fd;
		border: 1px solid #1976d2;
		border-radius: 8px;
		padding: 0.75rem;
		margin: 1rem 0 0 0;
	}

	.group-notice p {
		margin: 0;
		color: #1565c0;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.status-explainer {
		background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
		border: 2px solid #7b1fa2;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0 0 0;
	}

	.status-explainer h4 {
		margin: 0 0 0.5rem 0;
		color: #7b1fa2;
		font-size: 1rem;
	}

	.status-explainer p {
		margin: 0.5rem 0;
		color: #4a148c;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.status-list {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0;
	}

	.status-list li {
		padding: 0.25rem 0;
		color: #4a148c;
		font-size: 0.875rem;
	}

	.upgrade-note {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(123, 31, 162, 0.3);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.tier-actions {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.upgrade-button {
		display: inline-block;
		width: 100%;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		text-decoration: none;
		border: none;
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.upgrade-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.manage-button {
		display: inline-block;
		width: 100%;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #ffd400 0%, #ff9800 100%);
		color: #000;
		text-decoration: none;
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.manage-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 212, 0, 0.4);
	}
</style>
