import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Só o servidor do app pode chamar esta função. O segredo fica nos secrets do
// Supabase e nas variáveis de ambiente da Vercel.
const ORIGENS_PERMITIDAS = new Set([
  "https://simulado-prime-ashen.vercel.app",
  "http://localhost:3000",
]);

const MODELO = "gemini-2.5-flash";

function respostaJson(corpo: unknown, status: number, origem: string) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origem,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-ai-proxy-secret",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    },
  });
}

/** Lê o `role` do JWT sem validar a assinatura (o gateway já validou). */
function papelDoJwt(token: string): string | null {
  try {
    const parte = token.split(".")[1];
    if (!parte) return null;

    const base64 = parte
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parte.length / 4) * 4, "=");

    const payload = JSON.parse(atob(base64));
    return typeof payload?.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  const origemRecebida = req.headers.get("origin") ?? "";
  const origem = ORIGENS_PERMITIDAS.has(origemRecebida)
    ? origemRecebida
    : "https://simulado-prime-ashen.vercel.app";

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": origem,
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-ai-proxy-secret",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        Vary: "Origin",
      },
    });
  }

  if (req.method !== "POST") {
    return respostaJson({ error: "Método não permitido." }, 405, origem);
  }

  // A chave anon é pública (vai no bundle). Ela não pode gastar cota.
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const papel = papelDoJwt(token);

  if (!token || papel !== "authenticated" || (anonKey && token === anonKey)) {
    return respostaJson({ error: "Não autorizado." }, 401, origem);
  }

  // Segredo compartilhado com o servidor Next. Sem ele, nem um usuário logado
  // consegue chamar a função direto do navegador.
  const segredo = Deno.env.get("AI_PROXY_SECRET")?.trim();
  if (segredo && req.headers.get("x-ai-proxy-secret") !== segredo) {
    return respostaJson({ error: "Não autorizado." }, 401, origem);
  }

  let prompt = "";
  try {
    const corpo = await req.json();
    prompt = typeof corpo?.prompt === "string" ? corpo.prompt : "";
  } catch {
    return respostaJson({ error: "JSON inválido." }, 400, origem);
  }

  if (!prompt.trim()) {
    return respostaJson({ error: "O prompt é obrigatório." }, 400, origem);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("[gemini-chat] GEMINI_API_KEY ausente");
    return respostaJson({ error: "Serviço de IA não configurado." }, 500, origem);
  }

  try {
    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [{ text: "Você é um assistente útil focado em simulados." }],
          },
        }),
      }
    );

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      // Não registra o prompt: ele pode conter texto do usuário.
      console.error(
        "[gemini-chat] Gemini respondeu",
        resposta.status,
        detalhe.slice(0, 300)
      );
      return respostaJson(
        { error: "Falha ao gerar conteúdo." },
        resposta.status,
        origem
      );
    }

    const dados = await resposta.json();
    const texto = dados?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      console.error("[gemini-chat] Resposta sem texto");
      return respostaJson({ error: "A IA não retornou conteúdo." }, 502, origem);
    }

    return respostaJson({ resposta: texto }, 200, origem);
  } catch (erro) {
    console.error("[gemini-chat] Erro inesperado", erro);
    return respostaJson(
      { error: "Erro interno ao gerar conteúdo." },
      500,
      origem
    );
  }
});
