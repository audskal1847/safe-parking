import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL;

if (
  VAPID_PUBLIC_KEY &&
  VAPID_PRIVATE_KEY &&
  VAPID_EMAIL
) {
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

async function getKakaoAccessToken(refreshToken: string) {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
  }

  const res = await fetch(
    'https://kauth.kakao.com/oauth/token',
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: KAKAO_REST_API_KEY,
        refresh_token: refreshToken,
      }),
    }
  );

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(
      `카카오 토큰 갱신 실패: ${JSON.stringify(data)}`
    );
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return NextResponse.json(
        {
          error:
            'SUPABASE_SERVICE_ROLE_KEY가 없습니다.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      SUPABASE_URL,
      serviceKey.trim()
    );

    const { qrToken, type, message } =
      await req.json();

    if (!qrToken) {
      return NextResponse.json(
        {
          error: '유효하지 않은 요청입니다.',
        },
        { status: 400 }
      );
    }

    // 1. QR 토큰으로 차주 정보 조회
    console.log('========== NOTIFY DEBUG ==========');
console.log('qrToken:', JSON.stringify(qrToken));
console.log(
  'SUPABASE_URL:',
  SUPABASE_URL
);

const { data: card, error: cardError } =
  await supabase
    .from('parking_cards')
    .select(
      'id, plate_number, qr_token, kakao_refresh_token'
    )
    .eq('qr_token', String(qrToken).trim())
    .maybeSingle();

console.log('card:', card);
console.log('cardError:', cardError);

if (cardError || !card) {
  return NextResponse.json(
    {
      error: '차량 정보를 찾을 수 없습니다.',
      debug: {
        qrToken: String(qrToken).trim(),
        cardError: cardError?.message || null,
      },
    },
    { status: 404 }
  );
}

    // 2. 메시지 구성
    let title = '🚗 [차량 이동 요청]';

    let detail =
      '차량 이동 요청이 도착했습니다. 차량을 확인해 주세요.';

    if (type === 'ACCIDENT') {
      title = '🚨 [비상 / 사고 접수]';

      detail =
        '차량에 비상 상황 또는 접촉 사고가 접수되었습니다. 즉시 확인 바랍니다!';
    } else if (type === 'CUSTOM') {
      title = '💬 [방문자 메시지]';

      detail = `"${message || '내용 없음'}"`;
    }

    const now = new Date().toLocaleString(
      'ko-KR',
      {
        timeZone: 'Asia/Seoul',
      }
    );

    const textToSend =
      `[안심 주차 알림 도착]\n\n` +
      `${title}\n` +
      `• 차량번호: ${card.plate_number}\n` +
      `• 내용: ${detail}\n` +
      `• 시간: ${now}`;

    // -----------------------------------------
    // 3. 카카오톡 전송
    // -----------------------------------------

    if (card.kakao_refresh_token) {
      const accessToken =
        await getKakaoAccessToken(
          card.kakao_refresh_token
        );

      const templateObject = {
        object_type: 'text',
        text: textToSend,
        link: {
          web_url:
            'https://safe-parking-git-main-audskal1847s-projects.vercel.app',
          mobile_web_url:
            'https://safe-parking-git-main-audskal1847s-projects.vercel.app',
        },
        button_title: '안심 주차 서비스',
      };

      const kakaoParams =
        new URLSearchParams();

      kakaoParams.append(
        'template_object',
        JSON.stringify(templateObject)
      );

      const kakaoRes = await fetch(
        'https://kapi.kakao.com/v2/api/talk/memo/default/send',
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            'Content-Type':
              'application/x-www-form-urlencoded',
          },
          body: kakaoParams.toString(),
        }
      );

      const kakaoResult =
        await kakaoRes.json();

      if (kakaoResult.result_code !== 0) {
        console.error(
          'Kakao send error:',
          kakaoResult
        );

        return NextResponse.json(
          {
            error: '카카오톡 전송 실패',
          },
          { status: 500 }
        );
      }
    }

    // -----------------------------------------
    // 4. 휴대폰 Push 알림 전송
    // -----------------------------------------

    let pushSent = 0;

    if (
      VAPID_PUBLIC_KEY &&
      VAPID_PRIVATE_KEY &&
      VAPID_EMAIL
    ) {
      const { data: subscriptions } =
        await supabase
          .from('push_subscriptions')
          .select(
            'id, endpoint, p256dh, auth'
          )
          .eq(
            'parking_card_id',
            card.id
          );

      if (subscriptions) {
        for (const subscription of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint:
                  subscription.endpoint,
                keys: {
                  p256dh:
                    subscription.p256dh,
                  auth:
                    subscription.auth,
                },
              },
              JSON.stringify({
                title:
                  '🚗 안심 주차 알림',
                body: textToSend,
                url: '/dashboard',
              })
            );

            pushSent++;
          } catch (pushError: any) {
            console.error(
              'Push 전송 실패:',
              pushError
            );

            // 더 이상 사용할 수 없는 구독 삭제
            if (
              pushError?.statusCode === 404 ||
              pushError?.statusCode === 410
            ) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq(
                  'id',
                  subscription.id
                );
            }
          }
        }
      }
    }

    console.log(
      `알림 전송 완료 - Kakao: OK / Push: ${pushSent}`
    );

    return NextResponse.json({
      success: true,
      pushSent,
    });

  } catch (error: any) {
    console.error(
      'Notify API Error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          '알림 전송 실패',
      },
      { status: 500 }
    );
  }
}
