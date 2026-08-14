import { createClient } from '@supabase/supabase-js';

// 웹 브라우저 화면용 안전한 연결 클라이언트
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);