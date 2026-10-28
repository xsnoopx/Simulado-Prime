import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/adminAccess";

export async function POST(req: NextRequest) {
  try {
    const { action, userId, updatedFields, token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token de autenticação ausente." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://tobdeehicqircazdtbnx.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmRlZWhpY3FpcmNhemR0Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTUwMzksImV4cCI6MjA5NDczMTAzOX0.VY3oMLeg94CJmsTfta8550iIrFo68mtJO3XlN3eLYeg";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify token identity using getUser (verifies the JWT signature server-side).
    let isOwner = false;
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        isOwner = isAdminEmail(user.email);
      }
    } catch (authErr) {
      console.warn("GetUser failed during admin manage-players verification:", authErr);
    }

    // Never decode the token payload locally: an unsigned/forged JWT would be
    // accepted as the owner. If Supabase cannot confirm the token, deny access.
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Acesso administrativo negado." }, { status: 403 });
    }

    // A tabela ranking não aceita mais escrita direta (RLS). Esta rota precisa
    // da service_role: com a anon key o update silenciosamente não afetaria nada.
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceRoleKey) {
      console.error("[Admin] SUPABASE_SERVICE_ROLE_KEY ausente: manage-players não pode gravar.");
      return NextResponse.json(
        { success: false, error: "Servidor sem SUPABASE_SERVICE_ROLE_KEY configurada." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    if (action === "delete") {
      if (!userId) {
        return NextResponse.json({ success: false, error: "ID do usuário ausente para exclusão." }, { status: 400 });
      }

      const { error: deleteError } = await supabaseAdmin
        .from("ranking")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Usuário removido com sucesso." });
    } else if (action === "update") {
      if (!userId || !updatedFields || typeof updatedFields !== "object") {
        return NextResponse.json({ success: false, error: "ID do usuário ou campos de atualização ausentes." }, { status: 400 });
      }

      // Allowlist: never spread the request body straight into the database.
      // This blocking of mass assignment protects role/premium/ownership columns.
      const ALLOWED_FIELDS = [
        "name",
        "xp",
        "is_premium",
        "stats",
        "avatar_id",
        "avatar_frame_id",
        "custom_avatar_url",
      ] as const;

      const safeFields: Record<string, any> = {};
      for (const field of ALLOWED_FIELDS) {
        if (updatedFields[field] === undefined) continue;
        safeFields[field] = updatedFields[field];
      }

      if (Object.keys(safeFields).length === 0) {
        return NextResponse.json({ success: false, error: "Nenhum campo atualizável foi informado." }, { status: 400 });
      }

      if (safeFields.name !== undefined && typeof safeFields.name !== "string") {
        return NextResponse.json({ success: false, error: "O campo 'name' deve ser texto." }, { status: 400 });
      }
      if (safeFields.xp !== undefined && !Number.isFinite(Number(safeFields.xp))) {
        return NextResponse.json({ success: false, error: "O campo 'xp' deve ser numérico." }, { status: 400 });
      }
      if (safeFields.is_premium !== undefined && typeof safeFields.is_premium !== "boolean") {
        return NextResponse.json({ success: false, error: "O campo 'is_premium' deve ser booleano." }, { status: 400 });
      }
      if (safeFields.stats !== undefined && (typeof safeFields.stats !== "object" || Array.isArray(safeFields.stats))) {
        return NextResponse.json({ success: false, error: "O campo 'stats' deve ser um objeto." }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("ranking")
        .update({
          ...safeFields,
          ...(safeFields.xp !== undefined ? { xp: Number(safeFields.xp) } : {}),
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Cadastro atualizado com sucesso." });
    } else {
      return NextResponse.json({ success: false, error: "Ação inválida." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
