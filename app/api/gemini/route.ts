import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "@/lib/supabaseConfig";

// Requests above this size are rejected before reaching the AI provider.
const MAX_PROMPT_LENGTH = 20000;

type MotivoLimite = "dia" | "minuto";

interface UsoIa {
  permitido: boolean;
  motivo: MotivoLimite | null;
  usos_dia: number;
  limite_dia: number;
  restantes_dia: number;
  limite_minuto: number;
}

function cleanAndParseJSON(text: string) {
  if (!text) return null;
  text = text.trim();

  // Remove markdown code block markers
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/i, "");
    text = text.replace(/\n?```$/i, "");
    text = text.trim();
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Error parsing cleaned JSON:", err);
    // Try to find a JSON block using regex if there's surrounding text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err2) {
        console.error("Error parsing matched JSON:", err2);
      }
    }
    return null;
  }
}

/**
 * Mensagem amigável para o limite por conta. O cliente mostra `error`
 * diretamente, então nada de status HTTP ou nome de tabela aqui.
 */
function respostaDeLimite(uso: UsoIa) {
  if (uso.motivo === "minuto") {
    return NextResponse.json(
      {
        error: `Calma aí! Você fez ${uso.limite_minuto} gerações em sequência. Aguarde alguns segundos e tente de novo.`,
        motivo: "minuto",
        limite: uso.limite_minuto,
      },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return NextResponse.json(
    {
      error: `Você atingiu o limite de ${uso.limite_dia} gerações de IA por dia. O limite renova à meia-noite (horário de Brasília).`,
      motivo: "dia",
      limite: uso.limite_dia,
    },
    { status: 429, headers: { "Retry-After": "3600" } }
  );
}

export async function POST(req: NextRequest) {
  // Preenchido depois que a geração é contada. Se algo estourar no meio do
  // caminho, o catch devolve a geração em vez de deixar o usuário no prejuízo.
  let devolverGeracao: (() => Promise<void>) | null = null;

  try {
    const body = await req.json().catch(() => null);
    const prompt = body?.prompt;
    const responseSchema = body?.responseSchema;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "O parâmetro prompt é obrigatório." }, { status: 400 });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `O prompt excede o limite de ${MAX_PROMPT_LENGTH} caracteres.` },
        { status: 413 }
      );
    }

    const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Only signed-in users may spend AI credits through this proxy.
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "Entre na sua conta para usar os recursos de inteligência artificial." },
        { status: 401 }
      );
    }

    // The token signature is verified by Supabase, so forged JWTs are rejected here.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada. Entre novamente para continuar." },
        { status: 401 }
      );
    }

    // A cota do Gemini é do projeto inteiro. O limite por conta evita que uma
    // pessoa sozinha consuma a cota de todos os usuários.
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

    const admin = serviceKey
      ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
      : null;

    /**
     * Devolve a geração do dia quando a IA falha depois de já ter contado.
     * Sem isso, uma instabilidade do Gemini custa crédito do usuário sem que
     * ele receba conteúdo nenhum.
     *
     * O contador do minuto continua consumido de propósito: assim ninguém
     * martela a função tentando gastar a cota do projeto.
     */
    const devolverUso = async (motivo: string) => {
      if (!admin) return;

      const { error } = await admin.rpc("devolver_ai_usage", {
        p_user_id: user.id,
      });

      if (error) {
        console.warn(
          "[AI Proxy] Não foi possível devolver a geração:",
          error.message
        );
        return;
      }

      console.log("[AI Proxy] Geração devolvida", { userId: user.id, motivo });
    };

    if (admin) {
      const { data, error: usageError } = await admin.rpc("consumir_ai_usage", {
        p_user_id: user.id,
      });

      if (usageError) {
        // Migração ainda não aplicada ou banco instável: não derruba a IA.
        console.warn("[AI Proxy] Limite por conta indisponível:", usageError.message);
      } else {
        const uso = (Array.isArray(data) ? data[0] : data) as UsoIa | null;
        if (uso && !uso.permitido) {
          console.log("[AI Proxy] Limite atingido", {
            userId: user.id,
            motivo: uso.motivo,
          });
          return respostaDeLimite(uso);
        }
      }
    } else {
      console.warn(
        "[AI Proxy] SUPABASE_SERVICE_ROLE_KEY ausente: limite por conta desativado."
      );
    }

    const edgeUrl = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/gemini-chat`;
    console.log("[AI Proxy] Chamando gemini-chat para o usuário", user.id);

    // A partir daqui a geração já foi contada: qualquer exceção precisa devolver.
    devolverGeracao = () => devolverUso("excecao");

    // A função também exige o segredo do proxy; sem ele, ninguém chama a IA
    // direto do navegador, nem mesmo com um token de usuário válido.
    const edgeHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    };

    const proxySecret = process.env.AI_PROXY_SECRET?.trim();
    if (proxySecret) {
      edgeHeaders["x-ai-proxy-secret"] = proxySecret;
    }

    let edgeResponse: Response;
    try {
      edgeResponse = await fetch(edgeUrl, {
        method: "POST",
        headers: edgeHeaders,
        body: JSON.stringify({
          prompt: prompt,
          responseSchema: responseSchema,
        }),
      });
    } catch (erroRede) {
      console.error("[AI Proxy] Falha de rede ao chamar a Edge Function:", erroRede);
      await devolverUso("rede");
      return NextResponse.json(
        {
          error:
            "Erro de conexão com o serviço de IA. Verifique sua internet e tente novamente.",
        },
        { status: 503 }
      );
    }

    if (!edgeResponse.ok) {
      const status = edgeResponse.status;
      const errText = await edgeResponse.text();
      console.error(
        "[AI Proxy] Edge Function respondeu",
        status,
        errText.slice(0, 300)
      );

      const detalhe = errText.toLowerCase();

      // Nada de conteúdo chegou ao usuário: a geração do dia volta para ele.
      // Só a do minuto permanece gasta (proteção contra martelar a função).

      // Cota do Google estourada (429/RESOURCE_EXHAUSTED) ou limite do minuto.
      if (
        status === 429 ||
        detalhe.includes("resource_exhausted") ||
        detalhe.includes("quota") ||
        detalhe.includes("rate limit")
      ) {
        await devolverUso("alta-demanda");
        return NextResponse.json(
          {
            error:
              "A IA está com alta demanda agora. Aguarde alguns segundos e tente novamente.",
          },
          { status: 429, headers: { "Retry-After": "30" } }
        );
      }

      if (status === 401 || status === 403) {
        await devolverUso("sessao-recusada");
        return NextResponse.json(
          { error: "Sessão inválida ou expirada. Entre novamente para continuar." },
          { status: 401 }
        );
      }

      if (status === 413) {
        await devolverUso("pedido-grande");
        return NextResponse.json(
          { error: "O pedido é grande demais para a IA. Tente um texto menor." },
          { status: 413 }
        );
      }

      if (status >= 500) {
        await devolverUso("instabilidade");
        return NextResponse.json(
          {
            error:
              "O serviço de IA está instável no momento. Tente novamente em instantes.",
          },
          { status: 503 }
        );
      }

      await devolverUso("resposta-inesperada");
      return NextResponse.json(
        { error: "Não foi possível gerar o conteúdo agora. Tente novamente." },
        { status: 502 }
      );
    }

    const resJson = await edgeResponse.json();
    // Never log the generated content: prompts may contain user-provided text.
    console.log("[AI Proxy] Resposta recebida da Edge Function");

    // Extract the main string response
    let rawText = "";
    if (resJson && typeof resJson === "object") {
      if (resJson.resposta) {
        rawText = resJson.resposta;
      } else if (resJson.text) {
        rawText = resJson.text;
      } else if (resJson.content) {
        rawText = resJson.content;
      } else if (resJson.result) {
        rawText = resJson.result;
      } else {
        rawText = JSON.stringify(resJson);
      }
    } else {
      rawText = String(resJson);
    }

    // Só tenta interpretar JSON quando o chamador pediu uma resposta estruturada.
    // Assim uma resposta de texto simples não gera erro falso no log.
    const parsedObj = responseSchema ? cleanAndParseJSON(rawText) : null;
    const finalResponseText = parsedObj ? JSON.stringify(parsedObj) : rawText;

    if (!finalResponseText || !finalResponseText.trim()) {
      await devolverUso("resposta-vazia");
      return NextResponse.json(
        { error: "A IA não retornou conteúdo. Tente novamente." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: finalResponseText });
  } catch (err: unknown) {
    console.error("Erro ao gerar conteúdo via Supabase Edge Function:", err);

    if (devolverGeracao) {
      await devolverGeracao();
    }

    const mensagem = err instanceof Error ? err.message : String(err);

    if (/fetch|network|connect|econn|enotfound/i.test(mensagem)) {
      return NextResponse.json(
        {
          error:
            "Erro de conexão com o serviço de IA. Verifique sua internet e tente novamente.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao gerar conteúdo com a IA. Tente novamente." },
      { status: 500 }
    );
  }
}
