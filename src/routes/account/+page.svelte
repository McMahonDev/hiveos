<script lang="ts">
	import { nanoid } from 'nanoid';
	import { Query } from 'zero-svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import LogoutIcon from '$lib/static/icons/logoutIcon.svelte';

	const { data } = $props();
	const z = data.z;
	let userId = $derived(data.id);

	let isEditingProfile = $state(false);
	let editName = $state('');
	let editEmail = $state('');
	let updateMessage = $state('');
	let updateError = $state('');
	let verificationMessage = $state('');
	let verificationError = $state('');
	let isSendingVerification = $state(false);

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
		if (name) {
			const id = nanoid();
			z?.current.mutate.userGroups.insert({
				id,
				name: name,
				createdById: userId
			});
			z?.current.mutate.userGroupMembers.insert({
				id: nanoid(),
				userId: userId,
				userGroupId: id,
				userGroupCreatorId: userId
			});
			groupId = id;

			form.reset();

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
	}
	function deleteGroup(event: Event) {
		event.preventDefault();
		if (group?.current[0]?.id) {
			z?.current.mutate.userGroups.delete({ id: group.current[0]?.id });
			const memberId = userGroupMembers?.current[0]?.id;
			if (memberId) {
				z?.current.mutate.userGroupMembers.delete({ id: memberId });
			}
		}
	}
	function inviteMember(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const email = form.email.value;
		if (email) {
			const id = nanoid();
			z?.current.mutate.userGroupRequests.insert({
				id,
				email: email,
				userGroupId: group.current[0]?.id,
				status: false,
				sentByEmail: userEmail,
				groupName: group.current[0]?.name
			});
		}
		form.reset();
	}
	function acceptRequest(event: Event) {
		event.preventDefault();
		const requestId = event?.target?.closest('li').dataset.id;
		if (requestId && userGroupRequests && userGroupRequests.current) {
			const request = userGroupRequests.current.find((r) => r.id === requestId);
			if (request) {
				z?.current.mutate.userGroupMembers.insert({
					id: nanoid(),
					userId: userId,
					userGroupId: request.userGroupId,
					userGroupCreatorId: group?.current?.[0]?.createdById ?? ''
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
		const requestId = event?.target?.closest('li').dataset.id;
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
						<div class="email-with-badge">
							<span class="info-value">{user?.current[0]?.email ?? 'Loading...'}</span>
							{#if user?.current[0]?.email_verified}
								<span class="verified-badge" title="Email verified">✓ Verified</span>
							{:else}
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
			<div class="card group-card">
				<h2 class="card-title">Create a Group</h2>
				<p class="card-description">Groups allow you to share tasks and collaborate with others.</p>
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
		{/if}

		<!-- Group Admin Card -->
		{#if showDeleteGroup}
			<div class="card members-card">
				<h2 class="card-title">Group Members</h2>
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
	.email-with-badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.verified-badge,
	.unverified-badge {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.25rem 0.625rem;
		border-radius: 12px;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		letter-spacing: 0.02em;
	}

	.verified-badge {
		background: rgba(116, 200, 88, 0.15);
		color: var(--green);
		border: 1px solid rgba(116, 200, 88, 0.3);
	}

	.unverified-badge {
		background: rgba(255, 152, 0, 0.15);
		color: #ff9800;
		border: 1px solid rgba(255, 152, 0, 0.3);
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
