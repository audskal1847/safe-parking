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
    throw new Error('Supabase Key가 누락되었습니다. Vercel 환경 변수를 확인해주세요.');
  }

  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const { plateNumber, phoneNumber } = await req.json();

    if (!plateNumber || !phoneNumber) {
      return NextResponse.json({ error: '차량 번호와 전화번호를 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
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