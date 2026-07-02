import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Verify token identity using Supabase Auth
    let isOwner = false;
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        isOwner = user.email?.toLowerCase() === "klession@gmail.com";
      }
    } catch (authErr) {
      console.warn("GetUser failed during reset-ranking verification, trying token decode fallback:", authErr);
    }

    if (!isOwner) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          if (payload && payload.email?.toLowerCase() === "klession@gmail.com") {
            isOwner = true;
          }
        }
      } catch (decodeError) {
        console.error("JWT decoding isOwner fallback failed:", decodeError);
      }
    }

    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso administrativo negado." }, { status: 403 });
    }

    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    // 1. Fetch current season if it exists
    const { data: seasonData } = await supabaseAdmin
      .from('ranking')
      .select('xp')
      .eq('id', 'system_season')
      .maybeSingle();

    let currentSeason = 0;
    if (seasonData && typeof seasonData.xp === 'number') {
      currentSeason = seasonData.xp;
    }

    const nextSeason = currentSeason + 1;

    // 2. Clear all records from the 'ranking' table.
    const { error: deleteError } = await supabaseAdmin
      .from('ranking')
      .delete()
      .neq('id', 'placeholder_nonexistent_id'); // Delete everything because every id !== placeholder_nonexistent_id

    if (deleteError) {
      console.error("[Reset API Error] Failed to delete rows from ranking table:", deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    // 3. Insert/Initialize the new season record marker in the ranking table
    const { error: insertError } = await supabaseAdmin
      .from('ranking')
      .insert({
        id: 'system_season',
        name: 'Configuração do Sistema',
        avatar_id: 'default',
        avatar_frame_id: 'frame_01',
        is_premium: false,
        xp: nextSeason,
        stats: { season: nextSeason },
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error("[Reset API Error] Failed to write new season marker:", insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Ranking table reset successfully. Advanced to season ' + nextSeason });
  } catch (err: any) {
    console.error("[Reset API Exception]", err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
