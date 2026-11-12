import { NextRequest, NextResponse } from "next/server";
import { tomValido } from "@/lib/broadcastShared";
import {
  criarClienteAdmin,
  verificarAdminDoToken,
} from "@/lib/supportServer";

export const runtime = "nodejs";

const MAX_TITULO = 80;
const MAX_TEXTO = 500;

function erro(mensagem: string, status = 400) {
  return NextResponse.json({ success: false, error: mensagem }, { status });
}

function texto(valor: unknown, limite: number) {
  if (typeof valor !== "string") return "";
  return valor.replace(/\r\n/g, "\n").trim().slice(0, limite);
}

function horasValidas(valor: unknown): number {
  const numero = Math.round(Number(valor));
  if (!Number.isFinite(numero)) return 12;
  return Math.min(168, Math.max(1, numero));
}

export async function POST(req: NextRequest) {
  try {
    let corpo: any;
    try {
      corpo = await req.json();
    } catch {
      return erro("Não foi possível ler a solicitação.", 400);
    }

    const action = String(corpo?.action || "");
    const token = String(corpo?.token || "");

    if (!token) return erro("Token administrativo ausente.", 401);

    const adminUser = await verificarAdminDoToken(token);
    if (!adminUser) return erro("Acesso administrativo negado.", 403);

    const admin = criarClienteAdmin();
    if (!admin) {
      return erro("Servidor sem SUPABASE_SERVICE_ROLE_KEY configurada.", 500);
    }

    if (action === "list") {
      const { data, error } = await admin
        .from("app_broadcasts")
        .select(
          "id, title, body, tone, active, reexibir_horas, version, created_at, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("[Aviso ADM] Falha ao listar:", error.message);
        return erro("Não foi possível carregar os avisos.", 500);
      }

      const avisos = (data || []).map((linha: any) => ({
        id: linha.id,
        title: linha.title || "",
        body: linha.body || "",
        tone: linha.tone || "info",
        active: Boolean(linha.active),
        reexibirHoras: Number(linha.reexibir_horas) || 12,
        version: Number(linha.version) || 1,
        createdAt: linha.created_at,
        updatedAt: linha.updated_at,
      }));

      return NextResponse.json({
        success: true,
        avisos,
        ativoId: avisos.find((item: any) => item.active)?.id || null,
      });
    }

    // Daqui para baixo tudo grava: valida o conteúdo uma única vez.
    const precisaConteudo = ["publish", "update"].includes(action);

    let titulo = "";
    let mensagem = "";
    let tom = "info";
    let horas = 12;

    if (precisaConteudo) {
      titulo = texto(corpo?.title, MAX_TITULO);
      mensagem = texto(corpo?.body, MAX_TEXTO);
      tom = String(corpo?.tone || "info");
      horas = horasValidas(corpo?.horas);

      if (!mensagem) return erro("Escreva o texto do lembrete.");
      if (!tomValido(tom)) return erro("Escolha um tipo de aviso válido.");
    }

    if (action === "publish") {
      // Só um aviso ativo por vez: o índice único exige desativar o anterior.
      const { error: erroDesativar } = await admin
        .from("app_broadcasts")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("active", true);

      if (erroDesativar) {
        console.warn("[Aviso ADM] Falha ao desativar anterior:", erroDesativar.message);
        return erro("Não foi possível publicar o aviso.", 500);
      }

      const agora = new Date().toISOString();
      const { data, error } = await admin
        .from("app_broadcasts")
        .insert({
          title: titulo,
          body: mensagem,
          tone: tom,
          active: true,
          reexibir_horas: horas,
          version: 1,
          created_by: adminUser.email || adminUser.id,
          created_at: agora,
          updated_at: agora,
        })
        .select("id, version")
        .single();

      if (error) {
        console.warn("[Aviso ADM] Falha ao publicar:", error.message);
        return erro("Não foi possível publicar o aviso.", 500);
      }

      return NextResponse.json({ success: true, id: data.id, version: data.version });
    }

    if (action === "update") {
      const id = String(corpo?.id || "");
      if (!id) return erro("Aviso não informado.");

      const { data: atual, error: erroAtual } = await admin
        .from("app_broadcasts")
        .select("id, version")
        .eq("id", id)
        .maybeSingle();

      if (erroAtual || !atual) return erro("Aviso não encontrado.", 404);

      const { error: erroDesativar } = await admin
        .from("app_broadcasts")
        .update({ active: false })
        .eq("active", true)
        .neq("id", id);

      if (erroDesativar) {
        console.warn("[Aviso ADM] Falha ao desativar outros:", erroDesativar.message);
        return erro("Não foi possível salvar o aviso.", 500);
      }

      // version sobe: quem já tinha fechado vê de novo na hora.
      const { error } = await admin
        .from("app_broadcasts")
        .update({
          title: titulo,
          body: mensagem,
          tone: tom,
          active: true,
          reexibir_horas: horas,
          version: (Number(atual.version) || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.warn("[Aviso ADM] Falha ao atualizar:", error.message);
        return erro("Não foi possível salvar o aviso.", 500);
      }

      return NextResponse.json({ success: true, id });
    }

    if (action === "republish") {
      const id = String(corpo?.id || "");
      if (!id) return erro("Aviso não informado.");

      const { data: atual, error: erroAtual } = await admin
        .from("app_broadcasts")
        .select("id, version")
        .eq("id", id)
        .maybeSingle();

      if (erroAtual || !atual) return erro("Aviso não encontrado.", 404);

      await admin
        .from("app_broadcasts")
        .update({ active: false })
        .eq("active", true)
        .neq("id", id);

      const { error } = await admin
        .from("app_broadcasts")
        .update({
          active: true,
          version: (Number(atual.version) || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.warn("[Aviso ADM] Falha ao reenviar:", error.message);
        return erro("Não foi possível reenviar o aviso.", 500);
      }

      return NextResponse.json({ success: true, id });
    }

    if (action === "deactivate") {
      const id = String(corpo?.id || "");
      if (!id) return erro("Aviso não informado.");

      const { error } = await admin
        .from("app_broadcasts")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.warn("[Aviso ADM] Falha ao desativar:", error.message);
        return erro("Não foi possível desativar o aviso.", 500);
      }

      return NextResponse.json({ success: true, id });
    }

    if (action === "delete") {
      const id = String(corpo?.id || "");
      if (!id) return erro("Aviso não informado.");

      const { error } = await admin.from("app_broadcasts").delete().eq("id", id);

      if (error) {
        console.warn("[Aviso ADM] Falha ao excluir:", error.message);
        return erro("Não foi possível excluir o aviso.", 500);
      }

      return NextResponse.json({ success: true, id });
    }

    return erro("Ação inválida para os avisos.", 400);
  } catch (erroGeral) {
    console.warn("[Aviso ADM] Erro inesperado:", erroGeral);
    return erro("Não foi possível concluir a operação.", 500);
  }
}
