'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquare, AlertTriangle, CheckCircle2, Car, Send } from 'lucide-react';

export default function CallPage() {
  const params = useParams();
  const qrToken = params?.token as string;

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sentType, setSentType] = useState('');
  const [customMsg, setCustomMsg] = useState('');

  const sendNotification = async (type: string, message: string = '') => {
    if (!qrToken) return;
    setStatus('sending');
    setSentType(type);

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken, type, message }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 border border-slate-100 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mb-4">
          <Car size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">안심 주차 알림 서비스</h1>
        <p className="text-xs text-slate-500 mb-6">
          차주에게 개인 연락처 노출 없이 안전하게 메시지를 전달합니다.
        </p>

        {status === 'success' ? (
          <div className="py-8 flex flex-col items-center">
            <CheckCircle2 size={56} className="text-emerald-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">알림이 차주에게 전송되었습니다!</h3>
            <p className="text-xs text-slate-500 mt-1">확인 후 신속히 응답할 예정입니다.</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 text-xs text-blue-600 underline font-medium"
            >
              추가 메시지 보내기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => sendNotification('MOVE_REQUEST')}
              disabled={status === 'sending'}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <MessageSquare size={18} />
              {status === 'sending' && sentType === 'MOVE_REQUEST' ? '전송 중...' : '차량 이동 요청하기'}
            </button>

            <button
              onClick={() => sendNotification('ACCIDENT')}
              disabled={status === 'sending'}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <AlertTriangle size={18} />
              {status === 'sending' && sentType === 'ACCIDENT' ? '전송 중...' : '비상 / 사고 접수 알림'}
            </button>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="직접 메시지 입력 (예: 헤드라이트 켜짐)"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  disabled={status === 'sending'}
                  className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (customMsg.trim()) sendNotification('CUSTOM', customMsg);
                  }}
                  disabled={status === 'sending' || !customMsg.trim()}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {status === 'error' && (
              <p className="text-xs text-rose-500 pt-2">전송에 실패했습니다. 잠시 후 다시 시도해 주세요.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}