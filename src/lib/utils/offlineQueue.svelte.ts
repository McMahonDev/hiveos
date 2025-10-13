/**
 * Offline Queue Manager
 * 
 * Manages a queue of mutations that should be executed when online.
 * Stores mutations in localStorage and retries them when connectivity is restored.
 */

import { nanoid } from 'nanoid';
import { optimisticUpdates } from './optimisticUpdates.svelte';

export type PendingMutation = {
	id: string;
	type: 'insert' | 'update' | 'delete';
	table: 'shoppingList' | 'events' | 'tasks' | 'customListItems';
	data: any;
	timestamp: number;
	retries: number;
};

const QUEUE_KEY = 'offline-mutation-queue';
const MAX_RETRIES = 5;

class OfflineQueueManager {
	private queue = $state<PendingMutation[]>([]);
	private isProcessing = $state(false);
	public isOnline = $state(navigator.onLine);
	public hasPendingMutations = $derived(this.queue.length > 0);
	public pendingCount = $derived(this.queue.length);

	constructor() {
		// Load queue from localStorage
		this.loadQueue();

		// Listen for online/offline events
		if (typeof window !== 'undefined') {
			window.addEventListener('online', () => {
				this.isOnline = true;
				this.processQueue();
			});

			window.addEventListener('offline', () => {
				this.isOnline = false;
			});
		}
	}

	private loadQueue() {
		if (typeof window === 'undefined') return;

		try {
			const stored = localStorage.getItem(QUEUE_KEY);
			if (stored) {
				this.queue = JSON.parse(stored);
			}
		} catch (error) {
			console.error('Failed to load offline queue:', error);
			this.queue = [];
		}
	}

	private saveQueue() {
		if (typeof window === 'undefined') return;

		try {
			localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
		} catch (error) {
			console.error('Failed to save offline queue:', error);
		}
	}

	/**
	 * Add a mutation to the queue
	 */
	enqueue(mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retries'>) {
		const pending: PendingMutation = {
			...mutation,
			id: nanoid(),
			timestamp: Date.now(),
			retries: 0
		};

		this.queue = [...this.queue, pending];
		this.saveQueue();

		// Add optimistic update for immediate UI feedback
		if (mutation.type === 'insert') {
			optimisticUpdates.addItem({
				id: mutation.data.id,
				table: mutation.table,
				data: mutation.data,
				operation: 'insert'
			});
		} else if (mutation.type === 'update') {
			optimisticUpdates.updateItem(mutation.data.id, mutation.table, mutation.data);
		} else if (mutation.type === 'delete') {
			optimisticUpdates.deleteItem(mutation.data.id, mutation.table);
		}

		// Try to process immediately if online
		if (this.isOnline) {
			this.processQueue();
		}
	}

	/**
	 * Process all pending mutations
	 */
	async processQueue(z?: any) {
		if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
			return;
		}

		if (!z) {
			console.warn('Cannot process queue without Zero instance');
			return;
		}

		this.isProcessing = true;

		const mutationsToProcess = [...this.queue];
		const failedMutations: PendingMutation[] = [];

		for (const mutation of mutationsToProcess) {
			try {
				// Execute the mutation
				await this.executeMutation(z, mutation);
				
				// Remove from queue on success
				this.queue = this.queue.filter(m => m.id !== mutation.id);
				
				// Remove optimistic update (real data now available)
				optimisticUpdates.removeItem(mutation.data.id);
			} catch (error) {
				console.error('Failed to execute mutation:', error);
				
				// Increment retry count
				mutation.retries++;
				
				// Keep in queue if under max retries
				if (mutation.retries < MAX_RETRIES) {
					failedMutations.push(mutation);
				} else {
					console.error('Max retries reached for mutation:', mutation);
					// Remove from queue after max retries
					this.queue = this.queue.filter(m => m.id !== mutation.id);
				}
			}
		}

		// Update queue with failed mutations (with incremented retries)
		this.queue = failedMutations;
		this.saveQueue();
		this.isProcessing = false;
	}

	private async executeMutation(z: any, mutation: PendingMutation) {
		const { type, table, data } = mutation;

		if (!z?.current?.mutate?.[table]) {
			throw new Error(`Invalid table: ${table}`);
		}

		switch (type) {
			case 'insert':
				await z.current.mutate[table].insert(data);
				break;
			case 'update':
				await z.current.mutate[table].update(data);
				break;
			case 'delete':
				await z.current.mutate[table].delete(data);
				break;
			default:
				throw new Error(`Unknown mutation type: ${type}`);
		}
	}

	/**
	 * Clear all pending mutations (use with caution)
	 */
	clearQueue() {
		this.queue = [];
		this.saveQueue();
	}

	/**
	 * Get all pending mutations
	 */
	getPendingMutations() {
		return this.queue;
	}
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager();
