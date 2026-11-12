import { NextRequest, NextResponse } from "next/server";
import {
  MAX_IMAGENS_POR_MENSAGEM,
  criarClienteAdmin,
  normalizarTexto,
  resumoDaMensagem,
  serializarMensagens,
  subirImagensDoSuporte,
  verificarAdminDoToken,
  type MensagemSuporteRow,
} from "@/lib/supportServer";

export const runtime = "nodejs";

function erro(mensagem: string, status = 400) {
  return NextResponse.json({ success: false, error: mensagem }, { status });
}

async function totalNaoLidoAdmin(admin: any): Promise<number> {
  const { data } = await admin
    .from("support_threads")
    .select("unread_admin");
  return (data || []).reduce(
    (soma: number, linha: any) => soma + (Number(linha.unread_admin) || 0),
    0,
  );
}

export async function POST(req: NextRequest) {
  try {
    const corpo = await req.json();
    const action = String(corpo?.action || "");
    const token = String(corpo?.token || "");

    if (!token) {
      return erro("Token administrativo ausente.", 401);
    }

    const adminUser = await verificarAdminDoToken(token);
    if (!adminUser) {
      return erro("Acesso administrativo negado.", 403);
    }

    const admin = criarClienteAdmin();
    if (!admin) {
      return erro(
        "Servidor sem SUPABASE_SERVICE_ROLE_KEY configurada.",
        500,
      );
    }

    if (action === "count") {
      const unread = await totalNaoLidoAdmin(admin);
      return NextResponse.json({ success: true, unread });
    }

    if (action === "list") {
      const { data, error } = await admin
        .from("support_threads")
        .select(
          "id, user_id, user_name, user_email, category, status, unread_admin, last_message_at, last_preview, last_sender, created_at",
        )
        .order("last_message_at", { ascending: false })
        .limit(200);

      if (error) {
        console.warn("[Suporte ADM] Falha ao listar chamados:", error.message);
        return erro("Não foi possível carregar a IMBOX.", 500);
      }

      const threads = (data || []).map((linha: any) => ({
        id: linha.id,
        userId: linha.user_id,
        userName: linha.user_name || "Explorador",
        userEmail: linha.user_email || "",
        category: linha.category,
        status: linha.status,
        unread: Number(linha.unread_admin) || 0,
        lastMessageAt: linha.last_message_at,
        preview: linha.last_preview || "",
        lastSender: linha.last_sender,
        createdAt: linha.created_at,
      }));

      const unreadTotal = threads.reduce(
        (soma, thread) => soma + thread.unread,
        0,
      );

      return NextResponse.json({ success: true, threads, unreadTotal });
    }

    if (action === "thread") {
      const threadId = String(corpo?.threadId || "");
      if (!threadId) return erro("Chamado não informado.");

      const { data: thread, error: erroThread } = await admin
        .from("support_threads")
        .select(
          "id, user_id, user_name, user_email, category, status, unread_admin, last_message_at, last_preview, last_sender, created_at",
        )
        .eq("id", threadId)
        .maybeSingle();

      if (erroThread || !thread) {
        return erro("Chamado não encontrado.", 404);
      }

      const { data: linhas, error: erroMensagens } = await admin
        .from("support_messages")
        .select("id, sender, body, image_paths, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(300);

      if (erroMensagens) {
        console.warn(
          "[Suporte ADM] Falha ao ler mensagens:",
          erroMensagens.message,
        );
        return erro("Não foi possível carregar a conversa.", 500);
      }

      await admin
        .from("support_threads")
        .update({ unread_admin: 0, updated_at: new Date().toISOString() })
        .eq("id", threadId);

      const mensagens = await serializarMensagens(
        admin,
        (linhas || []) as MensagemSuporteRow[],
      );
      const unreadTotal = await totalNaoLidoAdmin(admin);

      return NextResponse.json({
        success: true,
        thread: {
          id: thread.id,
          userId: thread.user_id,
          userName: thread.user_name || "Explorador",
          userEmail: thread.user_email || "",
          category: thread.category,
          status: thread.status,
          lastMessageAt: thread.last_message_at,
          lastSender: thread.last_sender,
          preview: thread.last_preview || "",
          createdAt: thread.created_at,
        },
        messages: mensagens,
        unreadTotal,
      });
    }

    if (action === "reply") {
      const threadId = String(corpo?.threadId || "");
      if (!threadId) return erro("Chamado não informado.");

      const texto = normalizarTexto(corpo?.body);
      const imagens = corpo?.images;
      const notaInterna = Boolean(corpo?.note);
      const sender = notaInterna ? "note" : "admin";

      if (!texto && (!Array.isArray(imagens) || imagens.length === 0)) {
        return erro("Escreva uma resposta ou anexe uma imagem.");
      }
      if (Array.isArray(imagens) && imagens.length > MAX_IMAGENS_POR_MENSAGEM) {
        return erro(
          `Envie no máximo ${MAX_IMAGENS_POR_MENSAGEM} imagens por mensagem.`,
        );
      }

      const { data: thread, error: erroThread } = await admin
        .from("support_threads")
        .select("id, user_id, unread_user, status")
        .eq("id", threadId)
        .maybeSingle();

      if (erroThread || !thread) {
        return erro("Chamado não encontrado.", 404);
      }

      let caminhos: string[] = [];
      try {
        caminhos = await subirImagensDoSuporte(
          admin,
          thread.user_id,
          threadId,
          imagens,
        );
      } catch (falhaImagem: any) {
        return erro(falhaImagem?.message || "Não foi possível anexar a imagem.");
      }

      const { error: erroMensagem } = await admin
        .from("support_messages")
        .insert({
          thread_id: threadId,
          sender,
          author_id: adminUser.id,
          body: texto,
          image_paths: caminhos,
        });

      if (erroMensagem) {
        console.warn(
          "[Suporte ADM] Falha ao gravar resposta:",
          erroMensagem.message,
        );
        return erro("Não foi possível enviar a resposta.", 500);
      }

      // Nota interna não mexe no contador nem na prévia vista pelo jogador.
      if (!notaInterna) {
        const agora = new Date().toISOString();
        await admin
          .from("support_threads")
          .update({
            unread_user: (Number(thread.unread_user) || 0) + 1,
            status: "open",
            last_preview: resumoDaMensagem(
              texto,
              Array.isArray(imagens) && imagens.length > 0,
            ),
            last_sender: "admin",
            last_message_at: agora,
            updated_at: agora,
          })
          .eq("id", threadId);
      } else {
        await admin
          .from("support_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      }

      const unreadTotal = await totalNaoLidoAdmin(admin);
      return NextResponse.json({ success: true, unreadTotal });
    }

    if (action === "resolve") {
      const threadId = String(corpo?.threadId || "");
      if (!threadId) return erro("Chamado não informado.");

      const resolvido = Boolean(corpo?.resolved);
      const { error } = await admin
        .from("support_threads")
        .update({
          status: resolvido ? "resolved" : "open",
          unread_admin: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId);

      if (error) {
        console.warn("[Suporte ADM] Falha ao resolver:", error.message);
        return erro("Não foi possível atualizar o chamado.", 500);
      }

      const unreadTotal = await totalNaoLidoAdmin(admin);
      return NextResponse.json({
        success: true,
        status: resolvido ? "resolved" : "open",
        unreadTotal,
      });
    }

    return erro("Ação inválida para a IMBOX.", 400);
  } catch (erroGeral: any) {
    console.warn("[Suporte ADM] Erro inesperado:", erroGeral);
    return erro(
      erroGeral?.message || "Não foi possível concluir a operação.",
      500,
    );
  }
}
