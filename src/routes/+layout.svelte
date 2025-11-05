<script lang="ts">
	import '$lib/static/normalize.css';
	import '$lib/static/global.css';
	import '$lib/static/animations.css';
	import { fly } from 'svelte/transition';
	import LogoutIcon from '$lib/static/icons/logoutIcon.svelte';
	import ViewModeDropdown from '$lib/components/viewModeDropdown.svelte';
	import BottomNav from '$lib/components/bottomNav.svelte';
	import DesktopNav from '$lib/components/desktopNav.svelte';
	import Fab from '$lib/components/fab.svelte';
	import ListIcon from '$lib/components/listIcon.svelte';
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';
	import { viewPreferencesState } from '$lib/utils/viewPreferences.svelte';
	import OfflineIndicator from '$lib/components/offlineIndicator.svelte';
	import { page } from '$app/stores';

	let { children, data } = $props();
	let z = $derived(data.z);
	let auth = $derived(data.auth);
	let inGroup = $derived(data.groupId !== data.id);
	let createListModalOpen = $state(false);
	let selectedListType = $state<
		'basic' | 'shopping' | 'events' | 'tasks' | 'recipe' | 'messages' | 'contacts' | 'bookmarks'
	>('basic');

	let customLists = $state<Query<any, any, any> | undefined>(undefined);
	let isCheckingSession = $state(false);

	function openCreateListModal() {
		createListModalOpen = true;
	}

	async function handleLogout() {
		try {
			await authClient.signOut();
			await invalidateAll(); // This will re-run all load functions
			await goto('/account/login', { replaceState: true, noScroll: true });
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	// Check if session is still valid
	async function checkSession() {
		if (isCheckingSession || !auth) return;

		isCheckingSession = true;
		try {
			const session = await authClient.getSession();

			// If no session data returned but we think we're authenticated, log out
			if (!session?.data) {
				console.log('Session expired or revoked - logging out');
				await handleLogout();
			}
		} catch (error) {
			console.error('Session check failed:', error);
			// Session is invalid, log out
			await handleLogout();
		} finally {
			isCheckingSession = false;
		}
	}

	// Set up periodic session checking - check every 5 minutes instead of 5 seconds
	$effect(() => {
		if (!auth) return;

		// Check session every 5 minutes (300000ms) - much more reasonable than 5 seconds
		const interval = setInterval(checkSession, 300000);

		return () => {
			clearInterval(interval);
		};
	});

	$effect(() => {
		// set or clear the Query instance when auth / z.current changes
		if (auth && z?.current) {
			// Filter custom lists by current view mode
			const viewMode = viewModeState.currentMode;
			customLists = new Query(
				z.current.query.customLists.where('createdById', data.id).where('viewMode', viewMode)
			);
		} else {
			customLists = undefined;
		}
	});

	function createList(e: Event) {
		e.preventDefault();
		createListModalOpen = false;
		// get form data and create list logic here
		const formData = new FormData(e.target as HTMLFormElement);
		const listName = formData.get('list-name');
		const id = nanoid();
		z?.current?.mutate.customLists
			.insert({
				id,
				name: listName as string,
				createdById: data.id,
				createdAt: Date.now(),
				viewMode: viewModeState.currentMode,
				listType: selectedListType
			})
			.then(() => {
				(e.target as HTMLFormElement).reset();
				selectedListType = 'basic'; // Reset to default
				goto(`/custom-list/${id}`);
			})
			.catch((err) => {
				console.error('insert failed', err);
			});
	}
</script>

{#if auth}
	<OfflineIndicator {z} />
{/if}

<header>
	<div class="header-left">
		<h1><a href="/">HiveOS</a></h1>
		{#if auth}
			<DesktopNav {data} />
		{/if}
	</div>

	<div class="header-right">
		{#if auth}
			<ViewModeDropdown {data} />
		{:else}
			<a href="/account/login" class="auth-link">Login</a>
			<a href="/account/register" class="auth-link">Register</a>
		{/if}
	</div>
</header>

<div class="main-layout">
	{#if auth}
		<!-- FAB for creating lists -->
		<Fab onclick={openCreateListModal} />

		<!-- Bottom navigation for mobile -->
		<BottomNav />

		<!-- Create List Modal -->
		{#if createListModalOpen}
			<div class="create-list-modal">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="modal-backdrop" onclick={() => (createListModalOpen = false)}></div>
				<div class="modal-box">
					<h2>Create New List</h2>
					<form onsubmit={createList}>
						<label for="list-name">List Name:</label>
						<input type="text" id="list-name" name="list-name" required />

						<fieldset class="list-type-selection">
							<legend>Choose List Type:</legend>

							<label class="list-type-option">
								<input
									type="radio"
									name="list-type"
									value="basic"
									bind:group={selectedListType}
									checked
								/>
								<div class="option-content">
									<span class="option-icon">
										<ListIcon type="basic" size={24} />
									</span>
									<div class="option-text">
										<strong>Basic List</strong>
										<small>Simple checklist for any purpose</small>
									</div>
								</div>
							</label>

							<label class="list-type-option">
								<input
									type="radio"
									name="list-type"
									value="shopping"
									bind:group={selectedListType}
								/>
								<div class="option-content">
									<span class="option-icon">
										<ListIcon type="shopping" size={24} />
									</span>
									<div class="option-text">
										<strong>Shopping List</strong>
										<small>Track items by store</small>
									</div>
								</div>
							</label>

							<label class="list-type-option">
								<input type="radio" name="list-type" value="events" bind:group={selectedListType} />
								<div class="option-content">
									<span class="option-icon">
										<ListIcon type="events" size={24} />
									</span>
									<div class="option-text">
										<strong>Events</strong>
										<small>Schedule with dates & times</small>
									</div>
								</div>
							</label>

							<label class="list-type-option">
								<input type="radio" name="list-type" value="tasks" bind:group={selectedListType} />
								<div class="option-content">
									<span class="option-icon">
										<ListIcon type="tasks" size={24} />
									</span>
									<div class="option-text">
										<strong>Task List</strong>
										<small>Sortable tasks with drag & drop</small>
									</div>
								</div>
							</label>

							<label class="list-type-option">
								<input type="radio" name="list-type" value="recipe" bind:group={selectedListType} />
								<div class="option-content">
									<span class="option-icon">
										<ListIcon type="recipe" size={24} />
									</span>
									<div class="option-text">
										<strong>Recipe Box</strong>
										<small>Ingredients, instructions & cooking times</small>
									</div>
								</div>
							</label>

							{#if inGroup}
								<label class="list-type-option">
									<input
										type="radio"
										name="list-type"
										value="messages"
										bind:group={selectedListType}
									/>
									<div class="option-content">
										<span class="option-icon">
											<ListIcon type="messages" size={24} />
										</span>
										<div class="option-text">
											<strong>Messages</strong>
											<small>Notes, reminders & communication</small>
										</div>
									</div>
								</label>
							{/if}

							<label class="list-type-option">
								<input
									type="radio"
									name="list-type"
									value="contacts"
									bind:group={selectedListType}
								/>
								<div class="option-content">
									<span class="option-icon">
										<ListIcon type="contacts" size={24} />
									</span>
									<div class="option-text">
										<strong>Contacts</strong>
										<small>Phone, email & address book</small>
									</div>
								</div>
							</label>

							<label class="list-type-option">
								<input
									type="radio"
									name="list-type"
									value="bookmarks"
									bind:group={selectedListType}
								/>
								<div class="option-content">
									<span class="option-icon">
										<ListIcon type="bookmarks" size={24} />
									</span>
									<div class="option-text">
										<strong>Bookmarks</strong>
										<small>Save and organize links</small>
									</div>
								</div>
							</label>
						</fieldset>

						<div class="modal-buttons">
							<button type="submit">Create</button>
							<button type="button" onclick={() => (createListModalOpen = false)}>Cancel</button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	{/if}

	<main>
		{@render children()}
	</main>
</div>

<!-- <footer></footer> -->

<style>
	:global(body) {
		padding-bottom: var(--bottomNavHeight);
	}

	:global(body:has(.offline-banner, .syncing-banner)) header {
		top: 36px;
	}

	@media (max-width: 640px) {
		:global(body:has(.offline-banner, .syncing-banner)) header {
			top: 32px;
		}
	}

	@media screen and (min-width: 769px) {
		:global(body) {
			padding-bottom: 0;
		}
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 var(--spacing-md);
		transition: top 0.3s ease;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--textColor);
		margin: 0;
		padding: 0;

		a {
			text-decoration: none;
			color: inherit;
			transition: color 0.2s ease;

			&:hover {
				color: var(--primary);
			}
		}
	}

	.auth-link {
		text-decoration: none;
		color: var(--textColor);
		font-weight: 500;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: 8px;
		transition: all 0.2s ease;

		&:hover {
			background: rgba(0, 0, 0, 0.04);
			color: var(--primary-dark);
		}
	}

	@media screen and (max-width: 768px) {
		h1 {
			font-size: 1.5rem;
		}
	}

	.main-layout {
		min-height: calc(100vh - var(--headerHeight));
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--spacing-lg);
		background-color: var(--background);
		min-height: calc(100vh - var(--headerHeight) - var(--bottomNavHeight));
	}

	@media screen and (min-width: 769px) {
		main {
			min-height: calc(100vh - var(--headerHeight));
			padding: var(--spacing-xl);
		}
	}

	@media screen and (max-width: 640px) {
		main {
			padding: var(--spacing-md);
		}
	}

	.create-list-modal {
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
			border-radius: 10px;
			box-shadow: var(--level-3);
			z-index: 10001;
			max-width: 500px;
			width: 100%;
			max-height: 90vh;
			overflow-y: auto;
		}

		h2 {
			margin-top: 0;
			margin-bottom: 20px;
			color: var(--textColor);
		}

		form {
			display: flex;
			flex-direction: column;
			gap: 20px;

			label:not(.list-type-option) {
				font-weight: bold;
				color: var(--textColor);
			}

			input[type='text'] {
				padding: 10px;
				border: 1px solid #ccc;
				border-radius: 5px;
				font-size: 1rem;
			}

			.list-type-selection {
				border: 1px solid rgba(0, 0, 0, 0.1);
				border-radius: 8px;
				padding: 15px;
				display: flex;
				flex-direction: column;
				gap: 10px;

				legend {
					font-weight: bold;
					padding: 0 8px;
					color: var(--textColor);
				}

				.list-type-option {
					display: flex;
					align-items: center;
					padding: 12px;
					border: 2px solid rgba(0, 0, 0, 0.1);
					border-radius: 8px;
					cursor: pointer;
					transition: all 0.2s ease;

					&:has(input:checked) {
						border-color: var(--primary);
						background-color: rgba(255, 208, 0, 0.1);
					}

					&:hover {
						background-color: rgba(0, 0, 0, 0.02);
					}

					input[type='radio'] {
						margin-right: 12px;
						cursor: pointer;
					}

					.option-content {
						display: flex;
						align-items: center;
						gap: 12px;
						flex: 1;
					}

					.option-icon {
						display: flex;
						align-items: center;
						justify-content: center;
						width: 32px;
						height: 32px;
					}

					.option-text {
						display: flex;
						flex-direction: column;
						gap: 2px;

						strong {
							color: var(--textColor);
							font-size: 1rem;
						}

						small {
							color: var(--color-tertiary, #666);
							font-size: 0.875rem;
						}
					}
				}
			}

			.modal-buttons {
				display: flex;
				gap: 10px;
				margin-top: 10px;
			}

			button {
				flex: 1;
				padding: 12px;
				border: none;
				border-radius: 5px;
				cursor: pointer;
				font-size: 1rem;
				font-weight: 600;
				transition: all 0.2s ease;

				&[type='submit'] {
					background-color: var(--primary);
					color: #000;

					&:hover {
						transform: translateY(-1px);
						box-shadow: var(--level-2);
					}
				}

				&[type='button'] {
					background-color: #ccc;
					color: #000;

					&:hover {
						background-color: #b8b8b8;
					}
				}

				&:active {
					transform: translateY(0);
				}
			}
		}
	}
</style>
