<script lang="ts">
	let { onclick } = $props<{ onclick: () => void }>();
</script>

<button class="fab" {onclick} aria-label="Create new list">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<line x1="12" y1="5" x2="12" y2="19" />
		<line x1="5" y1="12" x2="19" y2="12" />
	</svg>
</button>

<style>
	.fab {
		position: fixed;
		bottom: calc(var(--bottomNavHeight) + var(--spacing-md));
		right: var(--spacing-md);
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--primary-gradient);
		color: var(--black);
		border: none;
		box-shadow:
			0 4px 12px rgba(255, 183, 0, 0.4),
			0 2px 4px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 999;
		padding: 0;
	}

	.fab:hover {
		transform: scale(1.1) rotate(90deg);
		box-shadow:
			0 8px 20px rgba(255, 183, 0, 0.5),
			0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.fab:active {
		transform: scale(1.05) rotate(90deg);
	}

	.fab svg {
		transition: transform 0.3s ease;
	}

	/* Desktop positioning */
	@media screen and (min-width: 769px) {
		.fab {
			bottom: var(--spacing-lg);
			right: var(--spacing-lg);
			width: 64px;
			height: 64px;
		}
	}

	/* Tablet adjustment */
	@media screen and (max-width: 768px) and (min-width: 481px) {
		.fab {
			bottom: calc(var(--bottomNavHeight) + var(--spacing-md));
		}
	}

	/* Small mobile */
	@media screen and (max-width: 480px) {
		.fab {
			width: 52px;
			height: 52px;
			bottom: calc(var(--bottomNavHeight) + var(--spacing-sm));
			right: var(--spacing-sm);
		}

		.fab svg {
			width: 22px;
			height: 22px;
		}
	}
</style>
