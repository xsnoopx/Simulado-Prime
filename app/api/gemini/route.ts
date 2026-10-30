import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "@/lib/supabaseConfig";

// Requests above this size are rejected before reaching the AI provider.
const MAX_PROMPT_LENGTH = 20000;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, responseSchema } = body;

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

    const edgeUrl = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/gemini-chat`;
    console.log("[AI Proxy] Chamando gemini-chat para o usuário", user.id);

    const edgeResponse = await fetch(edgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey
      },
      body: JSON.stringify({
        prompt: prompt,
        responseSchema: responseSchema
      })
    });

    if (!edgeResponse.ok) {
      const errText = await edgeResponse.text();
      console.error("[AI Proxy] Edge Function respondeu", edgeResponse.status, errText.slice(0, 300));
      throw new Error(`Edge Function returned status ${edgeResponse.status}`);
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

    // Attempt to parse it as JSON to ensure we return a clean, stringified JSON object
    // if a JSON response is expected (responseSchema is provided)
    const parsedObj = cleanAndParseJSON(rawText);
    const finalResponseText = parsedObj ? JSON.stringify(parsedObj) : rawText;

    return NextResponse.json({ text: finalResponseText });
  } catch (err: any) {
    console.error("Erro ao gerar conteúdo via Supabase Edge Function:", err);
    
    let errorMessage = err.message || "Erro interno ao gerar conteúdo com a IA.";
    const errStr = String(errorMessage);
    
    if (errStr.includes("<html") || errStr.includes("502") || errStr.includes("Bad Gateway") || errStr.includes("gateway")) {
      errorMessage = "O serviço de IA do Supabase está temporariamente instável ou indisponível. Por favor, aguarde alguns segundos e tente novamente.";
    } else if (errStr.toLowerCase().includes("fetch") || errStr.toLowerCase().includes("network") || errStr.toLowerCase().includes("connect")) {
      errorMessage = "Erro de conexão com o Supabase. Por favor, verifique a sua conexão e tente novamente.";
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
