<script lang="ts">
	import { Query } from 'zero-svelte';

	let { data } = $props();

	let z = data.z;
	let groupId = data.groupId;
	let userId = data.id;

	// Query user's group membership
	let groupMembership = $state<Query<any, any, any>>();
	$effect(() => {
		if (z?.current) {
			groupMembership = new Query(
				z.current.query.userGroupMembers.where('userId', userId)
			);
		}
	});

	// Query the actual group
	let userGroup = $state<Query<any, any, any>>();
	$effect(() => {
		if (z?.current && groupId) {
			userGroup = new Query(
				z.current.query.userGroups.where('id', groupId)
			);
		}
	});

	// Query all members in the group
	let allGroupMembers = $state<Query<any, any, any>>();
	$effect(() => {
		if (z?.current && groupId) {
			allGroupMembers = new Query(
				z.current.query.userGroupMembers.where('userGroupId', groupId)
			);
		}
	});

	// Query shared shopping list items
	let sharedShoppingItems = $state<Query<any, any, any>>();
	$effect(() => {
		if (z?.current && groupId) {
			sharedShoppingItems = new Query(
				z.current.query.shoppingList
					.where('viewMode', 'shared')
			);
		}
	});

	// Query shared shopping items assigned to this group
	let groupShoppingItems = $state<Query<any, any, any>>();
	$effect(() => {
		if (z?.current && groupId) {
			groupShoppingItems = new Query(
				z.current.query.shoppingList
					.where('assignedToId', groupId)
					.where('viewMode', 'shared')
			);
		}
	});

	// Log to console for debugging
	$effect(() => {
		console.log('=== SHARED LIST DEBUG INFO ===');
		console.log('Current User ID:', userId);
		console.log('Current Group ID:', groupId);
		console.log('Group Membership:', groupMembership?.current);
		console.log('User Group:', userGroup?.current);
		console.log('All Group Members:', allGroupMembers?.current);
		console.log('All Shared Shopping Items (any group):', sharedShoppingItems?.current);
		console.log('Shopping Items for THIS Group:', groupShoppingItems?.current);
		console.log('==============================');
	});
</script>

<section class="debug-container">
	<h1>Shared Lists Debug Information</h1>
	
	<div class="debug-section">
		<h2>Current User</h2>
		<p><strong>User ID:</strong> {userId}</p>
		<p><strong>Group ID from Server:</strong> {groupId}</p>
	</div>

	<div class="debug-section">
		<h2>Group Membership</h2>
		{#if groupMembership?.current && Array.isArray(groupMembership.current)}
			{#if groupMembership.current.length > 0}
				<ul>
					{#each groupMembership.current as membership}
						<li>
							<strong>Member ID:</strong> {membership.id}<br>
							<strong>User Group ID:</strong> {membership.userGroupId}<br>
							<strong>Is Admin:</strong> {membership.isAdmin ? 'Yes' : 'No'}
						</li>
					{/each}
				</ul>
			{:else}
				<p>No group memberships found</p>
			{/if}
		{:else}
			<p>Loading...</p>
		{/if}
	</div>

	<div class="debug-section">
		<h2>Group Details</h2>
		{#if userGroup?.current && Array.isArray(userGroup.current)}
			{#if userGroup.current.length > 0}
				{#each userGroup.current as group}
					<p><strong>Group Name:</strong> {group.name}</p>
					<p><strong>Group Type:</strong> {group.groupType}</p>
					<p><strong>Created By:</strong> {group.createdById}</p>
					<p><strong>Max Members:</strong> {group.maxMembers || 'Unlimited'}</p>
				{/each}
			{:else}
				<p>Group not found with ID: {groupId}</p>
			{/if}
		{:else}
			<p>Loading...</p>
		{/if}
	</div>

	<div class="debug-section">
		<h2>All Members in This Group</h2>
		{#if allGroupMembers?.current && Array.isArray(allGroupMembers.current)}
			{#if allGroupMembers.current.length > 0}
				<ul>
					{#each allGroupMembers.current as member}
						<li>
							<strong>User ID:</strong> {member.userId}<br>
							<strong>Is Admin:</strong> {member.isAdmin ? 'Yes' : 'No'}<br>
							<strong>Joined:</strong> {new Date(member.joinedAt).toLocaleString()}
						</li>
					{/each}
				</ul>
				<p><strong>Total Members:</strong> {allGroupMembers.current.length}</p>
			{:else}
				<p>No members found</p>
			{/if}
		{:else}
			<p>Loading...</p>
		{/if}
	</div>

	<div class="debug-section">
		<h2>All Shared Shopping Items (Any Group)</h2>
		{#if sharedShoppingItems?.current && Array.isArray(sharedShoppingItems.current)}
			{#if sharedShoppingItems.current.length > 0}
				<ul>
					{#each sharedShoppingItems.current as item}
						<li>
							<strong>Name:</strong> {item.name}<br>
							<strong>Assigned To ID:</strong> {item.assignedToId}<br>
							<strong>Created By:</strong> {item.createdById}<br>
							<strong>View Mode:</strong> {item.viewMode}<br>
							<strong>Store:</strong> {item.store || 'N/A'}<br>
							<strong>Match:</strong> {item.assignedToId === groupId ? '✅ MATCHES YOUR GROUP' : '❌ Different Group'}
						</li>
					{/each}
				</ul>
			{:else}
				<p>No shared shopping items found (any group)</p>
			{/if}
		{:else}
			<p>Loading...</p>
		{/if}
	</div>

	<div class="debug-section">
		<h2>Shopping Items for YOUR Group (assignedToId = {groupId})</h2>
		{#if groupShoppingItems?.current && Array.isArray(groupShoppingItems.current)}
			{#if groupShoppingItems.current.length > 0}
				<ul>
					{#each groupShoppingItems.current as item}
						<li>
							<strong>Name:</strong> {item.name}<br>
							<strong>Created By:</strong> {item.createdById}<br>
							<strong>Store:</strong> {item.store || 'N/A'}<br>
							<strong>Status:</strong> {item.status ? 'Completed' : 'Pending'}
						</li>
					{/each}
				</ul>
				<p><strong>Total Items:</strong> {groupShoppingItems.current.length}</p>
			{:else}
				<p class="warning">⚠️ No shopping items assigned to group ID: {groupId}</p>
				<p>This could mean:</p>
				<ul>
					<li>No items have been created yet in shared mode</li>
					<li>Items are assigned to a different group ID</li>
					<li>There's a mismatch between the groupId in the JWT and the database</li>
				</ul>
			{/if}
		{:else}
			<p>Loading...</p>
		{/if}
	</div>

	<div class="debug-section">
		<h2>Instructions</h2>
		<ol>
			<li>Check that both users show the SAME "Group ID from Server" value</li>
			<li>Verify both users appear in "All Members in This Group"</li>
			<li>Check "Shopping Items for YOUR Group" - both users should see the same items</li>
			<li>If "Assigned To ID" doesn't match your "Group ID", there's a mismatch</li>
			<li>Open browser console (F12) for more detailed logs</li>
		</ol>
	</div>
</section>

<style>
	.debug-container {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.debug-section {
		background: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.debug-section h2 {
		margin-top: 0;
		color: #333;
		border-bottom: 2px solid #007bff;
		padding-bottom: 0.5rem;
	}

	.debug-section ul {
		list-style: none;
		padding: 0;
	}

	.debug-section li {
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 1rem;
		margin-bottom: 0.5rem;
	}

	.warning {
		color: #d9534f;
		font-weight: bold;
	}

	strong {
		color: #555;
	}
</style>
