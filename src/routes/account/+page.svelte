<script lang="ts">
	import { nanoid } from 'nanoid';
	import { Query } from 'zero-svelte';

	const { data } = $props();
	const z = data.z;

	let groupId = data.groupId;
	let userId = data.id;

	let group = new Query(z?.current.query.userGroups.where('id', groupId));
	const user = new Query(z?.current.query.user.where('id', userId));

	const email = $derived(user.current[0]?.email ?? '');
	let userGroupMembers = new Query(z?.current.query.userGroupMembers.where('userGroupId', groupId));

	// recreate the query whenever `email` changes to keep it in sync

	let userGroupRequests = new Query(z?.current.query.userGroupRequests.where('email', email));

	// let groupName = $derived(group.current[0]?.name ?? 'No group found');
	let showDeleteGroup = $derived(
		group.current[0]?.name && group.current[0]?.createdById === userId ? true : false
	);

	function createGroup(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const name = form.groupName.value;
		console.log(name);
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
				userGroupId: id
			});
			groupId = id;
		}
	}
	function deleteGroup(event: Event) {
		event.preventDefault();
		if (group.current[0]?.id) {
			z?.current.mutate.userGroups.delete({ id: group.current[0]?.id });
			z?.current.mutate.userGroupMembers.delete({ id: userGroupMembers.current[0]?.id });
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
				sentByEmail: email,
				groupName: group.current[0]?.name
			});
		}
	}
	function acceptRequest(event: Event) {
		event.preventDefault();
		const requestId = event?.target?.closest('li').dataset.id;
		console.log(requestId);
		if (requestId) {
			const request = userGroupRequests.current.find((r) => r.id === requestId);
			if (request) {
				z?.current.mutate.userGroupMembers.upsert({
					id: nanoid(),
					userId: userId,
					userGroupId: request.userGroupId
				});
				z?.current.mutate.userGroupRequests.delete({
					id: requestId
				});
			}
		}
	}
	function rejectRequest(event: Event) {
		event.preventDefault();
		const requestId = event?.target?.closest('li').dataset.id;
		if (requestId) {
			z?.current.mutate.userGroupRequests.delete({ id: requestId });
		}
	}

	function getName(id: string) {
		const name = new Query(z?.current.query.user.where('id', id)).current[0]?.name;
		return name ? name : id;
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
						{#each userGroupMembers.current as member}
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
