export const load = async ({ params, parent }) => {
	const listId = params['id'];
	return { listId };
};
