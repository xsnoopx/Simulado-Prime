import { CATEGORIAS_CHARADAS, STATIC_CHARADAS } from './charadas-data';
import type {
  CategoriaCharada,
  CategoriaCharadaId,
  Charada,
  DificuldadeCharada,
} from './charadas-tipos';

export { CATEGORIAS_CHARADAS, STATIC_CHARADAS };
export type { CategoriaCharadaId, Charada, DificuldadeCharada };

export const DIFICULDADES: DificuldadeCharada[] = ['Simples', 'Médio', 'Complexo'];

export const TOTAL_CHARADAS = STATIC_CHARADAS.length;

export const CATEGORIA_POR_ID: Record<CategoriaCharadaId, CategoriaCharada> =
  CATEGORIAS_CHARADAS.reduce((mapa, categoria) => {
    mapa[categoria.id] = categoria;
    return mapa;
  }, {} as Record<CategoriaCharadaId, CategoriaCharada>);

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function contarPorCategoria(itens: Charada[] = STATIC_CHARADAS): Record<CategoriaCharadaId, number> {
  const contagem = {} as Record<CategoriaCharadaId, number>;
  for (const categoria of CATEGORIAS_CHARADAS) contagem[categoria.id] = 0;
  for (const item of itens) contagem[item.categoria] += 1;
  return contagem;
}

const DICAS_POR_CATEGORIA: Record<CategoriaCharadaId, string> = {
  classicas: 'Pense em um objeto, animal ou situação do dia a dia.',
  trocadilhos: 'Preste atenção ao som das palavras: a resposta costuma brincar com outra expressão.',
  animais: 'Lembre de um bicho e das características que ele tem em comum com a pergunta.',
  comida: 'Pense em um alimento, tempero ou utensílio de cozinha.',
  escola: 'A resposta pode estar em uma matéria, um objeto escolar ou uma expressão de sala de aula.',
  profissoes: 'Pense em um ofício e nas ferramentas ou expressões que ele usa.',
  geografia: 'A resposta é um lugar, país, estado, cidade ou rio com nome parecido com a pista.',
  logica: 'Leia o enunciado com calma: muitas vezes a pegadinha está em uma palavra.',
  matematica: 'Monte a conta com calma e confira se o enunciado esconde alguma inversão.',
};

export function obterDica(charada: Charada): string {
  if (charada.dica) return charada.dica;

  const resposta = charada.resposta.replace(/\.$/, '').trim();
  const palavras = resposta.split(/\s+/).filter(Boolean);
  const letras = resposta.replace(/[^A-Za-zÀ-ÿ]/g, '');

  if (palavras.length <= 4 && letras.length >= 2 && letras.length <= 28) {
    const inicial = letras[0].toUpperCase();
    return `A resposta começa com “${inicial}” e tem ${letras.length} letras.`;
  }

  return DICAS_POR_CATEGORIA[charada.categoria];
}

export interface FiltrosCharada {
  busca?: string;
  categoria?: CategoriaCharadaId | 'todas';
  dificuldade?: DificuldadeCharada | 'todas';
  somenteNaoVistas?: boolean;
  progresso?: ProgressoCharadas;
}

export function filtrarCharadas(
  itens: Charada[] = STATIC_CHARADAS,
  filtros: FiltrosCharada = {}
): Charada[] {
  const termo = normalizarTexto(filtros.busca ?? '');
  const categoria = filtros.categoria ?? 'todas';
  const dificuldade = filtros.dificuldade ?? 'todas';

  return itens.filter((item) => {
    if (categoria !== 'todas' && item.categoria !== categoria) return false;
    if (dificuldade !== 'todas' && item.dificuldade !== dificuldade) return false;
    if (filtros.somenteNaoVistas && filtros.progresso?.[item.id]?.status === 'acertei') {
      return false;
    }
    if (!termo) return true;

    const categoriaInfo = CATEGORIA_POR_ID[item.categoria];
    const alvo = normalizarTexto(
      [
        item.pergunta,
        item.resposta,
        item.dica ?? '',
        item.explicacao ?? '',
        categoriaInfo?.label ?? '',
        ...(item.tags ?? []),
      ].join(' ')
    );
    return termo.split(' ').every((parte) => alvo.includes(parte));
  });
}

export function charadaDoDia(itens: Charada[] = STATIC_CHARADAS, data: Date = new Date()): Charada {
  const dias = Math.floor(
    Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / 86_400_000
  );
  const indice = ((dias % itens.length) + itens.length) % itens.length;
  return itens[indice];
}

export function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export type StatusCharada = 'acertei' | 'errei';

export interface ProgressoCharada {
  status: StatusCharada;
  tentativas: number;
  ultimaVez: number;
}

export type ProgressoCharadas = Record<string, ProgressoCharada>;

export const CHAVE_PROGRESSO = 'charadas_progresso_v1';

export function lerProgresso(): ProgressoCharadas {
  if (typeof window === 'undefined') return {};
  try {
    const bruto = window.localStorage.getItem(CHAVE_PROGRESSO);
    if (!bruto) return {};
    const dados = JSON.parse(bruto) as ProgressoCharadas;
    return dados && typeof dados === 'object' ? dados : {};
  } catch {
    return {};
  }
}

export function salvarProgresso(progresso: ProgressoCharadas): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
  } catch {
    // Armazenamento cheio ou bloqueado: o acervo continua funcionando.
  }
}

export function registrarResposta(
  progresso: ProgressoCharadas,
  id: string,
  status: StatusCharada
): ProgressoCharadas {
  const anterior = progresso[id];
  return {
    ...progresso,
    [id]: {
      status,
      tentativas: (anterior?.tentativas ?? 0) + 1,
      ultimaVez: Date.now(),
    },
  };
}

export function limparProgresso(): ProgressoCharadas {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(CHAVE_PROGRESSO);
    } catch {
      // Ignora falhas de armazenamento.
    }
  }
  return {};
}

/**
 * Formata o percentual de forma legível mesmo quando o jogador começou agora.
 * Com centenas de itens, 1 resposta rende menos de 1% — mostrar "0,2%" é mais
 * honesto do que esconder o avanço atrás de "<1%".
 */
export function formatarPercentual(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) return '0';
  const arredondado = valor < 10 ? Math.round(valor * 10) / 10 : Math.round(valor);
  const seguro = arredondado === 0 ? 0.1 : arredondado;
  return String(seguro).replace('.', ',');
}

export function estatisticasProgresso(
  progresso: ProgressoCharadas,
  itens: Charada[] = STATIC_CHARADAS
): {
  resolvidos: number;
  tentados: number;
  total: number;
  percentual: number;
  percentualExato: number;
  percentualFormatado: string;
} {
  const ids = new Set(itens.map((item) => item.id));
  let resolvidos = 0;
  let tentados = 0;

  for (const [id, registro] of Object.entries(progresso)) {
    if (!ids.has(id)) continue;
    tentados += 1;
    if (registro.status === 'acertei') resolvidos += 1;
  }

  const percentualExato = itens.length > 0 ? (resolvidos / itens.length) * 100 : 0;

  return {
    resolvidos,
    tentados,
    total: itens.length,
    percentual: Math.round(percentualExato),
    percentualExato,
    percentualFormatado: formatarPercentual(percentualExato),
  };
}
