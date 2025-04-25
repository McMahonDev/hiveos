<script lang="ts">
	import { nanoid } from 'nanoid';
	import { Query } from 'zero-svelte';

	const { data } = $props();
	const z = data.z;

	let groupId = $state(data.groupid) as string;
	let userId = $state(data.id);
	let group = $state(new Query(z.current.query.userGroups.where('id', groupId)));

	const user = new Query(z.current.query.users.where('id', userId));
	const userGroupMembers = new Query(z.current.query.userGroupMembers.where('userId', userId));

	$effect(() => {
		group = new Query(z.current.query.userGroups.where('id', groupId));
	});

	let groupName = $derived(group.current[0]?.name ?? 'No group found');
	let showDeleteGroup = $derived(group.current[0]?.name ? true : false);

	function createGroup(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const name = form.groupName.value;
		console.log(name);
		if (name) {
			const id = nanoid();
			z.current.mutate.userGroups.insert({
				id,
				name: name,
				createdById: userId
			});
			z.current.mutate.userGroupMembers.insert({
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
			z.current.mutate.userGroups.delete({ id: group.current[0]?.id });
			z.current.mutate.userGroupMembers.delete({ id: userGroupMembers.current[0]?.id });
		}
	}
</script>

<div class="container">
	<h1>Your details</h1>
	<div class="details">
		<p><strong>Name:</strong> {user.current[0]?.name}</p>
		<p><strong>Email:</strong> {user.current[0]?.email}</p>
		<p><strong>Group:</strong> {groupName}</p>
		{#if !group.current[0]?.name}
			<form onsubmit={createGroup}>
				<input type="text" name="groupName" placeholder="Group Name" />
				<button class="" type="submit">Generate Group</button>
			</form>
		{/if}
		{#if showDeleteGroup}
			<form onsubmit={deleteGroup}>
				<button class="" type="submit">Delete Group</button>
			</form>
		{/if}
	</div>
</div>
