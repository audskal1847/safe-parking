self.addEventListener('push', function (event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: '안심주차 알림',
      body: '차량에 연락이 왔습니다.'
    };
  }

  const title = data.title || '🚗 안심주차 알림';

  const options = {
    body: data.body || '차량에 연락이 왔습니다.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/'
    },
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.openWindow(url)
  );
});