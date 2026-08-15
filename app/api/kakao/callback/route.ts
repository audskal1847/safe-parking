import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xufcnthlimejezxjldwt.supabase.co';
const KAKAO_REST_API_KEY = 'acb93c43a65de33ee589cbf0254e0ce7';
const REDIRECT_URI = 'https://safe-parking-git-main-audskal1847s-projects.vercel.app/api/kakao/callback';
const DOMAIN = 'https://safe-parking-git-main-audskal1847s-projects.vercel.app';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const plateNumber = searchParams.get('state') || '미지정 차량';

  if (!code) {
    return NextResponse.json({ error: '인가 코드가 없습니다.' }, { status: 400 });
  }

  // 1. 차주 고유 카카오 토큰 교환
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  const data = await tokenRes.json();

  if (!data.refresh_token) {
    return NextResponse.json({ error: '토큰 발급 실패', details: data }, { status: 500 });
  }

  // 2. Supabase DB에 차주 토큰과 함께 차량 등록
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!serviceKey) {
    return NextResponse.json({ error: 'Supabase Key 누락' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, serviceKey.trim());
  const qrToken = crypto.randomUUID();

  const { error: dbError } = await supabase.from('parking_cards').insert([
    {
      plate_number: decodeURIComponent(plateNumber),
      qr_token: qrToken,
      kakao_refresh_token: data.refresh_token,
      phone_number: 'KAKAO_LINKED',
    },
  ]);

  if (dbError) {
    return NextResponse.json({ error: 'DB 저장 실패', details: dbError }, { status: 500 });
  }

  const scanUrl = `${DOMAIN}/scan/${qrToken}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(scanUrl)}`;

  // 3. 발급 완료 화면 표시
  return new Response(
    `<!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>안심주차 QR 발급 완료</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 90vh; }
        .card { background: white; max-width: 360px; width: 100%; border-radius: 24px; padding: 30px 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center; }
        .badge { display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 13px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
        .title { font-size: 20px; font-weight: bold; color: #1e293b; margin: 0 0 8px 0; }
        .sub { font-size: 13px; color: #64748b; margin-bottom: 20px; }
        .qr-box { background: white; padding: 12px; border: 1px solid #e2e8f0; border-radius: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .plate { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 16px; margin-bottom: 4px; }
        .desc { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }
        .btn { display: block; width: 100%; box-sizing: border-box; background-color: #2563eb; color: white; text-decoration: none; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 14px; border: none; cursor: pointer; margin-bottom: 8px; }
        .btn-sub { background-color: #f8fafc; color: #475569; border: 1px solid #cbd5e1; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">✓ 카톡 연동 완료</span>
        <h1 class="title">안심 주차 QR 카드</h1>
        <p class="sub">로그인하신 카카오톡으로 호출 알림이 전송됩니다.</p>
        <div class="qr-box">
          <img src="${qrImageUrl}" alt="안심 주차 QR" width="220" height="220" />
        </div>
        <div class="plate">${decodeURIComponent(plateNumber)}</div>
        <div class="desc">이 QR 코드를 인쇄하거나 캡처하여 차량에 부착하세요.</div>
        <button class="btn" onclick="window.print()">🖨️ QR 코드 인쇄하기</button>
        <a href="/push-setup?qrToken=${encodeURIComponent(qrToken)}" class="btn" style="background-color:#16a34a; margin-top:10px;">🔔 주차 알림 켜기</a>
        <a href="/" class="btn btn-sub">다른 차량 등록하기</a>
      </div>
    </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}