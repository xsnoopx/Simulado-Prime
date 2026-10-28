import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ isOwner: false, code: "no_token" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tobdeehicqircazdtbnx.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmRlZWhpY3FpcmNhemR0Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTUwMzksImV4cCI6MjA5NDczMTAzOX0.VY3oMLeg94CJmsTfta8550iIrFo68mtJO3XlN3eLYeg';

    // Create a server-side Supabase client to reliably verify the token signature
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    let isOwner = false;
    let authErrorMsg = "";

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        isOwner = user.email?.toLowerCase() === "klession@gmail.com";
      } else if (error) {
        authErrorMsg = error.message;
      }
    } catch (authError: any) {
      authErrorMsg = authError.message || String(authError);
      console.warn("Supabase auth getUser failed during owner verification:", authErrorMsg);
    }

    // The token signature is verified by Supabase above. Never decode the payload
    // locally: an unsigned token would be trivially forgeable to impersonate the owner.
    if (authErrorMsg) {
      console.warn("[validate-owner] Verificação de token rejeitada:", authErrorMsg);
    }

    return NextResponse.json({ isOwner, code: isOwner ? "success" : "invalid_user" });
  } catch (err: any) {
    return NextResponse.json({ isOwner: false, error: err.message }, { status: 500 });
  }
}
