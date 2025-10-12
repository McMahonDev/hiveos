<script lang="ts"><script lang="ts"><script lang="ts">

	import { Query } from 'zero-svelte';

	import { viewModeState } from '$lib/state/viewMode.svelte.ts';	import { Query } from 'zero-svelte';	import { Query } from 'zero-svelte';

	import { viewPreferencesState } from '$lib/utils/viewPreferences';

	import { viewModeState } from '$lib/state/viewMode.svelte.ts';	import { viewModeState } from						<label class="setting-item">

	let { data } = $props();

	const z = data.z;	import { viewPreferencesState } from '$lib/utils/viewPreferences';							<div class="setting-info">

	const id = data.id;

								<span class="setting-name">Shopping List</span>

	// Query custom categories

	let customCategories = $state<Query<any, any, any> | undefined>(undefined);	let { data } = $props();								<span class="setting-description"



	$effect(() => {	const z = data.z;									>Show shopping list in {getViewName(viewMode)}</span

		if (data.auth && z?.current) {

			customCategories = new Query(	const id = data.id;								>

				z.current.query.viewModeCategories.where('userId', id).orderBy('createdAt', 'asc')

			);							</div>

		}

	});	// Query custom categories							<label class="toggle-switch">



	// Add custom categories to preferences when they load	let customCategories = $state<Query<any, any, any> | undefined>(undefined);								<input

	$effect(() => {

		if (customCategories?.current && Array.isArray(customCategories.current)) {									type="checkbox"

			customCategories.current.forEach((cat: any) => {

				if (!viewPreferencesState.preferences[cat.id]) {	$effect(() => {									checked={viewPreferencesState.preferences[viewMode]?.showShoppingList ?? true}

					viewPreferencesState.preferences[cat.id] = { showEvents: true, showShoppingList: true };

				}		if (data.auth && z?.current) {									onchange={() => viewPreferencesState.toggleSetting(viewMode, 'showShoppingList')}

			});

		}			customCategories = new Query(								/>

	});

				z.current.query.viewModeCategories.where('userId', id).orderBy('createdAt', 'asc')								<span class="slider"></span>

	function getViewName(viewMode: string): string {

		if (viewMode === 'personal') return 'Personal';			);							</label>

		if (viewMode === 'shared') return 'Shared';

		if (customCategories?.current && Array.isArray(customCategories.current)) {		}						</label>wMode.svelte.ts';

			const cat = customCategories.current.find((c: any) => c.id === viewMode);

			if (cat) return cat.name;	});	import { viewPreferencesState } from '$lib/utils/viewPreferences';

		}

		return viewMode;

	}

	// Add custom categories to preferences when they load	let { data } = $props();

	let allViewModes = $derived(() => {

		const modes = ['personal'];	$effect(() => {	const z = data.z;

		if (data.groupId !== data.id) {

			modes.push('shared');		if (customCategories?.current && Array.isArray(customCategories.current)) {	const id = data.id;

		}

		if (customCategories?.current && Array.isArray(customCategories.current)) {			customCategories.current.forEach((cat: any) => {

			customCategories.current.forEach((cat: any) => modes.push(cat.id));

		}				if (!viewPreferencesState.preferences[cat.id]) {	// Query custom categories

		return modes;

	});					viewPreferencesState.preferences[cat.id] = { showEvents: true, showShoppingList: true };	let customCategories = $state<Query<any, any, any> | undefined>(undefined);

</script>

				}

{#if data.auth}

	<div class="settings-container">			});	$effect(() => {

		<div class="header">

			<h1>View Settings</h1>		}		if (data.auth && z?.current) {

			<p class="subtitle">

				Customize which lists appear in each view mode. Hide lists you don't need in specific	});			customCategories = new Query(

				contexts.

			</p>				z.current.query.viewModeCategories.where('userId', id).orderBy('createdAt', 'asc')

		</div>

	function getViewName(viewMode: string): string {			);

		<div class="settings-grid">

			{#each allViewModes() as viewMode (viewMode)}		if (viewMode === 'personal') return 'Personal';		}

				<div class="view-card">

					<div class="view-header">		if (viewMode === 'shared') return 'Shared';	});

						<h2>{getViewName(viewMode)}</h2>

						{#if viewMode === viewModeState.currentMode}		if (customCategories?.current && Array.isArray(customCategories.current)) {

							<span class="current-badge">Current</span>

						{/if}			const cat = customCategories.current.find((c: any) => c.id === viewMode);	// Add custom categories to preferences when they load

					</div>

			if (cat) return cat.name;	$effect(() => {

					<div class="settings-list">

						<label class="setting-item">		}		if (customCategories?.current && Array.isArray(customCategories.current)) {

							<div class="setting-info">

								<span class="setting-name">Events & My Day</span>		return viewMode;			customCategories.current.forEach((cat: any) => {

								<span class="setting-description">Show events and My Day in {getViewName(viewMode)}</span>

							</div>	}				if (!viewPreferencesState.preferences[cat.id]) {

							<label class="toggle-switch">

								<input					viewPreferencesState.preferences[cat.id] = { showEvents: true, showShoppingList: true };

									type="checkbox"

									checked={viewPreferencesState.preferences[viewMode]?.showEvents ?? true}	let allViewModes = $derived(() => {				}

									onchange={() => viewPreferencesState.toggleSetting(viewMode, 'showEvents')}

								/>		const modes = ['personal'];			});

								<span class="slider"></span>

							</label>		if (data.groupId !== data.id) {		}

						</label>

			modes.push('shared');	});

						<label class="setting-item">

							<div class="setting-info">		}

								<span class="setting-name">Shopping List</span>

								<span class="setting-description"		if (customCategories?.current && Array.isArray(customCategories.current)) {	function getViewName(viewMode: string): string {

									>Show shopping list in {getViewName(viewMode)}</span

								>			customCategories.current.forEach((cat: any) => modes.push(cat.id));		if (viewMode === 'personal') return 'Personal';

							</div>

							<label class="toggle-switch">		}		if (viewMode === 'shared') return 'Shared';

								<input

									type="checkbox"		return modes;		if (customCategories?.current && Array.isArray(customCategories.current)) {

									checked={viewPreferencesState.preferences[viewMode]?.showShoppingList ?? true}

									onchange={() => viewPreferencesState.toggleSetting(viewMode, 'shoppingList')}	});			const cat = customCategories.current.find((c: any) => c.id === viewMode);

								/>

								<span class="slider"></span></script>			if (cat) return cat.name;

							</label>

						</label>		}

					</div>

				</div>{#if data.auth}		return viewMode;

			{/each}

		</div>	<div class="settings-container">	}



		<div class="info-box">		<div class="header">

			<h3>ℹ️ About View Settings</h3>

			<p>			<h1>View Settings</h1>	let allViewModes = $derived(() => {

				These settings control which default lists (Events and Shopping List) appear in your

				sidebar for each view mode. Your custom lists will always appear in the view where they			<p class="subtitle">		const modes = ['personal'];

				were created.

			</p>				Customize which lists appear in each view mode. Hide lists you don't need in specific		if (data.groupId !== data.id) {

			<p>

				<strong>Example:</strong> You might want to hide the Shopping List in your "Work" view since				contexts.			modes.push('shared');

				it's not relevant to work tasks. Disabling Events will also hide My Day since it depends on events.

			</p>			</p>		}

		</div>

	</div>		</div>		if (customCategories?.current && Array.isArray(customCategories.current)) {

{:else}

	<div class="auth-required">			customCategories.current.forEach((cat: any) => modes.push(cat.id));

		<p>Please log in to access settings.</p>

	</div>		<div class="settings-grid">		}

{/if}

			{#each allViewModes() as viewMode (viewMode)}		return modes;

<style>

	.settings-container {				<div class="view-card">	});

		max-width: 1200px;

		margin: 0 auto;					<div class="view-header"></script>

		padding: 24px;

	}						<h2>{getViewName(viewMode)}</h2>



	.header {						{#if viewMode === viewModeState.currentMode}{#if data.auth}

		margin-bottom: 32px;

	}							<span class="current-badge">Current</span>	<div class="settings-container">



	.header h1 {						{/if}		<div class="header">

		font-size: 2rem;

		margin: 0 0 8px 0;					</div>			<h1>View Settings</h1>

		color: #333;

	}			<p class="subtitle">



	.subtitle {					<div class="settings-list">				Customize which lists appear in each view mode. Hide lists you don't need in specific

		color: #666;

		font-size: 1rem;						<label class="setting-item">				contexts.

		margin: 0;

	}							<div class="setting-info">			</p>



	.settings-grid {								<span class="setting-name">Events & My Day</span>		</div>

		display: grid;

		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));								<span class="setting-description">Show events and My Day in {getViewName(viewMode)}</span>

		gap: 28px;

		margin-bottom: 40px;							</div>		<div class="settings-grid">

	}

							<label class="toggle-switch">			{#each allViewModes() as viewMode (viewMode)}

	.view-card {

		background: white;								<input				<div class="view-card">

		border: 3px solid #e5e5e5;

		border-radius: 16px;									type="checkbox"					<div class="view-header">

		padding: 28px;

		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);									checked={viewPreferencesState.preferences[viewMode]?.showEvents ?? true}						<h2>{getViewName(viewMode)}</h2>

		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

	}									onchange={() => viewPreferencesState.toggleSetting(viewMode, 'showEvents')}						{#if viewMode === viewModeState.currentMode}



	.view-card:hover {								/>							<span class="current-badge">Current</span>

		border-color: var(--primary);

		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);								<span class="slider"></span>						{/if}

		transform: translateY(-2px);

	}							</label>					</div>



	.view-header {						</label>

		display: flex;

		align-items: center;					<div class="settings-list">

		justify-content: space-between;

		margin-bottom: 24px;						<label class="setting-item">						<label class="setting-item">

		padding-bottom: 20px;

		border-bottom: 3px solid #f5f5f5;							<div class="setting-info">							<div class="setting-info">

	}

								<span class="setting-name">Shopping List</span>								<span class="setting-name">Events & My Day</span>

	.view-header h2 {

		font-size: 1.75rem;								<span class="setting-description"								<span class="setting-description">Show events and My Day in {getViewName(viewMode)}</span>

		margin: 0;

		color: #1a1a1a;									>Show shopping list in {getViewName(viewMode)}</span							</div>

		font-weight: 700;

	}								>							<label class="toggle-switch">



	.current-badge {							</div>								<input

		background-color: var(--primary);

		color: #000;							<label class="toggle-switch">									type="checkbox"

		padding: 6px 14px;

		border-radius: 16px;								<input									checked={viewPreferencesState.preferences[viewMode]?.showEvents ?? true}

		font-size: 0.7rem;

		font-weight: 700;									type="checkbox"									onchange={() => viewPreferencesState.toggleSetting(viewMode, 'showEvents')}

		text-transform: uppercase;

		letter-spacing: 0.5px;									checked={viewPreferencesState.preferences[viewMode]?.showShoppingList ?? true}								/>

		box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);

	}									onchange={() => viewPreferencesState.toggleSetting(viewMode, 'shoppingList')}								<span class="slider"></span>



	.settings-list {								/>							</label>

		display: flex;

		flex-direction: column;								<span class="slider"></span>						</label>

		gap: 12px;

	}							</label>



	.setting-item {						</label>						<label class="setting-item">

		display: flex;

		align-items: center;					</div>							<div class="setting-info">

		justify-content: space-between;

		padding: 20px;				</div>								<span class="setting-name">Shopping List</span>

		background-color: #fafafa;

		border: 2px solid transparent;			{/each}								<span class="setting-description"

		border-radius: 12px;

		cursor: pointer;		</div>									>Show shopping list in {getViewName(viewMode)}</span

		transition: all 0.2s ease;

	}								>



	.setting-item:hover {		<div class="info-box">							</div>

		background-color: #f0f0f0;

		border-color: #e0e0e0;			<h3>ℹ️ About View Settings</h3>							<label class="toggle-switch">

	}

			<p>								<input

	.setting-info {

		display: flex;				These settings control which default lists (Events and Shopping List) appear in your									type="checkbox"

		flex-direction: column;

		gap: 6px;				sidebar for each view mode. Your custom lists will always appear in the view where they									checked={preferences[viewMode]?.showShoppingList ?? true}

		flex: 1;

	}				were created.									onchange={() => toggleSetting(viewMode, 'showShoppingList')}



	.setting-name {			</p>								/>

		font-weight: 700;

		font-size: 1.05rem;			<p>								<span class="slider"></span>

		color: #1a1a1a;

		letter-spacing: -0.02em;				<strong>Example:</strong> You might want to hide the Shopping List in your "Work" view since							</label>

	}

				it's not relevant to work tasks. Disabling Events will also hide My Day since it depends on events.						</label>

	.setting-description {

		font-size: 0.9rem;			</p>					</div>

		color: #666;

		line-height: 1.4;		</div>				</div>

	}

	</div>			{/each}

	/* Toggle Switch */

	.toggle-switch {{:else}		</div>

		position: relative;

		display: inline-block;	<div class="auth-required">

		width: 56px;

		height: 32px;		<p>Please log in to access settings.</p>		<div class="info-box">

		flex-shrink: 0;

		margin-left: 12px;	</div>			<h3>ℹ️ About View Settings</h3>

	}

{/if}			<p>

	.toggle-switch input {

		opacity: 0;				These settings control which default lists (Events and Shopping List) appear in your

		width: 0;

		height: 0;<style>				sidebar for each view mode. Your custom lists will always appear in the view where they

	}

	.settings-container {				were created.

	.slider {

		position: absolute;		max-width: 1200px;			</p>

		cursor: pointer;

		top: 0;		margin: 0 auto;			<p>

		left: 0;

		right: 0;		padding: 24px;				<strong>Example:</strong> You might want to hide the Shopping List in your "Work" view since

		bottom: 0;

		background-color: #d0d0d0;	}				it's not relevant to work tasks.

		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

		border-radius: 32px;			</p>

		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

	}	.header {		</div>



	.slider:before {		margin-bottom: 32px;	</div>

		position: absolute;

		content: '';	}{:else}

		height: 24px;

		width: 24px;	<div class="auth-required">

		left: 4px;

		bottom: 4px;	.header h1 {		<p>Please log in to access settings.</p>

		background-color: white;

		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);		font-size: 2rem;	</div>

		border-radius: 50%;

		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);		margin: 0 0 8px 0;{/if}

	}

		color: #333;

	input:checked + .slider {

		background-color: var(--primary);	}<style>

		box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);

	}	.settings-container {



	input:checked + .slider:before {	.subtitle {		max-width: 1200px;

		transform: translateX(24px);

	}		color: #666;		margin: 0 auto;



	.info-box {		font-size: 1rem;		padding: 24px;

		background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);

		border: 3px solid #b3d9ff;		margin: 0;	}

		border-radius: 16px;

		padding: 28px;	}

		box-shadow: 0 4px 12px rgba(0, 100, 200, 0.08);

	}	.header {



	.info-box h3 {	.settings-grid {		margin-bottom: 32px;

		margin: 0 0 16px 0;

		color: #1a1a1a;		display: grid;	}

		font-size: 1.2rem;

		font-weight: 700;		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));

	}

		gap: 28px;	.header h1 {

	.info-box p {

		margin: 0 0 14px 0;		margin-bottom: 40px;		font-size: 2rem;

		color: #444;

		line-height: 1.7;	}		margin: 0 0 8px 0;

		font-size: 0.95rem;

	}		color: #333;



	.info-box p:last-child {	.view-card {	}

		margin-bottom: 0;

	}		background: white;



	.auth-required {		border: 3px solid #e5e5e5;	.subtitle {

		max-width: 600px;

		margin: 48px auto;		border-radius: 16px;		color: #666;

		padding: 32px;

		text-align: center;		padding: 28px;		font-size: 1rem;

		background: white;

		border-radius: 12px;		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);		margin: 0;

		border: 2px solid #e0e0e0;

	}		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);	}



	@media screen and (max-width: 768px) {	}

		.settings-grid {

			grid-template-columns: 1fr;	.settings-grid {

		}

	.view-card:hover {		display: grid;

		.header h1 {

			font-size: 1.5rem;		border-color: var(--primary);		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));

		}

		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);		gap: 28px;

		.view-header h2 {

			font-size: 1.25rem;		transform: translateY(-2px);		margin-bottom: 40px;

		}

	}	}	}

