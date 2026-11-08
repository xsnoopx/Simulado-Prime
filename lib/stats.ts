import { syncAllDataToSupabase } from './supabaseSync';

export type ModoSimulado = 'regular' | 'challenge' | 'hardcore' | 'survival';

export interface CategoryStats {
  correct: number;
  incorrect: number;
  answered: number;
  // XP acumulado da categoria. Fica opcional para aceitar estatísticas antigas
  // (sem XP) vindas do localStorage ou do Supabase.
  xp?: number;
}

export interface SimuladoStats {
  linguagens: CategoryStats;
  matematica: CategoryStats;
  humanas: CategoryStats;
  natureza: CategoryStats;
}

// XP ganho por resposta em cada modo de treino.
// No Regular, errar não dá nem tira XP.
export const XP_POR_MODO: Record<ModoSimulado, { acerto: number; erro: number }> = {
  regular: { acerto: 5, erro: 0 },
  hardcore: { acerto: 15, erro: 5 },
  challenge: { acerto: 25, erro: 10 },
  survival: { acerto: 30, erro: 15 },
};

// Regra usada para converter estatísticas antigas (só acertos/erros) em XP,
// preservando o que o jogador já havia conquistado.
const XP_LEGADO = { acerto: 15, erro: 5 } as const;

const DEFAULT_STATS: SimuladoStats = {
  linguagens: { correct: 0, incorrect: 0, answered: 0, xp: 0 },
  matematica: { correct: 0, incorrect: 0, answered: 0, xp: 0 },
  humanas: { correct: 0, incorrect: 0, answered: 0, xp: 0 },
  natureza: { correct: 0, incorrect: 0, answered: 0, xp: 0 },
};

export function xpDaCategoria(categoria?: CategoryStats | null): number {
  if (!categoria) return 0;

  const xpSalvo = Number(categoria.xp);
  if (Number.isFinite(xpSalvo)) {
    return Math.max(0, xpSalvo);
  }

  // Compatibilidade: antes o XP era calculado por 15/acerto e 5/erro.
  return Math.max(
    0,
    (categoria.correct || 0) * XP_LEGADO.acerto + (categoria.incorrect || 0) * XP_LEGADO.erro
  );
}

function normalizarCategoria(
  base: CategoryStats,
  salva: Partial<CategoryStats> | undefined
): CategoryStats {
  const correct = Number(salva?.correct ?? base.correct) || 0;
  const incorrect = Number(salva?.incorrect ?? base.incorrect) || 0;
  const answered = Number(salva?.answered ?? base.answered) || 0;
  const xpSalvo = Number(salva?.xp);

  return {
    correct,
    incorrect,
    answered,
    // Estatísticas antigas não têm `xp`: converte pelos valores legados.
    xp: Number.isFinite(xpSalvo)
      ? Math.max(0, xpSalvo)
      : Math.max(0, correct * XP_LEGADO.acerto + incorrect * XP_LEGADO.erro),
  };
}

export function getStats(): SimuladoStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const data = localStorage.getItem('simulado_stats');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        linguagens: normalizarCategoria(DEFAULT_STATS.linguagens, parsed.linguagens),
        matematica: normalizarCategoria(DEFAULT_STATS.matematica, parsed.matematica),
        humanas: normalizarCategoria(DEFAULT_STATS.humanas, parsed.humanas),
        natureza: normalizarCategoria(DEFAULT_STATS.natureza, parsed.natureza),
      };
    }
  } catch (e) {
    console.warn("Could not read stats", e);
  }
  return DEFAULT_STATS;
}

export function saveStats(stats: SimuladoStats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('simulado_stats', JSON.stringify(stats));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stats-updated', { detail: stats }));
    }
    // Asynchronously update Supabase in background
    syncAllDataToSupabase().catch((err) => {
      console.warn("Error background syncing stats to Supabase:", err);
    });
  } catch (e) {
    console.warn("Could not save stats", e);
  }
}

/**
 * Registra uma resposta e soma o XP da categoria conforme o modo de treino.
 * O modo padrão é `regular`, para chamadas antigas continuarem funcionando.
 */
export function recordAnswer(
  category: string,
  isCorrect: boolean,
  mode: ModoSimulado = 'regular'
) {
  if (typeof window === 'undefined') return;
  
  let catKey: keyof SimuladoStats = 'linguagens';
  const c = category.toLowerCase();
  
  if (c.includes('matematica') || c.includes('matemática')) {
    catKey = 'matematica';
  } else if (c.includes('humanas')) {
    catKey = 'humanas';
  } else if (c.includes('natureza')) {
    catKey = 'natureza';
  } else if (c.includes('linguagens') || c.includes('linguagem')) {
    catKey = 'linguagens';
  } else {
    return;
  }
  
  const stats = getStats();
  stats[catKey].answered += 1;
  if (isCorrect) {
    stats[catKey].correct += 1;
  } else {
    stats[catKey].incorrect += 1;
  }

  const regra = XP_POR_MODO[mode] ?? XP_POR_MODO.regular;
  stats[catKey].xp = xpDaCategoria(stats[catKey]) + (isCorrect ? regra.acerto : regra.erro);

  saveStats(stats);
}

export function resetStats() {
  saveStats(DEFAULT_STATS);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ach_progresso_zerado', 'true');
    } catch (e) {
      console.warn("Could not set ach_progresso_zerado", e);
    }
  }
}
