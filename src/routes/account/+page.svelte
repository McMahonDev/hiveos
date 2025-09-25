<script lang="ts">
	import { nanoid } from 'nanoid';
	import { Query } from 'zero-svelte';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();
	const z = data.z;
	let userId = $derived(data.id);

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
</script>

<div class="container">
	<h1>Your details</h1>

	<div class="details">
		<p><strong>Name:</strong> {user?.current[0]?.name}</p>
		<p><strong>Email:</strong> {user?.current[0]?.email}</p>
		<p>
			<strong>Group:</strong>{#if group.current[0]?.name}{group.current[0]?.name}{:else}No group
				found{/if}
		</p>
		{#if !group.current[0]?.name}
			<form onsubmit={createGroup}>
				<input type="text" name="groupName" placeholder="Group Name" />
				<button class="" type="submit">Generate Group</button>
			</form>
			{#if userGroupRequests.current.length > 0}
				<p>Pending Requests</p>
				<ul>
					{#each userGroupRequests.current as request}
						<li data-id={request.id}>
							Group:{request.groupName} from {request.sentByEmail}
							<button onclick={acceptRequest}>Accept</button>
							<button onclick={rejectRequest}>Reject</button>
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
		{#if showDeleteGroup}
			<form onsubmit={deleteGroup}>
				<button class="" type="submit">Delete Group</button>
			</form>

			<div>
				<div>
					<p>All members:</p>
					<ul>
						{#each allGroupMembers.current as member}
							<li>{getName(member.userId)}</li>
						{/each}
					</ul>
				</div>
				<div>
					<p>Invite Members:</p>

					<form onsubmit={inviteMember}>
						<input type="email" name="email" placeholder="Email" />
						<button class="" type="submit">Invite Member</button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
