<script lang="ts">
	import { Query } from 'zero-svelte';
	import NewTab from '$lib/static/icons/newTab.svelte';
	import ListIcon from '$lib/components/listIcon.svelte';
	import { viewModeState } from '$lib/state/viewMode.svelte.ts';

	let { data } = $props();
	let z = data.z;
	let isAuthenticated = $derived(data.auth);

	// Query custom lists for current view mode
	let customLists = $state<Query<any, any, any> | null>(null);

	$effect(() => {
		if (z?.current) {
			customLists = new Query(
				z.current.query.customLists.where('viewMode', viewModeState.currentMode)
			);
		} else {
			customLists = null;
		}
	});

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

	// Create a reactive map to store Query objects for each list's items
	let itemQueries = $state<Map<string, Query<any, any, any>>>(new Map());

	// Update item queries when lists change
	$effect(() => {
		if (z?.current && customLists?.current) {
			const newQueries = new Map<string, Query<any, any, any>>();

			for (const list of customLists.current) {
				const itemsQuery = new Query(
					z.current.query.customListItems
						.where('customListId', list.id)
						.where('viewMode', viewModeState.currentMode)
				);
				newQueries.set(list.id, itemsQuery);
			}

			itemQueries = newQueries;
		}
	});

	// Query items count for each list - now truly reactive
	function getItemCount(listId: string): number {
		const query = itemQueries.get(listId);
		if (!query) return 0;
		const count = query.current?.length || 0;
		return count;
	}

	const features = [
		{
			icon: 'shopping',
			title: 'Smart Shopping Lists',
			description: 'Organize items by store, share with family, and never forget an item again.'
		},
		{
			icon: 'events',
			title: 'Event Planning',
			description: 'Schedule events with dates and times. Get a "My Day" view of what\'s coming up.'
		},
		{
			icon: 'tasks',
			title: 'Task Management',
			description: 'Drag & drop sortable tasks. Stay organized and productive with ease.'
		},
		{
			icon: 'recipe',
			title: 'Recipe Box',
			description:
				'Store recipes with ingredients, instructions, and cooking times all in one place.'
		},
		{
			icon: 'messages',
			title: 'Messages & Notes',
			description: 'Share notes and reminders with your group. Keep everyone in the loop.'
		},
		{
			icon: 'contacts',
			title: 'Contact Management',
			description: 'Store phone numbers, emails, and addresses. Your digital address book.'
		},
		{
			icon: 'bookmarks',
			title: 'Bookmark Collections',
			description: 'Save and organize your favorite links. Access them from anywhere.'
		},
		{
			icon: 'offline',
			title: 'Works Offline',
			description: "Full offline support with automatic sync when you're back online."
		},
		{
			icon: 'shared',
			title: 'Personal & Shared',
			description: 'Toggle between personal mode and shared group mode instantly.'
		}
	];

	const pricingPlans = [
		{
			name: 'Free',
			price: '$0',
			period: 'forever',
			description: 'Perfect for getting started',
			features: [
				'Personal lists only',
				'Limited storage',
				'Single device sync',
				'All 8 list types',
				'Offline mode',
				'Basic support'
			],
			limitations: ['Cannot create groups', 'Cannot collaborate'],
			cta: 'Get Started Free',
			highlighted: false
		},
		{
			name: 'Individual',
			price: '$5',
			period: 'per month',
			description: 'For power users who collaborate',
			features: [
				'Everything in Free',
				'Unlimited storage',
				'Multiple devices',
				'Create & join groups',
				'Real-time collaboration',
				'Priority support'
			],
			limitations: [],
			cta: 'Start Free Trial',
			highlighted: true
		},
		{
			name: 'Family',
			price: '$20',
			period: 'per month',
			description: 'Best for families (up to 6 members)',
			features: [
				'Everything in Individual',
				'Up to 6 family members',
				'Family members FREE',
				'Generate access codes',
				'Family member management',
				'Premium support'
			],
			limitations: [],
			cta: 'Start Free Trial',
			highlighted: false
		}
	];

	const faqs = [
		{
			question: 'Is HiveOS really free?',
			answer:
				'Yes! We offer a free tier for personal use. The Free plan includes all 8 list types and offline mode, but is limited to personal lists only without collaboration. Upgrade to Individual ($5/mo) or Family ($20/mo) for unlimited storage and group features.'
		},
		{
			question: "What's the difference between the plans?",
			answer:
				'Free is for solo use with limited storage. Individual ($5/mo) adds unlimited storage and lets you create groups with other Individual users. Family ($20/mo) lets you create a family group where up to 5 additional members can join for FREE.'
		},
		{
			question: 'How does the Family plan work?',
			answer:
				'With the Family plan ($20/mo), you pay for everyone! You can invite up to 6 family members total, and they get full access without paying anything. Generate access codes to invite them easily.'
		},
		{
			question: 'Can I try before upgrading?',
			answer:
				"Absolutely! Start with the Free plan and explore all list types. When you're ready to collaborate or need more storage, upgrade to Individual or Family anytime. We also offer free trials for paid plans."
		},
		{
			question: 'How does offline mode work?',
			answer:
				'HiveOS works perfectly offline on all plans. All your data is stored locally on your device, and when you go back online, it automatically syncs with our servers. You never lose your work!'
		},
		{
			question: 'Can I use HiveOS on my phone?',
			answer:
				"Absolutely! HiveOS works on any device with a web browser - phones, tablets, laptops, and desktops. It's fully responsive and optimized for mobile use across all plans."
		},
		{
			question: 'What happens if I cancel my subscription?',
			answer:
				"If you cancel Individual or Family, you'll move to the Free plan. Your personal lists remain intact, but you'll lose access to groups and collaboration features. You can resubscribe anytime."
		},
		{
			question: 'Is my data secure and private?',
			answer:
				'Yes. Your data is encrypted and securely stored on all plans. We use industry-standard security practices to protect your information. You control who has access to your shared lists.'
		}
	];

	let openFaqIndex = $state<number | null>(null);

	function toggleFaq(index: number) {
		openFaqIndex = openFaqIndex === index ? null : index;
	}
