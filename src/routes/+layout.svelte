<script lang="ts">
	import '$lib/static/normalize.css';
	import '$lib/static/global.css';
	import { fly } from 'svelte/transition';
	import LogoutIcon from '$lib/static/icons/logoutIcon.svelte';
	import MenuIcon from '$lib/static/icons/menuIcon.svelte';
	import CloseIcon from '$lib/static/icons/closeIcon.svelte';

	let { children, data } = $props();
	let auth = $derived(data.auth);

	let menuOpen = $state(false);
	let showButtons = $state(true);

	$effect(() => {
		// get window width
		window.addEventListener('resize', () => {
			const width = window.innerWidth;
			if (width < 690) {
				menuOpen = false;
			} else {
				menuOpen = true;
			}
		});
		const width = window.innerWidth;
		if (width > 690) {
			menuOpen = true;
		} else {
			menuOpen = false;
		}
	});
</script>

<header>
	<h1>HiveOS</h1>

	<nav>
		<!-- <h2>home</h2> -->
		{#if auth}
			<a class="button logout" href="/account/logout">Logout <LogoutIcon /></a>
			{#if showButtons}
				<button class="button menuButton" onclick={() => (menuOpen = !menuOpen)}>
					{#if menuOpen}
						<CloseIcon />
					{:else}
						<MenuIcon />
					{/if}
				</button>
			{/if}
		{:else}
			<a href="/account/login">Login</a>
			<a href="/account/register">Register</a>
		{/if}
	</nav>
</header>

<div class="main-layout">
	{#if menuOpen}
		<aside transition:fly class:mobileOpen={menuOpen}>
			{#if !auth}
				<ul>
					<li><a href="/account/login">Login</a></li>
					<li><a href="/account/register">Register</a></li>
				</ul>
			{/if}
			{#if auth}
				<ul>
					<li><a href="/">Dashboard</a></li>
					<li><a href="/calendar">Calendar</a></li>
					<li><a href="/events">Events</a></li>
					<li><a href="/shopping-list">Shopping List</a></li>
					<li><a href="/tasks">Task list</a></li>
					<li><a href="/recipies">Recipies</a></li>
					<li><a class="button" href="/account/logout">Logout <LogoutIcon /></a></li>
					<li class="bottom"><a href="/account">Account</a></li>
				</ul>
			{/if}
		</aside>
	{/if}
	<main>
		{@render children()}
	</main>
</div>

<footer></footer>

<style>
	header {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
		padding: 20px;
		background-color: var(--primary);
		color: #000;
	}
	button.menuButton {
		display: none;
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

			&.button {
				background-color: #000;
				--svg-fill: #fff;
				color: #fff;
				padding: 10px 20px;
				border-radius: 5px;
				/* text-decoration: none; */
				transition: all 0.3s ease;
				box-shadow: var(--level-2);
				&:hover {
					transform: translateY(-1px);
				}
				&:active {
					transform: translateY(1px);
				}
			}
		}
	}

	h1 {
		font-size: 2rem;
		color: #000;
		margin: 0;
		padding: 0;
	}

	h2 {
		font-size: 1.5rem;
		margin: 0;
		padding: 0;
	}
	.main-layout {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: 1fr;
		gap: 20px;
		height: calc(100vh - var(--headerHeight) - var(--footerHeight));
	}

	/* Container query for smaller widths */

	main {
		padding: 20px;
		background-color: var(--background);
		margin-right: var(--margin-right);
		margin-left: var(--margin-left);
	}
	aside {
		height: 100%;
		width: max-content;
		min-width: 200px;
		padding: 20px;
		background-color: var(--background);

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
			}
			a {
				text-decoration: none;
				color: var(--textColor);
				font-size: 1.2rem;
				font-weight: 600;
			}
		}
	}

	@media (max-width: 690px) {
		.main-layout {
			grid-template-columns: 1fr;
		}
		aside {
			display: none;
			&.mobileOpen {
				display: block;
				position: absolute;
				top: var(--headerHeight);
				left: 0;
				width: 100vw;
				height: calc(100vh - var(--headerHeight) - var(--footerHeight));
				background-color: var(--background);
				z-index: 10;
			}
		}
		main {
			margin-right: auto;
			margin-left: auto;
			width: 100vw;
		}
		nav .logout {
			display: none;
		}
		button.menuButton {
			display: block;
		}
	}
</style>
