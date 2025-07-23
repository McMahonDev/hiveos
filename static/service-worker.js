self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});

// Listen for push events
self.addEventListener('push', function (event) {
	const data = event.data ? event.data.json() : {};
	const title = data.title || 'Content Updated!';
	const options = {
		body: data.body || 'There is new content available.',
		icon: '/favicon.png',
		badge: '/favicon.png'
	};
	event.waitUntil(self.registration.showNotification(title, options));
});