</script>

<svelte:head>
	{#if !isAuthenticated}
		<title>HiveOS - Organize Your Life Together | Smart Lists, Tasks & Events</title>
		<meta
			name="description"
			content="Start free with HiveOS - the all-in-one platform for shopping lists, tasks, events, recipes, and more. Free plan available. Upgrade to unlock collaboration."
		/>
		<meta
			name="keywords"
			content="free task manager, shopping list app, family organizer, event planner, recipe manager, todo list, shared lists, offline app, collaborative lists, family planning, free productivity app"
		/>

		<!-- Open Graph / Facebook -->
		<meta property="og:type" content="website" />
		<meta property="og:url" content="https://hiveos.app/" />
		<meta property="og:title" content="HiveOS - Organize Your Life Together" />
		<meta
			property="og:description"
			content="Start free with HiveOS. All-in-one platform for lists, tasks, events & more. Free plan available."
		/>
		<meta property="og:image" content="https://hiveos.app/og-image.png" />

		<!-- Twitter -->
		<meta property="twitter:card" content="summary_large_image" />
		<meta property="twitter:url" content="https://hiveos.app/" />
		<meta property="twitter:title" content="HiveOS - Organize Your Life Together" />
		<meta
			property="twitter:description"
			content="Start free with HiveOS. All-in-one platform for lists, tasks, events & more. Free plan available."
		/>
		<meta property="twitter:image" content="https://hiveos.app/og-image.png" />

		<!-- Additional SEO -->
		<link rel="canonical" href="https://hiveos.app/" />
		<meta name="robots" content="index, follow" />
		<meta name="author" content="HiveOS" />
	{:else}
		<title>Dashboard - HiveOS</title>
	{/if}
</svelte:head>

{#if isAuthenticated}
	<!-- Authenticated Dashboard View -->
	<div class="container">
		<div class="header">
			<h1>Welcome{data.name ? `, ${data.name}` : ''}!</h1>
			<p class="subtitle">
				{#if customLists?.current && customLists.current.length > 0}
					You have {customLists.current.length} list{customLists.current.length !== 1 ? 's' : ''} in
					{viewModeState.currentMode === 'personal' ? 'Personal' : 'Shared'} mode.
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
							<span class="list-icon">
								<ListIcon type={list.listType} size={32} />
							</span>
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
				<div class="empty-icon">
					<ListIcon type="basic" size={64} />
				</div>
				<h2>No lists yet</h2>
				<p>Create your first list to get started!</p>
				<p class="hint">Click the "+" button to create your first list</p>
			</div>
		{/if}
	</div>
{:else}
	<!-- Landing Page for Non-Authenticated Users -->
	<div class="landing-page">
		<!-- Hero Section -->
		<section class="hero">
			<div class="hero-content">
				<h1 class="hero-title">
					Organize Your Life with <span class="highlight">HiveOS</span>
				</h1>
				<p class="hero-subtitle">
					The all-in-one platform for lists, tasks, events, recipes, and more. Perfect for
					individuals and families who want to stay organized together.
				</p>
				<div class="hero-cta">
					<a href="/account/register" class="btn btn-primary">Start Free</a>
					<a href="/account/login" class="btn btn-secondary">Sign In</a>
				</div>
				<p class="hero-note">Free plan available • No credit card required • Upgrade anytime</p>
			</div>
			<div class="hero-visual">
				<div class="mockup-card">
					<div class="mockup-header">
						<div class="mockup-dots">
							<span></span><span></span><span></span>
						</div>
					</div>
					<div class="mockup-content">
						<div class="mockup-item">🛒 Weekly Groceries <span class="badge">12 items</span></div>
						<div class="mockup-item">📅 Family Events <span class="badge">3 upcoming</span></div>
						<div class="mockup-item">✓ Home Projects <span class="badge">5 tasks</span></div>
						<div class="mockup-item">
							📖 Recipe Collection <span class="badge">24 recipes</span>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section class="features">
			<div class="section-header">
				<h2>Everything You Need to Stay Organized</h2>
				<p>One platform, unlimited possibilities. Create any type of list you can imagine.</p>
			</div>
			<div class="features-grid">
				{#each features as feature}
					<div class="feature-card">
						<div class="feature-icon">
							<ListIcon type={feature.icon} size={40} />
						</div>
						<h3>{feature.title}</h3>
						<p>{feature.description}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- How It Works Section -->
		<section class="how-it-works">
			<div class="section-header">
				<h2>Get Started in Minutes</h2>
				<p>Simple, intuitive, and powerful</p>
			</div>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Create Your Account</h3>
					<p>Sign up in seconds with just your email</p>
				</div>
				<div class="step-arrow">→</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>Make Your First List</h3>
					<p>Choose from 8 different list types</p>
				</div>
				<div class="step-arrow">→</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Share & Collaborate</h3>
					<p>Invite family or keep it personal</p>
				</div>
			</div>
		</section>

		<!-- Use Cases Section -->
		<section class="use-cases">
			<div class="section-header">
				<h2>Perfect For</h2>
			</div>
			<div class="use-cases-grid">
				<div class="use-case-card">
					<div class="use-case-icon">👨‍👩‍👧‍👦</div>
					<h3>Families</h3>
					<p>Share shopping lists, coordinate events, and keep everyone on the same page.</p>
				</div>
				<div class="use-case-card">
					<div class="use-case-icon">🏠</div>
					<h3>Home Management</h3>
					<p>Track chores, maintenance tasks, and home improvement projects.</p>
				</div>
				<div class="use-case-card">
					<div class="use-case-icon">🎯</div>
					<h3>Personal Productivity</h3>
					<p>Manage your goals, daily tasks, and personal projects in one place.</p>
				</div>
				<div class="use-case-card">
					<div class="use-case-icon">🎯</div>
					<h3>Workplace Teams</h3>
					<p>Manage your team's projects, tasks, and collaborations in one place.</p>
				</div>
				<div class="use-case-card">
					<div class="use-case-icon">🎯</div>
					<h3>Sports Teams</h3>
					<p>Manage your team's events, tasks, and collaborations in one place.</p>
				</div>
				<div class="use-case-card">
					<div class="use-case-icon">🍳</div>
					<h3>Meal Planning</h3>
					<p>Store recipes, plan meals, and generate shopping lists automatically.</p>
				</div>
			</div>
		</section>

		<!-- Pricing Section -->
		<section class="pricing">
			<div class="section-header">
				<h2>Simple, Transparent Pricing</h2>
				<p>Start free and upgrade when you need collaboration</p>
			</div>
			<div class="pricing-grid">
				{#each pricingPlans as plan}
					<div class="pricing-card" class:highlighted={plan.highlighted}>
						{#if plan.highlighted}
							<div class="popular-badge">Most Popular</div>
						{/if}
						<h3 class="plan-name">{plan.name}</h3>
						<div class="plan-price">
							<span class="price">{plan.price}</span>
							<span class="period">/{plan.period}</span>
						</div>
						<p class="plan-description">{plan.description}</p>
						<ul class="plan-features">
							{#each plan.features as feature}
								<li class="feature">✓ {feature}</li>
							{/each}
							{#each plan.limitations as limitation}
								<li class="limitation">✗ {limitation}</li>
							{/each}
						</ul>
						<a
							href="/account/register"
							class="btn"
							class:btn-primary={plan.highlighted}
							class:btn-secondary={!plan.highlighted}
						>
							{plan.cta}
						</a>
					</div>
				{/each}
			</div>
		</section>

		<!-- FAQ Section -->
		<section class="faq">
			<div class="section-header">
				<h2>Frequently Asked Questions</h2>
				<p>Everything you need to know about HiveOS</p>
			</div>
			<div class="faq-list">
				{#each faqs as faq, index}
					<div class="faq-item" class:open={openFaqIndex === index}>
						<button
							class="faq-question"
							onclick={() => toggleFaq(index)}
							aria-expanded={openFaqIndex === index}
						>
							<span>{faq.question}</span>
							<span class="faq-icon">{openFaqIndex === index ? '−' : '+'}</span>
						</button>
						{#if openFaqIndex === index}
							<div class="faq-answer">
								<p>{faq.answer}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<!-- Final CTA Section -->
		<section class="final-cta">
			<div class="cta-content">
				<h2>Ready to Get Organized?</h2>
				<p>Start free and upgrade when you need collaboration. No credit card required.</p>
				<div class="cta-buttons">
					<a href="/account/register" class="btn btn-primary btn-large">Start Free</a>
				</div>
				<p class="cta-note">
					Already have an account? <a href="/account/login" class="link">Sign in here</a>
				</p>
			</div>
		</section>
	</div>
{/if}

<style>
	/* Dashboard Styles (Authenticated Users) */
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
				display: flex;
				align-items: center;
				justify-content: center;
				width: 48px;
				height: 48px;
				background: rgba(255, 183, 0, 0.1);
				border-radius: 12px;
				flex-shrink: 0;
				color: var(--primary-dark);
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
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 96px;
			height: 96px;
			background: rgba(255, 183, 0, 0.08);
			border-radius: 24px;
			margin-bottom: 20px;
			color: var(--textColorLight);
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

	/* Landing Page Styles (Non-Authenticated Users) */
	.landing-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;

		section {
			padding: 80px 20px;

			@media screen and (max-width: 768px) {
				padding: 60px 20px;
			}
		}
	}

	.hero {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 60px;
		align-items: center;
		padding-top: 40px;

		@media screen and (max-width: 968px) {
			grid-template-columns: 1fr;
			gap: 40px;
			text-align: center;
		}
	}

	.hero-content {
		.hero-title {
			font-size: 3.5rem;
			font-weight: 800;
			line-height: 1.2;
			margin: 0 0 20px 0;
			color: var(--textColor);

			@media screen and (max-width: 968px) {
				font-size: 2.5rem;
			}

			@media screen and (max-width: 640px) {
				font-size: 2rem;
			}

			.highlight {
				color: var(--primary);
				background: linear-gradient(135deg, #ffd000 0%, #ffb700 100%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
			}
		}

		.hero-subtitle {
			font-size: 1.25rem;
			line-height: 1.6;
			color: var(--color-tertiary, #666);
			margin: 0 0 30px 0;

			@media screen and (max-width: 640px) {
				font-size: 1.1rem;
			}
		}

		.hero-cta {
			display: flex;
			gap: 15px;
			margin-bottom: 20px;

			@media screen and (max-width: 968px) {
				justify-content: center;
			}

			@media screen and (max-width: 640px) {
				flex-direction: column;
			}
		}

		.hero-note {
			font-size: 0.875rem;
			color: var(--color-tertiary, #888);
			margin: 0;
		}
	}

	.hero-visual {
		perspective: 1000px;

		@media screen and (max-width: 968px) {
			max-width: 500px;
			margin: 0 auto;
		}
	}

	.mockup-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
		transform: rotateY(-5deg) rotateX(5deg);
		transition: transform 0.3s ease;

		@media screen and (max-width: 968px) {
			transform: none;
			box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		}

		&:hover {
			transform: rotateY(0deg) rotateX(0deg);

			@media screen and (max-width: 968px) {
				transform: none;
			}
		}

		.mockup-header {
			padding: 15px 20px;
			border-bottom: 1px solid #e0e0e0;
			background: linear-gradient(to bottom, #f8f8f8, #fff);
			border-radius: 12px 12px 0 0;

			@media screen and (max-width: 640px) {
				padding: 12px 16px;
			}

			.mockup-dots {
				display: flex;
				gap: 8px;

				span {
					width: 12px;
					height: 12px;
					border-radius: 50%;
					background: #ddd;

					@media screen and (max-width: 640px) {
						width: 10px;
						height: 10px;
					}

					&:nth-child(1) {
						background: #ff5f56;
					}
					&:nth-child(2) {
						background: #ffbd2e;
					}
					&:nth-child(3) {
						background: #27c93f;
					}
				}
			}
		}

		.mockup-content {
			padding: 20px;

			@media screen and (max-width: 640px) {
				padding: 16px;
			}

			.mockup-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 15px;
				margin-bottom: 10px;
				background: #f8f8f8;
				border-radius: 8px;
				font-size: 1rem;
				font-weight: 500;
				color: #333;

				@media screen and (max-width: 640px) {
					padding: 12px;
					font-size: 0.9rem;
					margin-bottom: 8px;
				}

				&:last-child {
					margin-bottom: 0;
				}

				.badge {
					background: var(--primary);
					color: #000;
					padding: 4px 12px;
					border-radius: 12px;
					font-size: 0.75rem;
					font-weight: 600;
					white-space: nowrap;

					@media screen and (max-width: 640px) {
						padding: 3px 10px;
						font-size: 0.7rem;
					}
				}
			}
		}
	}

	.btn {
		display: inline-block;
		padding: 14px 32px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		text-decoration: none;
		transition: all 0.2s ease;
		border: 2px solid transparent;
		cursor: pointer;
		text-align: center;

		@media screen and (max-width: 640px) {
			padding: 12px 24px;
			font-size: 0.95rem;
			width: 100%;
		}

		&.btn-primary {
			background: var(--primary);
			color: #000;
			box-shadow: 0 4px 12px rgba(255, 208, 0, 0.3);

			&:hover {
				transform: translateY(-2px);
				box-shadow: 0 6px 20px rgba(255, 208, 0, 0.4);

				@media screen and (max-width: 640px) {
					transform: none;
				}
			}
		}

		&.btn-secondary {
			background: transparent;
			color: var(--textColor);
			border-color: var(--textColor);

			&:hover {
				background: var(--textColor);
				color: white;
			}
		}

		&.btn-large {
			padding: 18px 40px;
			font-size: 1.125rem;

			@media screen and (max-width: 640px) {
				padding: 16px 32px;
				font-size: 1rem;
			}
		}

		&:active {
			transform: translateY(0);
		}
	}

	.section-header {
		text-align: center;
		margin-bottom: 50px;

		@media screen and (max-width: 640px) {
			margin-bottom: 35px;
		}

		h2 {
			font-size: 2.5rem;
			font-weight: 700;
			margin: 0 0 15px 0;
			color: var(--textColor);

			@media screen and (max-width: 768px) {
				font-size: 2rem;
			}

			@media screen and (max-width: 640px) {
				font-size: 1.75rem;
			}
		}

		p {
			font-size: 1.125rem;
			color: var(--color-tertiary, #666);
			margin: 0;

			@media screen and (max-width: 640px) {
				font-size: 1rem;
			}
		}
	}

	.features {
		background: linear-gradient(to bottom, transparent, rgba(255, 208, 0, 0.05), transparent);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 30px;

		@media screen and (max-width: 768px) {
			gap: 20px;
		}

		@media screen and (max-width: 640px) {
			grid-template-columns: 1fr;
		}
	}

	.feature-card {
		padding: 30px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		text-align: center;

		@media screen and (max-width: 640px) {
			padding: 25px 20px;
		}

		&:hover {
			transform: translateY(-5px);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

			@media screen and (max-width: 640px) {
				transform: translateY(-2px);
			}
		}

		.feature-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 72px;
			height: 72px;
			background: rgba(255, 183, 0, 0.1);
			border-radius: 16px;
			margin-bottom: 15px;
			color: var(--primary-dark);

			@media screen and (max-width: 640px) {
				width: 64px;
				height: 64px;
				margin-bottom: 12px;
			}
		}

		h3 {
			font-size: 1.25rem;
			font-weight: 600;
			margin: 0 0 10px 0;
			color: var(--textColor);

			@media screen and (max-width: 640px) {
				font-size: 1.125rem;
			}
		}

		p {
			font-size: 0.95rem;
			line-height: 1.6;
			color: var(--color-tertiary, #666);
			margin: 0;

			@media screen and (max-width: 640px) {
				font-size: 0.9rem;
			}
		}
	}

	.how-it-works {
		background: white;
	}

	.steps {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		max-width: 900px;
		margin: 0 auto;

		@media screen and (max-width: 768px) {
			flex-direction: column;
		}
	}

	.step {
		flex: 1;
		text-align: center;
		padding: 30px 20px;

		@media screen and (max-width: 640px) {
			padding: 20px 15px;
		}

		.step-number {
			width: 60px;
			height: 60px;
			background: var(--primary);
			color: #000;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 1.5rem;
			font-weight: 700;
			margin: 0 auto 20px;

			@media screen and (max-width: 640px) {
				width: 50px;
				height: 50px;
				font-size: 1.25rem;
				margin-bottom: 15px;
			}
		}

		h3 {
			font-size: 1.25rem;
			font-weight: 600;
			margin: 0 0 10px 0;
			color: var(--textColor);

			@media screen and (max-width: 640px) {
				font-size: 1.1rem;
			}
		}

		p {
			font-size: 0.95rem;
			color: var(--color-tertiary, #666);
			margin: 0;

			@media screen and (max-width: 640px) {
				font-size: 0.875rem;
			}
		}
	}

	.step-arrow {
		font-size: 2rem;
		color: var(--primary);
		font-weight: 700;

		@media screen and (max-width: 768px) {
			transform: rotate(90deg);
		}
	}

	.use-cases {
		background: linear-gradient(135deg, rgba(255, 208, 0, 0.1) 0%, rgba(255, 183, 0, 0.1) 100%);
	}

	.use-cases-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 30px;
		max-width: 1000px;
		margin: 0 auto;

		@media screen and (max-width: 640px) {
			grid-template-columns: 1fr;
			gap: 20px;
		}
	}

	.use-case-card {
		padding: 30px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		text-align: center;
		transition: all 0.3s ease;

		@media screen and (max-width: 640px) {
			padding: 25px 20px;
		}

		&:hover {
			transform: translateY(-5px);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		}

		.use-case-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 72px;
			height: 72px;
			background: rgba(255, 183, 0, 0.1);
			border-radius: 16px;
			margin-bottom: 15px;
			font-size: 2rem;

			@media screen and (max-width: 640px) {
				width: 64px;
				height: 64px;
				font-size: 1.75rem;
			}
		}

		h3 {
			font-size: 1.25rem;
			font-weight: 600;
			margin: 0 0 10px 0;
			color: var(--textColor);

			@media screen and (max-width: 640px) {
				font-size: 1.125rem;
			}
		}

		p {
			font-size: 0.95rem;
			line-height: 1.6;
			color: var(--color-tertiary, #666);
			margin: 0;

			@media screen and (max-width: 640px) {
				font-size: 0.9rem;
			}
		}
	}

	/* Pricing Section */
	.pricing {
		background: white;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 30px;
		max-width: 1100px;
		margin: 0 auto;

		@media screen and (max-width: 968px) {
			grid-template-columns: 1fr;
			max-width: 400px;
		}

		@media screen and (max-width: 640px) {
			gap: 20px;
		}
	}

	.pricing-card {
		background: white;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-radius: 16px;
		padding: 40px 30px;
		display: flex;
		flex-direction: column;
		position: relative;
		transition: all 0.3s ease;

		@media screen and (max-width: 640px) {
			padding: 30px 25px;
		}

		&:hover {
			border-color: var(--primary);
			box-shadow: 0 8px 24px rgba(255, 208, 0, 0.2);
			transform: translateY(-5px);

			@media screen and (max-width: 640px) {
				transform: translateY(-2px);
			}
		}

		&.highlighted {
			border-color: var(--primary);
			border-width: 3px;
			box-shadow: 0 8px 24px rgba(255, 208, 0, 0.25);

			@media screen and (max-width: 968px) {
				order: -1;
			}
		}

		.popular-badge {
			position: absolute;
			top: -12px;
			left: 50%;
			transform: translateX(-50%);
			background: var(--primary);
			color: #000;
			padding: 6px 20px;
			border-radius: 20px;
			font-size: 0.75rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.plan-name {
			font-size: 1.5rem;
			font-weight: 700;
			margin: 0 0 15px 0;
			color: var(--textColor);

			@media screen and (max-width: 640px) {
				font-size: 1.35rem;
			}
		}

		.plan-price {
			margin-bottom: 15px;

			.price {
				font-size: 3rem;
				font-weight: 800;
				color: var(--textColor);
				line-height: 1;

				@media screen and (max-width: 640px) {
					font-size: 2.5rem;
				}
			}

			.period {
				font-size: 1rem;
				color: var(--color-tertiary, #666);
				font-weight: 500;
			}
		}

		.plan-description {
			color: var(--color-tertiary, #666);
			font-size: 0.95rem;
			margin: 0 0 25px 0;
			min-height: 40px;

			@media screen and (max-width: 640px) {
				min-height: auto;
				margin-bottom: 20px;
			}
		}

		.plan-features {
			list-style: none;
			padding: 0;
			margin: 0 0 30px 0;
			flex-grow: 1;

			li {
				padding: 10px 0;
				font-size: 0.95rem;
				line-height: 1.5;
				border-bottom: 1px solid rgba(0, 0, 0, 0.05);

				@media screen and (max-width: 640px) {
					font-size: 0.9rem;
					padding: 8px 0;
				}

				&:last-child {
					border-bottom: none;
				}

				&.feature {
					color: var(--textColor);
				}

				&.limitation {
					color: var(--color-tertiary, #999);
				}
			}
		}

		.btn {
			width: 100%;
			margin-top: auto;
		}
	}

	/* FAQ Section */
	.faq {
		background: linear-gradient(to bottom, transparent, rgba(255, 208, 0, 0.03));
	}

	.faq-list {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.faq-item {
		background: white;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s ease;

		&.open {
			border-color: var(--primary);
			box-shadow: 0 4px 12px rgba(255, 208, 0, 0.2);
		}

		&:hover {
			border-color: rgba(0, 0, 0, 0.2);
		}
	}

	.faq-question {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 25px;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--textColor);
		transition: background 0.2s ease;

		@media screen and (max-width: 640px) {
			padding: 18px 20px;
			font-size: 1rem;
		}

		&:hover {
			background: rgba(255, 208, 0, 0.05);
		}

		.faq-icon {
			font-size: 1.5rem;
			font-weight: 400;
			color: var(--primary);
			flex-shrink: 0;
			margin-left: 15px;
			width: 30px;
			height: 30px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(255, 208, 0, 0.15);
			border-radius: 50%;

			@media screen and (max-width: 640px) {
				font-size: 1.25rem;
				width: 26px;
				height: 26px;
			}
		}
	}

	.faq-answer {
		padding: 0 25px 20px 25px;
		animation: slideDown 0.3s ease;

		@media screen and (max-width: 640px) {
			padding: 0 20px 18px 20px;
		}

		p {
			margin: 0;
			font-size: 1rem;
			line-height: 1.7;
			color: var(--color-tertiary, #666);

			@media screen and (max-width: 640px) {
				font-size: 0.95rem;
			}
		}
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.final-cta {
		background: linear-gradient(135deg, var(--primary) 0%, #ffb700 100%);
		text-align: center;

		.cta-content {
			max-width: 700px;
			margin: 0 auto;

			h2 {
				font-size: 2.5rem;
				font-weight: 700;
				margin: 0 0 15px 0;
				color: #000;

				@media screen and (max-width: 640px) {
					font-size: 2rem;
				}
			}

			p {
				font-size: 1.125rem;
				color: rgba(0, 0, 0, 0.8);
				margin: 0 0 30px 0;
			}

			.cta-buttons {
				margin-bottom: 20px;

				.btn-primary {
					background: #000;
					color: var(--primary);
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

					&:hover {
						box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
					}
				}
			}

			.cta-note {
				font-size: 0.95rem;
				color: rgba(0, 0, 0, 0.7);

				.link {
					color: #000;
					font-weight: 600;
					text-decoration: underline;

					&:hover {
						text-decoration: none;
					}
				}
			}
		}
	}
</style>
