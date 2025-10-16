<script lang="ts">
	import { nanoid } from 'nanoid';
	import { Query } from 'zero-svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import LogoutIcon from '$lib/static/icons/logoutIcon.svelte';
	import SubscriptionTierBadge from '$lib/components/subscriptionTierBadge.svelte';
	import SubscriptionUpgradeModal from '$lib/components/subscriptionUpgradeModal.svelte';

	const { data } = $props();
	const z = data.z;
	let userId = $derived(data.id);
	let showFamilyPaymentModal = $state(false);
	let pendingGroupName = $state('');

	let isEditingProfile = $state(false);
	let editName = $state('');
	let editEmail = $state('');
	let updateMessage = $state('');
	let updateError = $state('');
	let verificationMessage = $state('');
	let verificationError = $state('');
	let isSendingVerification = $state(false);

	// Access code state
	let accessCodeInput = $state('');
	let accessCodeValidating = $state(false);
	let accessCodeError = $state('');
	let accessCodeSuccess = $state('');
	let validatedAccessCodeId = $state('');
	let validatedGroupName = $state('');

	let userGroupMembers = $derived(
		z && z.current ? new Query(z.current.query.userGroupMembers.where('userId', userId)) : null
	);
	let groupId = $derived(userGroupMembers?.current?.[0]?.userGroupId ?? '');
	let group = $derived(
		z && z.current ? new Query(z.current.query.userGroups.where('id', groupId)) : null
	);
	const user = $derived(
		z && z.current ? new Query(z.current.query.user.where('id', userId)) : null
	);
	let allGroupMembers = $derived(
		z && z.current
			? new Query(
					z.current.query.userGroupMembers.where('userGroupId', group?.current[0]?.id ?? '')
				)
			: null
	);
	const userEmail = $derived(user?.current?.[0]?.email ?? '');

	const userGroupRequests = $derived(
		z?.current?.query?.userGroupRequests
			? new Query(z.current.query.userGroupRequests.where('email', userEmail))
			: null
	);

	let showDeleteGroup = $derived(
		group?.current[0]?.name && group.current[0]?.createdById === userId ? true : false
	);

	let allShoppingList = $derived(
		z && z.current ? new Query(z.current.query.shoppingList.where('assignedToId', userId)) : null
	);
	let allEvents = $derived(
		z && z.current ? new Query(z.current.query.events.where('assignedToId', userId)) : null
	);

	function createGroup(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const name = form.groupName.value;

		if (!name) return;

		// Check if user has any paid subscription
		const currentTier = user?.current?.[0]?.subscription_tier;
		if (currentTier === 'individual' || currentTier === 'family') {
			// Already paid, create group immediately
			actuallyCreateGroup(name);
		} else {
			// Free user - need to upgrade to individual first ($5)
			pendingGroupName = name;
			showFamilyPaymentModal = true;
		}

		form.reset();
	}

	async function handleFamilyPaymentConfirm() {
		// Redirect to mock checkout for individual plan
		// Note: Group creation happens AFTER upgrade, not automatically
		await goto('/api/mock-checkout?session=cs_mock_individual&tier=individual');
	}

	function actuallyCreateGroup(name: string) {
		const currentTier = user?.current?.[0]?.subscription_tier;
		const id = nanoid();

		// Determine group type based on subscription
		const groupType = currentTier === 'family' ? 'family' : 'individual';
		const maxMembers = currentTier === 'family' ? 6 : 99; // Family: 6, Individual: many

		z?.current.mutate.userGroups.insert({
			id,
			name: name,
			createdById: userId,
			groupType: groupType,
			maxMembers: maxMembers,
			createdAt: Date.now()
		});
		z?.current.mutate.userGroupMembers.insert({
			id: nanoid(),
			userId: userId,
			userGroupId: id,
			userGroupCreatorId: userId,
			isAdmin: true, // Creator is always admin
			joinedAt: Date.now()
		});

		// Update user's active group (don't change subscription tier)
		z?.current.mutate.user.update({
			id: userId,
			active_group_id: id
		});

		groupId = id;

		// update all data to new group
		allEvents?.current.forEach((event) => {
			z?.current.mutate.events.update({
				id: event.id,
				assignedToId: groupId
			});
		});

		allShoppingList?.current.forEach((item) => {
			z?.current.mutate.shoppingList.update({
				id: item.id,
				assignedToId: groupId
			});
		});
	}

	function deleteGroup(event: Event) {
		event.preventDefault();
		if (group?.current[0]?.id) {
			z?.current.mutate.userGroups.delete({ id: group.current[0]?.id });
			const memberId = userGroupMembers?.current[0]?.id;
			if (memberId) {
				z?.current.mutate.userGroupMembers.delete({ id: memberId });
			}

			// Update user's active group and subscription tier
			// Note: This keeps subscription active but removes group access
			// User should cancel subscription separately via /account/subscription
			z?.current.mutate.user.update({
				id: userId,
				active_group_id: null,
				subscription_tier: 'free'
				// Keep subscription_status, subscription_id, etc. for billing continuity
				// User can cancel via subscription management page
			});
		}
	}
	function inviteMember(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const email = form.email.value;
		if (email && group?.current[0]) {
			const id = nanoid();
			z?.current.mutate.userGroupRequests.insert({
				id,
				email: email,
				userGroupId: group.current[0].id,
				status: false,
				sentByEmail: userEmail,
				groupName: group.current[0].name
			});
		}
		form.reset();
	}
	function acceptRequest(event: Event) {
		event.preventDefault();
		const target = event?.target as HTMLElement;
		const requestId = target?.closest('li')?.dataset.id;
		if (requestId && userGroupRequests && userGroupRequests.current) {
			const request = userGroupRequests.current.find((r) => r.id === requestId);
			if (request) {
				z?.current.mutate.userGroupMembers.insert({
					id: nanoid(),
					userId: userId,
					userGroupId: request.userGroupId,
					userGroupCreatorId: group?.current?.[0]?.createdById ?? '',
					isAdmin: false, // New members are not admins by default
					joinedAt: Date.now()
				});
				// delete all other records in usergroupmembers that have the same userID, there can only be one
				const otherMemberships =
					userGroupMembers?.current?.filter(
						(m) => m.userId === userId && m.userGroupId !== request.userGroupId
					) ?? [];
				otherMemberships.forEach((membership) => {
					z?.current.mutate.userGroupMembers.delete({ id: membership.id });
				});
				let requestIds: Array<string> = [];
				userGroupRequests.current.forEach((r) => {
					if (r.email === request.email) {
						requestIds.push(r.id);
					}
				});

				requestIds.forEach((id) => {
					console.log('Deleting request id:', id);
					z?.current.mutate.userGroupRequests.delete({
						id
					});
				});
			}
		}
		invalidateAll();
	}
	function rejectRequest(event: Event) {
		event.preventDefault();
		const target = event?.target as HTMLElement;
		const requestId = target?.closest('li')?.dataset.id;
		if (requestId) {
			z?.current.mutate.userGroupRequests.delete({ id: requestId });
		}
	}

	function getName(id: string) {
		if (z && z.current) {
			const name = new Query(z.current.query.user.where('id', id)).current[0]?.name;
			return name ? name : id;
		}
		return id;
	}

	async function handleLogout() {
		try {
			await authClient.signOut();
			await invalidateAll();
			await goto('/account/login', { replaceState: true, noScroll: true });
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	function startEditProfile() {
		editName = user?.current[0]?.name ?? '';
		editEmail = user?.current[0]?.email ?? '';
		isEditingProfile = true;
		updateMessage = '';
		updateError = '';
	}

	function cancelEditProfile() {
		isEditingProfile = false;
		editName = '';
		editEmail = '';
		updateMessage = '';
		updateError = '';
	}

	async function saveProfileChanges(event: Event) {
		event.preventDefault();
		updateMessage = '';
		updateError = '';

		try {
			// Update via Better Auth
			const response = await authClient.updateUser({
				name: editName
				// Note: Better Auth may require additional verification for email changes
			});

			if (response.error) {
				updateError = response.error.message || 'Failed to update profile';
				return;
			}

			// Update in Zero/database
			if (z?.current && user?.current[0]) {
				await z.current.mutate.user.update({
					id: userId,
					name: editName
				});
			}

			updateMessage = 'Profile updated successfully!';
			isEditingProfile = false;

			// Refresh data
			await invalidateAll();

			// Clear success message after 3 seconds
			setTimeout(() => {
				updateMessage = '';
			}, 3000);
		} catch (error) {
			console.error('Update failed:', error);
			updateError = 'An error occurred while updating your profile';
		}
	}

	async function resendVerificationEmail() {
		verificationMessage = '';
		verificationError = '';
		isSendingVerification = true;

		try {
			const result = await authClient.sendVerificationEmail({
				email: userEmail,
				callbackURL: '/'
			});

			if (result.error) {
				verificationError = result.error.message || 'Failed to send verification email';
			} else {
				verificationMessage = 'Verification email sent! Please check your inbox.';
				// Clear success message after 5 seconds
				setTimeout(() => {
					verificationMessage = '';
				}, 5000);
			}
		} catch (error) {
			console.error('Send verification error:', error);
			verificationError = 'An error occurred while sending verification email';
		} finally {
			isSendingVerification = false;
		}
	}

	async function validateAccessCode() {
		accessCodeError = '';
		accessCodeSuccess = '';
		validatedAccessCodeId = '';
		validatedGroupName = '';

		if (!accessCodeInput.trim()) {
			accessCodeError = 'Please enter an access code';
			return;
		}

		accessCodeValidating = true;

		try {
			const formData = new FormData();
			formData.append('code', accessCodeInput.trim());

			const response = await fetch('?/validateAccessCode', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success' && result.data?.success) {
				accessCodeSuccess = `✓ Valid code! Group: ${result.data.groupName}`;
				validatedAccessCodeId = result.data.accessCodeId;
				validatedGroupName = result.data.groupName;
			} else if (result.type === 'failure') {
				accessCodeError = result.data?.error || 'Invalid access code';
			}
		} catch (error) {
			console.error('Error validating access code:', error);
			accessCodeError = 'An error occurred. Please try again.';
		} finally {
			accessCodeValidating = false;
		}
	}

	async function joinWithAccessCode(event: Event) {
		event.preventDefault();

		if (!validatedAccessCodeId) {
			accessCodeError = 'Please validate the access code first';
			return;
		}

		accessCodeValidating = true;
		accessCodeError = '';

		try {
			const formData = new FormData();
			formData.append('userId', userId);
			formData.append('accessCodeId', validatedAccessCodeId);

			const response = await fetch('?/joinWithAccessCode', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success' && result.data?.success) {
				accessCodeSuccess = result.data.message || 'Successfully joined group!';
				accessCodeInput = '';
				validatedAccessCodeId = '';

				// Refresh the page to show new group
				await invalidateAll();

				// Clear success message after a delay
				setTimeout(() => {
					accessCodeSuccess = '';
				}, 5000);
			} else if (result.type === 'failure') {
				accessCodeError = result.data?.error || 'Failed to join group';
			}
		} catch (error) {
			console.error('Error joining with access code:', error);
			accessCodeError = 'An error occurred. Please try again.';
		} finally {
			accessCodeValidating = false;
		}
	}

	// Check for subscription success
	$effect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const success = params.get('success');

			if (success === 'subscription_activated') {
				// Payment successful - user can now create groups
				// They need to enter group name again (better UX)
				pendingGroupName = '';

				// Clean URL
				window.history.replaceState({}, '', '/account');
			}
		}
	});
