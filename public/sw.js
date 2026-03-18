self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[SW] Push event received');

  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }

  let data;
  try {
    data = event.data.json();
    console.log('[SW] Push data parsed:', data);
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    console.log('[SW] Raw data text:', event.data.text());
    data = {
      title: 'VriendenschaarTraining',
      body: 'Je hebt een nieuwe melding',
    };
  }

  const options = {
    body: data.body || 'Geen bericht',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  console.log('[SW] Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notificatie', options)
      .then(() => console.log('[SW] Notification shown successfully'))
      .catch((err) => console.error('[SW] Failed to show notification:', err))
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
