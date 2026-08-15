'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function ScanPage() {
  const params = useParams();
  const token = params?.token as string;

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const [customMsg, setCustomMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const sendNotification = async (
    type: 'MOVE' | 'ACCIDENT' | 'CUSTOM',
    message?: string
  ) => {
    if (status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrToken: token,
          type,
          message: message || '',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(
          data.error || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        );
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center">

        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🚗
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          안심 주차 알림 서비스
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          차주에게 개인 연락처 노출 없이 안전하게 메시지를 전달합니다.
        </p>

        {status === 'success' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">✅</div>

            <h3 className="text-lg font-bold text-emerald-800 mb-1">
              알림 전송 완료!
            </h3>

            <p className="text-sm text-emerald-600">
              차주에게 호출 알림이 전달되었습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            <button
              onClick={() => sendNotification('MOVE')}
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl"
            >
              💬 차량 이동 요청하기
            </button>

            <button
              onClick={() => sendNotification('ACCIDENT')}
              disabled={status === 'loading'}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-4 rounded-2xl"
            >
              ⚠️ 비상 / 사고 접수 알림
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (customMsg.trim()) {
                  sendNotification('CUSTOM', customMsg);
                }
              }}
              className="flex gap-2 pt-2"
            >
              <input
                type="text"
                placeholder="직접 메시지 입력"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl"
              />

              <button
                type="submit"
                disabled={status === 'loading' || !customMsg.trim()}
                className="bg-slate-700 text-white px-4 rounded-xl font-bold text-sm"
              >
                전송
              </button>
            </form>

            {status === 'loading' && (
              <p className="text-xs text-blue-600 mt-2">
                차주에게 전송 중입니다...
              </p>
            )}

            {status === 'error' && (
              <p className="text-xs text-rose-500 font-medium mt-2">
                {errorMsg}
              </p>
            )}

          </div>
        )}
      </div>
    </main>
  );
}