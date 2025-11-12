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
	let validatedGroupId = $state('');
	let validationTimeout: ReturnType<typeof setTimeout> | null = null;

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

	// Get all member IDs from the group
	let groupMemberIds = $derived(allGroupMembers?.current?.map((member) => member.userId) ?? []);

	// Group-wide stats - get all items where viewMode is 'shared'
	// This represents items visible to the entire group
	let groupShoppingList = $derived(
		z && z.current && groupId
			? new Query(z.current.query.shoppingList.where('viewMode', 'shared'))
			: null
	);
	let groupEvents = $derived(
		z && z.current && groupId ? new Query(z.current.query.events.where('viewMode', 'shared')) : null
	);

	// User-specific queries (keep for other uses if needed)
	let allShoppingList = $derived(
		z && z.current ? new Query(z.current.query.shoppingList.where('assignedToId', userId)) : null
	);
	let allEvents = $derived(
		z && z.current ? new Query(z.current.query.events.where('assignedToId', userId)) : null
	);
	const userData = $derived(user?.current?.[0]);
	const cancelAtPeriodEnd = $derived(userData?.cancel_at_period_end);

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
		// Individual groups have no member limit (null), Family groups limited to 6
		const maxMembers = currentTier === 'family' ? 6 : null;

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

			// Update user's active group only
			// Note: Subscription tier is completely decoupled from groups
			// Users keep their paid subscription even after deleting a group
			z?.current.mutate.user.update({
				id: userId,
				active_group_id: null
				// DO NOT change subscription_tier - it's independent of group membership
			});
		}
	}
	function inviteMember(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const email = form.email.value;

		if (!email || !group?.current[0]) return;

		// Check if group is at capacity (only applies to groups with maxMembers set, like family groups)
		const currentGroup = group.current[0];
		if (currentGroup.maxMembers !== null) {
			const currentMemberCount = allGroupMembers?.current?.length ?? 0;
			// Account for the pending invitation (+1)
			if (currentMemberCount >= currentGroup.maxMembers) {
				alert(
					`This group is at full capacity (${currentGroup.maxMembers} members). Remove a member before inviting new ones.`
				);
				return;
			}
		}

		// Check if the invited user exists and has a paid subscription
		const invitedUser = z?.current
			? new Query(z.current.query.user.where('email', email)).current[0]
			: null;

		// Only paid users (individual or family tier) can be invited to groups
		if (invitedUser) {
			const tier = invitedUser.subscription_tier;
			if (tier !== 'individual' && tier !== 'family') {
				alert(
					'Only paid users can be invited to groups. The invited user must upgrade to an Individual ($5/mo) or Family plan first.'
				);
				return;
			}
		} else {
			// User doesn't exist yet - they'll need to sign up with a paid plan
			// We can still send the invite, but they'll need to upgrade when accepting
			console.log('Inviting non-existent user:', email, '- they must sign up with a paid plan');
		}

		const id = nanoid();
		z?.current.mutate.userGroupRequests.insert({
			id,
			email: email,
			userGroupId: group.current[0].id,
			status: false,
			sentByEmail: userEmail,
			groupName: group.current[0].name
		});

		form.reset();
	}
	function acceptRequest(event: Event) {
		event.preventDefault();

		// Check if user has a paid subscription before accepting
		const currentTier = user?.current?.[0]?.subscription_tier;
		if (currentTier !== 'individual' && currentTier !== 'family') {
			alert(
				'You must have a paid subscription (Individual $5/mo or Family plan) to join a group. Please upgrade your account first.'
			);
			return;
		}

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

	async function handleLogoutAllDevices() {
		if (
			!confirm(
				'This will sign you out of all other devices and browsers. Your current session will remain active. Continue?'
			)
		) {
			return;
		}

		try {
			// Use Better Auth's built-in revokeOtherSessions
			await authClient.revokeOtherSessions();
			alert('Successfully logged out of all other devices.');
		} catch (error) {
			console.error('Logout all devices failed:', error);
			alert('An error occurred. Please try again.');
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

	function validateAccessCode() {
		// Clear any existing timeout
		if (validationTimeout) {
			clearTimeout(validationTimeout);
		}

		// Reset validation state immediately if input is empty
		if (!accessCodeInput.trim()) {
			accessCodeError = '';
			accessCodeSuccess = '';
			validatedAccessCodeId = '';
			validatedGroupName = '';
			validatedGroupId = '';
			return;
		}

		// Debounce validation - wait 500ms after user stops typing
		validationTimeout = setTimeout(() => {
			performValidation();
		}, 500);
	}

	async function performValidation() {
		accessCodeError = '';
		accessCodeSuccess = '';
		validatedAccessCodeId = '';
		validatedGroupName = '';
		validatedGroupId = '';

		if (!accessCodeInput.trim()) {
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

			// Parse the data if it's a string
			let data = result.data;
			if (typeof data === 'string') {
				try {
					data = JSON.parse(data);
				} catch (e) {
					console.error('Failed to parse data:', e);
				}
			}

			// Handle array response format from SvelteKit
			if (Array.isArray(data)) {
				// data[1] = success (boolean), data[2] = accessCodeId, data[3] = groupName, data[5] = groupId
				if (data[1] === true) {
					accessCodeSuccess = `✓ Valid code! Group: ${data[3]}`;
					validatedAccessCodeId = data[2];
					validatedGroupName = data[3];
					validatedGroupId = data[5];
				} else {
					accessCodeError = 'Invalid access code';
				}
			} else if (result.type === 'success' && data?.success) {
				accessCodeSuccess = `✓ Valid code! Group: ${data.groupName}`;
				validatedAccessCodeId = data.accessCodeId;
				validatedGroupName = data.groupName;
				validatedGroupId = data.groupId;
			} else if (result.type === 'failure') {
				accessCodeError = data?.error || 'Invalid access code';
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

			// Parse the data if it's a string
			let data = result.data;
			if (typeof data === 'string') {
				try {
					data = JSON.parse(data);
				} catch (e) {
					console.error('Failed to parse join data:', e);
				}
			}

			// Handle array response format
			let success = false;
			let newGroupId = '';
			let message = '';

			if (Array.isArray(data)) {
				// Array format: [0: metadata, 1: success, 2: message, 3: groupId, 4: groupName]
				success = data[1] === true;
				message = data[2];
				newGroupId = data[3];
			} else if (data?.success) {
				success = true;
				newGroupId = data.groupId;
				message = data.message;
			}

			if (result.type === 'success' && success) {
				// Update Zero cache directly with the new group membership

				// Query the group to get creator info
				const targetGroup = z?.current
					? new Query(z.current.query.userGroups.where('id', newGroupId)).current[0]
					: null;

				const creatorId = targetGroup?.createdById || userId;

				// Add user to group in Zero
				z?.current.mutate.userGroupMembers.insert({
					id: nanoid(),
					userId: userId,
					userGroupId: newGroupId,
					userGroupCreatorId: creatorId,
					isAdmin: false,
					joinedAt: Date.now()
				});

				// Update user's active group in Zero
				z?.current.mutate.user.update({
					id: userId,
					active_group_id: newGroupId
				});

				accessCodeSuccess = message || 'Successfully joined group!';
				accessCodeInput = '';
				validatedAccessCodeId = '';
				validatedGroupName = '';
				validatedGroupId = '';

				// Refresh the page to show new group
				await invalidateAll();

				// Clear success message after a delay
				setTimeout(() => {
					accessCodeSuccess = '';
				}, 5000);
			} else if (result.type === 'failure') {
				console.error('❌ Join failed:', data);
				// Handle array format for errors too
				const errorMsg = Array.isArray(data) ? data[1] : data?.error || 'Failed to join group';
				accessCodeError = errorMsg;
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
					{#if user?.current[0]?.subscription_status === 'active' && !cancelAtPeriodEnd}
						<div class="subscription-status">
							<span class="status-badge active">Active</span>
							{#if user?.current[0]?.current_period_end}
								<span class="renewal-date">
									Renews {new Date(user.current[0].current_period_end).toLocaleDateString()}
								</span>
							{/if}
						</div>
					{:else if user?.current[0]?.subscription_status === 'canceling' || cancelAtPeriodEnd}
						<div class="subscription-status">
							<span
								class="status-badge canceling"
								style="background:rgba(255,212,0,0.15);color:#e6c000;border:1px solid rgba(255,212,0,0.3);"
								>Canceling</span
							>
							{#if user?.current[0]?.current_period_end}
								<span class="renewal-date">
									Ends {new Date(user.current[0].current_period_end).toLocaleDateString()}
								</span>
							{/if}
						</div>
					{:else}
						<div class="subscription-status">
							<span
								class="status-badge"
								style="background:var(--backgroundGrey);color:var(--grey);border:1px solid var(--lineColor);"
								>Inactive</span
							>
							{#if user?.current[0]?.current_period_end}
								<span class="renewal-date">
									Ends {new Date(user.current[0].current_period_end).toLocaleDateString()}
								</span>
							{/if}
						</div>
					{/if}
					<div class="subscription-actions">
						<a href="/account/subscription" class="secondary-button">Manage Subscription</a>
						{#if user?.current[0]?.subscription_tier === 'individual'}
							<a href="/account/upgrade?from=individual" class="upgrade-link-button">
								Upgrade to Family
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Access Code Card (for users not in a group) -->
		{#if !groupId || groupId === '' || groupId === userId}
			<div class="card access-code-card">
				<h2 class="card-title">Join with Access Code</h2>
				<p class="card-description">
					{#if user?.current[0]?.subscription_tier === 'free' || !user?.current[0]?.subscription_tier}
						Have an access code from a family group? Enter it below to join for free!
					{:else}
						Have an access code? Enter it below to join a group.
					{/if}
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
								oninput={validateAccessCode}
								onpaste={validateAccessCode}
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
					{#if user?.current[0]?.subscription_tier !== 'individual' && user?.current[0]?.subscription_tier !== 'family'}
						<div class="info-banner">
							<strong>Upgrade Required:</strong> You must have an Individual ($5/mo) or Family plan to
							accept group invitations.
						</div>
					{/if}
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

		<!-- Group Stats Card (Admin View) -->
		{#if showDeleteGroup}
			<div class="card group-stats-card">
				<div class="card-header">
					<h2 class="card-title">Group Statistics</h2>
					<a href="/account/groups" class="manage-group-link">Manage Group →</a>
				</div>
				<p class="card-description">Overview of your group's activity and members.</p>
				<div class="stats-grid">
					<div class="stat-box">
						<div class="stat-info">
							<span class="stat-number">{allGroupMembers?.current?.length ?? 0}</span>
							<span class="stat-label">Members</span>
						</div>
					</div>
					<!-- <div class="stat-box">
						<div class="stat-info">
							<span class="stat-number">{groupEvents?.current?.length ?? 0}</span>
							<span class="stat-label">Events</span>
						</div>
					</div>
					<div class="stat-box">
						<div class="stat-info">
							<span class="stat-number">{groupShoppingList?.current?.length ?? 0}</span>
							<span class="stat-label">Shopping Items</span>
						</div>
					</div> -->
				</div>
			</div>
		{/if}

		<!-- Notifications Card -->
		<div class="card notifications-card">
			<h2 class="card-title">📧 Notifications</h2>
			<p class="card-description">
				Manage your email notification preferences and scheduled digests.
			</p>
			<a
				href="/account/notifications"
				class="primary-button"
				style="display: block; text-align: center; text-decoration: none;"
			>
				Notification Settings
			</a>
		</div>

		<!-- Session Card -->
		<div class="card session-card">
			<h2 class="card-title">Session</h2>
			<p class="card-description">Manage your active sessions and devices.</p>
			<div class="session-actions">
				<button onclick={handleLogout} class="logout-button">
					<LogoutIcon />
					<span>Logout This Device</span>
				</button>
				<button onclick={handleLogoutAllDevices} class="logout-all-button">
					<span>🔒</span>
					<span>Logout All Devices</span>
				</button>
			</div>
		</div>

		<!-- Admin Card (only shown to superadmins) -->
		{#if data?.isSuperadmin}
			<div class="card admin-card">
				<h2 class="card-title">⚡ Admin Panel</h2>
				<p class="card-description">Access administrative features and system management tools.</p>
				<a
					href="/admin"
					class="admin-button"
					style="display: block; text-align: center; text-decoration: none;"
				>
					Open Admin Panel
				</a>
			</div>
		{/if}
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
	.group-form {
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

	/* Session Card */
	.session-card {
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

	/* Group Stats Card */
	.group-stats-card {
		grid-column: span 1;
	}

	.stats-grid {
		display: grid;
		/* grid-template-columns: repeat(3, 1fr); */
		gap: 1rem;
		margin-top: 1rem;
	}

	.stat-box {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem 1rem;
		background: var(--backgroundGrey);
		border-radius: 8px;
		transition: all 0.2s;
		border: 1px solid transparent;
	}

	.stat-box:hover {
		transform: translateY(-2px);
		border-color: var(--primary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: var(--textColor);
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--grey);
		font-weight: 500;
	}

	/* Session Actions */
	.session-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.logout-all-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background: var(--backgroundGrey);
		color: var(--textColor);
		border: 1px solid var(--lineColor);
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
	}

	.logout-all-button:hover {
		background: var(--level-2);
		border-color: var(--danger);
		color: var(--danger);
	}

	.logout-all-button span:first-child {
		font-size: 1.2rem;
	}

	/* Admin Card */
	.admin-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		color: white;
	}

	.admin-card .card-title {
		color: white;
	}

	.admin-card .card-description {
		color: rgba(255, 255, 255, 0.9);
	}

	.admin-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
	}

	.admin-button {
		padding: 0.875rem 1.5rem;
		background: white;
		color: #667eea;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.admin-button:hover {
		background: #f8f9ff;
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}

	/* Subscription Actions */
	.subscription-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.secondary-button {
		display: inline-block;
		text-align: center;
		padding: 0.875rem 1.5rem;
		background: var(--backgroundGrey);
		color: var(--textColor);
		border: 1px solid var(--lineColor);
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.secondary-button:hover {
		background: var(--level-2);
		border-color: var(--primary);
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

		.stats-grid {
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
