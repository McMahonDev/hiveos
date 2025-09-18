

export const load = (async ({ params, parent }) => {
    const listId = params['id'];
    console.log("Custom List ID:", listId);
    return { listId };
});