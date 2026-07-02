import { syncAllDataToSupabase } from './supabaseSync';

export interface CategoryStats {
  correct: number;
  incorrect: number;
  answered: number;
}

export interface SimuladoStats {
  linguagens: CategoryStats;
  matematica: CategoryStats;
  humanas: CategoryStats;
  natureza: CategoryStats;
}

const DEFAULT_STATS: SimuladoStats = {
  linguagens: { correct: 0, incorrect: 0, answered: 0 },
  matematica: { correct: 0, incorrect: 0, answered: 0 },
  humanas: { correct: 0, incorrect: 0, answered: 0 },
  natureza: { correct: 0, incorrect: 0, answered: 0 },
};

export function getStats(): SimuladoStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const data = localStorage.getItem('simulado_stats');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        linguagens: { ...DEFAULT_STATS.linguagens, ...(parsed.linguagens || {}) },
        matematica: { ...DEFAULT_STATS.matematica, ...(parsed.matematica || {}) },
        humanas: { ...DEFAULT_STATS.humanas, ...(parsed.humanas || {}) },
        natureza: { ...DEFAULT_STATS.natureza, ...(parsed.natureza || {}) },
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

export function recordAnswer(category: string, isCorrect: boolean) {
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
