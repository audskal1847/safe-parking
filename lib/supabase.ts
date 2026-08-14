import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xufcnthlimejezxjldwt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

// 호출될 때만 안전하게 클라이언트를 생성합니다 (빌드 타임 에러 원천 차단)
export const getSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};