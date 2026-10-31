import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/adminAccess";
import { resolveSupabaseConfig } from "@/lib/supabaseConfig";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * O aplicativo do jogador lê XP, premium, nome e estatísticas de
 * `auth.users.raw_user_meta_data` (metadados do Supabase Auth).
 *
 * Atualizar só a tabela `ranking` não muda nada na tela do jogador, porque o
 * ranking é apenas o placar público. Por isso esta função espelha os campos
 * administrativos nos metadados da conta de login.
 *
 * Devolve uma mensagem de aviso quando não foi possível sincronizar (por
 * exemplo, jogador antigo cuja linha do ranking não tem conta de Auth).
 */
async function propagarMetadadosDoJogador(
  supabaseAdmin: SupabaseClient,
  userId: string,
  campos: Record<string, any>
): Promise<string | null> {
  if (!UUID_REGEX.test(userId)) {
    return "XP e premium foram salvos apenas no ranking: este jogador não tem conta de login vinculada (ID não é um UUID do Supabase Auth).";
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    console.warn("[Admin] Não foi possível ler a conta de Auth do jogador:", error?.message);
    return `Ranking salvo, mas a conta de login não foi encontrada: ${error?.message || "usuário inexistente"}.`;
  }

  const metadadosAtuais = (data.user.user_metadata || {}) as Record<string, any>;
  const perfilAtual =
    metadadosAtuais.user_profile && typeof metadadosAtuais.user_profile === "object"
      ? { ...metadadosAtuais.user_profile }
      : {};

  const metadados: Record<string, any> = { ...metadadosAtuais };
  const perfil: Record<string, any> = { ...perfilAtual };

  if (campos.name !== undefined) {
    metadados.name = campos.name;
    perfil.name = campos.name;
  }

  if (campos.is_premium !== undefined) {
    const premium = !!campos.is_premium;
    metadados.isPremium = premium;
    perfil.isPremium = premium;
  }

  // Piso de XP definido manualmente pelo admin. O app usa o maior valor entre
  // este e o XP conquistado nas estatísticas.
  if (campos.xp !== undefined) {
    metadados.cosmos_xp = Number(campos.xp);
  }

  if (campos.stats !== undefined) {
    metadados.simulado_stats = campos.stats;
    perfil.stats = campos.stats;
  }

  if (campos.avatar_id !== undefined) {
    metadados.avatarId = campos.avatar_id;
    perfil.avatarId = campos.avatar_id;
  }
  if (campos.avatar_frame_id !== undefined) {
    metadados.avatarFrameId = campos.avatar_frame_id;
    perfil.avatarFrameId = campos.avatar_frame_id;
  }
  if (campos.custom_avatar_url !== undefined) {
    metadados.customAvatarUrl = campos.custom_avatar_url;
    perfil.customAvatarUrl = campos.custom_avatar_url;
  }

  metadados.user_profile = perfil;

  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: metadados,
  });

  if (metaError) {
    console.warn("[Admin] Falha ao gravar metadados do jogador:", metaError.message);
    return `Ranking salvo, mas o aplicativo do jogador não recebeu a alteração: ${metaError.message}`;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { action, userId, updatedFields, token } = await req.json();

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

      // Espelha os campos administrativos nos metadados de login do jogador.
      const avisoMetadados = await propagarMetadadosDoJogador(supabaseAdmin, userId, safeFields);

      return NextResponse.json({
        success: true,
        message: avisoMetadados
          ? "Cadastro atualizado no ranking, mas com pendência na conta do jogador."
          : "Cadastro atualizado e sincronizado com o aplicativo do jogador.",
        ...(avisoMetadados ? { warning: avisoMetadados } : {}),
      });
    } else {
      return NextResponse.json({ success: false, error: "Ação inválida." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
