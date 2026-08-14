import { createClient } from '@supabase/supabase-js';

// 주소 앞뒤 공백 및 따옴표 제거, https:// 누락 시 자동 보정
const getCleanUrl = () => {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xufcnthlimejezxjldwt.supabase.co';
  url = url.trim().replace(/^["']|["']$/g, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
};

const getCleanAnonKey = () => {
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return key.trim().replace(/^["']|["']$/g, '');
};

export const getSupabase = () => {
  const url = getCleanUrl();
  const key = getCleanAnonKey() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';
  return createClient(url, key);
};