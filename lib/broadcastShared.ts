// Tons, rótulos e formatadores dos Avisos do aplicativo.
// Compartilhado entre o balão global, o painel do admin e as rotas de API.

export const TONS_AVISO = [
  {
    id: "info",
    nome: "Informação",
    emoji: "ℹ️",
    chip: "border-sky-400/40 bg-sky-500/15 text-sky-200",
    borda: "border-sky-400/25",
    icone: "text-sky-300",
    barra: "from-sky-400 to-cyan-400",
  },
  {
    id: "atencao",
    nome: "Atenção",
    emoji: "⚠️",
    chip: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    borda: "border-amber-400/25",
    icone: "text-amber-300",
    barra: "from-amber-300 to-orange-400",
  },
  {
    id: "novidade",
    nome: "Novidade",
    emoji: "✨",
    chip: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    borda: "border-emerald-400/25",
    icone: "text-emerald-300",
    barra: "from-emerald-400 to-teal-400",
  },
  {
    id: "manutencao",
    nome: "Manutenção",
    emoji: "🔧",
    chip: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    borda: "border-rose-400/25",
    icone: "text-rose-300",
    barra: "from-rose-400 to-pink-400",
  },
] as const;

export type TomAvisoId = (typeof TONS_AVISO)[number]["id"];

export const IDS_TOM_AVISO = TONS_AVISO.map((tom) => tom.id);

export function tomDoAviso(id?: string | null) {
  return TONS_AVISO.find((tom) => tom.id === id) || TONS_AVISO[0];
}

export function tomValido(id: unknown): id is TomAvisoId {
  return typeof id === "string" && IDS_TOM_AVISO.includes(id as TomAvisoId);
}

export const HORAS_REEXIBICAO = [6, 12, 24, 48] as const;

export const MAX_TITULO_AVISO = 80;
export const MAX_TEXTO_AVISO = 500;

export function rotuloHoras(horas: number) {
  return horas === 1 ? "1 hora" : `${horas} horas`;
}

export function formatarDataCurta(iso?: string | null) {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
