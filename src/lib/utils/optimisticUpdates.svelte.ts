/**
 * Optimistic Updates Manager
 *
 * Manages optimistic UI updates for offline changes.
 * Tracks pending items that should be shown in the UI before they sync.
 */

export type OptimisticItem = {
	id: string;
	table: 'shoppingList' | 'events' | 'tasks' | 'customListItems';
	data: any;
	operation: 'insert' | 'update' | 'delete';
	timestamp: number;
};

const OPTIMISTIC_KEY = 'optimistic-items';

class OptimisticUpdatesManager {
	private items = $state<Map<string, OptimisticItem>>(new Map());

	constructor() {
		this.loadItems();
	}

	private loadItems() {
		if (typeof window === 'undefined') return;

		try {
			const stored = localStorage.getItem(OPTIMISTIC_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				this.items = new Map(Object.entries(parsed));
			}
		} catch (error) {
			console.error('Failed to load optimistic items:', error);
			this.items = new Map();
		}
	}

	private saveItems() {
		if (typeof window === 'undefined') return;

		try {
			const obj = Object.fromEntries(this.items);
			localStorage.setItem(OPTIMISTIC_KEY, JSON.stringify(obj));
		} catch (error) {
			console.error('Failed to save optimistic items:', error);
		}
	}

	/**
	 * Add an optimistic item (for inserts)
	 */
	addItem(item: Omit<OptimisticItem, 'timestamp'>) {
		const optimisticItem: OptimisticItem = {
			...item,
			timestamp: Date.now()
		};
		// Create a new Map to trigger reactivity
		this.items = new Map(this.items);
		this.items.set(item.id, optimisticItem);
		this.saveItems();
		console.log('Added optimistic item:', optimisticItem);
	}

	/**
	 * Update an existing item or optimistic item
	 */
	updateItem(id: string, table: OptimisticItem['table'], updates: Partial<any>) {
		const existing = this.items.get(id);
		// Create a new Map to trigger reactivity
		this.items = new Map(this.items);
		if (existing) {
			// Update the optimistic item
			existing.data = { ...existing.data, ...updates };
			this.items.set(id, existing);
		} else {
			// Create new optimistic update
			this.items.set(id, {
				id,
				table,
				data: updates,
				operation: 'update',
				timestamp: Date.now()
			});
		}
		this.saveItems();
		console.log('Updated optimistic item:', id, updates);
	}

	/**
	 * Mark an item as deleted
	 */
	deleteItem(id: string, table: OptimisticItem['table']) {
		const existing = this.items.get(id);
		// Create a new Map to trigger reactivity
		this.items = new Map(this.items);
		if (existing && existing.operation === 'insert') {
			// If it was an optimistic insert, just remove it
			this.items.delete(id);
		} else {
			// Mark as deleted
			this.items.set(id, {
				id,
				table,
				data: { id },
				operation: 'delete',
				timestamp: Date.now()
			});
		}
		this.saveItems();
		console.log('Deleted optimistic item:', id);
	}

	/**
	 * Remove an optimistic item (after successful sync)
	 */
	removeItem(id: string) {
		// Create a new Map to trigger reactivity
		this.items = new Map(this.items);
		this.items.delete(id);
		this.saveItems();
		console.log('Removed optimistic item after sync:', id);
	}

	/**
	 * Clear all optimistic items
	 */
	clearAll() {
		this.items.clear();
		this.saveItems();
	}

	/**
	 * Get all optimistic items for a specific table
	 */
	getItemsForTable(table: OptimisticItem['table']): OptimisticItem[] {
		return Array.from(this.items.values()).filter((item) => item.table === table);
	}

	/**
	 * Get a specific optimistic item
	 */
	getItem(id: string): OptimisticItem | undefined {
		return this.items.get(id);
	}

	/**
	 * Check if an item has pending changes
	 */
	hasPendingChanges(id: string): boolean {
		return this.items.has(id);
	}

	/**
	 * Merge optimistic items with real data for a table
	 */
	mergeWithRealData(table: OptimisticItem['table'], realData: any[]): any[] {
		const optimisticItems = this.getItemsForTable(table);
		const result = [...realData];

		// Apply optimistic updates
		for (const optimistic of optimisticItems) {
			const existingIndex = result.findIndex((item) => item.id === optimistic.id);

			if (optimistic.operation === 'insert') {
				// Add new items if not already present
				if (existingIndex === -1) {
					result.push(optimistic.data);
				}
			} else if (optimistic.operation === 'update') {
				// Update existing items
				if (existingIndex !== -1) {
					result[existingIndex] = { ...result[existingIndex], ...optimistic.data };
				}
			} else if (optimistic.operation === 'delete') {
				// Remove deleted items
				if (existingIndex !== -1) {
					result.splice(existingIndex, 1);
				}
			}
		}

		return result;
	}
}

// Export singleton instance
export const optimisticUpdates = new OptimisticUpdatesManager();
