import { NextResponse } from 'next/server';

const KAKAO_REST_API_KEY = 'acb93c43a65de33ee589cbf0254e0ce7';
const REDIRECT_URI = 'https://safe-parking-git-main-audskal1847s-projects.vercel.app/api/kakao/callback';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: '인가 코드가 없습니다.' }, { status: 400 });
  }

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

  return new Response(
    `<html>
      <head><meta charset="utf-8"><title>카카오 연동 완료</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 40px; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <h2 style="color: #059669;">🎉 카카오톡 연동 토큰 발급 성공!</h2>
          <p style="color: #4b5563; font-size: 14px;">아래 <b>Refresh Token</b>을 복사하여 대화창에 알려주세요:</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; word-break: break-all; font-weight: bold; color: #1e293b; margin: 20px 0; font-size: 13px; user-select: all;">
            ${data.refresh_token}
          </div>
        </div>
      </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}