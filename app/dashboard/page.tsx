'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Car, Printer } from 'lucide-react';

export default function DashboardPage() {
  const [plateNumber, setPlateNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('parking_cards')
      .insert({
        plate_number: plateNumber,
        phone_number: phoneNumber,
      })
      .select()
      .single();

    if (error) {
      alert('등록 중 오류가 발생했습니다: ' + error.message);
    } else {
      setCard(data);
    }
    setLoading(false);
  };

  const callUrl = card
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/call/${card.qr_token}`
    : '';

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Car className="text-blue-600" /> 안심 주차 카드 관리
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          차량 번호와 연락처를 등록하면 안심 QR 코드가 즉시 생성됩니다.
        </p>

        {!card ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">차량 번호</label>
              <input
                type="text"
                placeholder="예: 12가 3456"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">알림받을 휴대폰 번호</label>
              <input
                type="tel"
                placeholder="예: 01012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200"
            >
              {loading ? '생성 중...' : 'QR 안심 카드 발급하기'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
              <QRCodeSVG value={callUrl} size={180} />
            </div>
            <div>
              <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-bold">
                {card.plate_number}
              </span>
              <p className="text-xs text-slate-400 mt-2">이 QR을 인쇄하여 차량 앞유리에 부착하세요.</p>
              <p className="text-xs text-blue-600 font-mono mt-1 break-all select-all">{callUrl}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition"
            >
              <Printer size={18} /> QR 코드 인쇄하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}