<script lang="ts">
	import { page } from '$app/stores';
	import { Query } from 'zero-svelte';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props<{ data: any }>();
	let z = data.z;
	let currentPath = $derived($page.url.pathname);

	// Query custom lists for dropdown
	let customLists = $state<Query<any, any, any> | null>(null);
	let showListsDropdown = $state(false);
	let dropdownRef = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (z?.current) {
			customLists = new Query(
				z.current.query.customLists
					.where('createdById', data.id)
					.where('viewMode', viewModeState.currentMode)
			);
		} else {
			customLists = null;
		}
	});

	// Close dropdown when clicking outside
	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
				showListsDropdown = false;
			}
		}

		if (showListsDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	});

	// Close dropdown when path changes (using untrack to prevent infinite loop)
	$effect(() => {
		const path = currentPath;
		if (path) {
			showListsDropdown = false;
		}
	});

	function isActive(path: string) {
		if (path === '/') return currentPath === '/';
		return currentPath.startsWith(path);
	}

	function handleListClick() {
		showListsDropdown = false;
	}
</script>

<nav class="desktop-nav">
	<a href="/" class="nav-link" class:active={isActive('/')}> Dashboard </a>

	{#if customLists?.current && Array.isArray(customLists.current)}
		{@const hasEventLists = customLists.current.some((list) => list.listType === 'events')}
		{#if hasEventLists}
			<a href="/my-day" class="nav-link" class:active={isActive('/my-day')}> My Day </a>
		{/if}
	{/if}

	<!-- Lists dropdown -->
	{#if customLists?.current && Array.isArray(customLists.current) && customLists.current.length > 0}
		<div class="nav-dropdown" bind:this={dropdownRef}>
			<button
				class="nav-link dropdown-trigger"
				class:active={currentPath.startsWith('/custom-list')}
				onclick={() => (showListsDropdown = !showListsDropdown)}
			>
				Lists
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="chevron"
					class:open={showListsDropdown}
				>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>

			{#if showListsDropdown}
				<div class="dropdown-menu">
					{#each customLists.current as list}
						<a
							href="/custom-list/{list.id}"
							class="dropdown-item"
							class:active={currentPath === `/custom-list/${list.id}`}
							onclick={handleListClick}
						>
							{list.name}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<a href="/comparisons" class="nav-link" class:active={isActive('/comparisons')}> Tools </a>

	{#if data?.isSuperadmin}
		<a href="/admin" class="nav-link admin-link" class:active={isActive('/admin')}> Admin </a>
	{/if}
</nav>

<style>
	.desktop-nav {
		display: none;
		align-items: center;
		gap: var(--spacing-xs);
	}

	@media screen and (min-width: 769px) {
		.desktop-nav {
			display: flex;
		}
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: var(--spacing-xs) var(--spacing-sm);
		text-decoration: none;
		color: var(--textColorLight);
		font-weight: 500;
		font-size: 0.95rem;
		border-radius: 8px;
		transition: all 0.2s ease;
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
	}

	.nav-link:hover {
		color: var(--textColor);
		background: rgba(0, 0, 0, 0.04);
	}

	.nav-link.active {
		color: var(--primary-dark);
		background: rgba(255, 183, 0, 0.12);
		font-weight: 600;
	}

	.nav-dropdown {
		position: relative;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.chevron {
		transition: transform 0.2s ease;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		min-width: 200px;
		background: white;
		border-radius: var(--borderRadius);
		box-shadow: var(--level-3);
		border: 1px solid var(--border);
		padding: var(--spacing-xs);
		z-index: 1001;
		animation: dropdownSlide 0.2s ease;
	}

	@keyframes dropdownSlide {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-item {
		display: block;
		padding: var(--spacing-xs) var(--spacing-sm);
		text-decoration: none;
		color: var(--textColor);
		font-size: 0.9rem;
		border-radius: 6px;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.dropdown-item:hover {
		background: rgba(255, 183, 0, 0.12);
		color: var(--primary-dark);
	}

	.admin-link {
		margin-left: auto;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white !important;
		font-weight: 600;
	}

	.admin-link:hover {
		background: linear-gradient(135deg, #5568d3 0%, #653a8d 100%);
		color: white !important;
	}

	.admin-link.active {
		background: linear-gradient(135deg, #7c8ff2 0%, #8659b0 100%);
		color: white !important;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}
</style>
