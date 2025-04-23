<script lang="ts">
	import { nanoid } from 'nanoid';
	import { Query } from 'zero-svelte';

	const { data } = $props();
	const z = data.z;

	let groupId = $state(data.groupid);
	$inspect('groupId', groupId);

	const user = new Query(z.current.query.users.where('id', data.id));
	const userData = user.current[0];
	$inspect('userData', userData);

	const userGroupMembers = new Query(z.current.query.userGroupMembers.where('userId', data.id));

	const group = new Query(z.current.query.userGroups.where('id', groupId));

	// $inspect('group', group.current[0]);
	// $inspect(userGroup);

	function createGroup(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const groupName = form.groupName.value;
		console.log(groupName);
		if (groupName) {
			const id = nanoid();
			z.current.mutate.userGroups.insert({
				id,
				name: groupName,
				createdById: data.id
			});
			z.current.mutate.userGroupMembers.insert({
				id: nanoid(),
				userId: data.id,
				userGroupId: id
			});
			console.log('Group created', id);
			// group.current = new Query(z.current.query.userGroups.where('id', id));
			groupId = id;
		}
		console.log('Group created');
	}
	function deleteGroup(event: Event) {
		event.preventDefault();
		if (group.current[0]?.id) {
			z.current.mutate.userGroups.delete({ id: group.current[0]?.id });
			z.current.mutate.userGroupMembers.delete({ id: userGroupMembers.current[0]?.id });
		}
	}
</script>

<div class="container">
	<h1>Your details</h1>
	<div class="details">
		<p><strong>Name:</strong> {userData.name}</p>
		<p><strong>Email:</strong> {userData.email}</p>
		<p>
			<strong>Group:</strong>

			{#if group.current[0]?.name}
				{group.current[0]?.name}
			{:else}
				No group found
			{/if}
		</p>
		{#if !group.current[0]?.name}
			<form onsubmit={createGroup}>
				<input type="text" name="groupName" placeholder="Group Name" />
				<button class="" type="submit">Generate Group</button>
			</form>
		{/if}
		{#if group.current[0]?.name}
			<form onsubmit={deleteGroup}>
				<button class="" type="submit">Delete Group</button>
			</form>
		{/if}
	</div>
</div>
