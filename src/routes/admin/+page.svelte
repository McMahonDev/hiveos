<script lang="ts">
	let { data } = $props<{ data: any }>();

	const { analytics } = data;

	// Calculate percentages and format data
	const freeUsersPercent = Math.round(
		((analytics.usersByTier.find((t: any) => t.tier === 'free')?.count || 0) /
			analytics.totalUsers) *
			100
	);
	const paidUsersPercent = Math.round((analytics.paidUsers / analytics.totalUsers) * 100);
	const activeUsersPercent = Math.round((analytics.activeUsers / analytics.totalUsers) * 100);

	// Format date helper
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Admin Dashboard - HiveOS</title>
</svelte:head>

<section class="admin-dashboard">
	<header class="dashboard-header">
		<h1>Admin Dashboard</h1>
		<p class="subtitle">System analytics and user management</p>
	</header>

	<!-- Key Metrics Grid -->
	<div class="metrics-grid">
		<div class="metric-card">
			<div class="metric-icon">👥</div>
			<div class="metric-content">
				<h3>Total Users</h3>
				<p class="metric-value">{analytics.totalUsers}</p>
				<p class="metric-detail">{analytics.activeUsers} active (30d)</p>
			</div>
		</div>

		<div class="metric-card">
			<div class="metric-icon">💳</div>
			<div class="metric-content">
				<h3>Paid Users</h3>
				<p class="metric-value">{analytics.paidUsers}</p>
				<p class="metric-detail">{paidUsersPercent}% of total</p>
			</div>
		</div>

		<div class="metric-card">
			<div class="metric-icon">👨‍👩‍👧‍👦</div>
			<div class="metric-content">
				<h3>Total Groups</h3>
				<p class="metric-value">{analytics.totalGroups}</p>
				<p class="metric-detail">Avg {analytics.avgGroupSize} members</p>
			</div>
		</div>

		<div class="metric-card">
			<div class="metric-icon">📊</div>
			<div class="metric-content">
				<h3>Total Items</h3>
				<p class="metric-value">
					{analytics.totalEvents + analytics.totalShoppingItems + analytics.totalTasks}
				</p>
				<p class="metric-detail">Events, Shopping, Tasks</p>
			</div>
		</div>
	</div>

	<!-- Content Activity -->
	<div class="stats-grid">
		<div class="stat-card">
			<h2>Content Activity</h2>
			<div class="stat-list">
				<div class="stat-item">
					<span class="stat-label">📅 Events</span>
					<span class="stat-value">{analytics.totalEvents}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">🛒 Shopping Items</span>
					<span class="stat-value">{analytics.totalShoppingItems}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">✅ Tasks</span>
					<span class="stat-value">{analytics.totalTasks}</span>
				</div>
			</div>
		</div>

		<!-- User Breakdown -->
		<div class="stat-card">
			<h2>Users by Tier</h2>
			<div class="stat-list">
				{#each analytics.usersByTier as tier}
					<div class="stat-item">
						<span class="stat-label">
							{#if tier.tier === 'free'}
								🆓 Free
							{:else if tier.tier === 'individual'}
								👤 Individual
							{:else if tier.tier === 'family'}
								👨‍👩‍👧‍👦 Family
							{:else}
								{tier.tier}
							{/if}
						</span>
						<span class="stat-value">{tier.count}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Groups Breakdown -->
		<div class="stat-card">
			<h2>Groups by Type</h2>
			<div class="stat-list">
				{#if analytics.groupsByType.length > 0}
					{#each analytics.groupsByType as group}
						<div class="stat-item">
							<span class="stat-label">
								{#if group.type === 'family'}
									👨‍👩‍👧‍👦 Family
								{:else if group.type === 'team'}
									🤝 Team
								{:else}
									📁 {group.type}
								{/if}
							</span>
							<span class="stat-value">{group.count}</span>
						</div>
					{/each}
				{:else}
					<p class="no-data">No groups yet</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Recent Users -->
	<div class="recent-users">
		<h2>Recent Users</h2>
		<div class="users-table">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Tier</th>
						<th>Joined</th>
					</tr>
				</thead>
				<tbody>
					{#each analytics.recentUsers as user}
						<tr>
							<td>{user.name}</td>
							<td>{user.email}</td>
							<td>
								<span class="tier-badge tier-{user.subscriptionTier}">
									{user.subscriptionTier}
								</span>
							</td>
							<td>{formatDate(user.createdAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</section>

<style>
	.admin-dashboard {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px;
	}

	.dashboard-header {
		margin-bottom: 30px;
	}

	.dashboard-header h1 {
		font-size: 2.5rem;
		margin-bottom: 8px;
		color: var(--text-primary);
	}

	.subtitle {
		color: var(--text-secondary);
		font-size: 1.1rem;
	}

	/* Metrics Grid */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.metric-card {
		background: var(--level-1);
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--level-2);
		display: flex;
		align-items: center;
		gap: 16px;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.metric-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--level-3);
	}

	.metric-icon {
		font-size: 3rem;
		flex-shrink: 0;
	}

	.metric-content h3 {
		margin: 0 0 8px 0;
		font-size: 0.9rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.metric-value {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 4px 0;
		color: var(--text-primary);
	}

	.metric-detail {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.stat-card {
		background: var(--level-1);
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--level-2);
	}

	.stat-card h2 {
		margin: 0 0 20px 0;
		font-size: 1.25rem;
		color: var(--text-primary);
	}

	.stat-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		background: var(--level-2);
		border-radius: 8px;
		transition: background 0.2s ease;
	}

	.stat-item:hover {
		background: var(--level-3);
	}

	.stat-label {
		font-weight: 500;
		color: var(--text-primary);
	}

	.stat-value {
		font-weight: 700;
		font-size: 1.25rem;
		color: var(--text-primary);
	}

	.no-data {
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
		padding: 20px;
	}

	/* Recent Users Table */
	.recent-users {
		background: var(--level-1);
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--level-2);
	}

	.recent-users h2 {
		margin: 0 0 20px 0;
		font-size: 1.25rem;
		color: var(--text-primary);
	}

	.users-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: var(--level-2);
	}

	th {
		text-align: left;
		padding: 12px 16px;
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--level-2);
		color: var(--text-primary);
	}

	tbody tr:hover {
		background: var(--level-2);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.tier-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.tier-free {
		background: #e0e0e0;
		color: #424242;
	}

	.tier-individual {
		background: #bbdefb;
		color: #0d47a1;
	}

	.tier-family {
		background: #c8e6c9;
		color: #1b5e20;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.dashboard-header h1 {
			font-size: 2rem;
		}

		.metrics-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.metric-value {
			font-size: 2rem;
		}

		table {
			font-size: 0.875rem;
		}

		th,
		td {
			padding: 8px 12px;
		}
	}
</style>
