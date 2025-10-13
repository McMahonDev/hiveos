<script lang="ts">
	import { offlineQueue } from '$lib/utils/offlineQueue.svelte';

	let { z } = $props();

	// Attempt to process queue when component mounts and when online status changes
	$effect(() => {
		if (offlineQueue.isOnline && z) {
			offlineQueue.processQueue(z);
		}
	});
</script>

{#if !offlineQueue.isOnline}
	<div class="offline-banner">
		<span class="status-icon">📡</span>
		<span class="status-text">You're offline</span>
		{#if offlineQueue.hasPendingMutations}
			<span class="pending-count">{offlineQueue.pendingCount} pending change{offlineQueue.pendingCount === 1 ? '' : 's'}</span>
		{/if}
	</div>
{:else if offlineQueue.hasPendingMutations}
	<div class="syncing-banner">
		<span class="status-icon">🔄</span>
		<span class="status-text">Syncing {offlineQueue.pendingCount} change{offlineQueue.pendingCount === 1 ? '' : 's'}...</span>
	</div>
{/if}

<style>
	.offline-banner,
	.syncing-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		padding: 8px 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		animation: slideDown 0.3s ease-out;
		backdrop-filter: blur(8px);
	}

	.offline-banner {
		background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
		color: white;
		border-bottom: 2px solid rgba(0, 0, 0, 0.1);
	}

	.syncing-banner {
		background: linear-gradient(135deg, #4dabf7 0%, #339af0 100%);
		color: white;
		border-bottom: 2px solid rgba(0, 0, 0, 0.1);
	}

	.status-icon {
		font-size: 1.1rem;
		line-height: 1;
		display: flex;
		align-items: center;
	}

	.status-text {
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.pending-count {
		background: rgba(0, 0, 0, 0.2);
		padding: 3px 10px;
		border-radius: 10px;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.offline-banner,
		.syncing-banner {
			font-size: 0.8rem;
			padding: 6px 16px;
			gap: 8px;
		}

		.status-icon {
			font-size: 1rem;
		}

		.pending-count {
			padding: 2px 8px;
			font-size: 0.75rem;
		}
	}
</style>
