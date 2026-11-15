import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "@/lib/supabaseConfig";

// A geração pode demorar: a fila global pode segurar o pedido por alguns
// segundos e o Gemini às vezes leva outros tantos para responder. Sem isso, a
// Vercel cortaria a função no meio e o usuário veria erro sem motivo.
export const maxDuration = 60;

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

interface SlotGlobal {
  permitido: boolean;
  espera_segundos: number;
  na_janela: number;
}

/**
 * A cota do Gemini é do projeto inteiro, não de cada conta. O limite por conta
 * impede um abusador, mas não impede muita gente gerando ao mesmo tempo.
 *
 * Estes três números formam a fila global. O padrão de 8 por minuto deixa
 * folga sob o limite gratuito do modelo atual (~10 req/min). Com
 * faturamento ativo no Google, dá para subir pelo painel da Vercel.
 */
function lerNumero(valor: string | undefined, padrao: number, minimo: number) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return padrao;
  return Math.max(Math.trunc(numero), minimo);
}

const LIMITE_GLOBAL = lerNumero(process.env.AI_GLOBAL_LIMITE, 8, 1);
const JANELA_GLOBAL = lerNumero(process.env.AI_GLOBAL_JANELA_SEGUNDOS, 60, 1);
const ESPERA_GLOBAL = lerNumero(process.env.AI_GLOBAL_ESPERA_SEGUNDOS, 5, 0);

/**
 * Caminho principal da IA: chamada direta ao Gemini feita pelo servidor Next.
 *
 * Antes, toda geração passava pela Edge Function do Supabase. O gateway dela
 * devolveu "400 Bad Request" em HTML em janelas de instabilidade (redeploy e
 * retomada após ociosidade), e o usuário ficava sem conteúdo. Falar direto com
 * o Google tira esse salto do caminho. A chave continua só no servidor.
 *
 * A Edge Function permanece como reserva: se a chave não estiver configurada
 * (ou vier com formato inválido), a rota usa o caminho antigo.
 */
const MODELO_IA = process.env.GEMINI_MODELO?.trim() || "gemini-3.5-flash-lite";
const CHAVE_GEMINI = process.env.GEMINI_API_KEY?.trim() || "";

// Não validamos o formato da chave: o Google já mudou o padrão mais de uma vez.
// O que importa é que exista. Se o Google recusar, a rota volta sozinha para a
// Edge Function em vez de derrubar o usuário.
const USAR_GEMINI_DIRETO = CHAVE_GEMINI.length >= 20;

