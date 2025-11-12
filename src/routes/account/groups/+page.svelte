<script lang="ts">
	import { Query } from 'zero-svelte';
	import { nanoid } from 'nanoid';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const z = data.z;
	let userId = $derived(data.id);

	// Query user data
	const currentUser = $derived(
		z && z.current ? new Query(z.current.query.user.where('id', userId)) : null
	);
	const userRecord = $derived(currentUser?.current[0] ?? null);

	// Query user's group membership
	let userGroupMembership = $derived(
		z && z.current ? new Query(z.current.query.userGroupMembers.where('userId', userId)) : null
	);
	let activeGroupId = $derived(userRecord?.active_group_id ?? '');

	// Query the active group
	let activeGroup = $derived(
		z && z.current && activeGroupId
			? new Query(z.current.query.userGroups.where('id', activeGroupId))
			: null
	);
	let group = $derived(activeGroup?.current[0] ?? null);

	// Check if user is admin
	let membership = $derived(
		userGroupMembership?.current?.find((m) => m.userGroupId === activeGroupId) ?? null
	);
	let isAdmin = $derived(membership?.isAdmin ?? false);
	let isCreator = $derived(group?.createdById === userId);

	// Query all group members
	let allGroupMembers = $derived(
		z && z.current && activeGroupId
			? new Query(z.current.query.userGroupMembers.where('userGroupId', activeGroupId))
			: null
	);

	// Query access codes for this group
	let accessCodes = $derived(
		z && z.current && activeGroupId
			? new Query(z.current.query.accessCodes.where('groupId', activeGroupId))
			: null
	);

	// Query group data for stats
	let allShoppingList = $derived(
		z && z.current && activeGroupId
			? new Query(z.current.query.shoppingList.where('assignedToId', activeGroupId))
			: null
	);
	let allEvents = $derived(
		z && z.current && activeGroupId
			? new Query(z.current.query.events.where('assignedToId', activeGroupId))
			: null
	);

	// Query group activity log
	let groupActivityLogs = $derived(
		z && z.current && activeGroupId
			? new Query(z.current.query.groupActivityLog.where('groupId', activeGroupId))
			: null
	);

	// State for code generation
	let showCodeGenerator = $state(false);
	let newCodePrefix = $state('');
	let codeMaxUses = $state<number | null>(null);
	let codeExpiresInDays = $state<number | null>(null);
	let generatedCode = $state<string | null>(null);

	// State for messages
	let successMessage = $state('');
	let errorMessage = $state('');

	function generateAccessCode() {
		if (!group || !isAdmin) return;

		const prefix = newCodePrefix.trim() || group.groupType.toUpperCase();
		const randomPart = nanoid(8).toUpperCase();
		const code = `${prefix}-${randomPart}`;

		const expiresAt = codeExpiresInDays
			? Date.now() + codeExpiresInDays * 24 * 60 * 60 * 1000
			: null;

		z?.current.mutate.accessCodes.insert({
			id: nanoid(),
			code: code,
			groupId: group.id,
			createdById: userId,
			usesRemaining: codeMaxUses,
			maxUses: codeMaxUses,
			expiresAt: expiresAt,
			createdAt: Date.now()
		});

		// Log activity
		logGroupActivity('access_code_generated', undefined, { code: code, maxUses: codeMaxUses });

		generatedCode = code;
		successMessage = `Access code "${code}" created successfully!`;

		// Reset form
		newCodePrefix = '';
		codeMaxUses = null;
		codeExpiresInDays = null;
		showCodeGenerator = false;

		setTimeout(() => {
			successMessage = '';
			generatedCode = null;
		}, 5000);
	}

	function deleteAccessCode(codeId: string) {
		if (!isAdmin) return;

		if (confirm('Are you sure you want to delete this access code?')) {
			z?.current.mutate.accessCodes.delete({ id: codeId });
			successMessage = 'Access code deleted successfully';
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		}
	}

	function regenerateAccessCode(oldCode: any) {
		if (!isAdmin || !group) return;

		// Delete old code
		z?.current.mutate.accessCodes.delete({ id: oldCode.id });

		// Generate new code with same parameters
		const prefix = oldCode.code.split('-')[0];
		const randomPart = nanoid(8).toUpperCase();
		const newCodeStr = `${prefix}-${randomPart}`;

		z?.current.mutate.accessCodes.insert({
			id: nanoid(),
			code: newCodeStr,
			groupId: group.id,
			createdById: userId,
			usesRemaining: oldCode.maxUses,
			maxUses: oldCode.maxUses,
			expiresAt: oldCode.expiresAt ? Date.now() + (oldCode.expiresAt - oldCode.createdAt) : null,
			createdAt: Date.now()
		});

		generatedCode = newCodeStr;
		successMessage = `Access code regenerated: "${newCodeStr}"`;
		setTimeout(() => {
			successMessage = '';
			generatedCode = null;
		}, 5000);
	}

	function toggleMemberAdmin(memberId: string, currentAdminStatus: boolean) {
		if (!isAdmin) return;

		const member = allGroupMembers?.current?.find((m) => m.id === memberId);
		const targetUserId = member?.userId;

		z?.current.mutate.userGroupMembers.update({
			id: memberId,
			isAdmin: !currentAdminStatus
		});

		// Log activity
		if (targetUserId) {
			logGroupActivity(!currentAdminStatus ? 'admin_promoted' : 'admin_demoted', targetUserId);
		}

		successMessage = `Member ${!currentAdminStatus ? 'promoted to' : 'removed from'} admin`;
		setTimeout(() => {
			successMessage = '';
		}, 3000);
	}

	function removeMember(memberId: string, memberUserId: string) {
		if (!isAdmin || memberUserId === userId) return;

		if (confirm('Are you sure you want to remove this member from the group?')) {
			z?.current.mutate.userGroupMembers.delete({ id: memberId });

			// Update the removed user's active group only
			// Note: Subscription tier is completely decoupled from groups
			// Removed members keep their paid subscription
			z?.current.mutate.user.update({
				id: memberUserId,
				active_group_id: null
				// DO NOT change subscription_tier - it's independent of group membership
			});

			// Log activity
			logGroupActivity('member_removed', memberUserId);

			successMessage = 'Member removed from group';
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		}
	}

	function getMemberName(memberId: string): string {
		if (z && z.current) {
			const member = new Query(z.current.query.user.where('id', memberId)).current[0];
			return member?.name || 'Unknown User';
		}
		return 'Unknown User';
	}

	function getMemberEmail(memberId: string): string {
		if (z && z.current) {
			const member = new Query(z.current.query.user.where('id', memberId)).current[0];
			return member?.email || '';
		}
		return '';
	}

	function getMemberTier(memberId: string): string {
		if (z && z.current) {
			const member = new Query(z.current.query.user.where('id', memberId)).current[0];
			return member?.subscription_tier || 'free';
		}
		return 'free';
	}

	function logGroupActivity(actionType: string, targetUserId?: string, metadata?: any) {
		if (!z?.current || !group?.id) return;

		z.current.mutate.groupActivityLog.insert({
			id: nanoid(),
			groupId: group.id,
			actorUserId: userId,
			actionType: actionType,
			targetUserId: targetUserId || null,
			metadata: metadata ? JSON.stringify(metadata) : null,
			createdAt: Date.now()
		});
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			successMessage = 'Copied to clipboard!';
			setTimeout(() => {
				successMessage = '';
			}, 2000);
		});
	}

	function formatDate(timestamp: number | null): string {
		if (!timestamp) return 'Never';
		return new Date(timestamp).toLocaleDateString();
	}

	function isCodeExpired(expiresAt: number | null): boolean {
		if (!expiresAt) return false;
		return Date.now() > expiresAt;
	}

	function getUsageText(code: any): string {
		if (code.maxUses === null) return 'Unlimited';
		const used = (code.maxUses ?? 0) - (code.usesRemaining ?? 0);
		return `${used} / ${code.maxUses}`;
	}

	function inviteMemberByEmail(event: Event) {
		event.preventDefault();
		if (!isAdmin || !group) return;

		const form = event.target as HTMLFormElement;
		const email = form.email.value;

		if (!email) return;

		// Check if group is at capacity (only applies to groups with maxMembers set, like family groups)
		if (group.maxMembers !== null) {
			const currentMemberCount = allGroupMembers?.current?.length ?? 0;
			if (currentMemberCount >= group.maxMembers) {
				errorMessage = `This group is at full capacity (${group.maxMembers} members). Remove a member before inviting new ones.`;
				setTimeout(() => {
					errorMessage = '';
				}, 5000);
				return;
			}
		}

		// Allow inviting any user (free or paid)
		// Free users will see upgrade prompts when accessing group features
		const invitedUser = z?.current
			? new Query(z.current.query.user.where('email', email)).current[0]
			: null;

		if (invitedUser) {
			const tier = invitedUser.subscription_tier;
			if (tier !== 'individual' && tier !== 'family') {
				// Show info message instead of blocking
				successMessage = `Invitation sent to ${email}. Note: Free users will need to upgrade to access all group features.`;
				setTimeout(() => {
					successMessage = '';
				}, 5000);
			}
		}

		const id = nanoid();
		z?.current.mutate.userGroupRequests.insert({
			id,
			email: email,
			userGroupId: group.id,
			status: false,
			sentByEmail: userRecord?.email ?? '',
			groupName: group.name
		});

		successMessage = `Invitation sent to ${email}`;
		form.reset();

		setTimeout(() => {
			successMessage = '';
		}, 3000);
	}

	function deleteGroup(event: Event) {
		event.preventDefault();
		if (!isAdmin || !group) return;

		const tier = userRecord?.subscription_tier || 'unknown';
		const tierName =
			tier === 'individual' ? 'Individual ($5/mo)' : tier === 'family' ? 'Family ($20/mo)' : tier;

		if (
			!confirm(
				`Are you sure you want to delete this group?\n\n⚠️ Important: Your ${tierName} subscription will remain active and you will continue to be billed. Deleting the group does NOT cancel your subscription.\n\nTo cancel your subscription, visit Account Settings > Subscription.\n\nThis action cannot be undone and all members will be removed from the group.`
			)
		) {
			return;
		}

		// Delete the group
		z?.current.mutate.userGroups.delete({ id: group.id });

		// Delete all member records
		allGroupMembers?.current?.forEach((member) => {
			z?.current.mutate.userGroupMembers.delete({ id: member.id });
		});

		// Update user's active group only (subscription remains unchanged)
		z?.current.mutate.user.update({
			id: userId,
			active_group_id: null
		});

		successMessage = 'Group deleted successfully. Redirecting...';

		// Redirect to account settings after a brief delay
		setTimeout(() => {
			window.location.href = '/account';
		}, 1500);
	}
