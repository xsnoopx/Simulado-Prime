import { NextResponse } from 'next/server';
import { resolveSupabaseConfig } from '@/lib/supabaseConfig';

export async function GET() {
  const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );

  return NextResponse.json({
    supabaseUrl,
    supabaseAnonKey,
  });
}
