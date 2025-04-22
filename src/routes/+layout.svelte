<script lang="ts">
	import '$lib/static/normalize.css';
	import '$lib/static/global.css';
	import LogoutIcon from '$lib/static/icons/logoutIcon.svelte';

	let { children, data } = $props();
	let auth = $derived(data.auth);
	$inspect(data);
</script>

<header>
	<h1>HiveOS</h1>

	<nav>
		<!-- <h2>home</h2> -->
		{#if auth}
			<a href="/account/logout">Logout <LogoutIcon /></a>
		{:else}
			<a href="/account/login">Login</a>
			<a href="/account/register">Register</a>
		{/if}
	</nav>
</header>

<div class="main-layout">
	<aside>
		{#if auth}
			<ul>
				<li><a href="/">Dashboard</a></li>
				<li><a href="/calendar">Calendar</a></li>
				<li><a href="/events">Events</a></li>
				<li><a href="/shopping-list">Shopping List</a></li>
				<li><a href="/tasks">Task list</a></li>
				<li><a href="/recipies">Recipies</a></li>
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
		background-color: #000000;
		color: var(--primary);
	}
	nav {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 20px;
		a {
			text-decoration: underline;
			display: flex;
			gap: 8px;
		}
	}

	h1 {
		font-size: 2rem;
		color: var(--primary);
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
		/* margin-top: var(--headerHeight); */
		height: calc(100vh - var(--headerHeight) - var(--footerHeight));
	}
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
			a {
				text-decoration: none;
				color: var(--textColor);
				font-size: 1.2rem;
				font-weight: 600;
			}
		}
	}
</style>
