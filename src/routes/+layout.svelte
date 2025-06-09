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
	let menu: HTMLElement;
	function toggleMenu() {
		menuOpen = !menuOpen;
	}
	$effect(() => {
		window.addEventListener('resize', () => {
			if (window.innerWidth > 690) {
				menuOpen = false;
			}
		});

		menu.querySelectorAll('a').forEach((link) => {
			console.log(link);
			link.addEventListener('click', () => {
				menuOpen = false;
			});
		});
	});
</script>

<header>
	<h1>HiveOS</h1>

	<nav>
		<!-- <h2>home</h2> -->
		{#if auth}
			<a class="button" href="/account/logout">Logout <LogoutIcon /></a>
			<button onclick={toggleMenu} class="menu-button" aria-label="Open menu">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="3" y1="12" x2="21" y2="12"></line>
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<line x1="3" y1="18" x2="21" y2="18"></line>
				</svg>
			</button>
		{:else}
			<a href="/account/login">Login</a>
			<a href="/account/register">Register</a>
		{/if}
	</nav>
</header>

<div class="main-layout">
	<aside bind:this={menu} class:menuOpen>
		{#if auth}
			<ul>
				<li><a href="/">Dashboard</a></li>
				<li><a href="/calendar">Calendar</a></li>
				<li><a href="/events">Events</a></li>
				<li><a href="/shopping-list">Shopping List</a></li>
				<li><a href="/tasks">Task list</a></li>
				<li><a href="/recipies">Recipies</a></li>
				<li class="bottom"><a href="/account">Account</a></li>
			</ul>
		{/if}
	</aside>
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
			}
			a {
				text-decoration: none;
				color: var(--textColor);
				font-size: 1.2rem;
				font-weight: 600;
			}
		}

		@media screen and (max-width: 690px) {
			left: 0;
			top: -100%;
			position: fixed;
			display: block;
			position: fixed;

			width: 100%;
			height: calc(100vh - var(--headerHeight) - var(--footerHeight));
			text-align: center;
			&.menuOpen {
				top: calc(var(--headerHeight));
			}
		}
	}
	/* @container (min-width: 0px) and (max-width: 689px) {
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
		main {
			margin-right: auto;
			margin-left: auto;
			width: 100vw;
		}
	}

	/* Container query for medium widths */
	@container (min-width: 691px) and (max-width: 900px) {
		.main-layout {
			grid-template-columns: 1fr 2fr;
		}
	}

	.menu-button {
		display: none;

		@media screen and (max-width: 690px) {
			display: block;
		}
	}
</style>
