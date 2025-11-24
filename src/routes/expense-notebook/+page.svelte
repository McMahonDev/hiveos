<script lang="ts">
	import { goto } from '$app/navigation';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();
	let z = $derived(data.z);
	let userId = $derived(data.id);

	let notebooks = $state<Query<any, any, any> | undefined>(undefined);
	let createModalOpen = $state(false);
	let infoModalOpen = $state(false);
	let newNotebookName = $state('');
	let newNotebookDescription = $state('');

	$effect(() => {
		if (z?.current) {
			const viewMode = viewModeState.currentMode;
			notebooks = new Query(
				z.current.query.expenseNotebooks
					.where('createdById', userId)
					.where('viewMode', viewMode)
					.orderBy('createdAt', 'desc')
			);
		} else {
			notebooks = undefined;
		}
	});

	function openCreateModal() {
		createModalOpen = true;
		newNotebookName = '';
		newNotebookDescription = '';
	}

	async function createNotebook(e: Event) {
		e.preventDefault();
		if (!z?.current || !newNotebookName.trim()) return;

		const id = nanoid();
		const now = Date.now();

		try {
			await z.current.mutate.expenseNotebooks.insert({
				id,
				name: newNotebookName.trim(),
				description: newNotebookDescription.trim() || null,
				createdById: userId,
				viewMode: viewModeState.currentMode,
				createdAt: now,
				updatedAt: now
			});

			createModalOpen = false;
			goto(`/expense-notebook/${id}`);
		} catch (err) {
			console.error('Failed to create expense notebook:', err);
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function deleteNotebook(id: string) {
		if (!z?.current) return;
		if (!confirm('Are you sure you want to delete this expense notebook? This cannot be undone.'))
			return;

		try {
			await z.current.mutate.expenseNotebooks.delete({ id });
		} catch (err) {
			console.error('Failed to delete expense notebook:', err);
		}
	}
</script>

<div class="expense-notebook-page">
	<section class="page-header">
		<div class="header-content">
			<h1>Expense Notebook</h1>
			<p class="subtitle">Track your income and expenses, forecast your financial future</p>
		</div>
		<div class="header-actions">
			<button class="info-btn" onclick={() => (infoModalOpen = true)}>How it works</button>
			<button class="create-btn" onclick={openCreateModal}>+ New Notebook</button>
		</div>
	</section>

	{#if notebooks?.current && Array.isArray(notebooks.current)}
		{#if notebooks.current.length === 0}
			<div class="empty-state">
				<h2>No expense notebooks yet</h2>
				<p>Start by creating your first notebook to track income and expenses</p>
				<button class="create-btn-large" onclick={openCreateModal}
					>Create Your First Notebook</button
				>
			</div>
		{:else}
			<div class="notebooks-grid">
				{#each notebooks.current as notebook (notebook.id)}
					<a href={`/expense-notebook/${notebook.id}`}>
						<div class="notebook-card">
							<div class="card-header">
								<h3>{notebook.name}</h3>
								<button
									class="delete-btn"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										deleteNotebook(notebook.id);
									}}
									aria-label="Delete notebook"
								>
									×
								</button>
							</div>

							{#if notebook.description}
								<p class="description">{notebook.description}</p>
							{/if}
							<div class="card-meta">
								<span class="date">Created {formatDate(notebook.createdAt)}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="loading">Loading expense notebooks...</div>
	{/if}
</div>

{#if createModalOpen}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (createModalOpen = false)}></div>
		<div class="modal-box">
			<h2>Create New Expense Notebook</h2>
			<form onsubmit={createNotebook}>
				<div class="form-group">
					<label for="notebook-name">Notebook Name</label>
					<input
						type="text"
						id="notebook-name"
						bind:value={newNotebookName}
						placeholder="e.g., Monthly Budget, Vacation Planning"
						required
					/>
				</div>

				<div class="form-group">
					<label for="notebook-description">Description (optional)</label>
					<textarea
						id="notebook-description"
						bind:value={newNotebookDescription}
						placeholder="Add any notes about this notebook..."
						rows="3"
					></textarea>
				</div>

				<div class="modal-buttons">
					<button type="submit" class="btn-primary">Create Notebook</button>
					<button type="button" class="btn-secondary" onclick={() => (createModalOpen = false)}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if infoModalOpen}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (infoModalOpen = false)}></div>
		<div class="modal-box info-modal">
			<h2>How the Expense Notebook Works</h2>

			<div class="info-section">
				<h3>1. Create a Notebook</h3>
				<p>
					Start by creating a new expense notebook. You can have multiple notebooks for different
					purposes like monthly budgets, vacation planning, or business expenses.
				</p>
			</div>

			<div class="info-section">
				<h3>2. Track Income</h3>
				<p>Add your income sources and mark them as:</p>
				<ul>
					<li><strong>Recurring:</strong> Regular income like salary or rent</li>
					<li><strong>One-time:</strong> Single payments or bonuses</li>
				</ul>
			</div>

			<div class="info-section">
				<h3>3. Track Expenses</h3>
				<p>Add your expenses and categorize them as:</p>
				<ul>
					<li><strong>Fixed:</strong> Regular expenses like rent or subscriptions</li>
					<li><strong>One-time:</strong> Occasional purchases</li>
				</ul>
			</div>

			<div class="info-section">
				<h3>4. Future Projections</h3>
				<p>
					View a graph showing your projected income over time based on your recurring income and
					expenses. The graph uses color coding:
				</p>
				<ul>
					<li><strong>Green:</strong> Positive balance</li>
					<li><strong>Yellow:</strong> Breaking even</li>
					<li><strong>Red:</strong> Negative balance</li>
				</ul>
			</div>

			<div class="modal-buttons">
				<button type="button" class="btn-primary" onclick={() => (infoModalOpen = false)}>
					Got it
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.expense-notebook-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40px;
		gap: 20px;
		flex-wrap: wrap;
	}

	.header-content {
		h1 {
			margin: 0 0 8px 0;
			font-size: 2rem;
			color: var(--textColor);
		}
	}

	.subtitle {
		margin: 0;
		color: var(--color-tertiary, #666);
		font-size: 1rem;
	}

	.header-actions {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.info-btn {
		background-color: transparent;
		color: var(--textColor);
		padding: 12px 24px;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.2);
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s ease;

		&:hover {
			background-color: rgba(0, 0, 0, 0.05);
			border-color: rgba(0, 0, 0, 0.3);
		}
	}

	.create-btn {
		background-color: var(--primary);
		color: #000;
		padding: 12px 24px;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s ease;
		box-shadow: var(--level-2);

		&:hover {
			transform: translateY(-2px);
			box-shadow: var(--level-3);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.empty-state {
		text-align: center;
		padding: 80px 20px;

		h2 {
			color: var(--textColor);
			margin: 0 0 10px 0;
		}

		p {
			color: var(--color-tertiary, #666);
			margin: 0 0 30px 0;
		}
	}

	.create-btn-large {
		background-color: var(--primary);
		color: #000;
		padding: 16px 32px;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		font-weight: 600;
		transition: all 0.2s ease;
		box-shadow: var(--level-2);

		&:hover {
			transform: translateY(-2px);
			box-shadow: var(--level-3);
		}
	}

	.notebooks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;

		a {
			text-decoration: none;
		}
	}

	.notebook-card {
		background: var(--background);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		padding: 20px;
		transition: all 0.2s ease;
		box-shadow: var(--level-1);

		&:hover {
			box-shadow: var(--level-2);
			transform: translateY(-2px);
		}
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;

		h3 {
			margin: 0;
			font-size: 1.25rem;
			flex: 1;
			color: var(--textColor);
		}
	}

	.delete-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1.5rem;
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

	.description {
		color: var(--color-tertiary, #666);
		font-size: 0.9rem;
		margin: 0 0 12px 0;
		line-height: 1.5;
	}

	.card-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		font-size: 0.85rem;
		color: var(--color-tertiary, #999);
		flex-wrap: wrap;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: var(--color-tertiary, #666);
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
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;

		h2 {
			margin-top: 0;
			margin-bottom: 24px;
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
		}

		input[type='text'],
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

	.info-modal {
		max-width: 800px;
	}

	.info-section {
		margin-bottom: 24px;

		h3 {
			margin: 0 0 8px 0;
			font-size: 1.1rem;
			color: var(--textColor);
		}

		p {
			margin: 0 0 8px 0;
			color: var(--color-tertiary, #666);
			line-height: 1.6;
		}

		ul {
			margin: 8px 0;
			padding-left: 24px;
			color: var(--color-tertiary, #666);
			line-height: 1.6;
		}

		li {
			margin-bottom: 6px;
		}

		strong {
			color: var(--textColor);
			font-weight: 600;
		}
	}

	@media (max-width: 768px) {
		.expense-notebook-page {
			padding: 0 16px;
		}

		.page-header {
			flex-direction: column;
			align-items: stretch;
			margin-bottom: 24px;
		}

		.header-content h1 {
			font-size: 1.6rem;
		}

		.subtitle {
			font-size: 0.95rem;
		}

		.header-actions {
			flex-direction: column;
			width: 100%;
		}

		.info-btn,
		.create-btn {
			width: 100%;
			padding: 12px 20px;
		}

		.notebooks-grid {
			grid-template-columns: 1fr;
			gap: 16px;
		}

		.notebook-card {
			padding: 16px;
		}

		.card-header h3 {
			font-size: 1.1rem;
		}

		.empty-state {
			padding: 60px 20px;
		}

		.empty-state h2 {
			font-size: 1.4rem;
		}

		.modal-box {
			padding: 20px;
			max-width: calc(100% - 32px);
		}

		.info-modal {
			max-width: calc(100% - 32px);
		}
	}

	@media (max-width: 640px) {
		.expense-notebook-page {
			padding: 0 12px;
		}

		.page-header {
			margin-bottom: 20px;
		}

		.header-content h1 {
			font-size: 1.4rem;
		}

		.subtitle {
			font-size: 0.9rem;
		}

		.info-btn,
		.create-btn,
		.create-btn-large {
			font-size: 0.95rem;
			padding: 10px 16px;
		}

		.notebook-card {
			padding: 14px;
		}

		.card-header h3 {
			font-size: 1rem;
		}

		.description {
			font-size: 0.85rem;
		}

		.card-meta {
			font-size: 0.8rem;
		}

		.empty-state {
			padding: 40px 16px;
		}

		.empty-state h2 {
			font-size: 1.3rem;
		}

		.empty-state p {
			font-size: 0.9rem;
		}

		.modal-box {
			padding: 16px;
		}

		.modal-box h2 {
			font-size: 1.3rem;
			margin-bottom: 16px;
		}

		.form-group input[type='text'],
		.form-group textarea {
			font-size: 16px; /* Prevents zoom on iOS */
		}

		.modal-buttons {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
</style>
