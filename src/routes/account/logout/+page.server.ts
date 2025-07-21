// This server-side logout is no longer needed since we handle logout client-side
// The logout functionality is now handled by the handleLogout function in +layout.svelte

export async function load() {
	// Return empty object - logout is handled client-side
	return {};
}
