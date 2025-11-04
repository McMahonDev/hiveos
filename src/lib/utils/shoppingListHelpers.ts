/**
 * Save shopping item and store to localStorage for autocomplete
 * @param itemName - The name of the shopping item
 * @param storeName - The name of the store
 * @param savedItems - Current array of saved items
 * @param localStorageStores - Current array of saved stores
 * @returns Updated arrays for savedItems and localStorageStores
 */
export function saveToLocalStorage(
	itemName: string,
	storeName: string,
	savedItems: string[],
	localStorageStores: string[]
): { savedItems: string[]; localStorageStores: string[] } {
	let updatedItems = savedItems;
	let updatedStores = localStorageStores;

	if (itemName && !savedItems.includes(itemName)) {
		updatedItems = [...savedItems, itemName];
		localStorage.setItem('shopping-items', JSON.stringify(updatedItems));
	}

	if (storeName && storeName.trim() && !localStorageStores.includes(storeName)) {
		updatedStores = [...localStorageStores, storeName];
		localStorage.setItem('shopping-stores', JSON.stringify(updatedStores));
	}

	return { savedItems: updatedItems, localStorageStores: updatedStores };
}

/**
 * Check if a store exists only in localStorage (not in the database)
 * @param storeName - The store name to check
 * @param customListItems - Current list items from database
 * @param localStorageStores - Stores saved in localStorage
 * @returns true if store is only in localStorage
 */
export function isLocalStorageOnly(
	storeName: string,
	customListItems: any[] | null,
	localStorageStores: string[]
): boolean {
	if (!customListItems || !Array.isArray(customListItems)) {
		return localStorageStores.includes(storeName);
	}

	const isInDB = customListItems.some(
		(item: any) => item.store && item.store.trim() === storeName
	);

	return !isInDB && localStorageStores.includes(storeName);
}

/**
 * Remove a store from localStorage
 * @param storeName - The store name to remove
 * @param localStorageStores - Current array of saved stores
 * @returns Updated array of stores
 */
export function removeStore(storeName: string, localStorageStores: string[]): string[] {
	const updatedStores = localStorageStores.filter((s) => s !== storeName);
	localStorage.setItem('shopping-stores', JSON.stringify(updatedStores));
	return updatedStores;
}
