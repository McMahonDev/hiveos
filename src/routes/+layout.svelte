<script lang="ts">
	import '$lib/static/normalize.css';
	import '$lib/static/global.css';
	import { fly } from 'svelte/transition';
	import LogoutIcon from '$lib/static/icons/logoutIcon.svelte';
	import MenuIcon from '$lib/static/icons/menuIcon.svelte';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';

	let { children, data } = $props();

	let auth = $derived(data.auth);
	let menuOpen = $state(false);
	let inGroup = $derived(data.groupId !== data.id);
	let menu = $state<HTMLElement | null>(null);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	async function handleLogout() {
		try {
			await authClient.signOut();
			menuOpen = false; // Close menu on logout
			await goto('/account/login', { replaceState: true, noScroll: true });
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	$effect(() => {
		window.addEventListener('resize', () => {
			if (window.innerWidth > 690) {
				menuOpen = false;
			}
		});

		// Listen for SvelteKit navigation events
		const popstateHandler = () => {
			menuOpen = false;
		};
		window.addEventListener('popstate', popstateHandler);
		return () => {
			window.removeEventListener('popstate', popstateHandler);
		};
	});
</script>

<header>
	<h1><a href="/">HiveOS</a></h1>

	<nav>
		{#if auth}
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
				<!-- <li><a onclick={() => (menuOpen = false)} href="/calendar">Calendar</a></li> -->
				<li><a onclick={() => (menuOpen = false)} href="/events">Events</a></li>
				<li><a onclick={() => (menuOpen = false)} href="/shopping-list">Shopping List</a></li>
				<!-- <li><a onclick={() => (menuOpen = false)} href="/tasks">Task list</a></li> -->
				<!-- <li><a onclick={() => (menuOpen = false)} href="/recipies">Recipies</a></li> -->
				<button class="button logout" onclick={handleLogout}>Logout <LogoutIcon /></button>
				<li class="bottom"><a onclick={() => (menuOpen = false)} href="/account">Account</a></li>
			</ul>
		</aside>
	{/if}

	<main class:menuOpen>
		{@render children()}
	</main>
</div>

<!-- <footer></footer> -->

<style>
	header {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
		padding: 20px;
		background-color: var(--primary);
		color: #000;
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
		grid-template-columns: 1fr 2fr;
		grid-template-rows: 1fr;
		gap: 20px;
		/* height: calc(100dvh - var(--headerHeight) - var(--footerHeight)); */
		min-height: calc(100vh - var(--headerHeight));
		@media screen and (max-width: 690px) {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
		}
	}

	/* Container query for smaller widths */

	main {
		padding: 20px;
		background-color: var(--background);
		margin-right: var(--margin-right);
		margin-left: var(--margin-left);
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
				&.bottom {
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
			.logout {
				display: none;
				@media screen and (max-width: 690px) {
					display: unset;
				}
			}
		}

		@media screen and (max-width: 690px) {
			left: 0;
			top: -100%;
			position: fixed;
			display: block;
			position: fixed;

			width: 100%;
			height: calc(100dvh - var(--headerHeight));
			text-align: center;
			&.menuOpen {
				top: calc(var(--headerHeight));
			}
		}
	}

	.menu-button {
		display: none;

		@media screen and (max-width: 690px) {
			display: block;
		}
	}
</style>
