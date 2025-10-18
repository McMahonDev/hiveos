<script lang="ts">
	import { Query } from 'zero-svelte';
	import NewTab from '$lib/static/icons/newTab.svelte';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();
	let z = data.z;

	// Query custom lists for current view mode
	let customLists = $state<Query<any, any, any> | null>(null);

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

	function getListIcon(listType: string): string {
		switch (listType) {
			case 'shopping':
				return '🛒';
			case 'events':
				return '📅';
			case 'tasks':
				return '✓';
			case 'recipe':
				return '🍳';
			case 'messages':
				return '💬';
			case 'contacts':
				return '👤';
			case 'bookmarks':
				return '🔖';
			default:
				return '📝';
		}
	}

	function getListTypeName(listType: string): string {
		switch (listType) {
			case 'shopping':
				return 'Shopping List';
			case 'events':
				return 'Events';
			case 'tasks':
				return 'Task List';
			case 'recipe':
				return 'Recipe Box';
			case 'messages':
				return 'Messages';
			case 'contacts':
				return 'Contacts';
			case 'bookmarks':
				return 'Bookmarks';
			default:
				return 'List';
		}
	}

	// Query items count for each list
	function getItemCount(listId: string): number {
		if (!z?.current) return 0;
		const items = new Query(
			z.current.query.customListItems
				.where('customListId', listId)
				.where('viewMode', viewModeState.currentMode)
		);
		return items.current?.length || 0;
	}
</script>

<div class="container">
	<div class="header">
		<h1>Welcome{data.name ? `, ${data.name}` : ''}!</h1>
		<p class="subtitle">
			{#if customLists?.current && customLists.current.length > 0}
				You have {customLists.current.length} list{customLists.current.length !== 1 ? 's' : ''} in {viewModeState.currentMode ===
				'personal'
					? 'Personal'
					: 'Shared'} mode.
			{:else}
				Click "+ Create List" in the sidebar to get started.
			{/if}
		</p>
	</div>

	{#if customLists?.current && Array.isArray(customLists.current) && customLists.current.length > 0}
		<div class="lists-grid">
			{#each customLists.current as list (list.id)}
				<a class="card list-card" href={`/custom-list/${list.id}`}>
					<div class="card-header">
						<span class="list-icon">{getListIcon(list.listType)}</span>
						<div class="list-info">
							<h2>{list.name}</h2>
							<span class="list-type">{getListTypeName(list.listType)}</span>
						</div>
						<NewTab />
					</div>
					<div class="card-footer">
						<span class="item-count">{getItemCount(list.id)} items</span>
					</div>
				</a>
			{/each}
		</div>
	{:else if customLists?.current !== undefined}
		<div class="empty-state">
			<div class="empty-icon">📋</div>
			<h2>No lists yet</h2>
			<p>Create your first list to get started!</p>
			<p class="hint">Click the "+ Create List" button in the sidebar</p>
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.header {
		text-align: center;

		h1 {
			font-size: 2rem;
			margin: 0 0 10px 0;
		}

		.subtitle {
			color: var(--color-tertiary, #666);
			font-size: 1rem;
			margin: 0;
		}
	}

	.lists-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 20px;

		@media screen and (max-width: 640px) {
			grid-template-columns: 1fr;
		}
	}

	.card {
		padding: 20px;
		background-color: var(--level-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: var(--level-1);
		transition: all 0.2s ease;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 15px;

		&:hover {
			box-shadow: var(--level-3);
			transform: translateY(-2px);
		}

		.card-header {
			display: flex;
			align-items: flex-start;
			gap: 12px;

			.list-icon {
				font-size: 2rem;
				flex-shrink: 0;
			}

			.list-info {
				flex: 1;
				display: flex;
				flex-direction: column;
				gap: 4px;

				h2 {
					margin: 0;
					font-size: 1.25rem;
					font-weight: 600;
					color: var(--textColor);
				}

				.list-type {
					font-size: 0.875rem;
					color: var(--color-tertiary, #666);
					font-weight: 500;
				}
			}

			:global(svg) {
				flex-shrink: 0;
				margin-top: 4px;
			}
		}

		.card-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-top: 12px;
			border-top: 1px solid rgba(0, 0, 0, 0.1);

			.item-count {
				font-size: 0.875rem;
				color: var(--color-tertiary, #666);
				font-weight: 500;
			}
		}
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;

		.empty-icon {
			font-size: 4rem;
			margin-bottom: 20px;
			opacity: 0.5;
		}

		h2 {
			margin: 0 0 10px 0;
			font-size: 1.5rem;
			color: var(--textColor);
		}

		p {
			color: var(--color-tertiary, #666);
			margin: 5px 0;

			&.hint {
				font-size: 0.875rem;
				margin-top: 20px;
				padding: 12px 20px;
				background: rgba(0, 0, 0, 0.03);
				border-radius: 8px;
				display: inline-block;
			}
		}
	}
</style>
