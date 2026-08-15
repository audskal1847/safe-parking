import { NextResponse } from 'next/server';

const KAKAO_REST_API_KEY = 'acb93c43a65de33ee589cbf0254e0ce7';
const REDIRECT_URI = 'https://safe-parking-git-main-audskal1847s-projects.vercel.app/api/kakao/callback';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plateNumber = searchParams.get('plateNumber') || '';

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=talk_message&state=${encodeURIComponent(plateNumber)}`;

  return NextResponse.redirect(kakaoAuthUrl);
}