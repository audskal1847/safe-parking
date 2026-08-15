self.addEventListener('push', function (event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: '🚗 안심 주차 알림',
      body: event.data
        ? event.data.text()
        : '새로운 알림이 도착했습니다.',
      url: '/dashboard'
    };
  }

  const title =
    data.title || '🚗 안심 주차 알림';

  const options = {
    body:
      data.body || '새로운 알림이 도착했습니다.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard'
    },
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

self.addEventListener(
  'notificationclick',
  function (event) {
    event.notification.close();

    const url =
      event.notification.data?.url ||
      '/dashboard';

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function (clientList) {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
);