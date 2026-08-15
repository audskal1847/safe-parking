import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xufcnthlimejezxjldwt.supabase.co';
const KAKAO_REST_API_KEY = 'acb93c43a65de33ee589cbf0254e0ce7';

async function getKakaoAccessToken(refreshToken: string) {
  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: KAKAO_REST_API_KEY,
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`카카오 토큰 갱신 실패: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!serviceKey) {
      return NextResponse.json({ error: 'Supabase Key 누락' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, serviceKey.trim());
    const { qrToken, type, message } = await req.json();

    if (!qrToken) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
    }

    // 1. 등록 차량 및 해당 차주의 고유 토큰 조회
    const { data: card, error } = await supabase
      .from('parking_cards')
      .select('plate_number, kakao_refresh_token')
      .eq('qr_token', qrToken)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: '차량 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!card.kakao_refresh_token) {
      return NextResponse.json({ error: '카카오 연동 정보가 없는 차량입니다.' }, { status: 400 });
    }

    // 2. 메시지 구성
    let title = '🚗 [차량 이동 요청]';
    let detail = '차량 이동 요청이 도착했습니다. 차량을 확인해 주세요.';

    if (type === 'ACCIDENT') {
      title = '🚨 [비상 / 사고 접수]';
      detail = '차량에 비상 상황 또는 접촉 사고가 접수되었습니다. 즉시 확인 바랍니다!';
    } else if (type === 'CUSTOM') {
      title = '💬 [방문자 메시지]';
      detail = `"${message || '내용 없음'}"`;
    }

    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const textToSend = `[안심 주차 알림 도착]\n\n${title}\n• 차량번호: ${card.plate_number}\n• 내용: ${detail}\n• 시간: ${now}`;

    // 3. 차주 본인의 Access Token 발급
    const accessToken = await getKakaoAccessToken(card.kakao_refresh_token);

    // 4. 차주 본인의 카카오톡으로 메시지 발송
    const templateObject = {
      object_type: 'text',
      text: textToSend,
      link: {
        web_url: 'https://safe-parking-git-main-audskal1847s-projects.vercel.app',
        mobile_web_url: 'https://safe-parking-git-main-audskal1847s-projects.vercel.app',
      },
      button_title: '안심 주차 서비스',
    };

    const kakaoParams = new URLSearchParams();
    kakaoParams.append('template_object', JSON.stringify(templateObject));

    const kakaoRes = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: kakaoParams.toString(),
    });

    const kakaoResult = await kakaoRes.json();
    if (kakaoResult.result_code !== 0) {
      console.error('Kakao send error:', kakaoResult);
      return NextResponse.json({ error: '카카오톡 전송 실패', details: kakaoResult }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Notify API Error:', err);
    return NextResponse.json({ error: err.message || '알림 전송 실패' }, { status: 500 });
  }
}