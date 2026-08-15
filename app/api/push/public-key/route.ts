import { NextResponse } from 'next/server';

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID_PUBLIC_KEY가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    publicKey: publicKey
  });
}