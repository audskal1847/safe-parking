'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Car, AlertTriangle, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function CallPage() {
  const params = useParams();
  const token = params.token as string;
  const [customMsg, setCustomMsg] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSendNotification = async (type: string, message?: string) => {
    setStatus('sending');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: token,
          type,
          message: message || '',
        }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Car size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">차주 안심 호출 서비스</h2>
          <p className="text-xs text-slate-500 mt-1">
            원하시는 알림 버튼을 누르면 차주에게 즉시 전달됩니다.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle2 className="text-emerald-500 w-16 h-16 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800">알림이 전송되었습니다!</h3>
            <p className="text-xs text-slate-500 mt-1">차주가 확인 후 곧 조치할 예정입니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handleSendNotification('MOVE_REQUEST')}
              disabled={status === 'sending'}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition active:scale-98 shadow-md shadow-blue-200"
            >
              <Car size={20} /> 차량 이동 요청
            </button>

            <button
              onClick={() => handleSendNotification('ACCIDENT')}
              disabled={status === 'sending'}
              className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl transition active:scale-98 shadow-md shadow-amber-100"
            >
              <AlertTriangle size={20} /> 사고 접수 / 비상 연락
            </button>

            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-600 mb-1">직접 메시지 전달</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="예: 지하 2층에 주차했습니다"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSendNotification('CUSTOM', customMsg)}
                  disabled={status === 'sending' || !customMsg.trim()}
                  className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 disabled:opacity-50"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>

            {status === 'error' && (
              <p className="text-xs text-rose-500 text-center font-medium mt-2">
                전송에 실패했습니다. 잠시 후 다시 시도해주세요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}