// Helpers exclusivos do servidor para o Suporte Cósmico.
//
// As tabelas de suporte não têm acesso público: toda leitura/escrita acontece
// aqui, com a service_role. O cliente só fala com /api/support e
// /api/admin/support usando o token da sessão.

import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/adminAccess";
import { resolveSupabaseConfig } from "@/lib/supabaseConfig";

export const BUCKET_SUPORTE = "support-uploads";
export const MAX_IMAGENS_POR_MENSAGEM = 3;
export const MAX_IMAGEM_BYTES = 5 * 1024 * 1024;
export const MAX_TEXTO_SUPORTE = 2000;

const MIMES_PERMITIDOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ImagemDecodificada = {
  buffer: Buffer;
  contentType: string;
  extensao: string;
};

export function criarClienteAdmin(): SupabaseClient | null {
  const { supabaseUrl } = resolveSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  );
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return null;

  return createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });
}

async function clienteComToken(token: string): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  );
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Confere a assinatura do JWT no Supabase e devolve o usuário autenticado. */
export async function verificarUsuarioDoToken(
  token: string,
): Promise<User | null> {
  if (!token) return null;
  try {
    const client = await clienteComToken(token);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (erro) {
    console.warn("[Suporte] Falha ao verificar token:", erro);
    return null;
  }
}

export async function verificarAdminDoToken(
  token: string,
): Promise<User | null> {
  const usuario = await verificarUsuarioDoToken(token);
  if (!usuario || !isAdminEmail(usuario.email)) return null;
  return usuario;
}

/** Aceita apenas data URLs de imagem já comprimidas pelo cliente. */
export function decodificarImagem(dataUrl: unknown): ImagemDecodificada {
  if (typeof dataUrl !== "string") {
    throw new Error("Imagem em formato inválido.");
  }

  const encontrado = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(
    dataUrl,
  );
  if (!encontrado) {
    throw new Error("Use uma imagem JPG, PNG ou WebP.");
  }

  const contentType = encontrado[1];
  const buffer = Buffer.from(encontrado[2].replace(/\s/g, ""), "base64");

  if (buffer.length === 0) {
    throw new Error("A imagem enviada está vazia.");
  }
  if (buffer.length > MAX_IMAGEM_BYTES) {
    throw new Error("Cada imagem pode ter no máximo 5 MB.");
  }

  return {
    buffer,
    contentType,
    extensao: MIMES_PERMITIDOS[contentType] || "jpg",
  };
}

export function normalizarTexto(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor.replace(/\r\n/g, "\n").trim().slice(0, MAX_TEXTO_SUPORTE);
}

/** Sobe as imagens para o bucket privado e devolve os caminhos salvos. */
export async function subirImagensDoSuporte(
  admin: SupabaseClient,
  userId: string,
  threadId: string,
  imagens: unknown,
): Promise<string[]> {
  if (!Array.isArray(imagens) || imagens.length === 0) return [];
  if (imagens.length > MAX_IMAGENS_POR_MENSAGEM) {
    throw new Error(
      `Envie no máximo ${MAX_IMAGENS_POR_MENSAGEM} imagens por mensagem.`,
    );
  }

  const caminhos: string[] = [];

  for (let indice = 0; indice < imagens.length; indice += 1) {
    const { buffer, contentType, extensao } = decodificarImagem(imagens[indice]);
    const caminho = `${userId}/${threadId}/${Date.now()}-${indice}.${extensao}`;

    const { error } = await admin.storage
      .from(BUCKET_SUPORTE)
      .upload(caminho, buffer, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(
        `Não foi possível anexar a imagem: ${error.message}. Tente novamente sem o anexo.`,
      );
    }

    caminhos.push(caminho);
  }

  return caminhos;
}

/** Gera URLs assinadas temporárias para exibir os prints no chat. */
export async function assinarImagens(
  admin: SupabaseClient,
  caminhos?: string[] | null,
): Promise<string[]> {
  if (!caminhos || caminhos.length === 0) return [];

  const urls = await Promise.all(
    caminhos.map(async (caminho) => {
      const { data, error } = await admin.storage
        .from(BUCKET_SUPORTE)
        .createSignedUrl(caminho, 60 * 60 * 24);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    }),
  );

  return urls.filter((url): url is string => Boolean(url));
}

export type MensagemSuporteRow = {
  id: string;
  sender: "user" | "admin" | "note";
  body: string;
  image_paths: string[] | null;
  created_at: string;
};

/** Converte as linhas do banco no formato que o chat consome. */
export async function serializarMensagens(
  admin: SupabaseClient,
  linhas: MensagemSuporteRow[],
) {
  return Promise.all(
    (linhas || []).map(async (linha) => ({
      id: linha.id,
      sender: linha.sender,
      body: linha.body,
      createdAt: linha.created_at,
      images: await assinarImagens(admin, linha.image_paths),
    })),
  );
}

export function resumoDaMensagem(texto: string, temImagem: boolean): string {
  if (texto) {
    return texto.length > 120 ? `${texto.slice(0, 117)}...` : texto;
  }
  return temImagem ? "📷 Imagem enviada" : "";
}
