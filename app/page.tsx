'use client';

import { useState } from 'react';

export default function HomePage() {
  const [plateNumber, setPlateNumber] = useState('');

  const handleRegister = () => {
    if (!plateNumber.trim()) {
      alert('차량 번호를 입력해 주세요.');
      return;
    }
    window.location.href = `/api/kakao/login?plateNumber=${encodeURIComponent(plateNumber.trim())}`;
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🚗
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">안심 주차 서비스</h1>
        <p className="text-sm text-slate-500 mb-6">
          개인 연락처 노출 없이 차주의 카카오톡으로 안심 알림을 받아보세요.
        </p>

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              차량 번호
            </label>
            <input
              type="text"
              placeholder="예: 12가 3456"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium text-slate-800"
            />
          </div>

          <button
            onClick={handleRegister}
            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-sm cursor-pointer"
          >
            <span>💬</span>
            <span>카카오로 1초 등록 & QR 발급</span>
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          로그인한 카카오톡 계정으로 호출 알림이 전송됩니다.
        </p>
      </div>
    </main>
  );
}