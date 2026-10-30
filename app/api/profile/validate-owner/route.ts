import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/adminAccess";
import { resolveSupabaseConfig } from "@/lib/supabaseConfig";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ isOwner: false, code: "no_token" });
    }

    // Mesma configuração usada pelo cliente: se a chave do ambiente for de outro
    // projeto, o getUser abaixo falha com "Invalid API key" e o dono perde o
    // painel administrativo.
    const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Create a server-side Supabase client to reliably verify the token signature
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    let isOwner = false;
    let authErrorMsg = "";

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        isOwner = isAdminEmail(user.email);
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
