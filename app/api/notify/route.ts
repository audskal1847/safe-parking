import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xufcnthlimejezxjldwt.supabase.co';
  url = url.trim().replace(/^["']|["']$/g, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  key = key.trim().replace(/^["']|["']$/g, '');

  if (!key) {
    throw new Error('Supabase Key가 누락되었습니다.');
  }

  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const { qrToken, type, message } = await req.json();

    if (!qrToken) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. 차주 정보 조회
    const { data: card, error } = await supabase
      .from('parking_cards')
      .select('phone_number, plate_number')
      .eq('qr_token', qrToken)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: '차량 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2. 전달 메시지 로그
    let textToSend = `[안심주차 알림] 차량(${card.plate_number})\n`;
    if (type === 'MOVE_REQUEST') {
      textToSend += '이동 주차 요청이 도착했습니다. 차량을 확인해주세요.';
    } else if (type === 'ACCIDENT') {
      textToSend += '비상/사고 접수 알림이 도착했습니다. 즉시 확인 바랍니다.';
    } else {
      textToSend += `전달 메시지: "${message}"`;
    }

    console.log('--------------------------------------------------');
    console.log(`[알림 도착] 차주 번호: ${card.phone_number}`);
    console.log(`[내용]:\n${textToSend}`);
    console.log('--------------------------------------------------');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}