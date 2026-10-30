import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/adminAccess';
import { resolveSupabaseConfig } from '@/lib/supabaseConfig';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json().catch(() => ({}));

    if (!token) {
      return NextResponse.json({ success: false, error: "Token de autenticação ausente." }, { status: 401 });
    }

    const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );

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

      // PGRST202 = função não encontrada no schema cache. Acontece quando este
      // código já está no ar mas a migration ainda não foi aplicada no banco.
      // Sem isso o painel mostrava um "Could not find the function" cru.
      if (resetError.code === 'PGRST202') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Migration pendente: rode supabase/migrations/20261028090000_reset_ranking_season.sql no SQL Editor do Supabase e tente de novo.',
          },
          { status: 503 }
        );
      }

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
