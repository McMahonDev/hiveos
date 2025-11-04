<script lang="ts">
	import { goto } from '$app/navigation';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();
	let z = $derived(data.z);
	let userId = $derived(data.id);

	let comparisons = $state<Query<any, any, any> | undefined>(undefined);
	let createModalOpen = $state(false);
	let infoModalOpen = $state(false);
	let newComparisonName = $state('');
	let newComparisonDescription = $state('');
	let isPriceAFactor = $state(false);
	let priceWeight = $state(1);

	$effect(() => {
		if (z?.current) {
			const viewMode = viewModeState.currentMode;
			comparisons = new Query(
				z.current.query.comparisons
					.where('createdById', userId)
					.where('viewMode', viewMode)
					.orderBy('createdAt', 'desc')
			);
		} else {
			comparisons = undefined;
		}
	});

	function openCreateModal() {
		createModalOpen = true;
		newComparisonName = '';
		newComparisonDescription = '';
		isPriceAFactor = false;
		priceWeight = 1;
	}

	async function createComparison(e: Event) {
		e.preventDefault();
		if (!z?.current || !newComparisonName.trim()) return;

		const id = nanoid();
		const now = Date.now();

		try {
			await z.current.mutate.comparisons.insert({
				id,
				name: newComparisonName.trim(),
				description: newComparisonDescription.trim() || null,
				isPriceAFactor,
				priceWeight: isPriceAFactor ? priceWeight : 1,
				createdById: userId,
				viewMode: viewModeState.currentMode,
				createdAt: now,
				updatedAt: now
			});

			createModalOpen = false;
			goto(`/comparisons/${id}`);
		} catch (err) {
			console.error('Failed to create comparison:', err);
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function deleteComparison(id: string) {
		if (!z?.current) return;
		if (!confirm('Are you sure you want to delete this comparison? This cannot be undone.')) return;

		try {
			await z.current.mutate.comparisons.delete({ id });
		} catch (err) {
			console.error('Failed to delete comparison:', err);
		}
	}
</script>

<div class="comparisons-page">
	<section class="page-header">
		<div class="header-content">
			<h1>Comparison Tool</h1>
			<p class="subtitle">Make better decisions by comparing your options side-by-side</p>
		</div>
		<div class="header-actions">
			<button class="info-btn" onclick={() => (infoModalOpen = true)}>How it works</button>
			<button class="create-btn" onclick={openCreateModal}>+ New Comparison</button>
		</div>
	</section>

	{#if comparisons?.current && Array.isArray(comparisons.current)}
		{#if comparisons.current.length === 0}
			<div class="empty-state">
				<h2>No comparisons yet</h2>
				<p>Start by creating your first comparison to make informed decisions</p>
				<button class="create-btn-large" onclick={openCreateModal}
					>Create Your First Comparison</button
				>
			</div>
		{:else}
			<div class="comparisons-grid">
				{#each comparisons.current as comparison (comparison.id)}
					<a href={`/comparisons/${comparison.id}`}>
						<div class="comparison-card">
							<div class="card-header">
								<h3>
									{comparison.name}
								</h3>
								<button
									class="delete-btn"
									onclick={() => deleteComparison(comparison.id)}
									aria-label="Delete comparison"
								>
									×
								</button>
							</div>

							{#if comparison.description}
								<p class="description">{comparison.description}</p>
							{/if}
							<div class="card-meta">
								<span class="date">Created {formatDate(comparison.createdAt)}</span>
								{#if comparison.isPriceAFactor}
									<span class="badge">Price Factor</span>
								{/if}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="loading">Loading comparisons...</div>
	{/if}
</div>

{#if createModalOpen}
	<div class="modal">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (createModalOpen = false)}></div>
		<div class="modal-box">
			<h2>Create New Comparison</h2>
			<form onsubmit={createComparison}>
				<div class="form-group">
					<label for="comparison-name">What are you comparing?</label>
					<input
						type="text"
						id="comparison-name"
						bind:value={newComparisonName}
						placeholder="Enter comparison name"
						required
					/>
				</div>

				<div class="form-group">
					<label for="comparison-description">Description (optional)</label>
					<textarea
						id="comparison-description"
						bind:value={newComparisonDescription}
						placeholder="Add any notes about this comparison..."
						rows="3"
					></textarea>
				</div>

				<div class="form-group checkbox-group">
					<label>
						<input type="checkbox" bind:checked={isPriceAFactor} />
						<span>Is price a consideration factor?</span>
					</label>
				</div>

				{#if isPriceAFactor}
					<div class="form-group">
						<label for="price-weight">
							Price Importance (1-10)
							<span class="label-hint">How much should price impact the final score?</span>
						</label>
						<input
							type="range"
							id="price-weight"
							bind:value={priceWeight}
							min="1"
							max="10"
							step="1"
						/>
						<div class="range-value">{priceWeight}</div>
					</div>
				{/if}

				<div class="modal-buttons">
					<button type="submit" class="btn-primary">Create Comparison</button>
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
			<h2>How the Comparison Tool Works</h2>

			<div class="info-section">
				<h3>1. Create a Comparison</h3>
				<p>
					Start by naming your comparison and optionally adding a description. You can also indicate
					if price is a factor in your decision.
				</p>
			</div>

			<div class="info-section">
				<h3>2. Define Your Criteria</h3>
				<p>Add the factors that matter to you. Each criterion can be either:</p>
				<ul>
					<li><strong>Yes/No:</strong> Whether an item has a feature or not</li>
					<li>
						<strong>Numeric:</strong> Measurable values where you specify if higher or lower is better
					</li>
				</ul>
				<p>
					Drag criteria to reorder them - items at the top have higher importance and weight more
					heavily in scoring.
				</p>
			</div>

			<div class="info-section">
				<h3>3. Add Items to Compare</h3>
				<p>
					Add the options you're considering. For each item, you can set values for your criteria.
				</p>
			</div>

			<div class="info-section">
				<h3>4. Automatic Scoring</h3>
				<p>
					Items are automatically ranked based on how well they match your criteria. Each criterion
					contributes points based on its weight, and items are sorted from highest to lowest score.
				</p>
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
	.comparisons-page {
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

	.comparisons-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;

		a {
			text-decoration: none;
		}
	}

	.comparison-card {
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

	.badge {
		background: rgba(255, 208, 0, 0.2);
		color: var(--textColor);
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: var(--color-tertiary, #666);
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

	.checkbox-group {
		label {
			display: flex;
			align-items: center;
			gap: 10px;
			cursor: pointer;
			font-weight: normal;
		}

		input[type='checkbox'] {
			width: 18px;
			height: 18px;
			cursor: pointer;
		}
	}

	.label-hint {
		display: block;
		font-size: 0.85rem;
		font-weight: normal;
		color: var(--color-tertiary, #666);
		margin-top: 4px;
	}

	input[type='range'] {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: rgba(0, 0, 0, 0.1);
		outline: none;
		cursor: pointer;
		margin: 8px 0;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	input[type='range']::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
	}

	input[type='range']::-moz-range-thumb:hover {
		transform: scale(1.2);
	}

	.range-value {
		text-align: center;
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--primary);
		margin-top: 4px;
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
		.comparisons-page {
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

		.comparisons-grid {
			grid-template-columns: 1fr;
			gap: 16px;
		}

		.comparison-card {
			padding: 16px;
		}

		.card-header h3 {
			font-size: 1.1rem;
		}

		.card-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
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

		.info-section h3 {
			font-size: 1rem;
		}

		.info-section p,
		.info-section ul {
			font-size: 0.9rem;
		}
	}

	@media (max-width: 640px) {
		.comparisons-page {
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

		.comparison-card {
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

		.info-section {
			margin-bottom: 20px;
		}

		.info-section h3 {
			font-size: 0.95rem;
		}

		.info-section p,
		.info-section ul {
			font-size: 0.85rem;
			line-height: 1.5;
		}

		.info-section ul {
			padding-left: 20px;
		}
	}
</style>
