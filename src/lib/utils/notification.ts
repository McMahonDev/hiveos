export function notifyContentChange(
	title = 'Content Updated!',
	body = 'There is new content available.'
) {
	console.log('[notifyContentChange] called', { title, body });
	if ('Notification' in window && Notification.permission === 'granted') {
		// Try service worker notification first
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready
				.then((reg) => {
					reg.showNotification(title, {
						body,
						icon: '/favicon.png',
						badge: '/favicon.png'
					});
				})
				.catch((err) => {
					console.warn('[notifyContentChange] Service worker not ready', err);
					// Fallback to Notification API
					new Notification(title, {
						body,
						icon: '/favicon.png',
						badge: '/favicon.png'
					});
				});
		} else {
			// Fallback to Notification API
			new Notification(title, {
				body,
				icon: '/favicon.png',
				badge: '/favicon.png'
			});
		}
	} else {
		console.warn('[notifyContentChange] Notification permission not granted or not supported');
	}
}
