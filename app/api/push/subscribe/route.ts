import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { qrToken, endpoint, keys } = body;

    if (!qrToken || !endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: '필수 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Supabase Service Role Key가 없습니다.' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      SUPABASE_URL,
      serviceKey.trim()
    );

    const { data: card, error: cardError } = await supabase
      .from('parking_cards')
      .select('id')
      .eq('qr_token', qrToken)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: '차량 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          parking_card_id: card.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'endpoint'
        }
      );

    if (error) {
      console.error('Push 저장 오류:', error);

      return NextResponse.json(
        { error: 'Push 정보 저장 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Push API 오류:', error);

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}