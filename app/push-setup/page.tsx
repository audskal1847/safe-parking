'use client';

import { useState } from 'react';

export default function PushSetupPage() {
const [status, setStatus] = useState(
'아래 버튼을 눌러 차량 알림을 허용해 주세요.'
);
const [loading, setLoading] = useState(false);
const [done, setDone] = useState(false);

async function setupPush() {
if (loading) return;

setLoading(true);
setStatus('알림 설정을 준비하고 있습니다...');

try {
  if (!('serviceWorker' in navigator)) {
    setStatus(
      '이 휴대폰에서는 알림 기능을 사용할 수 없습니다.'
    );
    return;
  }

  if (!('PushManager' in window)) {
    setStatus(
      '이 브라우저에서는 알림 기능을 사용할 수 없습니다.'
    );
    return;
  }

  const qrToken =
    new URLSearchParams(window.location.search).get('qrToken');

  if (!qrToken) {
    setStatus('차량 정보를 찾을 수 없습니다.');
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    setStatus(
      '알림 권한이 허용되지 않았습니다. iPhone의 알림 설정을 확인해 주세요.'
    );
    return;
  }

  setStatus('알림 기능을 등록하고 있습니다...');

  const registration =
    await navigator.serviceWorker.register(
      '/service-worker.js'
    );

  await navigator.serviceWorker.ready;

  const keyResponse =
    await fetch('/api/push/public-key');

  const keyData = await keyResponse.json();

  if (!keyData.publicKey) {
    setStatus(
      '알림 설정 정보를 가져오지 못했습니다.'
    );
    return;
  }

  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(
            keyData.publicKey
          ),
      });
  }

  const subscriptionJson =
    subscription.toJSON();

  const response = await fetch(
    '/api/push/subscribe',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrToken,
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh:
            subscriptionJson.keys?.p256dh,
          auth:
            subscriptionJson.keys?.auth,
        },
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    setStatus(
      result.error ||
        '알림 등록에 실패했습니다.'
    );
    return;
  }

  setDone(true);
  setStatus(
    '알림 설정이 완료되었습니다! 이제 차량 호출 알림을 받을 수 있습니다.'
  );
} catch (error) {
  console.error(
    'Push setup error:',
    error
  );

  setStatus(
    '알림 설정 중 오류가 발생했습니다.'
  );
} finally {
  setLoading(false);
}

}

function urlBase64ToUint8Array(
base64String: string
) {
const padding =
'='.repeat(
(4 - (base64String.length % 4)) % 4
);

const base64 =
  (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

const rawData =
  window.atob(base64);

return Uint8Array.from(
  [...rawData].map((char) =>
    char.charCodeAt(0)
  )
);

}

return (
<main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
<div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
<div className="text-5xl mb-5">
{done ? '✅' : '🔔'}
</div>

    <h1 className="text-2xl font-bold text-slate-800 mb-4">
      안심주차 알림 설정
    </h1>

    <p className="text-slate-600 leading-7 mb-6">
      {status}
    </p>

    {!done && (
      <button
        type="button"
        onClick={setupPush}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-4 px-4 rounded-2xl"
      >
        {loading
          ? '알림 설정 중...'
          : '🔔 알림 허용하기'}
      </button>
    )}

    {done && (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-700 font-medium">
        차량 이동 요청 알림을 받을 준비가 완료되었습니다.
      </div>
    )}
  </div>
</main>

);
}