</script>

<div class="account-container">
	<h1 class="page-title">Account Settings</h1>

	<div class="cards-grid">
		<!-- User Profile Card -->
		<div class="card profile-card">
			<div class="card-header">
				<h2 class="card-title">Your Profile</h2>
				{#if !isEditingProfile}
					<button onclick={startEditProfile} class="edit-button">Edit</button>
				{/if}
			</div>

			{#if updateMessage}
				<div class="alert alert-success">{updateMessage}</div>
			{/if}
			{#if updateError}
				<div class="alert alert-error">{updateError}</div>
			{/if}

			{#if isEditingProfile}
				<form onsubmit={saveProfileChanges} class="profile-edit-form">
					<div class="input-group">
						<label for="editName">Name</label>
						<input
							type="text"
							id="editName"
							bind:value={editName}
							placeholder="Your name"
							required
						/>
					</div>
					<div class="input-group">
						<label for="editEmail">Email</label>
						<input
							type="email"
							id="editEmail"
							value={editEmail}
							placeholder="Your email"
							disabled
							title="Email cannot be changed at this time"
						/>
						<span class="input-hint">Email changes require verification (coming soon)</span>
					</div>
					<div class="info-row">
						<span class="info-label">Group</span>
						<span class="info-value group-badge">
							{#if group?.current[0]?.name}
								{group.current[0].name}
							{:else}
								<span class="no-group">No group</span>
							{/if}
						</span>
					</div>
					<div class="form-actions">
						<button type="submit" class="primary-button">Save Changes</button>
						<button type="button" onclick={cancelEditProfile} class="secondary-button"
							>Cancel</button
						>
					</div>
				</form>
			{:else}
				<div class="profile-info">
					<div class="info-row">
						<span class="info-label">Name</span>
						<span class="info-value">{user?.current[0]?.name ?? 'Loading...'}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Email</span>
						<div class="info-value-wrapper">
							<span class="info-value">{user?.current[0]?.email ?? 'Loading...'}</span>
							{#if !user?.current[0]?.email_verified}
								<span class="unverified-badge" title="Email not verified">⚠ Unverified</span>
							{/if}
						</div>
					</div>
					<div class="info-row">
						<span class="info-label">Group</span>
						<span class="info-value group-badge">
							{#if group?.current[0]?.name}
								{group.current[0].name}
							{:else}
								<span class="no-group">No group</span>
							{/if}
						</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Subscription Tier Card -->
		<div class="card subscription-card">
			<h2 class="card-title">Subscription</h2>
			<div class="subscription-info">
				<div class="current-tier">
					<span class="tier-label">Current Plan:</span>
					<span class="tier-value">
						{#if user?.current[0]?.subscription_tier === 'individual'}
							Individual ($5/month)
						{:else if user?.current[0]?.subscription_tier === 'family'}
							Family Plan ($20/month)
						{:else}
							Free
						{/if}
					</span>
				</div>
				{#if user?.current[0]?.subscription_tier === 'free'}
					<p class="upgrade-prompt-text">
						Upgrade to unlock collaboration features, unlimited storage, and group management.
					</p>
					<a href="/account/upgrade" class="upgrade-link-button"> View Upgrade Options </a>
				{:else}
					<p class="paid-tier-info">
						Thank you for supporting HiveOS! You have access to all premium features.
					</p>
					{#if user?.current[0]?.subscription_status === 'active'}
						<div class="subscription-status">
							<span class="status-badge active">Active</span>
							{#if user?.current[0]?.current_period_end}
								<span class="renewal-date">
									Renews {new Date(user.current[0].current_period_end).toLocaleDateString()}
								</span>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Access Code Card (only for free users not in a group) -->
		{#if user?.current[0]?.subscription_tier === 'free' && !group?.current[0]?.name}
			<div class="card access-code-card">
				<h2 class="card-title">Join with Access Code</h2>
				<p class="card-description">
					Have an access code from a family or team? Enter it below to join their group for free!
				</p>

				{#if accessCodeSuccess}
					<div class="alert alert-success">{accessCodeSuccess}</div>
				{/if}
				{#if accessCodeError}
					<div class="alert alert-error">{accessCodeError}</div>
				{/if}

				<form onsubmit={joinWithAccessCode} class="access-code-form">
					<div class="input-group">
						<label for="accessCode">Access Code</label>
						<div class="access-code-input-wrapper">
							<input
								type="text"
								id="accessCode"
								bind:value={accessCodeInput}
								onblur={validateAccessCode}
								placeholder="FAMILY-2024-XXXX"
								disabled={accessCodeValidating}
								class:validated={validatedAccessCodeId}
								class:error={accessCodeError}
							/>
							{#if accessCodeValidating}
								<span class="validation-spinner">⏳</span>
							{:else if validatedAccessCodeId}
								<span class="validation-check">✓</span>
							{/if}
						</div>
						{#if validatedGroupName}
							<span class="validation-message success">Will join: {validatedGroupName}</span>
						{/if}
					</div>
					<button
						class="primary-button"
						type="submit"
						disabled={!validatedAccessCodeId || accessCodeValidating}
					>
						{accessCodeValidating ? 'Joining...' : 'Join Group'}
					</button>
				</form>
			</div>
		{/if}

		<!-- Email Verification Card (only show if email is not verified) -->
		{#if !user?.current[0]?.email_verified}
			<div class="card verification-card">
				<h2 class="card-title">Email Verification</h2>
				<p class="card-description">
					Your email address is not verified. Please check your inbox for a verification email.
				</p>

				{#if verificationMessage}
					<div class="alert alert-success">{verificationMessage}</div>
				{/if}
				{#if verificationError}
					<div class="alert alert-error">{verificationError}</div>
				{/if}

				<button
					onclick={resendVerificationEmail}
					class="primary-button"
					disabled={isSendingVerification}
				>
					{isSendingVerification ? 'Sending...' : 'Resend Verification Email'}
				</button>
			</div>
		{/if}

		<!-- Group Management Card -->
		{#if !group?.current[0]?.name}
			{#if user?.current[0]?.subscription_tier === 'individual' || user?.current[0]?.subscription_tier === 'family'}
				<!-- Paid users can create groups -->
				<div class="card group-card">
					<h2 class="card-title">Create a Group</h2>
					<p class="card-description">
						{#if user?.current[0]?.subscription_tier === 'family'}
							Create a family group with up to 6 members. Generate access codes for family members
							to join for free.
						{:else}
							Create a group and collaborate with other Individual tier users.
						{/if}
					</p>
					<form onsubmit={createGroup} class="group-form">
						<div class="input-group">
							<label for="groupName">Group Name</label>
							<input
								type="text"
								id="groupName"
								name="groupName"
								placeholder="Enter group name"
								required
							/>
						</div>
						<button class="primary-button" type="submit">Create Group</button>
					</form>
				</div>
			{/if}

			<!-- Pending Requests Card -->
			{#if userGroupRequests?.current && userGroupRequests.current.length > 0}
				<div class="card requests-card">
					<h2 class="card-title">Pending Invitations</h2>
					<p class="card-description">You have been invited to join the following groups:</p>
					<ul class="requests-list">
						{#each userGroupRequests.current as request}
							<li data-id={request.id} class="request-item">
								<div class="request-info">
									<span class="request-group">{request.groupName}</span>
									<span class="request-from">from {request.sentByEmail}</span>
								</div>
								<div class="request-actions">
									<button onclick={acceptRequest} class="accept-button">Accept</button>
									<button onclick={rejectRequest} class="reject-button">Decline</button>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{:else if group?.current[0]?.name && !showDeleteGroup}
			<!-- Group Member Card (Non-Admin) -->
			<div class="card group-member-card">
				<h2 class="card-title">Your Group</h2>
				<p class="card-description">You are a member of <strong>{group.current[0].name}</strong></p>
				<a
					href="/account/groups"
					class="primary-button"
					style="display: inline-block; text-decoration: none; text-align: center;"
				>
					View Group Details
				</a>
			</div>
		{/if}

		<!-- Group Admin Card -->
		{#if showDeleteGroup}
			<div class="card members-card">
				<div class="card-header">
					<h2 class="card-title">Group Members</h2>
					<a href="/account/groups" class="manage-group-link">Manage Group →</a>
				</div>
				<ul class="members-list">
					{#each allGroupMembers?.current ?? [] as member}
						<li class="member-item">
							<span class="member-avatar">{getName(member.userId).charAt(0).toUpperCase()}</span>
							<span class="member-name">{getName(member.userId)}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="card invite-card">
				<h2 class="card-title">Invite Members</h2>
				<p class="card-description">Invite others to join your group by email.</p>
				<form onsubmit={inviteMember} class="invite-form">
					<div class="input-group">
						<label for="email">Email Address</label>
						<input
							type="email"
							id="email"
							name="email"
							placeholder="colleague@example.com"
							required
						/>
					</div>
					<button class="primary-button" type="submit">Send Invitation</button>
				</form>
			</div>

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

		<!-- Logout Card -->
		<div class="card logout-card">
			<h2 class="card-title">Session</h2>
			<p class="card-description">Sign out of your account on this device.</p>
			<button onclick={handleLogout} class="logout-button">
				<LogoutIcon />
				<span>Logout</span>
			</button>
		</div>
	</div>
</div>

<SubscriptionUpgradeModal
	bind:show={showFamilyPaymentModal}
	planType="family"
	onClose={() => (showFamilyPaymentModal = false)}
	onConfirm={handleFamilyPaymentConfirm}
/>

<style>
	.account-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--textColor);
		margin-bottom: 2rem;
		text-align: center;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.card {
		background: var(--cardBg);
		border-radius: var(--borderRadius);
		padding: 1.5rem;
		box-shadow: var(--cardShadow);
		border: 1px solid var(--lineColor);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: var(--level-3);
	}

	.card-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--textColor);
		margin-bottom: 1rem;
	}

	.card-description {
		font-size: 0.95rem;
		color: var(--grey);
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	/* Subscription Card Styles */
	.subscription-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.current-tier {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--backgroundGrey);
		border-radius: 8px;
	}

	.tier-label {
		font-weight: 600;
		color: var(--grey);
		font-size: 0.95rem;
	}

	.tier-value {
		font-weight: 700;
		color: var(--textColor);
		font-size: 1.1rem;
	}

	.upgrade-prompt-text {
		margin: 0;
		color: var(--grey);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.upgrade-link-button {
		display: block;
		text-align: center;
		padding: 0.875rem 1.5rem;
		background: var(--primary);
		color: var(--buttonTextColor);
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
		box-shadow: var(--level-1);
	}

	.upgrade-link-button:hover {
		background: #e6c000;
		transform: translateY(-1px);
		box-shadow: var(--level-2);
	}

	.paid-tier-info {
		margin: 0;
		color: var(--grey);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.subscription-status {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--backgroundGrey);
		border-radius: 8px;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.status-badge.active {
		background: rgba(116, 200, 88, 0.15);
		color: var(--green);
		border: 1px solid rgba(116, 200, 88, 0.3);
	}

	.renewal-date {
		font-size: 0.9rem;
		color: var(--grey);
	}

	/* Access Code Card */
	.access-code-card {
		border: 2px solid #667eea;
		background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
	}

	.access-code-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.access-code-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.access-code-input-wrapper input {
		flex: 1;
		padding-right: 2.5rem;
	}

	.access-code-input-wrapper input.validated {
		border-color: var(--green);
		background: rgba(116, 200, 88, 0.05);
	}

	.access-code-input-wrapper input.error {
		border-color: var(--danger);
		background: rgba(202, 46, 85, 0.05);
	}

	.validation-spinner,
	.validation-check {
		position: absolute;
		right: 1rem;
		font-size: 1.2rem;
	}

	.validation-check {
		color: var(--green);
		font-weight: bold;
	}

	.validation-message {
		font-size: 0.85rem;
		margin-top: -0.25rem;
	}

	.validation-message.success {
		color: var(--green);
		font-weight: 600;
	}

	/* Profile Card */
	.profile-card {
		grid-column: span 1;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header .card-title {
		margin-bottom: 0;
	}

	.edit-button {
		padding: 0.5rem 1rem;
		background: var(--primary);
		color: var(--buttonTextColor);
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.edit-button:hover {
		background: #e6c000;
		transform: translateY(-1px);
	}

	.profile-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.profile-edit-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.secondary-button {
		flex: 1;
		padding: 0.875rem 1.5rem;
		background: var(--backgroundGrey);
		color: var(--textColor);
		border: 2px solid var(--lineColor);
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.secondary-button:hover {
		background: var(--lineColor);
		transform: translateY(-1px);
	}

	.secondary-button:active {
		transform: translateY(0);
	}

	.input-hint {
		font-size: 0.8rem;
		color: var(--grey);
		font-style: italic;
		margin-top: -0.25rem;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		margin-bottom: 1rem;
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

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--backgroundGrey);
		border-radius: 8px;
		transition: background 0.2s ease;
		gap: 1rem;
	}

	.info-row:hover {
		background: var(--lineColor);
	}

	.info-label {
		font-weight: 600;
		color: var(--grey);
		font-size: 0.9rem;
	}

	.info-value {
		font-weight: 500;
		color: var(--textColor);
	}

	.group-badge {
		background: var(--primary);
		color: var(--buttonTextColor);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.no-group {
		color: var(--grey);
		font-style: italic;
	}

	/* Forms */
	.group-form,
	.invite-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
		width: auto;
		margin-bottom: 0;
	}

	.input-group input {
		padding: 0.75rem 1rem;
		border: 2px solid var(--lineColor);
		border-radius: 8px;
		font-size: 1rem;
		transition: all 0.2s ease;
		font-family: var(--bodyFont);
	}

	.input-group input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(255, 212, 0, 0.1);
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
		transition: all 0.2s ease;
		box-shadow: var(--level-1);
	}

	.primary-button:hover {
		background: #e6c000;
		transform: translateY(-1px);
		box-shadow: var(--level-2);
	}

	.primary-button:active {
		transform: translateY(0);
	}

	.primary-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.primary-button:disabled:hover {
		background: var(--primary);
		transform: none;
	}

	/* Email verification badges */
	.info-value-wrapper {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.unverified-badge {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.3rem 0.6rem;
		border-radius: 12px;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		background: rgba(255, 152, 0, 0.15);
		color: #e67e00;
		border: 1px solid rgba(255, 152, 0, 0.3);
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* Verification Card */
	.verification-card {
		border: 2px solid rgba(255, 152, 0, 0.3);
		background: rgba(255, 152, 0, 0.05);
	}

	/* Requests List */
	.requests-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.request-item {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--backgroundGrey);
		border-radius: 8px;
		border: 1px solid var(--lineColor);
	}

	.request-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.request-group {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--textColor);
	}

	.request-from {
		font-size: 0.9rem;
		color: var(--grey);
	}

	.request-actions {
		display: flex;
		gap: 0.5rem;
	}

	.accept-button,
	.reject-button {
		flex: 1;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.accept-button {
		background: var(--green);
		color: white;
	}

	.accept-button:hover {
		background: #6bb44e;
		transform: translateY(-1px);
	}

	.reject-button {
		background: var(--lightGreyAlt);
		color: var(--textColor);
	}

	.reject-button:hover {
		background: var(--lineColor);
		transform: translateY(-1px);
	}

	/* Members List */
	.members-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.member-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--backgroundGrey);
		border-radius: 8px;
		transition: background 0.2s ease;
	}

	.member-item:hover {
		background: var(--lineColor);
	}

	.member-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--primary);
		color: var(--buttonTextColor);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.1rem;
	}

	.member-name {
		font-weight: 600;
		color: var(--textColor);
	}

	/* Danger Zone */
	.danger-card {
		border-color: rgba(202, 46, 85, 0.3);
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
		box-shadow: var(--level-1);
	}

	.danger-button:hover {
		background: #a02445;
		transform: translateY(-1px);
		box-shadow: var(--level-2);
	}

	.danger-button:active {
		transform: translateY(0);
	}

	/* Logout Card */
	.logout-card {
		background: var(--backgroundGrey);
	}

	.logout-button {
		width: 100%;
		padding: 0.875rem 1.5rem;
		background: #000;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: var(--level-1);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		--svg-fill: #fff;
	}

	.logout-button:hover {
		background: #333;
		transform: translateY(-1px);
		box-shadow: var(--level-2);
	}

	.logout-button:active {
		transform: translateY(0);
	}

	/* Group Management Link */
	.manage-group-link {
		color: var(--primary);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
		transition: color 0.2s;
		white-space: nowrap;
	}

	.manage-group-link:hover {
		color: #e6c000;
		text-decoration: underline;
	}

	.group-member-card {
		text-align: center;
	}

	.group-member-card .card-description {
		margin-bottom: 1.5rem;
	}

	.group-member-card strong {
		color: var(--primary);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.page-title {
			font-size: 2rem;
		}

		.cards-grid {
			grid-template-columns: 1fr;
		}

		.request-item {
			padding: 0.75rem;
		}

		.request-actions {
			flex-direction: column;
		}
	}
</style>
