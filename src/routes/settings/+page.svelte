<script lang="ts">
	import { Query } from 'zero-svelte';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();

	const z = data.z;
	const id = data.id;

	// Query custom categories
	let customCategories = $state<Query<any, any, any> | undefined>(undefined);

	$effect(() => {
		if (data.auth && z?.current) {
			customCategories = new Query(
				z.current.query.viewModeCategories.where('userId', id).orderBy('createdAt', 'asc')
			);
		}
	});

	function getViewName(viewMode: string): string {
		if (viewMode === 'personal') return 'Personal';
		if (viewMode === 'shared') return 'Shared';
		if (customCategories?.current && Array.isArray(customCategories.current)) {
			const cat = customCategories.current.find((c: any) => c.id === viewMode);
			if (cat) return cat.name;
		}
		return viewMode;
	}

	let allViewModes = $derived(() => {
		const modes = ['personal'];
		if (data.groupId !== data.id) {
			modes.push('shared');
		}
		if (customCategories?.current && Array.isArray(customCategories.current)) {
			customCategories.current.forEach((cat: any) => modes.push(cat.id));
		}
		return modes;
	});

	// Query list counts for each view mode
	function getListCount(viewMode: string): number {
		if (!z?.current) return 0;
		const lists = new Query(z.current.query.customLists.where('viewMode', viewMode));
		return lists.current?.length || 0;
	}
</script>

{#if data.auth}
	<div class="settings-container">
		<div class="header">
			<h1>Settings</h1>
			<p class="subtitle">
				Manage your view modes and lists. Create custom lists for each view to organize your work.
			</p>
		</div>

		<div class="settings-grid">
			{#each allViewModes() as viewMode (viewMode)}
				<div class="view-card">
					<div class="view-header">
						<h2>{getViewName(viewMode)}</h2>
						{#if viewMode === viewModeState.currentMode}
							<span class="current-badge">Current</span>
						{/if}
					</div>

					<div class="view-stats">
						<div class="stat-item">
							<span class="stat-number">{getListCount(viewMode)}</span>
							<span class="stat-label">Lists</span>
						</div>
					</div>

					<div class="view-description">
						<p>
							{#if viewMode === 'personal'}
								Your personal lists. Only you can see these.
							{:else if viewMode === 'shared'}
								Shared lists with your group. All group members can see and edit these.
							{:else}
								Custom view mode for organizing specific types of work.
							{/if}
						</p>
					</div>
				</div>
			{/each}
		</div>

		<div class="info-box">
			<h3>ℹ️ About Lists & View Modes</h3>
			<p>
				<strong>View Modes</strong> help you organize your work into different contexts. Switch between
				them using the dropdown in the header.
			</p>
			<p>
				<strong>Lists</strong> are always tied to a specific view mode. When you create a list, it appears
				only in the current view mode.
			</p>
			<p>
				<strong>List Types:</strong>
			</p>
			<ul>
				<li><strong>📝 Basic List</strong> - Simple checklist for any purpose</li>
				<li><strong>🛒 Shopping List</strong> - Track items organized by store</li>
				<li><strong>📅 Events</strong> - Schedule with dates, times, and locations</li>
				<li><strong>✓ Task List</strong> - Sortable tasks with drag & drop ordering</li>
			</ul>
		</div>
	</div>
{:else}
	<div class="auth-required">
		<p>Please log in to access settings.</p>
	</div>
{/if}

<style>
	.settings-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px;
	}

	.header {
		margin-bottom: 32px;
	}

	.header h1 {
		font-size: 2rem;
		margin: 0 0 8px 0;
		color: #333;
	}

	.subtitle {
		color: #666;
		font-size: 1rem;
		margin: 0;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 28px;
		margin-bottom: 40px;
	}

	.view-card {
		background: white;
		border: 3px solid #e5e5e5;
		border-radius: 16px;
		padding: 28px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.view-card:hover {
		border-color: var(--primary);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		transform: translateY(-2px);
	}

	.view-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 3px solid #f5f5f5;
	}

	.view-header h2 {
		font-size: 1.5rem;
		margin: 0;
		color: #1a1a1a;
		font-weight: 700;
	}

	.current-badge {
		background-color: var(--primary);
		color: #000;
		padding: 6px 14px;
		border-radius: 16px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
	}

	.view-stats {
		display: flex;
		gap: 20px;
		margin-bottom: 16px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px 20px;
		background: #fafafa;
		border-radius: 8px;
		flex: 1;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: var(--primary);
		line-height: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #666;
		margin-top: 4px;
	}

	.view-description {
		color: #666;
		font-size: 0.95rem;
		line-height: 1.5;

		p {
			margin: 0;
		}
	}

	.info-box {
		background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
		border: 3px solid #b3d9ff;
		border-radius: 16px;
		padding: 28px;
		box-shadow: 0 4px 12px rgba(0, 100, 200, 0.08);
	}

	.info-box h3 {
		margin: 0 0 16px 0;
		color: #1a1a1a;
		font-size: 1.2rem;
		font-weight: 700;
	}

	.info-box p {
		margin: 0 0 14px 0;
		color: #444;
		line-height: 1.7;
		font-size: 0.95rem;
	}

	.info-box ul {
		margin: 12px 0 0 0;
		padding-left: 24px;
		color: #444;
	}

	.info-box li {
		margin: 8px 0;
		line-height: 1.6;
	}

	.info-box p:last-child {
		margin-bottom: 0;
	}

	.auth-required {
		max-width: 600px;
		margin: 48px auto;
		padding: 32px;
		text-align: center;
		background: white;
		border-radius: 12px;
		border: 2px solid #e0e0e0;
	}

	@media screen and (max-width: 768px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}

		.header h1 {
			font-size: 1.5rem;
		}

		.view-header h2 {
			font-size: 1.25rem;
		}
	}
</style>
