<script lang="ts">
	import '$lib/static/normalize.css';
	import '$lib/static/global.css';
	import Container from '$lib/components/container.svelte';
	let { children, data } = $props();
	let auth = $derived(data.auth);
	$inspect(data);
</script>

<header>
	<h1>HiveOS</h1>

	<nav>
		<!-- <h2>home</h2> -->
		{#if auth}
			<a href="/account/logout">Logout</a>
		{:else}
			<a href="/account/login">Login</a>
			<a href="/account/register">Register</a>
		{/if}
	</nav>
</header>
<Container>
	<div class="main-layout">
		<aside>
			{#if auth}
				<h2>Welcome {auth}</h2>
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
</Container>

<footer></footer>

<style>
	header {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
		padding: 10px;
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
		grid-template-columns: 1fr 3fr;
		grid-template-rows: 1fr;
		gap: 20px;
		margin-top: var(--headerHeight);
	}
	main {
		padding: 20px;
		background-color: var(--background);
	}
	aside {
		padding: 20px;
		background-color: var(--background);
		ul {
			list-style: none;
			padding: 0;
		}
	}
</style>
