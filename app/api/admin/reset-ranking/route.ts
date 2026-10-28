import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/adminAccess';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json().catch(() => ({}));

    if (!token) {
      return NextResponse.json({ success: false, error: "Token de autenticação ausente." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tobdeehicqircazdtbnx.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmRlZWhpY3FpcmNhemR0Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTUwMzksImV4cCI6MjA5NDczMTAzOX0.VY3oMLeg94CJmsTfta8550iIrFo68mtJO3XlN3eLYeg';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify token identity using Supabase Auth (signature checked server-side).
    let isOwner = false;
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        isOwner = isAdminEmail(user.email);
      }
    } catch (authErr) {
      console.warn("GetUser failed during reset-ranking verification:", authErr);
    }

    // Never decode the payload locally: a forged token would be accepted as the owner.
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso administrativo negado." }, { status: 403 });
    }

    // Sem service_role não há escrita: a tabela ranking passou a exigir RLS.
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceRoleKey) {
      console.error('[Reset API] SUPABASE_SERVICE_ROLE_KEY ausente: reset-ranking não pode gravar.');
      return NextResponse.json(
        { success: false, error: 'Servidor sem SUPABASE_SERVICE_ROLE_KEY configurada.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    // Uma única chamada: o delete dos jogadores e o upsert do marcador de
    // temporada rodam na mesma transação dentro do banco. Antes eram duas
    // chamadas separadas e, se o insert falhasse, o ranking ficava vazio.
    const { data: nextSeason, error: resetError } = await supabaseAdmin.rpc(
      'reset_ranking_season'
    );

    if (resetError) {
      console.error('[Reset API Error] Falha ao zerar o ranking:', resetError);
      return NextResponse.json({ success: false, error: resetError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      season: nextSeason,
      message: `Ranking zerado. Temporada ${nextSeason} iniciada.`,
    });
  } catch (err: any) {
    console.error("[Reset API Exception]", err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
