<script lang="ts">
	import { Query } from 'zero-svelte';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';
	import { viewPreferencesState } from '$lib/utils/viewPreferences.svelte';

	let { data } = $props();

	const z = data.z;
	const id = data.id;

	// Initialize preferences from localStorage
	$effect(() => {
		viewPreferencesState.init();
	});

	// Query custom categories
	let customCategories = $state<Query<any, any, any> | undefined>(undefined);

	$effect(() => {
		if (data.auth && z?.current) {
			customCategories = new Query(
				z.current.query.viewModeCategories.where('userId', id).orderBy('createdAt', 'asc')
			);
		}
	});

	// Add custom categories to preferences when they load
	$effect(() => {
		if (customCategories?.current && Array.isArray(customCategories.current)) {
			customCategories.current.forEach((cat: any) => {
				viewPreferencesState.ensureViewMode(cat.id);
			});
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
</script>

{#if data.auth}
	<div class="settings-container">
		<div class="header">
			<h1>View Settings</h1>
			<p class="subtitle">
				Customize which lists appear in each view mode. Hide lists you don't need in specific
				contexts.
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

					<div class="settings-list">
						<label class="setting-item">
							<div class="setting-info">
								<span class="setting-name">Events & My Day</span>
								<span class="setting-description"
									>Show events and My Day in {getViewName(viewMode)}</span
								>
							</div>
							<label class="toggle-switch">
								<input
									type="checkbox"
									checked={viewPreferencesState.preferences[viewMode]?.showEvents ?? true}
									onchange={() => viewPreferencesState.toggleSetting(viewMode, 'showEvents')}
								/>
								<span class="slider"></span>
							</label>
						</label>

						<label class="setting-item">
							<div class="setting-info">
								<span class="setting-name">Shopping List</span>
								<span class="setting-description"
									>Show shopping list in {getViewName(viewMode)}</span
								>
							</div>
							<label class="toggle-switch">
								<input
									type="checkbox"
									checked={viewPreferencesState.preferences[viewMode]?.showShoppingList ?? true}
									onchange={() => viewPreferencesState.toggleSetting(viewMode, 'showShoppingList')}
								/>
								<span class="slider"></span>
							</label>
						</label>
					</div>
				</div>
			{/each}
		</div>

		<div class="info-box">
			<h3>ℹ️ About View Settings</h3>
			<p>
				These settings control which default lists (Events and Shopping List) appear in your sidebar
				for each view mode. Your custom lists will always appear in the view where they were
				created.
			</p>
			<p>
				<strong>Example:</strong> You might want to hide the Shopping List in your "Work" view since
				it's not relevant to work tasks. Disabling Events will also hide My Day since it depends on events.
			</p>
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
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
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
		margin-bottom: 24px;
		padding-bottom: 20px;
		border-bottom: 3px solid #f5f5f5;
	}

	.view-header h2 {
		font-size: 1.75rem;
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

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px;
		background-color: #fafafa;
		border: 2px solid transparent;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
	}

	.setting-item:hover {
		background-color: #f0f0f0;
		border-color: #e0e0e0;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
	}

	.setting-name {
		font-weight: 700;
		font-size: 1.05rem;
		color: #1a1a1a;
		letter-spacing: -0.02em;
	}

	.setting-description {
		font-size: 0.9rem;
		color: #666;
		line-height: 1.4;
	}

	/* Toggle Switch */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 56px;
		height: 32px;
		flex-shrink: 0;
		margin-left: 12px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #d0d0d0;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 32px;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 24px;
		width: 24px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 50%;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	input:checked + .slider {
		background-color: var(--primary);
		box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
	}

	input:checked + .slider:before {
		transform: translateX(24px);
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
