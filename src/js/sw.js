import { cleanupOutdatedCaches, precacheAndRoute, matchPrecache } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST || []);

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      const networkResponse = await fetch(event.request);
      return networkResponse;
    } catch (error) {
      console.warn('SW: Navigasi jaringan gagal, menyajikan halaman offline.html.', event.request.url, error);
      const offlinePage = await matchPrecache('/offline.html');
      return offlinePage || Response.error();
    }
  }
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 30 }),
    ],
  })
);
registerRoute(
  ({url}) => url.origin === 'https://unpkg.com' || url.origin === 'https://cdnjs.cloudflare.com',
  new CacheFirst({
    cacheName: 'external-cdn-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

registerRoute(
  ({ request, url }) => request.destination === 'image' ||
                       url.hostname.includes('tile.openstreetmap.org') ||
                       url.hostname.includes('api.maptiler.com'),
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

registerRoute(
    ({ url, request }) => url.hostname === 'story-api.dicoding.dev' && request.method === 'GET',
    new NetworkFirst({
        cacheName: 'story-api-cache',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
        ],
         networkTimeoutSeconds: 10,
    })
);


self.addEventListener('push', (event) => {
    console.log('SW: Push Received. Data:', event.data);
    let notificationPayload = {
        title: 'Story App Notification',
        options: {
            body: 'You have a new message!',
            icon: 'assets/images/icons/icon-192x192.png',
            badge: 'assets/images/icons/icon-96x96.png',
            data: { url: '/index.html#/home' }
        }
    };
    try {
        if (event.data) {
            const parsedData = event.data.json();
            notificationPayload.title = parsedData.title || notificationPayload.title;
            if (parsedData.options) {
                notificationPayload.options.body = parsedData.options.body || notificationPayload.options.body;
                notificationPayload.options.icon = parsedData.options.icon || notificationPayload.options.icon;
                notificationPayload.options.badge = parsedData.options.badge || notificationPayload.options.badge;
                notificationPayload.options.data = parsedData.options.data || notificationPayload.options.data;
            } else {
                notificationPayload.options.body = parsedData.body || notificationPayload.options.body;
                notificationPayload.options.icon = parsedData.icon || notificationPayload.options.icon;
                notificationPayload.options.badge = parsedData.badge || notificationPayload.options.badge;
                if (parsedData.url) notificationPayload.options.data = { url: parsedData.url };
            }
        }
    } catch (e) {
        console.warn('SW: Error parsing push data as JSON. Using as text for body.', e.message);
        if (event.data) notificationPayload.options.body = event.data.text();
    }
    const finalNotificationOptions = {
        body: notificationPayload.options.body,
        icon: notificationPayload.options.icon,
        badge: notificationPayload.options.badge,
        data: notificationPayload.options.data,
    };
    event.waitUntil(
        self.registration.showNotification(notificationPayload.title, finalNotificationOptions)
            .then(() => console.log('SW: Notification shown successfully.'))
            .catch(err => console.error('SW: Error showing notification:', err))
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification click Received.');
    event.notification.close();
    const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/index.html';
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            const targetBaseUrl = new URL(urlToOpen, self.location.origin).pathname;
            for (const client of clientList) {
                const clientBaseUrl = new URL(client.url, self.location.origin).pathname;
                if (clientBaseUrl === targetBaseUrl && 'focus' in client) {
                    return client.focus().then(focusedClient => {
                        if (focusedClient && focusedClient.navigate) return focusedClient.navigate(urlToOpen);
                        return focusedClient;
                    });
                }
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        }).catch(err => console.error('Error handling notification click:', err))
    );
});

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });


setCatchHandler(async ({ event }) => {
  if (event.request.mode === 'navigate') {
    console.warn(`SW Catch handler: Navigasi gagal (lagi?) untuk ${event.request.url}, menyajikan halaman offline.`);
    const offlinePage = await matchPrecache('/offline.html');
    return offlinePage || Response.error();
  }
  return Response.error();
});