import { NextRequest, NextResponse } from "next/server";
import { categoriaValida } from "@/lib/supportShared";
import {
  MAX_IMAGENS_POR_MENSAGEM,
  criarClienteAdmin,
  normalizarTexto,
  resumoDaMensagem,
  serializarMensagens,
  subirImagensDoSuporte,
  verificarUsuarioDoToken,
  type MensagemSuporteRow,
} from "@/lib/supportServer";

export const runtime = "nodejs";

function erro(mensagem: string, status = 400) {
  return NextResponse.json({ success: false, error: mensagem }, { status });
}

async function totalNaoLidoDoUsuario(
  admin: ReturnType<typeof criarClienteAdmin>,
  userId: string,
): Promise<number> {
  if (!admin) return 0;
  const { data } = await admin
    .from("support_threads")
    .select("unread_user")
    .eq("user_id", userId);
  return (data || []).reduce(
    (soma, linha: any) => soma + (Number(linha.unread_user) || 0),
    0,
  );
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

    if (!token) {
      return erro("Entre na sua conta para falar com o suporte.", 401);
    }

    const usuario = await verificarUsuarioDoToken(token);
    if (!usuario) {
      return erro("Sua sessão expirou. Entre novamente para usar o suporte.", 401);
    }

    const admin = criarClienteAdmin();
    if (!admin) {
      return erro(
        "O suporte está temporariamente indisponível. Tente novamente mais tarde.",
        500,
      );
    }

    const userId = usuario.id;
    const nomeUsuario =
      (usuario.user_metadata?.name as string | undefined)?.trim() ||
      usuario.email?.split("@")[0] ||
      "Explorador";
    const emailUsuario = usuario.email || "";

    if (action === "count") {
      const unread = await totalNaoLidoDoUsuario(admin, userId);
      return NextResponse.json({ success: true, unread });
    }

    if (action === "list") {
      const { data, error } = await admin
        .from("support_threads")
        .select(
          "id, category, status, unread_user, last_message_at, last_preview, last_sender",
        )
        .eq("user_id", userId)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("[Suporte] Falha ao listar chamados:", error.message);
        return erro("Não foi possível carregar seus chamados.", 500);
      }

      const threads = (data || []).map((linha: any) => ({
        id: linha.id,
        category: linha.category,
        status: linha.status,
        unread: Number(linha.unread_user) || 0,
        lastMessageAt: linha.last_message_at,
        preview: linha.last_preview || "",
        lastSender: linha.last_sender,
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
          "id, user_id, category, status, unread_user, last_message_at, last_preview, last_sender, created_at",
        )
        .eq("id", threadId)
        .eq("user_id", userId)
        .maybeSingle();

      if (erroThread || !thread) {
        return erro("Chamado não encontrado.", 404);
      }

      const { data: linhas, error: erroMensagens } = await admin
        .from("support_messages")
        .select("id, sender, body, image_paths, created_at")
        .eq("thread_id", threadId)
        .neq("sender", "note")
        .order("created_at", { ascending: true })
        .limit(300);

      if (erroMensagens) {
        console.warn("[Suporte] Falha ao ler mensagens:", erroMensagens.message);
        return erro("Não foi possível carregar a conversa.", 500);
      }

      await admin
        .from("support_threads")
        .update({ unread_user: 0, updated_at: new Date().toISOString() })
        .eq("id", threadId)
        .eq("user_id", userId);

      const mensagens = await serializarMensagens(
        admin,
        (linhas || []) as MensagemSuporteRow[],
      );
      const unreadTotal = await totalNaoLidoDoUsuario(admin, userId);

      return NextResponse.json({
        success: true,
        thread: {
          id: thread.id,
          category: thread.category,
          status: thread.status,
          lastMessageAt: thread.last_message_at,
          lastSender: thread.last_sender,
          preview: thread.last_preview || "",
        },
        messages: mensagens,
        unreadTotal,
      });
    }

    if (action === "create") {
      const categoria = String(corpo?.category || "");
      if (!categoriaValida(categoria)) {
        return erro("Escolha uma categoria para abrir o chamado.");
      }

      const texto = normalizarTexto(corpo?.body);
      const imagens = corpo?.images;

      if (!texto && (!Array.isArray(imagens) || imagens.length === 0)) {
        return erro("Escreva uma mensagem ou anexe uma imagem.");
      }
      if (Array.isArray(imagens) && imagens.length > MAX_IMAGENS_POR_MENSAGEM) {
        return erro(
          `Envie no máximo ${MAX_IMAGENS_POR_MENSAGEM} imagens por mensagem.`,
        );
      }

      const threadId = crypto.randomUUID();
      const agora = new Date().toISOString();

      const { error: erroCriacao } = await admin
        .from("support_threads")
        .insert({
          id: threadId,
          user_id: userId,
          user_name: nomeUsuario,
          user_email: emailUsuario,
          category: categoria,
          status: "open",
          unread_admin: 1,
          unread_user: 0,
          last_preview: resumoDaMensagem(
            texto,
            Array.isArray(imagens) && imagens.length > 0,
          ),
          last_sender: "user",
          last_message_at: agora,
          created_at: agora,
          updated_at: agora,
        });

      if (erroCriacao) {
        console.warn("[Suporte] Falha ao abrir chamado:", erroCriacao.message);
        return erro("Não foi possível abrir o chamado.", 500);
      }

      let caminhos: string[] = [];
      try {
        caminhos = await subirImagensDoSuporte(
          admin,
          userId,
          threadId,
          imagens,
        );
      } catch (falhaImagem: any) {
        // Sem a mensagem o chamado vazio não serve para nada: desfaz tudo.
        await admin.from("support_threads").delete().eq("id", threadId);
        return erro(falhaImagem?.message || "Não foi possível anexar a imagem.");
      }

      const { error: erroMensagem } = await admin
        .from("support_messages")
        .insert({
          thread_id: threadId,
          sender: "user",
          author_id: userId,
          body: texto,
          image_paths: caminhos,
        });

      if (erroMensagem) {
        console.warn(
          "[Suporte] Falha ao gravar mensagem inicial:",
          erroMensagem.message,
        );
        await admin.from("support_threads").delete().eq("id", threadId);
        return erro("Não foi possível enviar a mensagem.", 500);
      }

      return NextResponse.json({ success: true, threadId });
    }

    if (action === "send") {
      const threadId = String(corpo?.threadId || "");
      if (!threadId) return erro("Chamado não informado.");

      const texto = normalizarTexto(corpo?.body);
      const imagens = corpo?.images;

      if (!texto && (!Array.isArray(imagens) || imagens.length === 0)) {
        return erro("Escreva uma mensagem ou anexe uma imagem.");
      }
      if (Array.isArray(imagens) && imagens.length > MAX_IMAGENS_POR_MENSAGEM) {
        return erro(
          `Envie no máximo ${MAX_IMAGENS_POR_MENSAGEM} imagens por mensagem.`,
        );
      }

      const { data: thread, error: erroThread } = await admin
        .from("support_threads")
        .select("id, user_id, unread_admin")
        .eq("id", threadId)
        .eq("user_id", userId)
        .maybeSingle();

      if (erroThread || !thread) {
        return erro("Chamado não encontrado.", 404);
      }

      let caminhos: string[] = [];
      try {
        caminhos = await subirImagensDoSuporte(
          admin,
          userId,
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
          sender: "user",
          author_id: userId,
          body: texto,
          image_paths: caminhos,
        });

      if (erroMensagem) {
        console.warn(
          "[Suporte] Falha ao enviar mensagem:",
          erroMensagem.message,
        );
        return erro("Não foi possível enviar a mensagem.", 500);
      }

      const agora = new Date().toISOString();
      await admin
        .from("support_threads")
        .update({
          unread_admin: (Number(thread.unread_admin) || 0) + 1,
          unread_user: 0,
          status: "open",
          last_preview: resumoDaMensagem(
            texto,
            Array.isArray(imagens) && imagens.length > 0,
          ),
          last_sender: "user",
          last_message_at: agora,
          updated_at: agora,
        })
        .eq("id", threadId)
        .eq("user_id", userId);

      return NextResponse.json({ success: true });
    }

    return erro("Ação inválida para o suporte.", 400);
  } catch (erroGeral: any) {
    console.warn("[Suporte] Erro inesperado:", erroGeral);
    return erro("Não foi possível concluir a operação.", 500);
  }
}
