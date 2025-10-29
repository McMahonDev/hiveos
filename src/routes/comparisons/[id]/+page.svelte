<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import {
		calculateItemScore,
		rankItems,
		updateCriteriaWeights,
		sortCriteriaByWeight
	} from '$lib/utils/comparisonRanking';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();
	let z = $derived(data.z);
	let userId = $derived(data.id);
	let comparisonId = $derived($page.params.id);

	let comparison = $state<Query<any, any, any> | undefined>(undefined);
	let criteria = $state<Query<any, any, any> | undefined>(undefined);
	let items = $state<Query<any, any, any> | undefined>(undefined);
	let itemValues = $state<Query<any, any, any> | undefined>(undefined);
	let accessDenied = $state(false);

	// Modal states
	let addCriterionModalOpen = $state(false);
	let editCriterionModalOpen = $state(false);
	let addItemModalOpen = $state(false);
	let setItemValuesModalOpen = $state(false);

	// Drag and drop state
	let draggedCriterion = $state<any>(null);
	let draggedOverCriterion = $state<any>(null);

	// Form states
	let newCriterionName = $state('');
	let newCriterionType = $state<'boolean' | 'number'>('boolean');
	let newCriterionHigherIsBetter = $state(true);
	let editingCriterion = $state<any>(null);
	let editCriterionName = $state('');
	let editCriterionType = $state<'boolean' | 'number'>('boolean');
	let editCriterionHigherIsBetter = $state(true);
	let newItemName = $state('');
	let newItemPrice = $state<number | null>(null);
	let newItemNotes = $state('');

	// Item values state
	let selectedItem = $state<any>(null);
	let itemValueStates = $state<Record<string, boolean>>({});
	let itemNumericValues = $state<Record<string, number | null>>({});

	$effect(() => {
		if (z?.current && comparisonId) {
			comparison = new Query(z.current.query.comparisons.where('id', comparisonId));

			criteria = new Query(
				z.current.query.comparisonCriteria
					.where('comparisonId', comparisonId)
					.orderBy('sortOrder', 'asc')
			);

			items = new Query(
				z.current.query.comparisonItems
					.where('comparisonId', comparisonId)
					.orderBy('totalScore', 'desc')
			);

			itemValues = new Query(
				z.current.query.comparisonItemValues.related('comparisonItem', (q: any) =>
					q.where('comparisonId', comparisonId)
				)
			);
		}
	});

	// Security check: Verify access permissions
	$effect(() => {
		if (comparison?.current && Array.isArray(comparison.current) && comparison.current[0]) {
			const comp = comparison.current[0];
			const currentViewMode = viewModeState.currentMode;

			// Check if the comparison belongs to the current user
			if (comp.createdById !== userId) {
				console.warn('Access denied: Comparison does not belong to current user');
				accessDenied = true;
				goto('/comparisons');
				return;
			}

			// Check if the comparison's view mode matches the current view mode
			if (comp.viewMode !== currentViewMode) {
				console.warn('Access denied: Comparison view mode does not match current view mode');
				accessDenied = true;
				goto('/comparisons');
				return;
			}

			accessDenied = false;
		}
	});

	// Watch for view mode changes and redirect if needed
	$effect(() => {
		const currentViewMode = viewModeState.currentMode;
		if (comparison?.current && Array.isArray(comparison.current) && comparison.current[0]) {
			const comp = comparison.current[0];
			if (comp.viewMode !== currentViewMode) {
				console.log('View mode changed, redirecting to comparisons home');
				goto('/comparisons');
			}
		}
	});

	// Calculate scores on the fly
	let rankedItems = $derived.by(() => {
		if (!items?.current || !Array.isArray(items.current)) return [];
		if (!criteria?.current || !Array.isArray(criteria.current)) return [];
		if (!itemValues?.current || !Array.isArray(itemValues.current)) return [];

		const allCriteria = criteria.current;
		const allValues = itemValues.current;

		// Calculate score for each item
		const itemsWithScores = items.current.map((item: any) => {
			const itemCriteriaValues = allValues
				.filter((v: any) => v.comparisonItemId === item.id)
				.map((v: any) => {
					const criterion = allCriteria.find((c: any) => c.id === v.criterionId);
					return {
						hasFeature: v.hasFeature,
						numericValue: v.numericValue,
						criterion: {
							weight: criterion?.weight || 0,
							type: criterion?.type || 'boolean',
							higherIsBetter: criterion?.higherIsBetter ?? true
						},
						criterionId: v.criterionId
					};
				});

			const totalScore = calculateItemScore(itemCriteriaValues, allValues);

			return {
				...item,
				totalScore
			};
		});

		// Rank the items
		return rankItems(itemsWithScores);
	});

	async function addCriterion(e: Event) {
		e.preventDefault();
		if (!z?.current || !newCriterionName.trim() || !comparisonId) return;

		const existingCriteria = Array.isArray(criteria?.current) ? criteria.current : [];

		// Calculate weight based on position (highest sortOrder gets lowest weight)
		const maxSortOrder = existingCriteria.length;
		const newWeight = existingCriteria.length > 0 ? 1 : 1; // Start with weight 1 (lowest priority)

		try {
			await z.current.mutate.comparisonCriteria.insert({
				id: nanoid(),
				comparisonId,
				name: newCriterionName.trim(),
				type: newCriterionType,
				higherIsBetter: newCriterionType === 'number' ? newCriterionHigherIsBetter : null,
				weight: newWeight,
				sortOrder: maxSortOrder,
				createdById: userId,
				createdAt: Date.now()
			});

			// Create empty values for all items
			const allItems = Array.isArray(items?.current) ? items.current : [];
			const newCriterionId = nanoid();
			for (const item of allItems) {
				await z.current.mutate.comparisonItemValues.insert({
					id: nanoid(),
					comparisonItemId: item.id,
					criterionId: newCriterionId,
					hasFeature: false,
					numericValue: null,
					notes: null,
					createdById: userId,
					createdAt: Date.now()
				});
			}

			newCriterionName = '';
			newCriterionType = 'boolean';
			newCriterionHigherIsBetter = true;
			addCriterionModalOpen = false;
		} catch (err) {
			console.error('Failed to add criterion:', err);
		}
	}

	// Drag and drop handlers
	function handleDragStart(criterion: any) {
		draggedCriterion = criterion;
	}

	function handleDragOver(e: DragEvent, criterion: any) {
		e.preventDefault();
		draggedOverCriterion = criterion;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();

		if (!z?.current || !draggedCriterion || !draggedOverCriterion) return;
		if (draggedCriterion.id === draggedOverCriterion.id) {
			draggedCriterion = null;
			draggedOverCriterion = null;
			return;
		}

		const allCriteria = Array.isArray(criteria?.current) ? [...criteria.current] : [];
		const draggedIdx = allCriteria.findIndex((c: any) => c.id === draggedCriterion.id);
		const droppedIdx = allCriteria.findIndex((c: any) => c.id === draggedOverCriterion.id);

		if (draggedIdx === -1 || droppedIdx === -1) return;

		// Reorder the array
		const [removed] = allCriteria.splice(draggedIdx, 1);
		allCriteria.splice(droppedIdx, 0, removed);

		// Update sortOrder and weight based on new positions
		// Higher position (index 0) = higher weight
		try {
			for (let i = 0; i < allCriteria.length; i++) {
				const criterion = allCriteria[i];
				const newWeight = allCriteria.length - i; // First item gets highest weight
				await z.current.mutate.comparisonCriteria.update({
					id: criterion.id,
					sortOrder: i,
					weight: newWeight
				});
			}
		} catch (err) {
			console.error('Failed to reorder criteria:', err);
		}

		draggedCriterion = null;
		draggedOverCriterion = null;
	}

	function handleDragEnd() {
		draggedCriterion = null;
		draggedOverCriterion = null;
	}

	async function deleteCriterion(criterionId: string) {
		if (!z?.current) return;

		try {
			// Delete all item values for this criterion
			const valuesToDelete = Array.isArray(itemValues?.current)
				? itemValues.current.filter((v: any) => v.criterionId === criterionId)
				: [];
			if (valuesToDelete.length > 0) {
				for (const value of valuesToDelete) {
					await z.current.mutate.comparisonItemValues.delete({ id: value.id });
				}
			}

			// Delete the criterion
			await z.current.mutate.comparisonCriteria.delete({ id: criterionId });

			// Recalculate item scores and update sortOrder for remaining criteria
			const remainingCriteria = Array.isArray(criteria?.current)
				? criteria.current.filter((c: any) => c.id !== criterionId)
				: [];

			for (let i = 0; i < remainingCriteria.length; i++) {
				const criterion = remainingCriteria[i];
				const newWeight = remainingCriteria.length - i;
				await z.current.mutate.comparisonCriteria.update({
					id: criterion.id,
					sortOrder: i,
					weight: newWeight
				});
			}
		} catch (err) {
			console.error('Failed to delete criterion:', err);
		}
	}

	function openEditCriterionModal(criterion: any) {
		editingCriterion = criterion;
		editCriterionName = criterion.name;
		editCriterionType = criterion.type || 'boolean';
		editCriterionHigherIsBetter = criterion.higherIsBetter ?? true;
		editCriterionModalOpen = true;
	}

	async function saveEditedCriterion(e: Event) {
		e.preventDefault();
		if (!z?.current || !editingCriterion || !editCriterionName.trim()) return;

		try {
			await z.current.mutate.comparisonCriteria.update({
				id: editingCriterion.id,
				name: editCriterionName.trim(),
				type: editCriterionType,
				higherIsBetter: editCriterionType === 'number' ? editCriterionHigherIsBetter : null
			});

			editCriterionModalOpen = false;
			editingCriterion = null;
		} catch (err) {
			console.error('Failed to update criterion:', err);
		}
	}

	function openAddItemModal() {
		newItemName = '';
		newItemPrice = null;
		newItemNotes = '';
		addItemModalOpen = true;
	}

	async function addItem(e: Event) {
		e.preventDefault();
		if (!z?.current || !newItemName.trim() || !comparisonId) return;

		const itemId = nanoid();

		try {
			await z.current.mutate.comparisonItems.insert({
				id: itemId,
				comparisonId,
				name: newItemName.trim(),
				price: newItemPrice,
				notes: newItemNotes.trim() || null,
				totalScore: 0,
				createdById: userId,
				createdAt: Date.now()
			});

			// Create empty values for all criteria
			const allCriteria = Array.isArray(criteria?.current) ? criteria.current : [];
			for (const criterion of allCriteria) {
				await z.current.mutate.comparisonItemValues.insert({
					id: nanoid(),
					comparisonItemId: itemId,
					criterionId: criterion.id,
					hasFeature: false,
					numericValue: null,
					notes: null,
					createdById: userId,
					createdAt: Date.now()
				});
			}

			addItemModalOpen = false;
		} catch (err) {
			console.error('Failed to add item:', err);
		}
	}

	async function deleteItem(itemId: string) {
		if (!z?.current) return;

		try {
			// Delete all values for this item
			const valuesToDelete = Array.isArray(itemValues?.current)
				? itemValues.current.filter((v: any) => v.comparisonItemId === itemId)
				: [];
			if (valuesToDelete.length > 0) {
				for (const value of valuesToDelete) {
					await z.current.mutate.comparisonItemValues.delete({ id: value.id });
				}
			}

			// Delete the item
			await z.current.mutate.comparisonItems.delete({ id: itemId });
		} catch (err) {
			console.error('Failed to delete item:', err);
		}
	}

	function openSetItemValuesModal(item: any) {
		selectedItem = item;
		const allCriteria = Array.isArray(criteria?.current) ? criteria.current : [];
		const values = Array.isArray(itemValues?.current) ? itemValues.current : [];

		// Build initial state for both boolean and numeric values
		const boolStates: Record<string, boolean> = {};
		const numericStates: Record<string, number | null> = {};

		for (const criterion of allCriteria) {
			const value = values.find(
				(v: any) => v.comparisonItemId === item.id && v.criterionId === criterion.id
			);

			if (criterion.type === 'number') {
				numericStates[criterion.id] = value?.numericValue ?? null;
			} else {
				boolStates[criterion.id] = value?.hasFeature || false;
			}
		}

		itemValueStates = boolStates;
		itemNumericValues = numericStates;
		setItemValuesModalOpen = true;
	}

	async function saveItemValues() {
		if (!z?.current || !selectedItem) return;

		try {
			const values = Array.isArray(itemValues?.current) ? itemValues.current : [];
			const allCriteria = Array.isArray(criteria?.current) ? criteria.current : [];

			// Save both boolean and numeric values
			for (const criterion of allCriteria) {
				const existingValue = values.find(
					(v: any) => v.comparisonItemId === selectedItem.id && v.criterionId === criterion.id
				);

				const hasFeature = criterion.type === 'boolean' ? itemValueStates[criterion.id] : false;
				const numericValue = criterion.type === 'number' ? itemNumericValues[criterion.id] : null;

				if (existingValue) {
					await z.current.mutate.comparisonItemValues.update({
						id: existingValue.id,
						hasFeature,
						numericValue
					});
				} else {
					await z.current.mutate.comparisonItemValues.insert({
						id: nanoid(),
						comparisonItemId: selectedItem.id,
						criterionId: criterion.id,
						hasFeature,
						numericValue,
						notes: null,
						createdById: userId,
						createdAt: Date.now()
					});
				}
			}

			setItemValuesModalOpen = false;
			selectedItem = null;
		} catch (err) {
			console.error('Failed to save item values:', err);
		}
	}