</style>



	.view-header {	.view-card {

		display: flex;		background: white;

		align-items: center;		border: 3px solid #e5e5e5;

		justify-content: space-between;		border-radius: 16px;

		margin-bottom: 24px;		padding: 28px;

		padding-bottom: 20px;		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

		border-bottom: 3px solid #f5f5f5;		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

	}	}



	.view-header h2 {	.view-card:hover {

		font-size: 1.75rem;		border-color: var(--primary);

		margin: 0;		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

		color: #1a1a1a;		transform: translateY(-2px);

		font-weight: 700;	}

	}

	.view-header {

	.current-badge {		display: flex;

		background-color: var(--primary);		align-items: center;

		color: #000;		justify-content: space-between;

		padding: 6px 14px;		margin-bottom: 24px;

		border-radius: 16px;		padding-bottom: 20px;

		font-size: 0.7rem;		border-bottom: 3px solid #f5f5f5;

		font-weight: 700;	}

		text-transform: uppercase;

		letter-spacing: 0.5px;	.view-header h2 {

		box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);		font-size: 1.75rem;

	}		margin: 0;

		color: #1a1a1a;

	.settings-list {		font-weight: 700;

		display: flex;	}

		flex-direction: column;

		gap: 12px;	.current-badge {

	}		background-color: var(--primary);

		color: #000;

	.setting-item {		padding: 6px 14px;

		display: flex;		border-radius: 16px;

		align-items: center;		font-size: 0.7rem;

		justify-content: space-between;		font-weight: 700;

		padding: 20px;		text-transform: uppercase;

		background-color: #fafafa;		letter-spacing: 0.5px;

		border: 2px solid transparent;		box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);

		border-radius: 12px;	}

		cursor: pointer;

		transition: all 0.2s ease;	.settings-list {

	}		display: flex;

		flex-direction: column;

	.setting-item:hover {		gap: 12px;

		background-color: #f0f0f0;	}

		border-color: #e0e0e0;

	}	.setting-item {

		display: flex;

	.setting-info {		align-items: center;

		display: flex;		justify-content: space-between;

		flex-direction: column;		padding: 20px;

		gap: 6px;		background-color: #fafafa;

		flex: 1;		border: 2px solid transparent;

	}		border-radius: 12px;

		cursor: pointer;

	.setting-name {		transition: all 0.2s ease;

		font-weight: 700;	}

		font-size: 1.05rem;

		color: #1a1a1a;	.setting-item:hover {

		letter-spacing: -0.02em;		background-color: #f0f0f0;

	}		border-color: #e0e0e0;

	}

	.setting-description {

		font-size: 0.9rem;	.setting-info {

		color: #666;		display: flex;

		line-height: 1.4;		flex-direction: column;

	}		gap: 6px;

		flex: 1;

	/* Toggle Switch */	}

	.toggle-switch {

		position: relative;	.setting-name {

		display: inline-block;		font-weight: 700;

		width: 56px;		font-size: 1.05rem;

		height: 32px;		color: #1a1a1a;

		flex-shrink: 0;		letter-spacing: -0.02em;

		margin-left: 12px;	}

	}

	.setting-description {

	.toggle-switch input {		font-size: 0.9rem;

		opacity: 0;		color: #666;

		width: 0;		line-height: 1.4;

		height: 0;	}

	}

	/* Toggle Switch */

	.slider {	.toggle-switch {

		position: absolute;		position: relative;

		cursor: pointer;		display: inline-block;

		top: 0;		width: 50px;

		left: 0;		height: 28px;

		right: 0;		flex-shrink: 0;

		bottom: 0;	}

		background-color: #d0d0d0;

		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);	.toggle-switch input {

		border-radius: 32px;		opacity: 0;

		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);		width: 0;

	}		height: 0;

	}

	.slider:before {

		position: absolute;	.slider {

		content: '';		position: absolute;

		height: 24px;		cursor: pointer;

		width: 24px;		top: 0;

		left: 4px;		left: 0;

		bottom: 4px;		right: 0;

		background-color: white;		bottom: 0;

		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);		background-color: #ccc;

		border-radius: 50%;		transition: 0.3s;

		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);		border-radius: 28px;

	}	}



	input:checked + .slider {	.slider:before {

		background-color: var(--primary);		position: absolute;

		box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);		content: '';

	}		height: 24px;

		width: 24px;

	input:checked + .slider:before {		left: 4px;

		transform: translateX(24px);		bottom: 4px;

	}		background-color: white;

		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	.info-box {		border-radius: 50%;

		background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

		border: 3px solid #b3d9ff;	}

		border-radius: 16px;

		padding: 28px;	input:checked + .slider {

		box-shadow: 0 4px 12px rgba(0, 100, 200, 0.08);		background-color: var(--primary);

	}		box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);

	}

	.info-box h3 {

		margin: 0 0 16px 0;	input:checked + .slider:before {

		color: #1a1a1a;		transform: translateX(22px);

		font-size: 1.2rem;	}

		font-weight: 700;

	}	.info-box {

		background-color: #f0f7ff;

	.info-box p {		border: 2px solid #b3d9ff;

		margin: 0 0 14px 0;		border-radius: 12px;

		color: #444;		padding: 24px;

		line-height: 1.7;	}

		font-size: 0.95rem;

	}	.info-box h3 {

		margin: 0 0 12px 0;

	.info-box p:last-child {		color: #333;

		margin-bottom: 0;		font-size: 1.1rem;

	}	}



	.auth-required {	.info-box p {

		max-width: 600px;		margin: 0 0 12px 0;

		margin: 48px auto;		color: #555;

		padding: 32px;		line-height: 1.6;

		text-align: center;	}

		background: white;

		border-radius: 12px;	.info-box p:last-child {

		border: 2px solid #e0e0e0;		margin-bottom: 0;

	}	}



	@media screen and (max-width: 768px) {	.auth-required {

		.settings-grid {		max-width: 600px;

			grid-template-columns: 1fr;		margin: 48px auto;

		}		padding: 32px;

		text-align: center;

		.header h1 {		background: white;

			font-size: 1.5rem;		border-radius: 12px;

		}		border: 2px solid #e0e0e0;

	}

		.view-header h2 {

			font-size: 1.25rem;	@media screen and (max-width: 768px) {

		}		.settings-grid {

	}			grid-template-columns: 1fr;

</style>		}


		.header h1 {
			font-size: 1.5rem;
		}

		.view-header h2 {
			font-size: 1.25rem;
		}
	}
</style>
