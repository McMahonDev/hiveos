export const user = $state({
	auth: false,
	isLoggedIn: false,
	userID: '',
	email: '',
	groupId: '' // Will be set to userId when user logs in
});
