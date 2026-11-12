// Constantes e formatadores do Suporte Cósmico compartilhados entre o cliente
// e as rotas de API. Nada aqui pode conter segredo: o arquivo vai para o bundle.

export const CATEGORIAS_SUPORTE = [
  {
    id: "bug",
    nome: "Bug",
    emoji: "🐞",
    descricao: "Algo quebrou ou está errado",
    chip: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    selo: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  {
    id: "elogio",
    nome: "Elogio",
    emoji: "💜",
    descricao: "Conte o que você gostou",
    chip: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    selo: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  {
    id: "sugestao",
    nome: "Sugestão",
    emoji: "💡",
    descricao: "Ideia para melhorar o app",
    chip: "border-indigo-400/40 bg-indigo-500/15 text-indigo-200",
    selo: "bg-indigo-500/15 text-indigo-200 border-indigo-400/30",
  },
  {
    id: "duvida",
    nome: "Dúvida",
    emoji: "❓",
    descricao: "Precisa de uma explicação",
    chip: "border-sky-400/40 bg-sky-500/15 text-sky-200",
    selo: "bg-sky-500/15 text-sky-200 border-sky-400/30",
  },
  {
    id: "outro",
    nome: "Outro",
    emoji: "✳️",
    descricao: "Um assunto diferente",
    chip: "border-slate-400/40 bg-slate-400/10 text-slate-200",
    selo: "bg-slate-400/10 text-slate-200 border-slate-400/30",
  },
] as const;

export type CategoriaSuporteId = (typeof CATEGORIAS_SUPORTE)[number]["id"];

export const IDS_CATEGORIAS_SUPORTE = CATEGORIAS_SUPORTE.map(
  (categoria) => categoria.id,
);

export function categoriaSuporte(id?: string | null) {
  return (
    CATEGORIAS_SUPORTE.find((categoria) => categoria.id === id) ||
    CATEGORIAS_SUPORTE[CATEGORIAS_SUPORTE.length - 1]
  );
}

export function categoriaValida(id: unknown): id is CategoriaSuporteId {
  return (
    typeof id === "string" &&
    IDS_CATEGORIAS_SUPORTE.includes(id as CategoriaSuporteId)
  );
}

/** Texto curto de horário usado nas listas e nas bolhas do chat. */
export function tempoCurto(dataIso?: string | null): string {
  if (!dataIso) return "";
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return "";

  const diferenca = Date.now() - data.getTime();
  const minutos = Math.floor(diferenca / 60000);

  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `${dias} dias`;

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function statusDoChamado(status: string, lastSender?: string | null) {
  if (status === "resolved") {
    return { texto: "Resolvido", classe: "text-emerald-300" };
  }
  if (lastSender === "admin") {
    return { texto: "Respondido", classe: "text-primary-light" };
  }
  return { texto: "Aguardando admin", classe: "text-amber-300" };
}
