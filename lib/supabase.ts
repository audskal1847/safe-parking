import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xufcnthlimejezxjldwt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1ZmNudGhsaW1lamV6eGpsZHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjg0MzEsImV4cCI6MjA1NTc0NDQzMX0.dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);