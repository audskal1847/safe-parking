'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, QrCode, CheckCircle, Copy } from 'lucide-react';

export default function DashboardPage() {
  const [plateNumber, setPlateNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !phoneNumber) {
      setErrorMsg('차량 번호와 전화번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const token = Math.random().toString(36).substring(2, 10);

      const { error } = await supabase.from('parking_cards').insert([
        {
          plate_number: plateNumber.replace(/\s+/g, ''),
          phone_number: phoneNumber.replace(/[^0-9]/g, ''),
          qr_token: token,
        },
      ]);

      if (error) throw error;

      setQrToken(token);
    } catch (err: any) {
      setErrorMsg(err.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const callUrl = qrToken ? `${origin}/call/${qrToken}` : '';
  const qrImageUrl = callUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(callUrl)}`
    : '';

  const copyToClipboard = () => {
    if (!callUrl) return;
    navigator.clipboard.writeText(callUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
            <Car size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">안심 주차 QR 발급 대시보드</h1>
          <p className="text-sm text-slate-500 mt-1">차량 번호와 연락처를 등록하여 안심 QR 코드를 생성하세요.</p>
        </div>

        {!qrToken ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">차량 번호</label>
              <input
                type="text"
                placeholder="예: 12가 3456"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">차주 연락처</label>
              <input
                type="tel"
                placeholder="예: 010-1234-5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <QrCode size={18} />
              {loading ? 'QR 생성 중...' : 'QR 안심 카드 발급하기'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
              <CheckCircle size={14} /> 발급 완료
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <img src={qrImageUrl} alt="QR Code" width={180} height={180} className="block" />
              </div>
              <p className="text-base font-bold text-slate-800 mt-4">{plateNumber}</p>
              <p className="text-xs text-slate-400 mt-0.5">스마트폰으로 스캔하면 바로 안심 호출 페이지가 열립니다.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={callUrl}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-600 select-all"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition"
              >
                <Copy size={14} /> {copied ? '복사됨' : '복사'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setQrToken('');
                setPlateNumber('');
                setPhoneNumber('');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              새로운 차량 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}