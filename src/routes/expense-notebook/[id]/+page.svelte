<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();
	let z = $derived(data.z);
	let userId = $derived(data.id);
	let notebookId = $derived($page.params.id);

	let notebook = $state<Query<any, any, any> | undefined>(undefined);
	let items = $state<Query<any, any, any> | undefined>(undefined);
	let accessDenied = $state(false);

	// Modal states
	let addItemModalOpen = $state(false);
	let editItemModalOpen = $state(false);
	let editingItem = $state<any>(null);

	// Form states
	let newItemName = $state('');
	let newItemAmount = $state<number | null>(null);
	let newItemType = $state<'income' | 'expense'>('income');
	let newItemFrequency = $state<'recurring' | 'one-time'>('recurring');
	let newItemCategory = $state('');
	let newItemStartDate = $state('');
	let newItemEndDate = $state('');
	let newItemRecurrenceInterval = $state<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'>(
		'monthly'
	);
	let newItemNotes = $state('');

	$effect(() => {
		if (z?.current && notebookId) {
			notebook = new Query(z.current.query.expenseNotebooks.where('id', notebookId));

			items = new Query(
				z.current.query.expenseNotebookItems
					.where('notebookId', notebookId)
					.orderBy('createdAt', 'desc')
			);
		}
	});

	// Security check
	$effect(() => {
		if (notebook?.current && Array.isArray(notebook.current) && notebook.current[0]) {
			const nb = notebook.current[0];
			const currentViewMode = viewModeState.currentMode;

			if (nb.createdById !== userId) {
				console.warn('Access denied: Notebook does not belong to current user');
				accessDenied = true;
				goto('/expense-notebook');
				return;
			}

			if (nb.viewMode !== currentViewMode) {
				console.warn('Access denied: Notebook view mode does not match current view mode');
				accessDenied = true;
				goto('/expense-notebook');
				return;
			}

			accessDenied = false;
		}
	});

	// Watch for view mode changes
	$effect(() => {
		const currentViewMode = viewModeState.currentMode;
		if (notebook?.current && Array.isArray(notebook.current) && notebook.current[0]) {
			const nb = notebook.current[0];
			if (nb.viewMode !== currentViewMode) {
				goto('/expense-notebook');
			}
		}
	});

	// Computed values
	let incomeItems = $derived.by(() => {
		if (!items?.current || !Array.isArray(items.current)) return [];
		return items.current.filter((item: any) => item.type === 'income');
	});

	let expenseItems = $derived.by(() => {
		if (!items?.current || !Array.isArray(items.current)) return [];
		return items.current.filter((item: any) => item.type === 'expense');
	});

	// Calculate monthly projection for the next 12 months with cumulative balance
	let projectionData = $derived.by(() => {
		if (!items?.current || !Array.isArray(items.current)) return [];

		const months = 12;
		const projections: Array<{
			month: string;
			income: number;
			expenses: number;
			balance: number;
			cumulativeBalance: number;
		}> = [];

		const now = new Date();
		let runningBalance = 0;

		for (let i = 0; i < months; i++) {
			const targetMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
			const monthStr = targetMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

			let monthIncome = 0;
			let monthExpenses = 0;

			items.current.forEach((item: any) => {
				const startDate = new Date(item.startDate);
				const endDate = item.endDate ? new Date(item.endDate) : null;

				// Check if item is active in this month - need to check the entire month range
				const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
				const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

				if (item.frequency === 'one-time') {
					// Check if one-time item falls in this month
					// Compare year and month only (ignore day)
					if (
						startDate.getFullYear() === targetMonth.getFullYear() &&
						startDate.getMonth() === targetMonth.getMonth()
					) {
						if (item.type === 'income') {
							monthIncome += item.amount;
						} else {
							monthExpenses += item.amount;
						}
					}
				} else if (item.frequency === 'recurring') {
					// Skip if item starts after this month
					if (startDate > monthEnd) return;
					// Skip if item ended before this month
					if (endDate && endDate < monthStart) return;
					// Recurring item - calculate occurrences in this month
					switch (item.recurrenceInterval) {
						case 'daily':
							// Calculate actual days in month considering start/end dates
							const daysInMonth = new Date(
								targetMonth.getFullYear(),
								targetMonth.getMonth() + 1,
								0
							).getDate();
							const actualDays = Math.min(
								daysInMonth,
								endDate
									? Math.ceil((endDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))
									: daysInMonth
							);
							if (item.type === 'income') {
								monthIncome += item.amount * Math.max(0, actualDays);
							} else {
								monthExpenses += item.amount * Math.max(0, actualDays);
							}
							break;
						case 'weekly':
							// Approximately 4-5 weeks per month, use 4.33 average
							if (item.type === 'income') {
								monthIncome += item.amount * 4.33;
							} else {
								monthExpenses += item.amount * 4.33;
							}
							break;
						case 'biweekly':
							// 2 biweekly periods per month on average (26 periods per year / 12 months)
							if (item.type === 'income') {
								monthIncome += item.amount * 2.17;
							} else {
								monthExpenses += item.amount * 2.17;
							}
							break;
						case 'monthly':
							if (item.type === 'income') {
								monthIncome += item.amount;
							} else {
								monthExpenses += item.amount;
							}
							break;
						case 'yearly':
							// Check if this is the anniversary month
							const monthsSinceStart =
								(targetMonth.getFullYear() - startDate.getFullYear()) * 12 +
								(targetMonth.getMonth() - startDate.getMonth());
							if (monthsSinceStart >= 0 && monthsSinceStart % 12 === 0) {
								if (item.type === 'income') {
									monthIncome += item.amount;
								} else {
									monthExpenses += item.amount;
								}
							}
							break;
					}
				}
			});

			const monthBalance = monthIncome - monthExpenses;
			runningBalance += monthBalance;

			projections.push({
				month: monthStr,
				income: monthIncome,
				expenses: monthExpenses,
				balance: monthBalance,
				cumulativeBalance: runningBalance
			});
		}

		return projections;
	});

	function openAddItemModal(type: 'income' | 'expense') {
		newItemName = '';
		newItemAmount = null;
		newItemType = type;
		newItemFrequency = 'recurring';
		newItemCategory = '';
		newItemStartDate = new Date().toISOString().split('T')[0];
		newItemEndDate = '';
		newItemRecurrenceInterval = 'monthly';
		newItemNotes = '';
		addItemModalOpen = true;
	}

	async function addItem(e: Event) {
		e.preventDefault();
		if (!z?.current || !newItemName.trim() || !newItemAmount || !notebookId) return;

		const itemId = nanoid();

		try {
			await z.current.mutate.expenseNotebookItems.insert({
				id: itemId,
				notebookId,
				name: newItemName.trim(),
				amount: newItemAmount,
				type: newItemType,
				frequency: newItemFrequency,
				category: newItemCategory.trim() || null,
				startDate: new Date(newItemStartDate).getTime(),
				endDate: newItemEndDate ? new Date(newItemEndDate).getTime() : null,
				recurrenceInterval: newItemFrequency === 'recurring' ? newItemRecurrenceInterval : null,
				notes: newItemNotes.trim() || null,
				createdById: userId,
				createdAt: Date.now()
			});

			addItemModalOpen = false;
		} catch (err) {
			console.error('Failed to add item:', err);
		}
	}

	function openEditItemModal(item: any) {
		editingItem = item;
		newItemName = item.name;
		newItemAmount = item.amount;
		newItemType = item.type;
		newItemFrequency = item.frequency;
		newItemCategory = item.category || '';
		newItemStartDate = new Date(item.startDate).toISOString().split('T')[0];
		newItemEndDate = item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '';
		newItemRecurrenceInterval = item.recurrenceInterval || 'monthly';
		newItemNotes = item.notes || '';
		editItemModalOpen = true;
	}

	async function saveEditedItem(e: Event) {
		e.preventDefault();
		if (!z?.current || !editingItem || !newItemName.trim() || !newItemAmount) return;

		try {
			await z.current.mutate.expenseNotebookItems.update({
				id: editingItem.id,
				name: newItemName.trim(),
				amount: newItemAmount,
				type: newItemType,
				frequency: newItemFrequency,
				category: newItemCategory.trim() || null,
				startDate: new Date(newItemStartDate).getTime(),
				endDate: newItemEndDate ? new Date(newItemEndDate).getTime() : null,
				recurrenceInterval: newItemFrequency === 'recurring' ? newItemRecurrenceInterval : null,
				notes: newItemNotes.trim() || null
			});

			editItemModalOpen = false;
			editingItem = null;
		} catch (err) {
			console.error('Failed to update item:', err);
		}
	}

	async function deleteItem(itemId: string) {
		if (!z?.current) return;
		if (!confirm('Are you sure you want to delete this item?')) return;

		try {
			await z.current.mutate.expenseNotebookItems.delete({ id: itemId });
		} catch (err) {
			console.error('Failed to delete item:', err);
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getBalanceColor(balance: number): string {
		if (balance > 100) return '#4caf50'; // Green
		if (balance < -100) return '#f44336'; // Red
		return '#ffc107'; // Yellow
	}
</script>

<div class="expense-notebook-detail-page">
	{#if accessDenied}
		<div class="access-denied">
			<h2>Access Denied</h2>
			<p>
				You don't have permission to view this notebook or it doesn't exist in the current view
				mode.
			</p>
			<a href="/expense-notebook" class="back-btn">← Back to Expense Notebooks</a>
		</div>
	{:else if notebook?.current && Array.isArray(notebook.current) && notebook.current[0]}
		{@const nb = notebook.current[0]}

		<div class="page-title-section">
			<a href="/expense-notebook" class="back-link">← Back to Expense Notebooks</a>
			<h1>{nb.name}</h1>
			{#if nb.description}
				<p class="description">{nb.description}</p>
			{/if}
		</div>

		<!-- Projection Graph -->
		<section class="projection-section">
			<h2>Future Projection (Cumulative Balance)</h2>
			<div class="graph-container">
				<div class="graph-wrapper">
					<svg class="line-graph" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
						<!-- Grid lines -->
						<line x1="50" y1="50" x2="50" y2="250" stroke="#ddd" stroke-width="2" />
						<line x1="50" y1="250" x2="750" y2="250" stroke="#ddd" stroke-width="2" />

						<!-- Zero line -->
						<line
							x1="50"
							y1="150"
							x2="750"
							y2="150"
							stroke="#999"
							stroke-width="1"
							stroke-dasharray="5,5"
						/>

						{#if projectionData.length > 0}
							{@const maxAbsBalance = Math.max(
								...projectionData.map((d) => Math.abs(d.cumulativeBalance)),
								1000
							)}
							{@const xStep = 700 / (projectionData.length - 1)}

							<!-- Line path -->
							{@const pathData = projectionData
								.map((d, i) => {
									const x = 50 + i * xStep;
									const normalizedBalance = d.cumulativeBalance / maxAbsBalance;
									const y = 150 - normalizedBalance * 100;
									return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
								})
								.join(' ')}

							<path
								d={pathData}
								fill="none"
								stroke="#4caf50"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>

							<!-- Data points -->
							{#each projectionData as data, i}
								{@const x = 50 + i * xStep}
								{@const normalizedBalance = data.cumulativeBalance / maxAbsBalance}
								{@const y = 150 - normalizedBalance * 100}
								{@const color = getBalanceColor(data.cumulativeBalance)}

								<g class="data-point-group">
									<circle cx={x} cy={y} r="5" fill={color} stroke="white" stroke-width="2" />

									<!-- Labels -->
									<text {x} y="270" text-anchor="middle" font-size="10" fill="#666">
										{data.month.split(' ')[0]}
									</text>

									<!-- Value labels on hover -->
									<g class="hover-label" style="opacity: 0; pointer-events: none;">
										<rect
											x={x - 40}
											y={y - 35}
											width="80"
											height="25"
											fill="rgba(0,0,0,0.8)"
											rx="4"
										/>
										<text
											{x}
											y={y - 17}
											text-anchor="middle"
											font-size="11"
											fill="white"
											font-weight="600"
										>
											{formatCurrency(data.cumulativeBalance)}
										</text>
									</g>

									<!-- Invisible hover target -->
									<rect
										x={x - 15}
										y={y - 15}
										width="30"
										height="30"
										fill="transparent"
										style="cursor: pointer;"
										onmouseenter={(e) => {
											const group = e.target.closest('.data-point-group');
											const label = group?.querySelector('.hover-label');
											if (label) label.style.opacity = '1';
										}}
										onmouseleave={(e) => {
											const group = e.target.closest('.data-point-group');
											const label = group?.querySelector('.hover-label');
											if (label) label.style.opacity = '0';
										}}
									/>
								</g>
							{/each}

							<!-- Y-axis labels -->
							<text x="45" y="55" text-anchor="end" font-size="10" fill="#666">
								{formatCurrency(maxAbsBalance)}
							</text>
							<text x="45" y="155" text-anchor="end" font-size="10" fill="#666"> $0 </text>
							<text x="45" y="255" text-anchor="end" font-size="10" fill="#666">
								-{formatCurrency(maxAbsBalance)}
							</text>
						{/if}
					</svg>
				</div>
				<div class="legend">
					<div class="legend-item">
						<span class="legend-color" style="background-color: #4caf50;"></span>
						<span>Positive</span>
					</div>
					<div class="legend-item">
						<span class="legend-color" style="background-color: #ffc107;"></span>
						<span>Breaking Even</span>
					</div>
					<div class="legend-item">
						<span class="legend-color" style="background-color: #f44336;"></span>
						<span>Negative</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Income & Expenses Sections -->
		<div class="content-grid">
			<!-- Income Section -->
			<section class="section income-section">
				<div class="section-header">
					<h2>Income ({incomeItems.length})</h2>
					<button class="add-btn income-btn" onclick={() => openAddItemModal('income')}>
						+ Add Income
					</button>
				</div>

				{#if incomeItems.length === 0}
					<div class="empty-section">
						<p>No income sources yet. Add your first income source!</p>
					</div>
				{:else}
					<div class="items-list">
						{#each incomeItems as item (item.id)}
							<div class="item-card">
								<div class="item-header">
									<div class="item-info">
										<h3>{item.name}</h3>
										<span class="item-amount income">{formatCurrency(item.amount)}</span>
									</div>
									<div class="item-actions">
										<button class="edit-btn" onclick={() => openEditItemModal(item)}>Edit</button>
										<button class="delete-btn-small" onclick={() => deleteItem(item.id)}>×</button>
									</div>
								</div>
								<div class="item-meta">
									<span class="badge {item.frequency}">{item.frequency}</span>
									{#if item.frequency === 'recurring' && item.recurrenceInterval}
										<span class="interval">{item.recurrenceInterval}</span>
									{/if}
									{#if item.category}
										<span class="category">{item.category}</span>
									{/if}
								</div>
								<div class="item-dates">
									<span>Starts: {formatDate(item.startDate)}</span>
									{#if item.endDate}
										<span>Ends: {formatDate(item.endDate)}</span>
									{/if}
								</div>
								{#if item.notes}
									<p class="item-notes">{item.notes}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Expenses Section -->
			<section class="section expense-section">
				<div class="section-header">
					<h2>Expenses ({expenseItems.length})</h2>
					<button class="add-btn expense-btn" onclick={() => openAddItemModal('expense')}>
						+ Add Expense
					</button>
				</div>

				{#if expenseItems.length === 0}
					<div class="empty-section">
						<p>No expenses yet. Add your first expense!</p>
					</div>
				{:else}
					<div class="items-list">
						{#each expenseItems as item (item.id)}
							<div class="item-card">
								<div class="item-header">
									<div class="item-info">
										<h3>{item.name}</h3>
										<span class="item-amount expense">{formatCurrency(item.amount)}</span>
									</div>
									<div class="item-actions">
										<button class="edit-btn" onclick={() => openEditItemModal(item)}>Edit</button>
										<button class="delete-btn-small" onclick={() => deleteItem(item.id)}>×</button>
									</div>
								</div>
								<div class="item-meta">
									<span class="badge {item.frequency}">{item.frequency}</span>
									{#if item.frequency === 'recurring' && item.recurrenceInterval}
										<span class="interval">{item.recurrenceInterval}</span>
									{/if}
									{#if item.category}
										<span class="category">
											{item.category === 'fixed' ? 'Fixed' : item.category}
										</span>
									{/if}
								</div>
								<div class="item-dates">
									<span>Starts: {formatDate(item.startDate)}</span>
									{#if item.endDate}
										<span>Ends: {formatDate(item.endDate)}</span>
									{/if}
								</div>
								{#if item.notes}
									<p class="item-notes">{item.notes}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>
	{:else}
		<div class="loading">Loading expense notebook...</div>
	{/if}
</div>

<!-- Add Item Modal -->
{#if addItemModalOpen}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (addItemModalOpen = false)}></div>
		<div class="modal-box">
			<h2>Add {newItemType === 'income' ? 'Income' : 'Expense'}</h2>
			<form onsubmit={addItem}>
				<div class="form-group">
					<label for="item-name">Name</label>
					<input
						type="text"
						id="item-name"
						bind:value={newItemName}
						placeholder="e.g., Salary, Rent, Groceries"
						required
					/>
				</div>

				<div class="form-group">
					<label for="item-amount">Amount</label>
					<input
						type="number"
						id="item-amount"
						bind:value={newItemAmount}
						placeholder="0.00"
						step="0.01"
						min="0"
						required
					/>
				</div>

				<div class="form-group">
					<label for="item-frequency">Frequency</label>
					<select id="item-frequency" bind:value={newItemFrequency}>
						<option value="recurring">Recurring</option>
						<option value="one-time">One-time</option>
					</select>
				</div>

				{#if newItemFrequency === 'recurring'}
					<div class="form-group">
						<label for="item-interval">Recurrence Interval</label>
						<select id="item-interval" bind:value={newItemRecurrenceInterval}>
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
							<option value="biweekly">Bi-weekly</option>
							<option value="monthly">Monthly</option>
							<option value="yearly">Yearly</option>
						</select>
					</div>
				{/if}

				<div class="form-group">
					<label for="item-category">
						Category {newItemType === 'expense' ? '(e.g., "fixed" for fixed expenses)' : ''}
					</label>
					<input
						type="text"
						id="item-category"
						bind:value={newItemCategory}
						placeholder="Optional category"
					/>
				</div>

				<div class="form-group">
					<label for="item-start-date">Start Date</label>
					<input type="date" id="item-start-date" bind:value={newItemStartDate} required />
				</div>

				<div class="form-group">
					<label for="item-end-date">End Date (optional)</label>
					<input type="date" id="item-end-date" bind:value={newItemEndDate} />
				</div>

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

<!-- Edit Item Modal -->
{#if editItemModalOpen && editingItem}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (editItemModalOpen = false)}></div>
		<div class="modal-box">
			<h2>Edit {editingItem.type === 'income' ? 'Income' : 'Expense'}</h2>
			<form onsubmit={saveEditedItem}>
				<div class="form-group">
					<label for="edit-item-name">Name</label>
					<input type="text" id="edit-item-name" bind:value={newItemName} required />
				</div>

				<div class="form-group">
					<label for="edit-item-amount">Amount</label>
					<input
						type="number"
						id="edit-item-amount"
						bind:value={newItemAmount}
						step="0.01"
						min="0"
						required
					/>
				</div>

				<div class="form-group">
					<label for="edit-item-frequency">Frequency</label>
					<select id="edit-item-frequency" bind:value={newItemFrequency}>
						<option value="recurring">Recurring</option>
						<option value="one-time">One-time</option>
					</select>
				</div>

				{#if newItemFrequency === 'recurring'}
					<div class="form-group">
						<label for="edit-item-interval">Recurrence Interval</label>
						<select id="edit-item-interval" bind:value={newItemRecurrenceInterval}>
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
							<option value="biweekly">Bi-weekly</option>
							<option value="monthly">Monthly</option>
							<option value="yearly">Yearly</option>
						</select>
					</div>
				{/if}

				<div class="form-group">
					<label for="edit-item-category">Category</label>
					<input type="text" id="edit-item-category" bind:value={newItemCategory} />
				</div>

				<div class="form-group">
					<label for="edit-item-start-date">Start Date</label>
					<input type="date" id="edit-item-start-date" bind:value={newItemStartDate} required />
				</div>

				<div class="form-group">
					<label for="edit-item-end-date">End Date (optional)</label>
					<input type="date" id="edit-item-end-date" bind:value={newItemEndDate} />
				</div>

				<div class="form-group">
					<label for="edit-item-notes">Notes (optional)</label>
					<textarea
						id="edit-item-notes"
						bind:value={newItemNotes}
						placeholder="Any additional notes..."
						rows="3"
					></textarea>
				</div>

				<div class="modal-buttons">
					<button type="submit" class="btn-primary">Save Changes</button>
					<button type="button" class="btn-secondary" onclick={() => (editItemModalOpen = false)}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.expense-notebook-detail-page {
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

	.projection-section {
		background: var(--background);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 24px;
		box-shadow: var(--level-1);

		h2 {
			margin: 0 0 20px 0;
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--textColor);
		}
	}

	.graph-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.graph-wrapper {
		width: 100%;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 8px;
		padding: 10px;
	}

	.line-graph {
		width: 100%;
		height: auto;
		max-height: 300px;
	}

	.hover-label {
		transition: opacity 0.2s ease;
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 24px;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.legend-color {
		width: 16px;
		height: 16px;
		border-radius: 4px;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		align-items: start;
	}

	.section {
		background: var(--background);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--level-1);
	}

	.income-section {
		border-left: 4px solid #4caf50;
	}

	.expense-section {
		border-left: 4px solid #f44336;
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

	.add-btn {
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

	.income-btn {
		background-color: #4caf50;
		color: #fff;
	}

	.expense-btn {
		background-color: #f44336;
		color: #fff;
	}

	.empty-section {
		text-align: center;
		padding: 40px 20px;
		color: var(--color-tertiary, #666);
	}

	.items-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 12px;
	}

	.item-card {
		padding: 12px;
		background: var(--background);
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;

		&:hover {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		}
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 8px;
		gap: 8px;
	}

	.item-info {
		flex: 1;
		min-width: 0;

		h3 {
			margin: 0 0 4px 0;
			font-size: 0.95rem;
			font-weight: 600;
			color: var(--textColor);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.item-amount {
		font-size: 1rem;
		font-weight: 700;

		&.income {
			color: #4caf50;
		}

		&.expense {
			color: #f44336;
		}
	}

	.item-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.edit-btn {
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

	.delete-btn-small {
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

	.item-meta {
		display: flex;
		gap: 6px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	.badge {
		font-size: 0.7rem;
		padding: 3px 8px;
		border-radius: 10px;
		font-weight: 600;
		text-transform: capitalize;

		&.recurring {
			background: rgba(76, 175, 80, 0.15);
			color: #4caf50;
		}

		&.one-time {
			background: rgba(255, 152, 0, 0.15);
			color: #ff9800;
		}
	}

	.interval,
	.category {
		font-size: 0.7rem;
		color: var(--color-tertiary, #666);
		background: rgba(0, 0, 0, 0.05);
		padding: 3px 8px;
		border-radius: 10px;
		text-transform: capitalize;
	}

	.item-dates {
		display: flex;
		gap: 12px;
		font-size: 0.7rem;
		color: var(--color-tertiary, #666);
		margin-bottom: 6px;
	}

	.item-notes {
		margin: 6px 0 0 0;
		font-size: 0.8rem;
		color: var(--color-tertiary, #666);
		line-height: 1.4;
		font-style: italic;
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
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		height: calc(100% - var(--headerHeight));
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

	.form-group {
		margin-bottom: 20px;

		label {
			display: block;
			font-weight: 600;
			color: var(--textColor);
			margin-bottom: 8px;
			font-size: 0.9rem;
		}

		input[type='text'],
		input[type='number'],
		input[type='date'],
		textarea,
		select {
			width: 100%;
			padding: 10px 12px;
			border: 1px solid rgba(0, 0, 0, 0.2);
			border-radius: 6px;
			font-size: 1rem;
			font-family: inherit;
			background: var(--background);
			color: var(--textColor);
		}

		select {
			cursor: pointer;
		}

		textarea {
			resize: vertical;
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

	@media (max-width: 1024px) {
		.expense-notebook-detail-page {
			padding: 0 16px;
		}
	}

	@media (max-width: 768px) {
		.expense-notebook-detail-page {
			padding: 0 16px;
		}

		.page-title-section h1 {
			font-size: 1.6rem;
		}

		.projection-section {
			padding: 16px;
		}

		.line-graph {
			max-height: 250px;
		}

		.section {
			padding: 16px;
		}

		.item-card {
			padding: 14px;
		}

		.modal-box {
			padding: 20px;
		}

		.form-group input,
		.form-group textarea,
		.form-group select {
			font-size: 16px; /* Prevents zoom on iOS */
		}
	}

	@media (max-width: 640px) {
		.expense-notebook-detail-page {
			padding: 0 12px;
		}

		.page-title-section h1 {
			font-size: 1.4rem;
		}

		.projection-section h2 {
			font-size: 1.1rem;
		}

		.line-graph {
			max-height: 200px;
		}

		.legend {
			gap: 12px;
		}

		.section-header h2 {
			font-size: 1.1rem;
		}

		.add-btn {
			font-size: 0.85rem;
			padding: 8px 12px;
		}

		.item-header {
			flex-direction: column;
			gap: 8px;
		}

		.item-actions {
			width: 100%;
			justify-content: flex-end;
		}

		.modal-box {
			padding: 16px;
		}

		.modal-buttons {
			flex-direction: column;
		}
	}
</style>
