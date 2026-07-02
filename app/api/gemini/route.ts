import { NextRequest, NextResponse } from "next/server";

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

    if (!prompt) {
      return NextResponse.json({ error: "O parâmetro prompt é obrigatório." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tobdeehicqircazdtbnx.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmRlZWhpY3FpcmNhemR0Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTUwMzksImV4cCI6MjA5NDczMTAzOX0.VY3oMLeg94CJmsTfta8550iIrFo68mtJO3XlN3eLYeg';

    console.log("[Supabase Edge Function] Chamando gemini-chat na URL https://tobdeehicqircazdtbnx.supabase.co/functions/v1/gemini-chat...");
    
    const edgeResponse = await fetch("https://tobdeehicqircazdtbnx.supabase.co/functions/v1/gemini-chat", {
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
      throw new Error(`Edge Function returned status ${edgeResponse.status}: ${errText}`);
    }

    const resJson = await edgeResponse.json();
    console.log("[Supabase Edge Function] Resposta recebida:", resJson);

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