const INSTRUCAO_SISTEMA = "Você é um assistente útil focado em simulados.";

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

    /**
     * Guarda o motivo real da falha para diagnóstico. A API de logs do
     * Supabase não está disponível no plano atual, então a tabela `ai_erros`
     * é a forma de saber, depois, o que o Gemini respondeu.
     */
    const registrarErroIa = async (
      status: number,
      motivo: string,
      detalhe: string
    ) => {
      if (!admin) return;

      const { error } = await admin.from("ai_erros").insert({
        user_id: user.id,
        status,
        motivo,
        detalhe: detalhe.slice(0, 500),
      });

      if (error) {
        console.warn(
          "[AI Proxy] Não foi possível registrar o erro:",
          error.message
        );
      }
    };

    /**
     * Reserva uma vaga na fila global. Se a fila estiver cheia, espera alguns
     * segundos antes de desistir: em pico curto isso evita devolver erro para
     * quem só chegou na hora errada.
     *
     * Sem a migração aplicada, o RPC falha e a fila fica desligada (fail-open).
     */
    const reservarSlotGlobal = async (): Promise<{
      permitido: boolean;
      espera: number;
    }> => {
      if (!admin) return { permitido: true, espera: 0 };

      const inicio = Date.now();

      for (;;) {
        const { data, error } = await admin.rpc("reservar_slot_ia", {
          p_limite: LIMITE_GLOBAL,
          p_janela_segundos: JANELA_GLOBAL,
        });

        if (error) {
          console.warn(
            "[AI Proxy] Limitador global indisponível:",
            error.message
          );
          return { permitido: true, espera: 0 };
        }

        const slot = (Array.isArray(data) ? data[0] : data) as SlotGlobal | null;
        if (!slot || slot.permitido) {
          return { permitido: true, espera: 0 };
        }

        const esperaAteLiberar = Math.max(slot.espera_segundos ?? 1, 1);
        const decorrido = (Date.now() - inicio) / 1000;
        const restante = ESPERA_GLOBAL - decorrido;

        if (restante <= 0) {
          return { permitido: false, espera: esperaAteLiberar };
        }

        // Espera em passos de no máximo 1s para não segurar a função à toa.
        await new Promise((resolver) =>
          setTimeout(resolver, Math.min(restante, esperaAteLiberar, 1) * 1000)
        );
      }
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

    // Daqui para frente a geração já foi contada: qualquer exceção precisa devolver.
    devolverGeracao = () => devolverUso("excecao");

    const slotGlobal = await reservarSlotGlobal();
    if (!slotGlobal.permitido) {
      // A vaga não saiu: devolve a geração do dia, senão o usuário paga por
      // uma tentativa que nunca chegou ao Gemini.
      await devolverUso("fila-global");
      console.log("[AI Proxy] Fila global cheia", {
        userId: user.id,
        espera: slotGlobal.espera,
      });
      return NextResponse.json(
        {
          error: `Muita gente gerando agora. Tente de novo em ${slotGlobal.espera} segundo${
            slotGlobal.espera === 1 ? "" : "s"
          }.`,
        },
        { status: 429, headers: { "Retry-After": String(slotGlobal.espera) } }
      );
    }

    const edgeUrl = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/gemini-chat`;
    console.log(
      USAR_GEMINI_DIRETO
        ? "[AI Proxy] Chamando o Gemini direto para o usuário"
        : "[AI Proxy] Chamando gemini-chat para o usuário",
      user.id
    );

    // Reserva: a função exige o segredo do proxy, então ninguém chama a IA
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

    // Uma falha de rede ou do próprio provedor pode ser passageira. As
    // tentativas extras acontecem antes de o usuário ver erro e não cobram
    // outra geração dele.
    const ESPERAS_IA = [700, 2000, 4000];

    const chamarGeminiDireto = async (): Promise<Response> => {
      const resposta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_IA}:generateContent?key=${CHAVE_GEMINI}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: INSTRUCAO_SISTEMA }] },
          }),
        }
      );

      if (!resposta.ok) {
        // Mesmos cabeçalhos de diagnóstico da Edge Function, para o registro
        // em `ai_erros` continuar mostrando o motivo real da recusa.
        const detalhe = (await resposta.text()).replace(/[\r\n]+/g, " ").slice(0, 400);

        return new Response(
          JSON.stringify({ error: "Falha ao gerar conteúdo." }),
          {
            status: resposta.status,
            headers: {
              "Content-Type": "application/json",
              "x-gemini-status": String(resposta.status),
              "x-gemini-erro": detalhe,
            },
          }
        );
      }

      const dados = await resposta.json();
      const texto = dados?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (typeof texto !== "string" || !texto.trim()) {
        return new Response(
          JSON.stringify({ error: "A IA não retornou conteúdo." }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ resposta: texto }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    let provedorUsado = USAR_GEMINI_DIRETO ? "gemini" : "edge";

    const chamarEdge = () =>
      fetch(edgeUrl, {
        method: "POST",
        headers: edgeHeaders,
        body: JSON.stringify({
          prompt: prompt,
          responseSchema: responseSchema,
        }),
      });

    const chamarProvedor = async (): Promise<Response> => {
      if (!USAR_GEMINI_DIRETO) {
        return chamarEdge();
      }

      const resposta = await chamarGeminiDireto();

      // Chave recusada, modelo inexistente ou permissão negada: em vez de
      // derrubar o usuário, usa a Edge Function como reserva. Cota esgotada
      // (429) não entra aqui, porque a reserva também falharia.
      const detalheErro = resposta.headers.get("x-gemini-erro") || "";
      const problemaDeAcesso =
        resposta.status >= 400 &&
        resposta.status < 500 &&
        resposta.status !== 429 &&
        /api[ _-]?key|permission|not found|not supported|invalid|denied/i.test(
          detalheErro
        );

      if (problemaDeAcesso) {
        console.warn(
          "[AI Proxy] Gemini direto recusado; usando a Edge Function como reserva",
          resposta.status
        );
        provedorUsado = "edge-reserva";
        return chamarEdge();
      }

      return resposta;
    };

    const tentarIa = async (): Promise<Response> => {
      let ultimaFalha: unknown = null;

      for (let tentativa = 0; tentativa <= ESPERAS_IA.length; tentativa++) {
        try {
          const resposta = await chamarProvedor();

          // O gateway do Supabase responde 400 com HTML quando a função está
          // reiniciando; isso é falha de transporte, não do modelo.
          const htmlDeGateway =
            resposta.status === 400 &&
            (resposta.headers.get("content-type") || "").includes("text/html");

          if (!htmlDeGateway && resposta.status < 500) {
            return resposta;
          }

          ultimaFalha = new Error(`Serviço de IA respondeu ${resposta.status}`);
        } catch (erro) {
          ultimaFalha = erro;
        }

        const espera = ESPERAS_IA[tentativa];
        if (espera) {
          await new Promise((resolver) => setTimeout(resolver, espera));
        }
      }

      throw ultimaFalha ?? new Error("Serviço de IA indisponível");
    };

    let respostaIa: Response;
    try {
      respostaIa = await tentarIa();
    } catch (erroRede) {
      const mensagemErro = String(erroRede);
      const respostaDoGateway = /respondeu (\d+)/.exec(mensagemErro);
      const statusGateway = respostaDoGateway ? Number(respostaDoGateway[1]) : 0;

      console.error("[AI Proxy] Edge Function indisponível:", erroRede);
      await registrarErroIa(statusGateway, "gateway", mensagemErro.slice(0, 300));
      await devolverUso("gateway");

      if (statusGateway) {
        return NextResponse.json(
          {
            error:
              "O serviço de IA está instável no momento. Tente novamente em instantes.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Erro de conexão com o serviço de IA. Verifique sua internet e tente novamente.",
        },
        { status: 503 }
      );
    }

    if (!respostaIa.ok) {
      const status = respostaIa.status;
      const errText = await respostaIa.text();
      console.error(
        "[AI Proxy] Edge Function respondeu",
        status,
        errText.slice(0, 300)
      );

      const detalhe = errText.toLowerCase();

      // Detalhe real vindo do Gemini (cabeçalho preenchido pela Edge Function).
      const upstream = respostaIa.headers.get("x-gemini-erro") || "";
      await registrarErroIa(status, "edge", upstream || errText);

      // Nada de conteúdo chegou ao usuário: a geração do dia e a do minuto
      // voltam para ele. O risco de abuso fica contido pelo limitador global
      // (8 por minuto no projeto inteiro).

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

    const resJson = await respostaIa.json();
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
      await registrarErroIa(200, "resposta-vazia", rawText.slice(0, 300));
      await devolverUso("resposta-vazia");
      return NextResponse.json(
        { error: "A IA não retornou conteúdo. Tente novamente." },
        { status: 502 }
      );
    }

    // Cabeçalho de diagnóstico: mostra qual caminho atendeu o pedido, sem
    // expor chave nem prompt.
    return NextResponse.json(
      { text: finalResponseText },
      { headers: { "x-ai-provedor": provedorUsado } }
    );
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