</script>

<div class="comparison-page">
	{#if accessDenied}
		<div class="access-denied">
			<h2>Access Denied</h2>
			<p>
				You don't have permission to view this comparison or it doesn't exist in the current view
				mode.
			</p>
			<a href="/comparisons" class="back-btn">← Back to Comparisons</a>
		</div>
	{:else if comparison?.current && Array.isArray(comparison.current) && comparison.current[0]}
		{@const comp = comparison.current[0]}

		<div class="page-title-section">
			<a href="/comparisons" class="back-link">← Back to Comparisons</a>
			<h1>{comp.name}</h1>
			{#if comp.description}
				<p class="description">{comp.description}</p>
			{/if}
		</div>

		<div class="content-grid">
			<!-- Criteria Section -->
			<section class="section">
				<div class="section-header">
					<h2>Criteria ({criteria?.current?.length || 0})</h2>
					<div class="header-buttons">
						<button class="add-btn" onclick={() => (addCriterionModalOpen = true)}>
							+ Add Criterion
						</button>
					</div>
				</div>

				{#if criteria?.current && Array.isArray(criteria.current) && criteria.current.length > 1}
					<p class="drag-hint">Drag to reorder - Top = Most Important</p>
				{/if}

				{#if criteria?.current && Array.isArray(criteria.current)}
					{#if criteria.current.length === 0}
						<div class="empty-section">
							<p>No criteria yet. Add what matters most to you!</p>
						</div>
					{:else}
						<div class="criteria-list">
							{#each criteria.current as criterion (criterion.id)}
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="criterion-item"
									class:dragging={draggedCriterion?.id === criterion.id}
									class:drag-over={draggedOverCriterion?.id === criterion.id}
									draggable="true"
									role="button"
									tabindex="0"
									ondragstart={() => handleDragStart(criterion)}
									ondragover={(e) => handleDragOver(e, criterion)}
									ondrop={handleDrop}
									ondragend={handleDragEnd}
								>
									<div class="drag-handle" aria-label="Drag to reorder">⋮⋮</div>
									<div class="criterion-info">
										<span class="criterion-name">{criterion.name}</span>
										<div class="criterion-meta">
											<span class="criterion-weight">Weight: {criterion.weight}</span>
											{#if criterion.type === 'number'}
												<span class="criterion-type">
													Numeric • {criterion.higherIsBetter === false
														? '↓ Lower is better'
														: '↑ Higher is better'}
												</span>
											{:else}
												<span class="criterion-type">Yes/No</span>
											{/if}
										</div>
									</div>
									<div class="criterion-actions">
										<button
											class="edit-small-btn"
											onclick={() => openEditCriterionModal(criterion)}
											aria-label="Edit criterion"
										>
											Edit
										</button>
										<button
											class="delete-small-btn"
											onclick={() => deleteCriterion(criterion.id)}
											aria-label="Delete criterion"
										>
											×
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</section>

			<!-- Items Section -->
			<section class="section">
				<div class="section-header">
					<h2>Items ({items?.current?.length || 0})</h2>
					<button class="add-btn" onclick={openAddItemModal}>+ Add Item</button>
				</div>

				{#if items?.current && Array.isArray(items.current)}
					{#if items.current.length === 0}
						<div class="empty-section">
							<p>No items yet. Add things you want to compare!</p>
						</div>
					{:else}
						<div class="items-list">
							{#each rankedItems as item (item.id)}
								{@const itemCriteriaValues = Array.isArray(itemValues?.current)
									? itemValues.current.filter((v: any) => v.comparisonItemId === item.id)
									: []}
								<div class="item-card">
									<div class="item-header">
										<div class="item-title">
											<h3>#{item.rank} {item.name}</h3>
										</div>
										<button
											class="delete-small-btn"
											onclick={() => deleteItem(item.id)}
											aria-label="Delete item"
										>
											×
										</button>
									</div>
									<div class="item-details">
										<div class="score">Score: {item.totalScore.toFixed(2)}</div>
										{#if comp.isPriceAFactor && item.price}
											<div class="price">Price: ${item.price}</div>
										{/if}
									</div>

									<!-- Show criteria values -->
									{#if criteria?.current && Array.isArray(criteria.current)}
										<div class="criteria-values">
											{#each criteria.current as criterion (criterion.id)}
												{@const value = itemCriteriaValues.find(
													(v: any) => v.criterionId === criterion.id
												)}
												{@const allValuesForCriterion = Array.isArray(itemValues?.current)
													? itemValues.current.filter((v: any) => v.criterionId === criterion.id)
													: []}
												{@const points = (() => {
													if (criterion.type === 'number' && value?.numericValue != null) {
														// Calculate normalized score for numeric
														const validValues = allValuesForCriterion
															.map((v: any) => v.numericValue)
															.filter((v: any) => v != null);
														if (validValues.length === 0) return 0;
														if (validValues.length === 1) return criterion.weight;
														const min = Math.min(...validValues);
														const max = Math.max(...validValues);
														if (min === max) return criterion.weight;
														const normalized = (value.numericValue - min) / (max - min);
														const finalScore =
															criterion.higherIsBetter === false ? 1 - normalized : normalized;
														return finalScore * criterion.weight;
													} else if (criterion.type === 'boolean') {
														// Boolean criteria
														return value?.hasFeature ? criterion.weight : 0;
													}
													return 0;
												})()}
												<div class="criterion-value">
													<span class="criterion-label">{criterion.name}:</span>
													<div class="value-with-points">
														{#if criterion.type === 'number'}
															<span class="value-display">
																{value?.numericValue ?? 'N/A'}
															</span>
														{:else}
															<span class="value-display">
																{value?.hasFeature ? '✓' : '✗'}
															</span>
														{/if}
														<span class="points-display">({points.toFixed(2)} pts)</span>
													</div>
												</div>
											{/each}
										</div>
									{/if}

									{#if item.notes}
										<p class="item-notes">{item.notes}</p>
									{/if}
									<button class="set-values-btn" onclick={() => openSetItemValuesModal(item)}>
										Set Values
									</button>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</section>
		</div>
	{:else}
		<div class="loading">Loading comparison...</div>
	{/if}
</div>

<!-- Add Criterion Modal -->
{#if addCriterionModalOpen}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (addCriterionModalOpen = false)}></div>
		<div class="modal-box">
			<h2>Add Criterion</h2>
			<form onsubmit={addCriterion}>
				<div class="form-group">
					<label for="criterion-name">Criterion Name</label>
					<input
						type="text"
						id="criterion-name"
						bind:value={newCriterionName}
						placeholder="Enter criterion name"
						required
					/>
				</div>

				<div class="form-group">
					<label for="criterion-type">Criterion Type</label>
					<select id="criterion-type" bind:value={newCriterionType}>
						<option value="boolean">Yes/No</option>
						<option value="number">Numeric Value</option>
					</select>
				</div>

				{#if newCriterionType === 'number'}
					<div class="form-group radio-group">
						<span class="radio-group-label">For this criterion:</span>
						<label class="radio-option">
							<input
								type="radio"
								name="higher-better"
								checked={newCriterionHigherIsBetter === true}
								onchange={() => (newCriterionHigherIsBetter = true)}
							/>
							<span>Higher is better</span>
						</label>
						<label class="radio-option">
							<input
								type="radio"
								name="higher-better"
								checked={newCriterionHigherIsBetter === false}
								onchange={() => (newCriterionHigherIsBetter = false)}
							/>
							<span>Lower is better</span>
						</label>
					</div>
				{/if}

				<div class="modal-buttons">
					<button type="submit" class="btn-primary">Add Criterion</button>
					<button
						type="button"
						class="btn-secondary"
						onclick={() => (addCriterionModalOpen = false)}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Criterion Modal -->
{#if editCriterionModalOpen && editingCriterion}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (editCriterionModalOpen = false)}></div>
		<div class="modal-box">
			<h2>Edit Criterion</h2>
			<form onsubmit={saveEditedCriterion}>
				<div class="form-group">
					<label for="edit-criterion-name">Criterion Name</label>
					<input
						type="text"
						id="edit-criterion-name"
						bind:value={editCriterionName}
						placeholder="Enter criterion name"
						required
					/>
				</div>

				<div class="form-group">
					<label for="edit-criterion-type">Criterion Type</label>
					<select id="edit-criterion-type" bind:value={editCriterionType}>
						<option value="boolean">Yes/No</option>
						<option value="number">Numeric Value</option>
					</select>
				</div>

				{#if editCriterionType === 'number'}
					<div class="form-group radio-group">
						<span class="radio-group-label">For this criterion:</span>
						<label class="radio-option">
							<input
								type="radio"
								name="edit-higher-better"
								checked={editCriterionHigherIsBetter === true}
								onchange={() => (editCriterionHigherIsBetter = true)}
							/>
							<span>Higher is better</span>
						</label>
						<label class="radio-option">
							<input
								type="radio"
								name="edit-higher-better"
								checked={editCriterionHigherIsBetter === false}
								onchange={() => (editCriterionHigherIsBetter = false)}
							/>
							<span>Lower is better</span>
						</label>
					</div>
				{/if}

				<div class="modal-buttons">
					<button type="submit" class="btn-primary">Save Changes</button>
					<button
						type="button"
						class="btn-secondary"
						onclick={() => (editCriterionModalOpen = false)}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Add Item Modal -->
{#if addItemModalOpen}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (addItemModalOpen = false)}></div>
		<div class="modal-box">
			<h2>Add Item</h2>
			<form onsubmit={addItem}>
				<div class="form-group">
					<label for="item-name">Item Name</label>
					<input
						type="text"
						id="item-name"
						bind:value={newItemName}
						placeholder="Enter item name"
						required
					/>
				</div>

				{#if comparison?.current?.[0]?.isPriceAFactor}
					<div class="form-group">
						<label for="item-price">Price (optional)</label>
						<input
							type="number"
							id="item-price"
							bind:value={newItemPrice}
							placeholder="Enter price"
							min="0"
						/>
					</div>
				{/if}

				<div class="form-group">
					<label for="item-notes">Notes (optional)</label>
					<textarea
						id="item-notes"
						bind:value={newItemNotes}
						placeholder="Any additional notes..."
						rows="3"
					></textarea>
				</div>

				<div class="modal-buttons">
					<button type="submit" class="btn-primary">Add Item</button>
					<button type="button" class="btn-secondary" onclick={() => (addItemModalOpen = false)}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Set Item Values Modal -->
{#if setItemValuesModalOpen && selectedItem}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (setItemValuesModalOpen = false)}></div>
		<div class="modal-box">
			<h2>Set Values for {selectedItem.name}</h2>
			<p class="modal-subtitle">Enter values for each criterion:</p>

			<div class="values-form">
				{#if criteria?.current && Array.isArray(criteria.current)}
					{#each criteria.current as criterion (criterion.id)}
						{#if criterion.type === 'boolean'}
							<label class="checkbox-label">
								<input type="checkbox" bind:checked={itemValueStates[criterion.id]} />
								<span>{criterion.name}</span>
							</label>
						{:else if criterion.type === 'number'}
							<div class="numeric-input-group">
								<label for={`numeric-${criterion.id}`}>{criterion.name}</label>
								<input
									type="number"
									id={`numeric-${criterion.id}`}
									bind:value={itemNumericValues[criterion.id]}
									placeholder="Enter value"
									step="any"
								/>
								<small class="input-hint">
									{criterion.higherIsBetter === false ? '↓ Lower is better' : '↑ Higher is better'}
								</small>
							</div>
						{/if}
					{/each}
				{/if}
			</div>

			<div class="modal-buttons">
				<button type="button" class="btn-primary" onclick={saveItemValues}>Save Values</button>
				<button
					type="button"
					class="btn-secondary"
					onclick={() => (setItemValuesModalOpen = false)}
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.comparison-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px;
	}

	.page-title-section {
		margin-bottom: 32px;

		h1 {
			margin: 0 0 8px 0;
			font-size: 2rem;
			font-weight: 700;
			color: var(--textColor);
			line-height: 1.2;
		}
	}

	.back-link {
		color: var(--textColor);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-bottom: 12px;
		opacity: 0.7;
		font-size: 0.95rem;
		transition: opacity 0.2s ease;

		&:hover {
			opacity: 1;
		}
	}

	.description {
		margin: 0;
		color: var(--color-tertiary, #666);
		font-size: 1.05rem;
	}

	.content-grid {
		display: grid;
		grid-template-columns: minmax(350px, 400px) 1fr;
		gap: 24px;
		align-items: start;

		@media (max-width: 1300px) {
			grid-template-columns: minmax(320px, 380px) 1fr;
			gap: 20px;
		}

		@media (max-width: 1200px) {
			grid-template-columns: minmax(300px, 350px) 1fr;
			gap: 20px;
		}
	}

	.section {
		background: var(--background);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--level-1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		flex-wrap: wrap;
		gap: 12px;

		h2 {
			margin: 0;
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--textColor);
		}
	}

	.header-buttons {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.add-btn {
		background-color: var(--primary);
		color: #000;
		padding: 8px 16px;
		border-radius: 6px;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.2s ease;

		&:hover {
			transform: translateY(-1px);
			box-shadow: var(--level-2);
		}
	}

	.drag-hint {
		font-size: 0.85rem;
		color: var(--color-tertiary, #666);
		margin: 0 0 12px 0;
		padding: 8px 12px;
		background: rgba(0, 0, 0, 0.03);
		border-radius: 6px;
		border-left: 3px solid var(--primary);
	}

	.empty-section {
		text-align: center;
		padding: 40px 20px;
		color: var(--color-tertiary, #666);
	}

	.criteria-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.criterion-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 16px;
		background: var(--background);
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		cursor: grab;
		gap: 12px;

		&:active {
			cursor: grabbing;

			.drag-handle {
				cursor: grabbing;
			}
		}

		&.dragging {
			opacity: 0.5;
			transform: scale(0.98);
		}

		&.drag-over {
			border-color: var(--primary);
			background: rgba(255, 215, 0, 0.1);
			transform: translateY(-2px);
		}

		&:hover {
			border-color: rgba(0, 0, 0, 0.2);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		}
	}

	.drag-handle {
		color: var(--color-tertiary, #999);
		font-size: 1rem;
		cursor: grab;
		user-select: none;
		line-height: 1;
	}

	.criterion-info {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
	}

	.criterion-name {
		font-weight: 600;
		color: var(--textColor);
		font-size: 0.95rem;
	}

	.criterion-meta {
		display: flex;
		gap: 12px;
		font-size: 0.85rem;
		color: var(--color-tertiary, #666);
		flex-wrap: wrap;
	}

	.criterion-weight {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--primary);
		background: rgba(255, 215, 0, 0.15);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.criterion-type {
		font-size: 0.85rem;
		color: var(--color-tertiary, #666);
	}

	.criterion-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.edit-small-btn {
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.1);
		cursor: pointer;
		font-size: 0.8rem;
		padding: 4px 12px;
		border-radius: 4px;
		color: var(--textColor);
		transition: all 0.2s ease;

		&:hover {
			background: rgba(0, 0, 0, 0.05);
			border-color: rgba(0, 0, 0, 0.2);
		}
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.item-card {
		padding: 16px;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.item-title {
		display: flex;
		align-items: center;
		gap: 8px;

		h3 {
			margin: 0;
			font-size: 1.1rem;
			color: var(--textColor);
		}
	}

	.delete-small-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1.3rem;
		line-height: 1;
		color: #999;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s ease;

		&:hover {
			background: rgba(255, 0, 0, 0.1);
			color: #ff0000;
		}
	}

	.item-details {
		display: flex;
		gap: 16px;
		margin-bottom: 12px;
		font-size: 0.9rem;
	}

	.score {
		font-weight: 600;
		color: var(--primary);
	}

	.price {
		color: var(--color-tertiary, #666);
	}

	.criteria-values {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 12px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 6px;
		font-size: 0.875rem;
		min-width: 0;
		overflow: hidden;
	}

	.criterion-value {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		min-width: 0;
	}

	.criterion-label {
		color: var(--color-tertiary, #666);
		font-weight: 500;
		flex: 1;
		min-width: 0;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.value-with-points {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.value-display {
		color: #000;
		font-weight: 600;
	}

	.points-display {
		color: var(--primary);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.item-notes {
		font-size: 0.9rem;
		color: var(--color-tertiary, #666);
		margin: 0 0 12px 0;
		font-style: italic;
	}

	.set-values-btn {
		background-color: #f0f0f0;
		color: #333;
		padding: 8px 16px;
		border-radius: 6px;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.2s ease;

		&:hover {
			background-color: #e0e0e0;
		}
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: var(--color-tertiary, #666);
	}

	.access-denied {
		text-align: center;
		padding: 80px 20px;
		max-width: 600px;
		margin: 0 auto;

		h2 {
			color: var(--textColor);
			margin: 0 0 16px 0;
			font-size: 1.75rem;
		}

		p {
			color: var(--color-tertiary, #666);
			margin: 0 0 32px 0;
			line-height: 1.6;
		}
	}

	.back-btn {
		display: inline-block;
		background-color: var(--primary);
		color: #000;
		padding: 12px 24px;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s ease;
		box-shadow: var(--level-2);

		&:hover {
			transform: translateY(-2px);
			box-shadow: var(--level-3);
		}
	}

	/* Modal styles */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.modal-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
	}

	.modal-box {
		position: relative;
		background-color: var(--background);
		padding: 30px;
		border-radius: 12px;
		box-shadow: var(--level-3);
		z-index: 10001;
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;

		h2 {
			margin-top: 0;
			margin-bottom: 20px;
			color: var(--textColor);
		}
	}

	.modal-subtitle {
		margin: 0 0 20px 0;
		color: var(--color-tertiary, #666);
	}

	.form-group {
		margin-bottom: 20px;

		label {
			display: block;
			font-weight: 600;
			color: var(--textColor);
			margin-bottom: 8px;
		}

		input[type='text'],
		input[type='number'],
		textarea {
			width: 100%;
			padding: 10px 12px;
			border: 1px solid rgba(0, 0, 0, 0.2);
			border-radius: 6px;
			font-size: 1rem;
			font-family: inherit;
			background: var(--background);
			color: var(--textColor);
		}

		textarea {
			resize: vertical;
		}

		select {
			width: 100%;
			padding: 10px 12px;
			border: 1px solid rgba(0, 0, 0, 0.2);
			border-radius: 6px;
			font-size: 1rem;
			font-family: inherit;
			background: var(--background);
			color: var(--textColor);
			cursor: pointer;
		}
	}

	.radio-group {
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.02);

		> label:first-child {
			display: block;
			margin-bottom: 12px;
			font-weight: 600;
		}
	}

	.radio-group-label {
		display: block;
		margin-bottom: 12px;
		font-weight: 600;
		color: var(--textColor);
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		cursor: pointer;
		border-radius: 6px;
		transition: background 0.2s ease;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		input[type='radio'] {
			cursor: pointer;
		}

		span {
			color: var(--textColor);
		}
	}

	.numeric-input-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 6px;

		label {
			font-weight: 600;
			color: var(--textColor);
		}

		input[type='number'] {
			padding: 10px 12px;
			border: 1px solid rgba(0, 0, 0, 0.2);
			border-radius: 6px;
			font-size: 1rem;
			font-family: inherit;
			background: var(--background);
			color: var(--textColor);
		}
	}

	.input-hint {
		color: var(--color-tertiary, #666);
		font-size: 0.85rem;
		font-style: italic;
	}

	.values-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s ease;

		&:hover {
			background: rgba(0, 0, 0, 0.05);
		}

		input[type='checkbox'] {
			width: 20px;
			height: 20px;
			cursor: pointer;
		}

		span {
			flex: 1;
			color: var(--textColor);
			font-weight: 500;
		}
	}

	.modal-buttons {
		display: flex;
		gap: 12px;
		margin-top: 24px;
	}

	.btn-primary,
	.btn-secondary {
		flex: 1;
		padding: 12px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background-color: var(--primary);
		color: #000;

		&:hover {
			transform: translateY(-1px);
			box-shadow: var(--level-2);
		}
	}

	.btn-secondary {
		background-color: #e0e0e0;
		color: #333;

		&:hover {
			background-color: #d0d0d0;
		}
	}

	@media (max-width: 1150px) {
		.content-grid {
			grid-template-columns: 1fr;
			gap: 20px;
		}

		.section {
			max-width: 100%;
		}
	}

	@media (max-width: 968px) {
		.comparison-page {
			padding: 16px;
		}

		.page-title-section h1 {
			font-size: 1.5rem;
		}

		.section {
			padding: 16px;
		}

		.section-header {
			flex-direction: column;
			align-items: stretch;
		}

		.section-header h2 {
			font-size: 1.1rem;
		}

		.header-buttons {
			width: 100%;
		}

		.add-btn {
			width: 100%;
			padding: 10px 16px;
		}

		.criterion-item {
			flex-direction: column;
			align-items: stretch;
			padding: 12px;
			gap: 8px;
		}

		.drag-handle {
			align-self: flex-start;
		}

		.criterion-info {
			order: 1;
		}

		.criterion-actions {
			order: 2;
			justify-content: flex-start;
			margin-top: 8px;
		}

		.criterion-meta {
			flex-direction: column;
			gap: 6px;
		}

		.item-card {
			padding: 12px;
		}

		.item-header {
			flex-wrap: wrap;
		}

		.item-title h3 {
			font-size: 1rem;
		}

		.item-details {
			flex-direction: column;
			gap: 8px;
		}

		.criteria-values {
			padding: 10px;
			font-size: 0.8rem;
		}

		.criterion-value {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}

		.value-with-points {
			width: 100%;
			justify-content: space-between;
		}

		.set-values-btn {
			width: 100%;
		}

		.modal-box {
			padding: 20px;
			max-width: calc(100% - 32px);
		}

		.drag-hint {
			font-size: 0.8rem;
			padding: 6px 10px;
		}
	}

	@media (max-width: 640px) {
		.comparison-page {
			padding: 12px;
		}

		.page-title-section h1 {
			font-size: 1.3rem;
		}

		.description {
			font-size: 0.95rem;
		}

		.section {
			padding: 12px;
			border-radius: 8px;
		}

		.criterion-item {
			padding: 10px;
		}

		.criterion-name {
			font-size: 0.9rem;
		}

		.criterion-meta {
			font-size: 0.8rem;
		}

		.edit-small-btn {
			font-size: 0.75rem;
			padding: 4px 10px;
		}

		.item-title h3 {
			font-size: 0.95rem;
		}

		.criteria-values {
			font-size: 0.75rem;
			padding: 8px;
		}

		.criterion-label {
			font-size: 0.8rem;
		}

		.value-display {
			font-size: 0.85rem;
		}

		.points-display {
			font-size: 0.75rem;
		}

		.modal-box {
			padding: 16px;
		}

		.modal-box h2 {
			font-size: 1.3rem;
			margin-bottom: 16px;
		}

		.form-group input[type='text'],
		.form-group input[type='number'],
		.form-group textarea,
		.form-group select {
			font-size: 16px; /* Prevents zoom on iOS */
		}

		.modal-buttons {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}

		.access-denied {
			padding: 40px 16px;
		}

		.access-denied h2 {
			font-size: 1.4rem;
		}
	}
</style>
