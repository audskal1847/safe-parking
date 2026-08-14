import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// URL을 직접 고정하여 환경 변수 누락/형식 오류를 원천 차단합니다.
const SUPABASE_URL = 'https://xufcnthlimejezxjldwt.supabase.co';

export async function POST(req: Request) {
  try {
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Vercel 환경 변수(Key)가 누락되었습니다.' },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, serviceKey.trim());
    const { plateNumber, phoneNumber } = await req.json();

    if (!plateNumber || !phoneNumber) {
      return NextResponse.json({ error: '차량 번호와 전화번호를 입력해주세요.' }, { status: 400 });
    }

    const token = Math.random().toString(36).substring(2, 10);

    const { error } = await supabase.from('parking_cards').insert([
      {
        plate_number: plateNumber.replace(/\s+/g, ''),
        phone_number: phoneNumber.replace(/[^0-9]/g, ''),
        qr_token: token,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}