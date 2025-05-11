import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);


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
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

registerRoute(
    ({ url, request }) => url.hostname === 'story-api.dicoding.dev' && request.method === 'GET',
    new NetworkFirst({
        cacheName: 'story-api-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60,
            }),
        ],
         networkTimeoutSeconds: 10,
    })
);

self.addEventListener('fetch', (event) => {
});


self.addEventListener('push', (event) => {
    console.log('Service Worker: Push Received.');
    const pushData = event.data.json();
    const title = pushData.title || 'Story App Notification';
    const options = {
        body: pushData.body || 'Something new happened!',
        icon: pushData.icon || 'assets/images/icons/icon-192x192.png',
        badge: pushData.badge || 'assets/images/icons/icon-96x96.png',
        data: { url: pushData.url || '/index.html#/home' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification click Received.');
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/index.html';
    event.waitUntil(
        clients.matchAll({ type: "window" }).then((clientList) => {
            for (const client of clientList) {
                 const clientBaseUrl = client.url.split('#')[0];
                 const targetBaseUrl = urlToOpen.split('#')[0];
                 if (clientBaseUrl === targetBaseUrl && 'focus' in client) {
                    return client.focus().then(focusedClient => {
                        if (focusedClient && focusedClient.navigate) {
                            return focusedClient.navigate(urlToOpen);
                        }
                        return focusedClient;
                    });
                 }
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});

self.addEventListener('install', () => {
  console.log('Service Worker: Installing (Workbox)...');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service Worker: Activating (Workbox)...');
  self.clients.claim();
});
