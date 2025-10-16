<script lang="ts">
	import type { User } from '../../zero-schema';

	type Props = {
		user: User | null;
		showUpgradeButton?: boolean;
	};

	let { user, showUpgradeButton = true }: Props = $props();

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
			features: ['Personal lists only', 'Limited data storage', 'Single device access'],
			price: 'Free'
		},
		individual: {
			name: 'Individual',
			color: '#1976d2',
			bgColor: '#e3f2fd',
			features: ['Unlimited data', 'Multiple devices', 'Collaborate with paid users'],
			price: '$5/month'
		},
		family_member: {
			name: 'Family Member',
			color: '#7b1fa2',
			bgColor: '#f3e5f5',
			features: ['Full family plan features', 'Shared family lists', 'Unlimited data'],
			price: 'Included'
		},
		family_admin: {
			name: 'Family Admin',
			color: '#7b1fa2',
			bgColor: '#f3e5f5',
			features: [
				'Up to 6 family members',
				'Generate access codes',
				'Manage members',
				'Unlimited data'
			],
			price: '$20/month'
		},
		team_member: {
			name: 'Team Member',
			color: '#d32f2f',
			bgColor: '#ffebee',
			features: ['Full team features', 'Shared team workspace', 'Unlimited data'],
			price: 'Included'
		},
		team_admin: {
			name: 'Team Admin',
			color: '#d32f2f',
			bgColor: '#ffebee',
			features: [
				'Unlimited members',
				'Generate access codes',
				'Manage team members',
				'Advanced features'
			],
			price: 'Custom'
		}
	};

	const tier = $derived(user?.subscription_tier || 'free');
	const info = $derived(tierInfo[tier] || tierInfo.free);
	const isFreeTier = $derived(tier === 'free');
</script>

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

	{#if showUpgradeButton && isFreeTier}
		<div class="tier-actions">
			<a href="/settings/subscription" class="upgrade-button"> Upgrade Plan </a>
		</div>
	{/if}
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

	.tier-actions {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.upgrade-button {
		display: inline-block;
		width: 100%;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		text-decoration: none;
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.upgrade-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}
</style>
