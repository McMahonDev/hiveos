<script lang="ts">
	import { page } from '$app/stores';

	let currentPath = $derived($page.url.pathname);

	const navItems = [
		{ href: '/', icon: 'home', label: 'Home', match: (path: string) => path === '/' },
		{
			href: '/my-day',
			icon: 'calendar',
			label: 'My Day',
			match: (path: string) => path === '/my-day'
		},
		{
			href: '/comparisons',
			icon: 'tools',
			label: 'Tools',
			match: (path: string) => path.startsWith('/comparisons')
		},
		{
			href: '/settings',
			icon: 'settings',
			label: 'Settings',
			match: (path: string) => path === '/settings'
		},
		{
			href: '/account',
			icon: 'user',
			label: 'Account',
			match: (path: string) => path === '/account'
		}
	];

	function isActive(item: (typeof navItems)[0]) {
		return item.match(currentPath);
	}
</script>

<nav class="bottom-nav">
	{#each navItems as item}
		<a href={item.href} class="nav-item" class:active={isActive(item)} aria-label={item.label}>
			<span class="nav-icon">
				{#if item.icon === 'home'}
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
						<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
						<polyline points="9 22 9 12 15 12 15 22" />
					</svg>
				{:else if item.icon === 'calendar'}
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
						<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
						<line x1="16" x2="16" y1="2" y2="6" />
						<line x1="8" x2="8" y1="2" y2="6" />
						<line x1="3" x2="21" y1="10" y2="10" />
					</svg>
				{:else if item.icon === 'tools'}
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
						<path
							d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
						/>
					</svg>
				{:else if item.icon === 'settings'}
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
						<path
							d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
						/>
						<circle cx="12" cy="12" r="3" />
					</svg>
				{:else if item.icon === 'user'}
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
						<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				{/if}
			</span>
			<span class="nav-label">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--bottomNavHeight);
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 0 var(--spacing-sm);
		z-index: 1000;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: var(--spacing-xs);
		text-decoration: none;
		color: var(--textColorLight);
		transition: all 0.2s ease;
		border-radius: 12px;
		min-width: 64px;
		position: relative;
	}

	.nav-item:active {
		transform: scale(0.95);
	}

	.nav-item.active {
		color: var(--primary-dark);
	}

	.nav-item.active .nav-icon {
		background: var(--primary);
		color: var(--black);
	}

	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		transition: all 0.2s ease;
	}

	.nav-item:hover .nav-icon {
		background: rgba(0, 0, 0, 0.05);
	}

	.nav-item.active:hover .nav-icon {
		background: var(--primary);
	}

	.nav-icon svg {
		width: 24px;
		height: 24px;
	}

	.nav-label {
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	/* Hide on desktop */
	@media screen and (min-width: 769px) {
		.bottom-nav {
			display: none;
		}
	}

	/* Adjust for very small screens */
	@media screen and (max-width: 360px) {
		.nav-item {
			min-width: 52px;
		}

		.nav-label {
			font-size: 0.7rem;
		}

		.nav-icon svg {
			width: 20px;
			height: 20px;
		}
	}
</style>
