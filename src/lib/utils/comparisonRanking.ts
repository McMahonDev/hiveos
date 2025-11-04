/**
 * Calculate tiered price bonus points
 * Items with lower prices get higher bonuses in a tiered system
 * @param itemPrice - The price of the current item
 * @param allPrices - All item prices for comparison
 * @param priceWeight - Weight multiplier for price bonus (1-10 scale)
 * @returns Price bonus points
 */
export function calculatePriceBonus(
	itemPrice: number | null | undefined,
	allPrices: (number | null | undefined)[],
	priceWeight: number
): number {
	// No price, no bonus
	if (itemPrice === null || itemPrice === undefined) return 0;

	// Filter valid prices and sort descending (highest to lowest)
	const validPrices = allPrices
		.filter((p): p is number => p !== null && p !== undefined)
		.sort((a, b) => b - a);

	// Need at least 2 items with prices to calculate bonus
	if (validPrices.length < 2) return 0;

	// Find position of this item's price (0 = most expensive)
	const position = validPrices.indexOf(itemPrice);
	if (position === -1) return 0;

	// Calculate tier: highest price gets 0, second gets 1, third gets 2, etc.
	const tier = validPrices.length - 1 - position;

	// Apply weight to the tier bonus
	return tier * priceWeight;
}

/**
 * Normalize a numeric value to a 0-1 scale within a set of values
 * @param value - The value to normalize
 * @param allValues - All values for this criterion
 * @param higherIsBetter - Whether higher values are better
 * @returns Normalized score between 0 and 1
 */
function normalizeNumericValue(
	value: number | null | undefined,
	allValues: (number | null | undefined)[],
	higherIsBetter: boolean
): number {
	if (value === null || value === undefined) return 0;

	// Filter out null/undefined values
	const validValues = allValues.filter((v): v is number => v !== null && v !== undefined);
	if (validValues.length === 0) return 0;
	if (validValues.length === 1) return 1; // Only one value, give it full score

	const min = Math.min(...validValues);
	const max = Math.max(...validValues);

	// If all values are the same, give full score
	if (min === max) return 1;

	// Normalize to 0-1 range
	const normalized = (value - min) / (max - min);

	// If lower is better, invert the score
	return higherIsBetter ? normalized : 1 - normalized;
}

/**
 * Calculate the total weighted score for a comparison item
 * @param itemValues - Array of values with criterion info
 * @param allItemValues - All item values for normalization of numeric criteria
 * @param priceBonus - Optional price bonus points to add to the score
 * @returns Total weighted score
 */
export function calculateItemScore(
	itemValues: Array<{
		hasFeature: boolean;
		numericValue?: number | null;
		criterion: { weight: number; type: string; higherIsBetter?: boolean };
		criterionId: string;
	}>,
	allItemValues?: Array<{
		numericValue?: number | null;
		criterionId: string;
	}>,
	priceBonus?: number
): number {
	const criteriaScore = itemValues.reduce((total, value) => {
		const { criterion } = value;

		if (criterion.type === 'number') {
			// For numeric criteria, normalize the value based on all items' values for this criterion
			const allValuesForCriterion = allItemValues
				? allItemValues
						.filter((v) => v.criterionId === value.criterionId)
						.map((v) => v.numericValue)
				: [value.numericValue];

			const normalizedScore = normalizeNumericValue(
				value.numericValue,
				allValuesForCriterion,
				criterion.higherIsBetter ?? true
			);

			// Apply weight to the normalized score
			return total + normalizedScore * criterion.weight;
		} else {
			// Boolean criteria - simple has/doesn't have
			if (value.hasFeature) {
				return total + criterion.weight;
			}
		}

		return total;
	}, 0);

	// Add price bonus if provided
	return criteriaScore + (priceBonus || 0);
}

/**
 * Rank comparison items by their scores
 * @param items - Array of comparison items with totalScore
 * @returns Sorted array with rank property added
 */
export function rankItems<T extends { id: string; totalScore: number }>(
	items: T[]
): Array<T & { rank: number }> {
	// Sort by score descending
	const sorted = [...items].sort((a, b) => b.totalScore - a.totalScore);

	// Add rank, handling ties
	let currentRank = 1;
	let previousScore: number | null = null;

	return sorted.map((item, index) => {
		if (previousScore !== null && item.totalScore < previousScore) {
			currentRank = index + 1;
		}
		previousScore = item.totalScore;

		return {
			...item,
			rank: currentRank
		};
	});
}

/**
 * Update criterion weight based on pairwise comparison
 * When comparing two criteria, the "more important" one gets higher weight
 * @param selectedCriterion - The criterion that is more important
 * @param comparedCriterion - The criterion that is less important
 * @param allCriteria - All criteria in the comparison
 * @returns Updated criteria array with adjusted weights
 */
export function updateCriteriaWeights<T extends { id: string; weight: number; sortOrder: number }>(
	selectedCriterionId: string,
	comparedCriterionId: string,
	allCriteria: T[],
	isMoreImportant: boolean
): T[] {
	return allCriteria.map((criterion) => {
		if (criterion.id === selectedCriterionId) {
			// Increment weight if selected as more important
			return {
				...criterion,
				weight: isMoreImportant ? criterion.weight + 1 : criterion.weight
			};
		} else if (criterion.id === comparedCriterionId) {
			// Increment weight if compared criterion is actually more important
			return {
				...criterion,
				weight: !isMoreImportant ? criterion.weight + 1 : criterion.weight
			};
		}
		return criterion;
	});
}

/**
 * Sort criteria by weight (highest first) and update sortOrder
 */
export function sortCriteriaByWeight<T extends { weight: number; sortOrder: number }>(
	criteria: T[]
): Array<T & { sortOrder: number }> {
	return [...criteria]
		.sort((a, b) => b.weight - a.weight)
		.map((criterion, index) => ({
			...criterion,
			sortOrder: index
		}));
}
