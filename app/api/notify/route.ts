import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 외부로 노출되지 않는 안전한 서버 전용 클라이언트
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { qrToken, type, message } = await req.json();

    if (!qrToken) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
    }

    // 1. 서버 권한으로 차주 정보 조회 (전화번호는 외부에 노출되지 않음)
    const { data: card, error } = await supabaseAdmin
      .from('parking_cards')
      .select('phone_number, plate_number')
      .eq('qr_token', qrToken)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: '차량 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2. 메시지 본문 구성
    let textToSend = `[안심주차 알림] 차량(${card.plate_number})\n`;
    if (type === 'MOVE_REQUEST') {
      textToSend += '이동 주차 요청이 도착했습니다. 차량을 확인해주세요.';
    } else if (type === 'ACCIDENT') {
      textToSend += '비상/사고 접수 알림이 도착했습니다. 즉시 확인 바랍니다.';
    } else {
      textToSend += `전달 메시지: "${message}"`;
    }

    // 3. 발송 결과 터미널(CMD) 출력 (테스트용)
    console.log('--------------------------------------------------');
    console.log(`[알림 도착] 차주 번호: ${card.phone_number}`);
    console.log(`[내용]:\n${textToSend}`);
    console.log('--------------------------------------------------');

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}