</script>

<div class="groups-container">
	<div class="page-header">
		<h1 class="page-title">Group Management</h1>
		<a href="/account" class="back-link">← Back to Settings</a>
	</div>

	{#if successMessage}
		<div class="alert alert-success">{successMessage}</div>
	{/if}

	{#if errorMessage}
		<div class="alert alert-error">{errorMessage}</div>
	{/if}

	{#if userRecord?.subscription_tier === 'free'}
		<div class="alert alert-info upgrade-prompt">
			<strong>🔒 Limited Access:</strong> You're on a free account in this group.
			<a
				href="/account/upgrade"
				style="color: inherit; text-decoration: underline; font-weight: 600;"
			>
				Upgrade to Individual ($5/mo)
			</a>
			to create your own groups and unlock full collaboration features.
		</div>
	{/if}

	{#if !group}
		<div class="card empty-state">
			<h2>No Active Group</h2>
			<p>You are not currently a member of any group.</p>
			<p>
				To create a group or join one, visit your <a href="/account">Account Settings</a>.
			</p>
		</div>
	{:else}
		<div class="info-banner subscription-info">
			💡 <strong>Note:</strong> Your subscription and group membership are independent. Leaving or
			deleting this group will <strong>not</strong> affect your billing or subscription status. To
			manage your subscription, visit <a href="/account/subscription">Subscription Settings</a>.
		</div>

		<!-- Group Info Card -->
		<div class="card group-info-card">
			<div class="card-header">
				<h2 class="card-title">{group.name}</h2>
				<span class="group-type-badge">{group.groupType}</span>
			</div>
			<div class="group-stats">
				<div class="stat">
					<span class="stat-label">Members</span>
					<span class="stat-value">
						{#if group.groupType === 'individual'}
							{allGroupMembers?.current?.length ?? 0} members
						{:else if group.maxMembers}
							{@const currentCount = allGroupMembers?.current?.length ?? 0}
							{@const isAlmostFull = currentCount >= group.maxMembers - 1}
							{@const isFull = currentCount >= group.maxMembers}
							<span class:warning={isAlmostFull} class:full={isFull}>
								{currentCount} / {group.maxMembers}
								{#if isFull}
									<span class="capacity-badge full">Full</span>
								{:else if isAlmostFull}
									<span class="capacity-badge warning">Almost Full</span>
								{/if}
							</span>
						{:else}
							{allGroupMembers?.current?.length ?? 0} members
						{/if}
					</span>
				</div>
				<div class="stat">
					<span class="stat-label">Created</span>
					<span class="stat-value">{formatDate(group.createdAt)}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Your Role</span>
					<span class="stat-value">{isAdmin ? 'Admin' : 'Member'}</span>
				</div>
			</div>
		</div>

		<!-- Access Codes Section (Admin Only) -->
		{#if isAdmin}
			{@const currentCount = allGroupMembers?.current?.length ?? 0}
			{@const maxMembers = group?.maxMembers}
			{@const isFull = maxMembers && currentCount >= maxMembers}
			<div class="card access-codes-card">
				<div class="card-header">
					<h2 class="card-title">Access Codes</h2>
					<button
						class="primary-button"
						onclick={() => (showCodeGenerator = !showCodeGenerator)}
						disabled={isFull && !showCodeGenerator}
					>
						{isFull && !showCodeGenerator
							? 'Group Full'
							: showCodeGenerator
								? 'Cancel'
								: '+ Generate Code'}
					</button>
				</div>
				{#if isFull}
					<div class="alert alert-error">
						<strong>⚠️ Group Full:</strong> Cannot generate new access codes when at capacity ({maxMembers}
						members).
					</div>
				{/if}

				{#if showCodeGenerator}
					<div class="code-generator">
						<h3>Generate New Access Code</h3>
						<div class="form-grid">
							<div class="input-group">
								<label for="codePrefix">Code Prefix (Optional)</label>
								<input
									type="text"
									id="codePrefix"
									bind:value={newCodePrefix}
									placeholder="e.g., FAMILY, TEAM"
									maxlength="10"
								/>
								<span class="input-hint">Default: {group.groupType.toUpperCase()}</span>
							</div>

							<div class="input-group">
								<label for="maxUses">Max Uses (Optional)</label>
								<input
									type="number"
									id="maxUses"
									bind:value={codeMaxUses}
									placeholder="Unlimited"
									min="1"
								/>
								<span class="input-hint">Leave empty for unlimited uses</span>
							</div>

							<div class="input-group">
								<label for="expiresIn">Expires In (Days, Optional)</label>
								<input
									type="number"
									id="expiresIn"
									bind:value={codeExpiresInDays}
									placeholder="Never expires"
									min="1"
								/>
								<span class="input-hint">Leave empty for no expiration</span>
							</div>
						</div>

						<button class="primary-button" onclick={generateAccessCode}> Generate Code </button>
					</div>
				{/if}

				{#if generatedCode}
					<div class="generated-code-display">
						<div class="code-banner">
							<span class="code-text">{generatedCode}</span>
							<button class="copy-button" onclick={() => copyToClipboard(generatedCode!)}>
								📋 Copy
							</button>
						</div>
						<p class="code-hint">Share this code with people you want to invite to your group.</p>
					</div>
				{/if}

				{#if accessCodes?.current && accessCodes.current.length > 0}
					<div class="codes-list">
						<h3>Active Codes</h3>
						<div class="table-responsive">
							<table class="codes-table">
								<thead>
									<tr>
										<th>Code</th>
										<th>Uses</th>
										<th>Expires</th>
										<th>Created</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{#each accessCodes.current as code}
										{@const isExpired = isCodeExpired(code.expiresAt)}
										{@const isExhausted = code.usesRemaining !== null && code.usesRemaining <= 0}
										{@const isActive = !isExpired && !isExhausted}
										<tr class:expired={isExpired} class:exhausted={isExhausted}>
											<td>
												<button
													class="code-cell"
													onclick={() => copyToClipboard(code.code)}
													title="Click to copy"
													disabled={!isActive}
												>
													{code.code}
												</button>
												{#if isExpired}
													<span class="status-badge expired">Expired</span>
												{:else if isExhausted}
													<span class="status-badge exhausted">No Uses Left</span>
												{:else}
													<span class="status-badge active">Active</span>
												{/if}
											</td>
											<td>{getUsageText(code)}</td>
											<td>
												{#if isExpired}
													<span class="expired-text">Expired</span>
												{:else}
													{formatDate(code.expiresAt)}
												{/if}
											</td>
											<td>{formatDate(code.createdAt)}</td>
											<td>
												<div class="code-actions">
													{#if !isActive}
														<button
															class="regenerate-button"
															onclick={() => regenerateAccessCode(code)}
														>
															Regenerate
														</button>
													{/if}
													<button class="delete-button" onclick={() => deleteAccessCode(code.id)}>
														Delete
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{:else}
					<p class="empty-message">No access codes yet. Generate one to invite members!</p>
				{/if}
			</div>
		{/if}

		<!-- Members Section -->
		<div class="card members-card">
			<h2 class="card-title">Group Members</h2>

			{#if allGroupMembers?.current && allGroupMembers.current.length > 0}
				<div class="members-list">
					{#each allGroupMembers.current as member}
						{@const memberName = getMemberName(member.userId)}
						{@const memberEmail = getMemberEmail(member.userId)}
						{@const memberTier = getMemberTier(member.userId)}
						{@const isCurrentUser = member.userId === userId}
						{@const isMemberAdmin = member.isAdmin}

						<div class="member-card">
							<div class="member-avatar">
								{memberName.charAt(0).toUpperCase()}
							</div>
							<div class="member-info">
								<div class="member-name">
									{memberName}
									{#if isCurrentUser}
										<span class="you-badge">You</span>
									{/if}
								</div>
								<div class="member-email">{memberEmail}</div>
								<div class="member-meta">
									<span class="member-role">
										{isMemberAdmin ? '👑 Admin' : '👤 Member'}
									</span>
									<span class="member-tier" class:free-tier={memberTier === 'free'}>
										{#if memberTier === 'free' && group?.groupType === 'family'}
											🎁 Guest (via family code)
										{:else if memberTier === 'free'}
											Free Account
										{:else if memberTier === 'individual'}
											💳 Individual Plan
										{:else if memberTier === 'family'}
											👨‍👩‍👧‍👦 Family Plan
										{:else}
											{memberTier}
										{/if}
									</span>
									<span class="member-joined">Joined {formatDate(member.joinedAt)}</span>
								</div>
							</div>

							{#if isAdmin && !isCurrentUser}
								<div class="member-actions">
									<button
										class="action-button"
										onclick={() => toggleMemberAdmin(member.id, isMemberAdmin)}
									>
										{isMemberAdmin ? 'Remove Admin' : 'Make Admin'}
									</button>
									<button
										class="action-button danger"
										onclick={() => removeMember(member.id, member.userId)}
									>
										Remove
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-message">No members found.</p>
			{/if}
		</div>

		<!-- Group Activity Log Section -->
		<div class="card">
			<h3>📋 Activity Log</h3>
			{#if groupActivityLogs && groupActivityLogs.current && groupActivityLogs.current.length > 0}
				{@const sortedLogs = [...groupActivityLogs.current].sort(
					(a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
				)}
				{@const recentLogs = sortedLogs.slice(0, 50)}
				<div class="activity-feed">
					{#each recentLogs as log}
						{@const actorUser = z?.current
							? new Query(z.current.query.user.where('id', log.actorUserId)).current[0]
							: null}
						{@const actorName = actorUser?.name || actorUser?.email || 'Unknown User'}
						{@const targetUser =
							log.targetUserId && z?.current
								? new Query(z.current.query.user.where('id', log.targetUserId)).current[0]
								: null}
						{@const targetName = targetUser?.name || targetUser?.email || 'Unknown User'}
						<div class="activity-item">
							<div class="activity-icon">
								{#if log.actionType === 'member_added'}
									➕
								{:else if log.actionType === 'member_removed'}
									➖
								{:else if log.actionType === 'admin_promoted'}
									👑
								{:else if log.actionType === 'admin_demoted'}
									👤
								{:else if log.actionType === 'access_code_generated'}
									🔑
								{:else}
									📝
								{/if}
							</div>
							<div class="activity-content">
								<div class="activity-description">
									<strong>{actorName}</strong>
									{#if log.actionType === 'member_added'}
										added <strong>{targetName}</strong> to the group
									{:else if log.actionType === 'member_removed'}
										removed <strong>{targetName}</strong> from the group
									{:else if log.actionType === 'admin_promoted'}
										promoted <strong>{targetName}</strong> to admin
									{:else if log.actionType === 'admin_demoted'}
										removed admin from <strong>{targetName}</strong>
									{:else if log.actionType === 'access_code_generated'}
										generated a new access code
										{#if log.metadata}
											{@const meta = JSON.parse(log.metadata)}
											{#if meta.codeType === 'personal'}
												(personal)
											{:else if meta.codeType === 'family'}
												(family, max uses: {meta.maxUses})
											{/if}
										{/if}
									{:else}
										performed action: {log.actionType}
									{/if}
								</div>
								<div class="activity-timestamp">
									{formatDate(log.createdAt)}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-message">No activity recorded yet.</p>
			{/if}
		</div>

		<!-- Email-based Invite Members Section (Admin Only) -->
		{#if isAdmin}
			{@const currentCount = allGroupMembers?.current?.length ?? 0}
			{@const maxMembers = group?.maxMembers}
			{@const isFull = maxMembers && currentCount >= maxMembers}
			<div class="card invite-members-card">
				<h2 class="card-title">Invite Members by Email</h2>
				<p class="card-description">Send direct email invitations to specific users.</p>
				{#if isFull}
					<div class="alert alert-error">
						<strong>⚠️ Group Full:</strong> This group has reached its maximum capacity ({maxMembers}
						members). Remove a member before inviting new ones.
					</div>
				{/if}
				<div class="info-banner">
					<strong>Note:</strong> Free users can now be invited and will see upgrade prompts for full
					access.
				</div>
				<form onsubmit={inviteMemberByEmail} class="invite-form">
					<div class="input-group">
						<label for="invite-email">Email Address</label>
						<input
							type="email"
							id="invite-email"
							name="email"
							placeholder="colleague@example.com"
							required
							disabled={isFull}
						/>
					</div>
					<button class="primary-button" type="submit" disabled={isFull}>
						{isFull ? 'Group Full' : 'Send Invitation'}
					</button>
				</form>
			</div>

			<!-- Danger Zone (Admin Only) -->
			<div class="card danger-card">
				<h2 class="card-title danger-title">Danger Zone</h2>
				<p class="card-description">
					Deleting your group is permanent and cannot be undone. All group members will be removed.
				</p>
				<form onsubmit={deleteGroup}>
					<button class="danger-button" type="submit">Delete Group</button>
				</form>
			</div>
		{/if}
	{/if}
</div>

<style>
	.groups-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--textColor);
	}

	.back-link {
		color: var(--primary);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #e6c000;
	}

	.card {
		background: var(--cardBg);
		border-radius: var(--borderRadius);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: var(--cardShadow);
		border: 1px solid var(--lineColor);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.card-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--textColor);
		margin: 0;
	}

	.alert {
		padding: 1rem 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	.alert-success {
		background: rgba(116, 200, 88, 0.15);
		color: var(--green);
		border: 1px solid rgba(116, 200, 88, 0.3);
	}

	.alert-error {
		background: rgba(202, 46, 85, 0.15);
		color: var(--danger);
		border: 1px solid rgba(202, 46, 85, 0.3);
	}

	/* Group Info */
	.group-type-badge {
		background: var(--primary);
		color: var(--buttonTextColor);
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.group-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--grey);
		font-weight: 600;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--textColor);
	}

	/* Code Generator */
	.code-generator {
		background: var(--backgroundGrey);
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.code-generator h3 {
		margin-bottom: 1rem;
		color: var(--textColor);
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--textColor);
	}

	.input-group input {
		padding: 0.75rem;
		border: 2px solid var(--lineColor);
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.input-group input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.input-hint {
		font-size: 0.8rem;
		color: var(--grey);
		font-style: italic;
	}

	.primary-button {
		padding: 0.875rem 1.5rem;
		background: var(--primary);
		color: var(--buttonTextColor);
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-button:hover {
		background: #e6c000;
		transform: translateY(-1px);
	}

	/* Generated Code Display */
	.generated-code-display {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		color: white;
	}

	.code-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.code-text {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: 2px;
		font-family: 'Courier New', monospace;
	}

	.copy-button {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 2px solid white;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-button:hover {
		background: white;
		color: #667eea;
	}

	.code-hint {
		font-size: 0.9rem;
		opacity: 0.9;
		margin: 0;
	}

	/* Codes Table */
	.codes-list {
		margin-top: 1.5rem;
	}

	.codes-list h3 {
		margin-bottom: 1rem;
		color: var(--textColor);
	}

	.table-responsive {
		overflow-x: auto;
	}

	.codes-table {
		width: 100%;
		border-collapse: collapse;
	}

	.codes-table th {
		text-align: left;
		padding: 0.75rem;
		background: var(--backgroundGrey);
		font-weight: 600;
		color: var(--textColor);
		border-bottom: 2px solid var(--lineColor);
	}

	.codes-table td {
		padding: 0.75rem;
		border-bottom: 1px solid var(--lineColor);
	}

	.codes-table tr.expired {
		opacity: 0.5;
	}

	.code-cell {
		background: transparent;
		border: none;
		color: var(--primary);
		font-family: 'Courier New', monospace;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}

	.code-cell:hover {
		color: #e6c000;
	}

	.expired-badge {
		background: rgba(202, 46, 85, 0.15);
		color: var(--danger);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.delete-button {
		padding: 0.5rem 1rem;
		background: var(--danger);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.delete-button:hover {
		background: #a02445;
		transform: translateY(-1px);
	}

	/* Members List */
	.members-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.member-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--backgroundGrey);
		border-radius: 8px;
		border: 1px solid var(--lineColor);
		transition: all 0.2s;
	}

	.member-card:hover {
		background: var(--lineColor);
	}

	.member-avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: var(--primary);
		color: var(--buttonTextColor);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.member-info {
		flex: 1;
		min-width: 0;
	}

	.member-name {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--textColor);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.you-badge {
		background: var(--green);
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.member-email {
		font-size: 0.9rem;
		color: var(--grey);
		margin-top: 0.25rem;
	}

	.member-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		font-size: 0.85rem;
	}

	.member-role {
		color: var(--textColor);
		font-weight: 600;
	}

	.member-joined {
		color: var(--grey);
	}

	.member-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.action-button {
		padding: 0.5rem 1rem;
		background: var(--primary);
		color: var(--buttonTextColor);
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.action-button:hover {
		background: #e6c000;
		transform: translateY(-1px);
	}

	.action-button.danger {
		background: var(--danger);
		color: white;
	}

	.action-button.danger:hover {
		background: #a02445;
	}

	.empty-message {
		text-align: center;
		color: var(--grey);
		padding: 2rem;
		font-style: italic;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
	}

	.empty-state h2 {
		color: var(--textColor);
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: var(--grey);
		margin-bottom: 0.5rem;
	}

	.empty-state a {
		color: var(--primary);
		font-weight: 600;
	}

	/* Responsive */
	/* Invite Members Card */
	.invite-members-card {
		margin-top: 1.5rem;
	}

	.invite-form {
		margin-top: 1rem;
	}

	.input-group {
		margin-bottom: 1rem;
	}

	.input-group label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--textColor);
	}

	.input-group input {
		width: 100%;
		padding: 0.875rem;
		border: 1px solid var(--lineColor);
		border-radius: 8px;
		font-size: 1rem;
		background: var(--level-1);
		color: var(--textColor);
	}

	.info-banner {
		padding: 0.875rem 1rem;
		background: rgba(255, 212, 0, 0.1);
		border-left: 3px solid var(--primary);
		border-radius: 6px;
		font-size: 0.9rem;
		color: var(--textColor);
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.info-banner strong {
		color: var(--textColor);
		font-weight: 600;
	}

	/* Danger Zone Card */
	.danger-card {
		margin-top: 1.5rem;
		border: 2px solid var(--danger);
	}

	.danger-title {
		color: var(--danger);
	}

	.danger-button {
		width: 100%;
		padding: 0.875rem 1.5rem;
		background: var(--danger);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.danger-button:hover {
		background: #b8184a;
		transform: translateY(-1px);
		box-shadow: var(--level-2);
	}

	/* Capacity Indicators */
	.capacity-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.capacity-badge.warning {
		background: rgba(255, 165, 0, 0.2);
		color: #ff8c00;
	}

	.capacity-badge.full {
		background: rgba(220, 38, 38, 0.2);
		color: #dc2626;
	}

	.stat-value .warning {
		color: #ff8c00;
	}

	.stat-value .full {
		color: #dc2626;
	}

	.alert-info.upgrade-prompt {
		background: rgba(59, 130, 246, 0.1);
		border-left: 3px solid #3b82f6;
		color: var(--textColor);
	}

	/* Access Code Status Badges */
	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		margin-left: 0.5rem;
		text-transform: uppercase;
	}

	.status-badge.active {
		background: rgba(34, 197, 94, 0.2);
		color: #16a34a;
	}

	.status-badge.expired {
		background: rgba(220, 38, 38, 0.2);
		color: #dc2626;
	}

	.status-badge.exhausted {
		background: rgba(251, 146, 60, 0.2);
		color: #ea580c;
	}

	tr.expired {
		opacity: 0.6;
	}

	tr.exhausted {
		opacity: 0.7;
	}

	.expired-text {
		color: #dc2626;
		font-weight: 600;
	}

	.code-cell:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.code-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.regenerate-button {
		padding: 0.5rem 0.875rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.regenerate-button:hover {
		background: #2563eb;
	}

	.alert-error {
		background: rgba(220, 38, 38, 0.1);
		border-left: 3px solid #dc2626;
		padding: 0.875rem 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		color: var(--textColor);
	}

	/* Member Tier Display */
	.member-tier {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.member-tier.free-tier {
		background: rgba(156, 163, 175, 0.15);
		color: #6b7280;
	}

	.subscription-info {
		background: rgba(147, 197, 253, 0.15);
		border-left: 3px solid #3b82f6;
	}

	.subscription-info a {
		color: #3b82f6;
		font-weight: 600;
		text-decoration: underline;
	}

	/* Activity Log Styles */
	.activity-feed {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 600px;
		overflow-y: auto;
	}

	.activity-item {
		display: flex;
		gap: 0.875rem;
		padding: 0.875rem;
		background: var(--cardBackground);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.activity-item:hover {
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.activity-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.activity-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.activity-description {
		font-size: 0.9375rem;
		color: var(--textColor);
		line-height: 1.5;
	}

	.activity-description strong {
		font-weight: 600;
		color: #60a5fa;
	}

	.activity-timestamp {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.5);
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.page-title {
			font-size: 2rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.group-stats {
			grid-template-columns: 1fr;
		}

		.code-banner {
			flex-direction: column;
			align-items: stretch;
		}

		.member-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.member-actions {
			width: 100%;
			flex-direction: row;
		}

		.action-button {
			flex: 1;
		}

		.table-responsive {
			font-size: 0.9rem;
		}
	}
</style>
