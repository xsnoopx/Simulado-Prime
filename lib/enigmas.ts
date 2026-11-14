import { CATEGORIAS_ENIGMAS, STATIC_ENIGMAS } from './enigmas-data';
import type {
  CategoriaEnigma,
  CategoriaEnigmaId,
  DificuldadeEnigma,
  Enigma,
} from './enigmas-tipos';

export { CATEGORIAS_ENIGMAS, STATIC_ENIGMAS };
export type { CategoriaEnigmaId, DificuldadeEnigma, Enigma };

export const DIFICULDADES: DificuldadeEnigma[] = ['Simples', 'Médio', 'Complexo'];

export const TOTAL_ENIGMAS = STATIC_ENIGMAS.length;

export const CATEGORIA_POR_ID: Record<CategoriaEnigmaId, CategoriaEnigma> =
  CATEGORIAS_ENIGMAS.reduce((mapa, categoria) => {
    mapa[categoria.id] = categoria;
    return mapa;
  }, {} as Record<CategoriaEnigmaId, CategoriaEnigma>);

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function contarPorCategoria(itens: Enigma[] = STATIC_ENIGMAS): Record<CategoriaEnigmaId, number> {
  const contagem = {} as Record<CategoriaEnigmaId, number>;
  for (const categoria of CATEGORIAS_ENIGMAS) contagem[categoria.id] = 0;
  for (const item of itens) contagem[item.categoria] += 1;
  return contagem;
}

const DICAS_POR_CATEGORIA: Record<CategoriaEnigmaId, string> = {
  classicos: 'Pense em um objeto, animal ou fenômeno do dia a dia.',
  logica: 'Separe as informações e teste cada possibilidade sem pressa.',
  matematica: 'Monte a conta com calma; às vezes a pegadinha está no enunciado.',
  palavras: 'Brincadeira com letras, sílabas, plurais ou sentido das palavras.',
  lateral: 'Questione a premissa: algo na cena não é o que parece.',
  misterio: 'Procure a pista que contradiz o depoimento ou a cena.',
  ciencia: 'Lembre de um princípio físico, químico ou biológico.',
  historia: 'Pense em mitos, civilizações e personagens que marcaram época.',
};

export function obterDica(enigma: Enigma): string {
  if (enigma.dica) return enigma.dica;

  const resposta = enigma.resposta.replace(/\.$/, '').trim();
  const palavras = resposta.split(/\s+/).filter(Boolean);
  const letras = resposta.replace(/[^A-Za-zÀ-ÿ]/g, '');

  if (palavras.length <= 4 && letras.length >= 2 && letras.length <= 28) {
    const inicial = letras[0].toUpperCase();
    return `A resposta começa com “${inicial}” e tem ${letras.length} letras.`;
  }

  return DICAS_POR_CATEGORIA[enigma.categoria];
}

export interface FiltrosEnigma {
  busca?: string;
  categoria?: CategoriaEnigmaId | 'todas';
  dificuldade?: DificuldadeEnigma | 'todas';
  somenteNaoResolvidos?: boolean;
  progresso?: ProgressoEnigmas;
}

export function filtrarEnigmas(
  itens: Enigma[] = STATIC_ENIGMAS,
  filtros: FiltrosEnigma = {}
): Enigma[] {
  const termo = normalizarTexto(filtros.busca ?? '');
  const categoria = filtros.categoria ?? 'todas';
  const dificuldade = filtros.dificuldade ?? 'todas';

  return itens.filter((item) => {
    if (categoria !== 'todas' && item.categoria !== categoria) return false;
    if (dificuldade !== 'todas' && item.dificuldade !== dificuldade) return false;
    if (filtros.somenteNaoResolvidos && filtros.progresso?.[item.id]?.status === 'acertei') {
      return false;
    }
    if (!termo) return true;

    const categoriaInfo = CATEGORIA_POR_ID[item.categoria];
    const alvo = normalizarTexto(
      [
        item.titulo,
        item.enigma,
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

export function enigmaDoDia(itens: Enigma[] = STATIC_ENIGMAS, data: Date = new Date()): Enigma {
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

export type StatusEnigma = 'acertei' | 'errei';

export interface ProgressoEnigma {
  status: StatusEnigma;
  tentativas: number;
  ultimaVez: number;
}

export type ProgressoEnigmas = Record<string, ProgressoEnigma>;

export const CHAVE_PROGRESSO = 'enigmas_progresso_v1';

export function lerProgresso(): ProgressoEnigmas {
  if (typeof window === 'undefined') return {};
  try {
    const bruto = window.localStorage.getItem(CHAVE_PROGRESSO);
    if (!bruto) return {};
    const dados = JSON.parse(bruto) as ProgressoEnigmas;
    return dados && typeof dados === 'object' ? dados : {};
  } catch {
    return {};
  }
}

export function salvarProgresso(progresso: ProgressoEnigmas): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
  } catch {
    // Armazenamento cheio ou bloqueado: o acervo continua funcionando.
  }
}

export function registrarResposta(
  progresso: ProgressoEnigmas,
  id: string,
  status: StatusEnigma
): ProgressoEnigmas {
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

export function limparProgresso(): ProgressoEnigmas {
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
 * Mesma regra do acervo de charadas: percentual com uma casa decimal quando
 * ainda é pequeno, para o primeiro acerto não desaparecer como "<1%".
 */
export function formatarPercentual(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) return '0';
  const arredondado = valor < 10 ? Math.round(valor * 10) / 10 : Math.round(valor);
  const seguro = arredondado === 0 ? 0.1 : arredondado;
  return String(seguro).replace('.', ',');
}

export function estatisticasProgresso(
  progresso: ProgressoEnigmas,
  itens: Enigma[] = STATIC_ENIGMAS
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
