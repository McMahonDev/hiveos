<script lang="ts">
	import '$lib/static/normalize.css';
	import '$lib/static/global.css';
	import { fly } from 'svelte/transition';
	import LogoutIcon from '$lib/static/icons/logoutIcon.svelte';
	import MenuIcon from '$lib/static/icons/menuIcon.svelte';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import ViewModeDropdown from '$lib/components/viewModeDropdown.svelte';
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';
	import { viewPreferencesState } from '$lib/utils/viewPreferences.svelte';
	import OfflineIndicator from '$lib/components/offlineIndicator.svelte';

	let { children, data } = $props();
	let z = $derived(data.z);
	let auth = $derived(data.auth);
	let menuOpen = $state(false);
	let inGroup = $derived(data.groupId !== data.id);
	let menu = $state<HTMLElement | null>(null);
	let createListModalOpen = $state(false);
	let selectedListType = $state<
		'basic' | 'shopping' | 'events' | 'tasks' | 'recipe' | 'messages' | 'contacts' | 'bookmarks'
	>('basic');

	let customLists = $state<Query<any, any, any> | undefined>(undefined);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	async function handleLogout() {
		try {
			await authClient.signOut();
			menuOpen = false; // Close menu on logout

			await invalidateAll(); // This will re-run all load functions

			await goto('/account/login', { replaceState: true, noScroll: true });
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

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

		// named handlers so they can be removed on cleanup
		function resizeHandler() {
			if (window.innerWidth > 690) {
				menuOpen = false;
			}
		}

		function popstateHandler() {
			menuOpen = false;
		}

		window.addEventListener('resize', resizeHandler);
		window.addEventListener('popstate', popstateHandler);

		return () => {
			window.removeEventListener('resize', resizeHandler);
			window.removeEventListener('popstate', popstateHandler);
		};
	});

	function openCreateList() {
		menuOpen = false;
		createListModalOpen = true;
	}

	function createList(e: Event) {
		e.preventDefault();
		menuOpen = false;
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
	<h1><a href="/">HiveOS</a></h1>

	<nav>
		{#if auth}
			<ViewModeDropdown {data} />
			<button class="button logout" onclick={handleLogout}>Logout <LogoutIcon /></button>
			<button onclick={toggleMenu} class="menu-button" aria-label="Open menu">
				{#if menuOpen}
					<CloseIcon />
				{:else}
					<MenuIcon />
				{/if}
			</button>
		{:else}
			<a href="/account/login">Login</a>
			<a href="/account/register">Register</a>
		{/if}
	</nav>
</header>

<div class="main-layout">
	{#if auth}
		<aside bind:this={menu} class:menuOpen>
			<ul>
				<li><a onclick={() => (menuOpen = false)} href="/">Dashboard</a></li>

				<!-- Show My Day link if there are event-type lists -->
				{#if customLists?.current && Array.isArray(customLists.current)}
					{@const hasEventLists = customLists.current.some((list) => list.listType === 'events')}
					{#if hasEventLists}
						<li><a onclick={() => (menuOpen = false)} href="/my-day">My Day</a></li>
					{/if}
				{/if}

				{#if customLists}
					{#if customLists?.current && Array.isArray(customLists.current)}
						{#each customLists.current as list (list.id)}
							<li>
								<a onclick={() => (menuOpen = false)} href={`/custom-list/${list.id}`}
									>{list.name}</a
								>
							</li>
						{/each}
					{/if}
				{/if}
				<li class="create-list-item">
					<button class="create-list-btn" onclick={() => openCreateList()}>+ Create List</button>
				</li>
				<li class="push-bottom">
					<a onclick={() => (menuOpen = false)} href="/settings">Settings</a>
				</li>
				<li><a onclick={() => (menuOpen = false)} href="/account">Account</a></li>
			</ul>
		</aside>
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
									<span class="option-icon">📝</span>
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
									<span class="option-icon">🛒</span>
									<div class="option-text">
										<strong>Shopping List</strong>
										<small>Track items by store</small>
									</div>
								</div>
							</label>

							<label class="list-type-option">
								<input type="radio" name="list-type" value="events" bind:group={selectedListType} />
								<div class="option-content">
									<span class="option-icon">📅</span>
									<div class="option-text">
										<strong>Events</strong>
										<small>Schedule with dates & times</small>
									</div>
								</div>
							</label>

							<label class="list-type-option">
								<input type="radio" name="list-type" value="tasks" bind:group={selectedListType} />
								<div class="option-content">
									<span class="option-icon">✓</span>
									<div class="option-text">
										<strong>Task List</strong>
										<small>Sortable tasks with drag & drop</small>
									</div>
								</div>
							</label>

							<label class="list-type-option">
								<input type="radio" name="list-type" value="recipe" bind:group={selectedListType} />
								<div class="option-content">
									<span class="option-icon">📖</span>
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
										<span class="option-icon">💬</span>
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
									<span class="option-icon">👥</span>
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
									<span class="option-icon">🔖</span>
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

	<main class:menuOpen>
		{@render children()}
	</main>
</div>

<!-- <footer></footer> -->

<style>
	:global(body:has(.offline-banner, .syncing-banner)) header {
		margin-top: 36px;
	}

	@media (max-width: 640px) {
		:global(body:has(.offline-banner, .syncing-banner)) header {
			margin-top: 32px;
		}
	}

	header {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
		padding: 20px;
		background-color: var(--primary);
		color: #000;
		transition: margin-top 0.3s ease;
	}

	nav {
		display: flex;
		container-type: inline-size;
		justify-content: flex-end;
		align-items: center;
		gap: 20px;
		a {
			text-decoration: underline;
			display: flex;
			gap: 10px;
		}

		button.button {
			background-color: #000;
			--svg-fill: #fff;
			color: #fff;
			padding: 10px 20px;
			border-radius: 5px;
			border: none;
			cursor: pointer;
			text-decoration: none;
			transition: all 0.3s ease;
			box-shadow: var(--level-2);
			display: flex;
			align-items: center;
			gap: 5px;

			&:hover {
				transform: translateY(-1px);
			}
			&:active {
				transform: translateY(1px);
			}
			&.logout {
				@media screen and (max-width: 690px) {
					display: none;
				}
			}
		}
	}

	h1 {
		font-size: 2rem;
		color: #000;
		margin: 0;
		padding: 0;
		a {
			text-decoration: none;
			color: inherit;
		}
	}

	.main-layout {
		display: grid;
		grid-template-columns: 200px 2fr 200px;
		grid-template-rows: 1fr;
		gap: 20px;
		/* height: calc(100dvh - var(--headerHeight) - var(--footerHeight)); */
		/* min-height: calc(100vh - var(--headerHeight)); */

		/* Single column centered layout when not authenticated */
		&:not(:has(aside)) {
			grid-template-columns: 1fr;
			/* max-width: 600px; */
			margin: 0 auto;
			gap: 0;
		}

		@media screen and (max-width: 690px) {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
			--margin-left: var(--margin-right);
		}
	}

	/* Container query for smaller widths */

	main {
		padding: 20px;
		background-color: var(--background);
		/* margin-right: var(--margin-right);
		margin-left: var(--margin-left); */
		opacity: 1;
		transition: all 0.3s ease;
		&.menuOpen {
			opacity: 0;
			pointer-events: none;
		}
	}
	aside {
		height: 100%;
		width: max-content;
		min-width: 200px;
		padding: 20px;
		background-color: var(--background);
		transition: all 0.3s ease;
		min-height: calc(100dvh - 100px);

		@media screen and (max-width: 690px) {
			overflow-y: auto;
		}

		ul {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: 10px;
			height: 100%;

			li {
				&.push-bottom {
					margin-top: auto;
				}
				@media screen and (max-width: 690px) {
					width: 100%;
				}
			}
			a {
				text-decoration: none;
				color: var(--textColor);
				font-size: 1.2rem;
				font-weight: 600;
				@media screen and (max-width: 690px) {
					display: block;
					width: 100%;
					font-size: 1.5rem;
					padding: 10px;
					text-align: center;
					cursor: pointer;
				}
			}
			.create-list-item {
				margin-top: 10px;
				padding-top: 10px;
				border-top: 1px solid rgba(0, 0, 0, 0.1);
			}

			.create-list-btn {
				background-color: transparent;
				border: 2px dashed rgba(0, 0, 0, 0.2);
				cursor: pointer;
				font-size: 1.2rem;
				font-weight: 600;
				color: var(--textColor);
				width: 100%;
				padding: 8px;
				border-radius: 5px;
				transition: all 0.2s ease;

				&:hover {
					background-color: rgba(0, 0, 0, 0.05);
					border-color: rgba(0, 0, 0, 0.3);
				}

				@media screen and (max-width: 690px) {
					font-size: 1.2rem;
					padding: 12px;
				}
			}
		}

		@media screen and (max-width: 690px) {
			left: 0;
			top: -100%;
			position: fixed;
			z-index: 9998;
			width: 100%;
			max-height: calc(100dvh - var(--headerHeight) - 32px);
			text-align: center;
			transition: top 0.3s ease;
			overflow-y: auto;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

			&.menuOpen {
				top: calc(var(--headerHeight) + 32px);
			}

			:global(body:not(:has(.offline-banner, .syncing-banner))) & {
				max-height: calc(100dvh - var(--headerHeight));

				&.menuOpen {
					top: var(--headerHeight);
				}
			}
		}
	}

	.menu-button {
		display: none;

		@media screen and (max-width: 690px) {
			display: block;
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
						font-size: 1.5rem;
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
