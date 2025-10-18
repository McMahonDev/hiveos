<script lang="ts">
	import { goto } from '$app/navigation';

	type PlanType = 'individual' | 'family';

	type Props = {
		show: boolean;
		planType: PlanType;
		onClose: () => void;
		onConfirm: () => void | Promise<void>;
	};

	let { show = $bindable(), planType, onClose, onConfirm }: Props = $props();

	const plans = {
		individual: {
			name: 'Individual Plan',
			price: '$5',
			interval: 'month',
			features: [
				'Unlimited data storage',
				'Multiple device sync',
				'Create groups with other $5 users',
				'Real-time collaboration',
				'Priority support'
			],
			color: '#1976d2'
		},
		family: {
			name: 'Family Plan',
			price: '$20',
			interval: 'month',
			features: [
				'Everything in Individual',
				'Up to 6 family members',
				'Generate access codes for family',
				'Family members get free access',
				'Manage all members'
			],
			color: '#7b1fa2'
		}
	};

	const plan = $derived(plans[planType]);
	let isProcessing = $state(false);

	async function handleConfirm() {
		isProcessing = true;
		try {
			await onConfirm();
		} finally {
			isProcessing = false;
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

{#if show}
	<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
		<div class="modal-content">
			<div class="modal-header">
				<h2>Upgrade to {plan.name}</h2>
				<button class="close-button" onclick={onClose} aria-label="Close">×</button>
			</div>

			<div class="pricing-display" style="border-color: {plan.color};">
				<div class="price">
					<span class="amount">{plan.price}</span>
					<span class="interval">/{plan.interval}</span>
				</div>
			</div>

			<div class="features-list">
				<h3>Includes:</h3>
				<ul>
					{#each plan.features as feature}
						<li>{feature}</li>
					{/each}
				</ul>
			</div>

			<div class="mock-notice">
				<p>
					<strong>🔧 Development Mode</strong><br />
					This is a mock payment flow. In production, you'll be redirected to Stripe for secure payment
					processing.
				</p>
			</div>

			<div class="modal-actions">
				<button class="cancel-button" onclick={onClose} disabled={isProcessing}> Cancel </button>
				<button
					class="confirm-button"
					onclick={handleConfirm}
					disabled={isProcessing}
					style="background: linear-gradient(135deg, {plan.color} 0%, {plan.color}dd 100%);"
				>
					{#if isProcessing}
						Processing...
					{:else}
						Continue to Payment
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		padding: 1.5rem;
		border-bottom: 1px solid #eee;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 2rem;
		color: #999;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: #f5f5f5;
		color: #333;
	}

	.pricing-display {
		padding: 2rem;
		text-align: center;
		border: 3px solid;
		margin: 1.5rem;
		border-radius: 12px;
		background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
	}

	.price {
		font-size: 3rem;
		font-weight: 700;
		color: #333;
	}

	.amount {
		color: inherit;
	}

	.interval {
		font-size: 1.25rem;
		color: #666;
		font-weight: 400;
	}

	.features-list {
		padding: 0 1.5rem 1.5rem;
	}

	.features-list h3 {
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
		color: #333;
	}

	.features-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.features-list li {
		padding: 0.75rem 0;
		padding-left: 2rem;
		position: relative;
		color: #555;
		border-bottom: 1px solid #f0f0f0;
	}

	.features-list li:last-child {
		border-bottom: none;
	}

	.features-list li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: #4caf50;
		font-weight: bold;
		font-size: 1.25rem;
	}

	.mock-notice {
		margin: 1rem 1.5rem;
		padding: 1rem;
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 8px;
		font-size: 0.9rem;
	}

	.mock-notice p {
		margin: 0;
		color: #856404;
		line-height: 1.5;
	}

	.modal-actions {
		padding: 1.5rem;
		border-top: 1px solid #eee;
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.cancel-button,
	.confirm-button {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.cancel-button {
		background: #f5f5f5;
		color: #666;
	}

	.cancel-button:hover:not(:disabled) {
		background: #e0e0e0;
	}

	.confirm-button {
		color: white;
		min-width: 160px;
	}

	.confirm-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.cancel-button:disabled,
	.confirm-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
