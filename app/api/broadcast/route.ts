import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supportServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Leitura pública do aviso ativo. Não exige login: o lembrete aparece também
 * para visitantes. Só a rota fala com a tabela (service_role), então o
 * histórico de avisos nunca fica exposto.
 */
export async function GET() {
  const semCache = { "Cache-Control": "no-store" };

  try {
    const admin = criarClienteAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, notice: null }, { headers: semCache });
    }

    const { data, error } = await admin
      .from("app_broadcasts")
      .select("id, title, body, tone, version, reexibir_horas, updated_at")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Tabela ainda não migrada ou banco fora: o app segue sem o balão.
      console.warn("[Aviso] Falha ao ler aviso ativo:", error.message);
      return NextResponse.json({ success: false, notice: null }, { headers: semCache });
    }

    if (!data) {
      return NextResponse.json({ success: true, notice: null }, { headers: semCache });
    }

    return NextResponse.json(
      {
        success: true,
        notice: {
          id: data.id,
          title: data.title || "",
          body: data.body || "",
          tone: data.tone || "info",
          version: Number(data.version) || 1,
          reexibirHoras: Number(data.reexibir_horas) || 12,
          updatedAt: data.updated_at,
        },
      },
      { headers: semCache },
    );
  } catch (erro) {
    console.warn("[Aviso] Erro inesperado:", erro);
    return NextResponse.json({ success: false, notice: null }, { headers: semCache });
  }
}
