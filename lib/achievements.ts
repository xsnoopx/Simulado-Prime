import { SimuladoStats } from './stats';
import { getSupabase } from './supabase';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  color: string;
}

export function getExperienceDetails(stats: SimuladoStats | null) {
  if (!stats) return { xp: 0, level: 1, baseTitle: 'Recruta do Cosmos', percent: 0, totalCorrect: 0, totalAnswered: 0 };

  const totalCorrect = (stats.linguagens?.correct || 0) + 
                       (stats.matematica?.correct || 0) + 
                       (stats.humanas?.correct || 0) + 
                       (stats.natureza?.correct || 0);

  const totalAnswered = (stats.linguagens?.answered || 0) + 
                        (stats.matematica?.answered || 0) + 
                        (stats.humanas?.answered || 0) + 
                        (stats.natureza?.answered || 0);

  const totalIncorrect = Math.max(0, totalAnswered - totalCorrect);

  // Calculate dynamic XP: 15 XP per correct, 5 XP per incorrect answer attempts
  const xp = (totalCorrect * 15) + (totalIncorrect * 5);
  
  // Smooth level thresholds of size 150 XP per level
  const levelStep = 150;
  const level = Math.floor(xp / levelStep) + 1;
  const levelXpRemainder = xp % levelStep;
  const percent = Math.floor((levelXpRemainder / levelStep) * 100);

  // Dynamic Title based on levels
  let baseTitle = 'Cadete do Cosmos';
  if (level >= 3) baseTitle = 'Explorador de Nebulosas';
  if (level >= 6) baseTitle = 'Viajante Sideral';
  if (level >= 10) baseTitle = 'Explorador de Galáxias';
  if (level >= 15) baseTitle = 'Sábio do Universo';

  return { xp, level, baseTitle, percent, totalCorrect, totalAnswered };
}

export function getAchievements(stats: SimuladoStats | null): Achievement[] {
  const xpInfo = getExperienceDetails(stats);

  // Carregar conquistas desbloqueadas salvas anteriormente do localStorage
  let savedUnlocked: string[] = [];
  const isClient = typeof window !== 'undefined';
  if (isClient) {
    try {
      const stored = localStorage.getItem('cosmos_unlocked_achievements_v1');
      if (stored) {
        savedUnlocked = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Erro ao carregar conquistas salvas:", e);
    }
  }

  const rawAchievements: Achievement[] = [
    {
      id: 'start',
      title: 'Impulso Inicial 🚀',
      desc: 'Respondeu sua primeira pergunta em qualquer simulado.',
      unlocked: xpInfo.totalAnswered >= 1,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'linguages',
      title: 'Mestre Orador 📚',
      desc: 'Acertou 5 ou mais questões de Linguagens.',
      unlocked: (stats?.linguagens?.correct || 0) >= 5,
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'math',
      title: 'Mestre de Newton 📐',
      desc: 'Acertou 5 ou mais questões de Matemática.',
      unlocked: (stats?.matematica?.correct || 0) >= 5,
      color: 'from-amber-600 to-red-500'
    },
    {
      id: 'nature',
      title: 'Bioma Sagrado 🔬',
      desc: 'Acertou 5 ou mais questões de Ciências da Natureza.',
      unlocked: (stats?.natureza?.correct || 0) >= 5,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'humanas',
      title: 'Historiador Estelar 🌍',
      desc: 'Acertou 5 ou mais questões de Ciências Humanas.',
      unlocked: (stats?.humanas?.correct || 0) >= 5,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'galaxy_hero',
      title: 'Guerreiro da Galáxia ☀️',
      desc: 'Respondeu e concluiu um total acumulado de 15+ questões.',
      unlocked: xpInfo.totalAnswered >= 15,
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 'level_5',
      title: 'Velocidade da Luz ⚡',
      desc: 'Alcançou o Nível 5 de estudo no Cosmos.',
      unlocked: xpInfo.level >= 5,
      color: 'from-yellow-400 to-amber-500'
    },
    {
      id: 'xp_500',
      title: 'Viajante Fantástico 🌌',
      desc: 'Acumulou 500 ou mais pontos de XP de conhecimento.',
      unlocked: xpInfo.xp >= 500,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'correct_10',
      title: 'Supernova Intelectual 🌠',
      desc: 'Acertou 10 ou mais questões no total acumulado.',
      unlocked: xpInfo.totalCorrect >= 10,
      color: 'from-yellow-300 to-red-600'
    },
    {
      id: 'answered_30',
      title: 'Explorador Lendário 👑',
      desc: 'Respondeu 30 ou mais questões totais no Cosmos.',
      unlocked: xpInfo.totalAnswered >= 30,
      color: 'from-teal-500 to-emerald-700'
    },
    {
      id: 'foco_sideral',
      title: 'Foco Sideral 🌐',
      desc: 'Acertou ao menos 2 questões em todas as 4 áreas espciais.',
      unlocked: (stats?.linguagens?.correct || 0) >= 2 && 
                (stats?.matematica?.correct || 0) >= 2 && 
                (stats?.humanas?.correct || 0) >= 2 && 
                (stats?.natureza?.correct || 0) >= 2,
      color: 'from-cyan-400 to-indigo-600'
    },
    {
      id: 'elite_pilot',
      title: 'Mestre do Multiverso 🛸',
      desc: 'Alcançou o grandioso Nível 10 de evolução espacial.',
      unlocked: xpInfo.level >= 10,
      color: 'from-orange-500 to-pink-600'
    },
    {
      id: 'first_syntax',
      title: 'Primeiro Contato 🛰️',
      desc: 'Respondeu ao menos 3 questões de Linguagens.',
      unlocked: (stats?.linguagens?.answered || 0) >= 3,
      color: 'from-violet-400 to-fuchsia-600'
    },
    {
      id: 'first_calculus',
      title: 'Aritmética Cósmica 🧮',
      desc: 'Respondeu ao menos 3 questões de Matemática.',
      unlocked: (stats?.matematica?.answered || 0) >= 3,
      color: 'from-rose-500 to-amber-500'
    },
    {
      id: 'first_history',
      title: 'Arqueólogo do Tempo ⏳',
      desc: 'Respondeu ao menos 3 questões de Ciências Humanas.',
      unlocked: (stats?.humanas?.answered || 0) >= 3,
      color: 'from-amber-500 to-orange-700'
    },
    {
      id: 'first_phys',
      title: 'Física de Partículas ⚛️',
      desc: 'Respondeu ao menos 3 questões de Ciências da Natureza.',
      unlocked: (stats?.natureza?.answered || 0) >= 3,
      color: 'from-emerald-400 to-cyan-500'
    },
    {
      id: 'correct_20',
      title: 'Constelação de Acertos ✨',
      desc: 'Alcançou a marca de 20 acertos totais no Cosmos.',
      unlocked: xpInfo.totalCorrect >= 20,
      color: 'from-sky-400 to-blue-600'
    },
    {
      id: 'answered_50',
      title: 'Andrômeda à Vista 🌀',
      desc: 'Concluiu 50 questões respondidas totais no aplicativo.',
      unlocked: xpInfo.totalAnswered >= 50,
      color: 'from-fuchsia-500 to-indigo-700'
    },
    {
      id: 'xp_1000',
      title: 'Império Cósmico 🏛️',
      desc: 'Acumulou mais de 1000 pontos do Cosmos XP.',
      unlocked: xpInfo.xp >= 1000,
      color: 'from-amber-400 to-yellow-600'
    },
    {
      id: 'level_15',
      title: 'Soberano das Estrelas 🪐',
      desc: 'Conquistou o ilustre Nível 15 de estudo espacial.',
      unlocked: xpInfo.level >= 15,
      color: 'from-teal-400 to-blue-600'
    },
    {
      id: 'linguages_10',
      title: 'Cícero do Cosmos 🗣️',
      desc: 'Acertou 10 ou mais questões na área de Linguagens.',
      unlocked: (stats?.linguagens?.correct || 0) >= 10,
      color: 'from-indigo-400 to-pink-500'
    },
    {
      id: 'math_10',
      title: 'Pitágoras Moderno 📐',
      desc: 'Acertou 10 ou mais questões de Matemática pura.',
      unlocked: (stats?.matematica?.correct || 0) >= 10,
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'nature_10',
      title: 'Darwin Sideral 🧬',
      desc: 'Acertou 10 ou mais questões de Ciências da Natureza.',
      unlocked: (stats?.natureza?.correct || 0) >= 10,
      color: 'from-green-400 to-emerald-600'
    },
    {
      id: 'humanas_10',
      title: 'Aristóteles Galáctico 🏛️',
      desc: 'Acertou 10 ou mais questões de Ciências Humanas.',
      unlocked: (stats?.humanas?.correct || 0) >= 10,
      color: 'from-cyan-400 to-teal-600'
    },
    {
      id: 'all_rounder_10',
      title: 'Polímata do Universo 🧠',
      desc: 'Respondeu ao menos 10 questões em cada uma das 4 áreas.',
      unlocked: (stats?.linguagens?.answered || 0) >= 10 && 
                (stats?.matematica?.answered || 0) >= 10 && 
                (stats?.humanas?.answered || 0) >= 10 && 
                (stats?.natureza?.answered || 0) >= 10,
      color: 'from-[#a5b4fc] to-[#818cf8]'
    },
    {
      id: 'xp_1500',
      title: 'Nuvem de Oort ☁️',
      desc: 'Reivindicou 1500 XP de conhecimentos cósmicos.',
      unlocked: xpInfo.xp >= 1500,
      color: 'from-slate-400 to-purple-600'
    },
    {
      id: 'level_3',
      title: 'Piloto Iniciante 🚁',
      desc: 'Subiu para o Nível 3 de evolução na plataforma.',
      unlocked: xpInfo.level >= 3,
      color: 'from-indigo-500 to-cyan-500'
    },
    {
      id: 'level_8',
      title: 'Mestre da Velocidade 🚀',
      desc: 'Alcançou com sucesso o Nível 8 de estudo.',
      unlocked: xpInfo.level >= 8,
      color: 'from-orange-400 to-rose-500'
    },
    {
      id: 'correct_30',
      title: 'Superestrela Cadente ☄️',
      desc: 'Alcançou a marca brilhante de 30 acertos acumulados.',
      unlocked: xpInfo.totalCorrect >= 30,
      color: 'from-pink-400 to-yellow-500'
    },
    {
      id: 'answered_100',
      title: 'Centenário de Órbita 💯',
      desc: 'Respondeu um total impressionante de 100 questões no Cosmos.',
      unlocked: xpInfo.totalAnswered >= 100,
      color: 'from-emerald-400 to-emerald-700'
    },
    {
      id: 'xp_3000',
      title: 'Núcleo Galáctico 🔥',
      desc: 'Rompeu a fronteira quântica acumulando 3000 XP.',
      unlocked: xpInfo.xp >= 3000,
      color: 'from-amber-500 to-red-700'
    },
    {
      id: 'linguages_15',
      title: 'Poliglota da Capital 🌌',
      desc: 'Acertou 15 ou mais questões de Linguagens.',
      unlocked: (stats?.linguagens?.correct || 0) >= 15,
      color: 'from-fuchsia-500 to-violet-700'
    },
    {
      id: 'math_15',
      title: 'Equação de Einstein 📝',
      desc: 'Acertou 15 ou mais questões na área de Matemática.',
      unlocked: (stats?.matematica?.correct || 0) >= 15,
      color: 'from-red-600 to-rose-800'
    },
    {
      id: 'nature_15',
      title: 'Alquimista do Vácuo 🧪',
      desc: 'Acertou 15 ou mais questões de Ciências da Natureza.',
      unlocked: (stats?.natureza?.correct || 0) >= 15,
      color: 'from-teal-400 to-green-600'
    },
    {
      id: 'humanas_15',
      title: 'Filósofo dos Anéis 🪐',
      desc: 'Acertou 15 ou mais questões de Ciências Humanas.',
      unlocked: (stats?.humanas?.correct || 0) >= 15,
      color: 'from-cyan-500 to-emerald-600'
    },
    {
      id: 'half_century',
      title: 'Metade do Caminho 🗺️',
      desc: 'Chegou em 50 acertos totais em simulados resolvidos.',
      unlocked: xpInfo.totalCorrect >= 50,
      color: 'from-lime-400 to-emerald-600'
    },
    {
      id: 'level_20',
      title: 'Deus Ex Machina ⚔️',
      desc: 'Consagrou seu estudo chegando ao supremo Nível 20.',
      unlocked: xpInfo.level >= 20,
      color: 'from-amber-400 to-amber-700'
    },
    {
      id: 'total_perfection',
      title: 'Alinhamento Planetário 🌟',
      desc: 'Mantenha precisão de acerto acima de 80% (mínimo 20 respondidas).',
      unlocked: xpInfo.totalAnswered >= 20 && (xpInfo.totalCorrect / xpInfo.totalAnswered) >= 0.8,
      color: 'from-yellow-400 to-emerald-500'
    },
    {
      id: 'gravity_defier',
      title: 'Desafiador de Gravidade 🪂',
      desc: 'Respondeu 75 ou mais questões no Cosmos.',
      unlocked: xpInfo.totalAnswered >= 75,
      color: 'from-cyan-300 to-blue-500'
    },
    {
      id: 'xp_5000',
      title: 'Zênite Supremo 🎆',
      desc: 'Chegou ao glorioso topo cósmico com 5000 XP!',
      unlocked: xpInfo.xp >= 5000,
      color: 'from-purple-500 to-rose-600'
    },
    {
      id: 'linguages_25',
      title: 'Bárbaro de Alexandria 📜',
      desc: 'Acertou 25 questões de Linguagens em simulados.',
      unlocked: (stats?.linguagens?.correct || 0) >= 25,
      color: 'from-violet-500 to-pink-600'
    },
    {
      id: 'math_25',
      title: 'Calculadora Quântica 💻',
      desc: 'Acertou 25 questões difíceis de Matemática.',
      unlocked: (stats?.matematica?.correct || 0) >= 25,
      color: 'from-orange-600 to-red-700'
    },
    {
      id: 'nature_25',
      title: 'Arquiteto do Habitat 🍀',
      desc: 'Acertou 25 questões na área de Ciências da Natureza.',
      unlocked: (stats?.natureza?.correct || 0) >= 25,
      color: 'from-green-500 to-teal-700'
    },
    {
      id: 'humanas_25',
      title: 'Imperador da Ágora 🏛️',
      desc: 'Acertou 25 questões em Ciências Humanas.',
      unlocked: (stats?.humanas?.correct || 0) >= 25,
      color: 'from-[#06b6d4] to-[#0369a1]'
    },
    {
      id: 'balanced_mind',
      title: 'Harmonia Sideral ⚖️',
      desc: 'Acumulou ao menos 5 acertos em todas as 4 áreas do Cosmos.',
      unlocked: (stats?.linguagens?.correct || 0) >= 5 && 
                (stats?.matematica?.correct || 0) >= 5 && 
                (stats?.humanas?.correct || 0) >= 5 && 
                (stats?.natureza?.correct || 0) >= 5,
      color: 'from-teal-300 to-indigo-600'
    },
    {
      id: 'level_100',
      title: 'Ancião Cósmico 🧝',
      desc: 'Pertence ao seleto grupo que atingiu o Nível 100.',
      unlocked: xpInfo.level >= 100,
      color: 'from-yellow-400 to-amber-600'
    },
    {
      id: 'immortal_brain',
      title: 'Cérebro de Silício 🧠',
      desc: 'Alcançou e concluiu mais de 150 questões totais.',
      unlocked: xpInfo.totalAnswered >= 150,
      color: 'from-pink-600 to-purple-800'
    },
    {
      id: 'exact_perfection',
      title: 'Singularidade Rígida 🕳️',
      desc: 'Acumulou precisamente 100 acertos em toda a história.',
      unlocked: xpInfo.totalCorrect >= 100,
      color: 'from-slate-600 to-slate-900'
    },
    {
      id: 'perfect_round',
      title: 'Órbita sem Desvios 💫',
      desc: 'Acertou 15+ perguntas mantendo eficácia acima de 90%.',
      unlocked: xpInfo.totalAnswered >= 15 && (xpInfo.totalCorrect / xpInfo.totalAnswered) >= 0.9,
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'omega_traveler',
      title: 'Alfa e Ômega 🌀',
      desc: 'Lenda absoluta que superou 7500 XP de aprendizado!',
      unlocked: xpInfo.xp >= 7500,
      color: 'from-amber-200 via-indigo-500 to-red-600'
    },
    {
      id: 'progresso_zerado',
      title: 'Progresso Zerado 🧹',
      desc: 'Limpou com êxito o seu histórico de simulados para reiniciar sua órbita cósmica.',
      unlocked: typeof window !== 'undefined' ? (localStorage.getItem('ach_progresso_zerado') === 'true') : false,
      color: 'from-emerald-400 via-teal-500 to-cyan-600'
    },
    {
      id: 'estilista_sideral',
      title: 'Estilista Sideral 🔥',
      desc: 'Equipou uma moldura elegante para personalizar sua identidade cósmica.',
      unlocked: typeof window !== 'undefined' ? (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
          return !!(profile.avatarFrameId && profile.avatarFrameId !== 'frame_01');
        } catch (_) { return false; }
      })() : false,
      color: 'from-violet-500 to-pink-600'
    },
    {
      id: 'explorador_estelar',
      title: 'Explorador Estelar 🪐',
      desc: 'Avaliou o Cosmos e ajudou a expandir as fronteiras do conhecimento na Play Store.',
      unlocked: typeof window !== 'undefined' ? (localStorage.getItem('cosmos_app_rated') === 'true') : false,
      color: 'from-yellow-400 to-amber-500'
    },
    {
      id: 'guia_cosmos',
      title: 'Guia Cosmos 🛰️',
      desc: 'Forneceu um feedback valioso para o aprimoramento contínuo da nossa inteligência espacial.',
      unlocked: false,
      color: 'from-cyan-400 to-blue-600'
    },
    {
      id: 'colecionador_reliquias',
      title: 'Colecionador de Relíquias 💎',
      desc: 'Equipou uma moldura de alto prestígio cósmico desbloqueada nesta jornada.',
      unlocked: typeof window !== 'undefined' ? (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
          const elapsed = ['frame_06', 'frame_09', 'frame_10', 'frame_11', 'frame_12', 'frame_13', 'frame_14', 'frame_15', 'frame_16', 'frame_17', 'frame_18', 'frame_19', 'frame_20', 'frame_21', 'frame_22', 'frame_23', 'frame_24', 'frame_25', 'frame_26', 'frame_27', 'frame_28', 'frame_29', 'frame_30', 'frame_31', 'frame_32', 'frame_33', 'frame_34', 'frame_35', 'frame_36', 'frame_37', 'frame_38', 'frame_39', 'frame_40'];
          return !!(profile.avatarFrameId && elapsed.includes(profile.avatarFrameId));
        } catch (_) { return false; }
      })() : false,
      color: 'from-blue-600 to-cyan-500'
    },
    {
      id: 'estilo_cyberpunk',
      title: 'Estilo Cyberpunk 📟',
      desc: 'Equipou uma moldura futurista da categoria Cyberpunk.',
      unlocked: typeof window !== 'undefined' ? (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
          const elapsed = ['frame_11', 'frame_12', 'frame_13', 'frame_14', 'frame_15', 'frame_16', 'frame_17', 'frame_18', 'frame_19', 'frame_20'];
          return !!(profile.avatarFrameId && elapsed.includes(profile.avatarFrameId));
        } catch (_) { return false; }
      })() : false,
      color: 'from-emerald-400 to-teal-600'
    },
    {
      id: 'espirito_mistico',
      title: 'Espírito Místico 🔮',
      desc: 'Equipou uma moldura ancestral da categoria Místico.',
      unlocked: typeof window !== 'undefined' ? (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
          const elapsed = ['frame_21', 'frame_22', 'frame_23', 'frame_24', 'frame_25', 'frame_26', 'frame_27', 'frame_28', 'frame_29', 'frame_30'];
          return !!(profile.avatarFrameId && elapsed.includes(profile.avatarFrameId));
        } catch (_) { return false; }
      })() : false,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'prestigio_imperial',
      title: 'Prestígio Imperial 👑',
      desc: 'Equipou uma moldura nobre da categoria Imperial.',
      unlocked: typeof window !== 'undefined' ? (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
          const elapsed = ['frame_31', 'frame_32', 'frame_33', 'frame_34', 'frame_35', 'frame_36', 'frame_37', 'frame_38', 'frame_39', 'frame_40'];
          return !!(profile.avatarFrameId && elapsed.includes(profile.avatarFrameId));
        } catch (_) { return false; }
      })() : false,
      color: 'from-amber-500 to-yellow-600'
    }
  ];

  const updatedAchievements = rawAchievements.map(ach => {
    const wasSaved = savedUnlocked.includes(ach.id);
    const isNowUnlocked = ach.unlocked || wasSaved;
    return {
      ...ach,
      unlocked: isNowUnlocked
    };
  });

  // Salvar quaisquer novas conquistas desbloqueadas no localStorage
  if (isClient) {
    const currentUnlockedIds = updatedAchievements
      .filter(a => a.unlocked)
      .map(a => a.id);
    
    const hasNew = currentUnlockedIds.some(id => !savedUnlocked.includes(id));
    if (hasNew) {
      try {
        localStorage.setItem('cosmos_unlocked_achievements_v1', JSON.stringify(currentUnlockedIds));
      } catch (e) {
        console.warn("Erro ao salvar conquistas desbloqueadas:", e);
      }
    }
  }

  return updatedAchievements;
}

export async function syncAchievementsToSupabase() {
  if (typeof window === 'undefined') return;
  try {
    const client = await getSupabase();
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError || !session?.user) {
      return;
    }

    const supabaseAch = session.user.user_metadata?.unlocked_achievements || [];
    let localAch: string[] = [];
    try {
      const stored = localStorage.getItem('cosmos_unlocked_achievements_v1');
      if (stored) {
        localAch = JSON.parse(stored);
      }
    } catch (_) {}

    // Merge to prevent ever losing any achievements
    const merged = Array.from(new Set([...localAch, ...supabaseAch]));

    // If local was missing some that are in Supabase, write them to local storage
    if (merged.length > localAch.length) {
      localStorage.setItem('cosmos_unlocked_achievements_v1', JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('achievements-synced', { detail: merged }));
    }

    // If Supabase didn't have all the achievements, update Supabase user_metadata
    if (merged.length > supabaseAch.length) {
      const { error: updateError } = await client.auth.updateUser({
        data: {
          unlocked_achievements: merged
        }
      });
      if (updateError) {
        if (updateError.message?.toLowerCase().includes("session") || updateError.message?.toLowerCase().includes("auth")) {
          console.log("Achievements sync skipped: Session inactive or missing (expected during logout/reset):", updateError.message);
        } else {
          console.warn("Erro ao sincronizar conquistas no Supabase:", updateError.message);
        }
      } else {
        console.log("Conquistas sincronizadas com sucesso no Supabase:", merged);
      }
    }
  } catch (err) {
    console.warn("Erro ao sincronizar conquistas:", err);
  }
}

export function getAchievementIdByTitle(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("IMPULSO INICIAL")) return "start";
  if (t.includes("MESTRE ORADOR")) return "linguages";
  if (t.includes("MENTE LOGICA") || t.includes("MENTE LÓGICA")) return "matematica";
  if (t.includes("FILOSOFO COSMICO") || t.includes("FILÓSOFO CÓSMICO")) return "humanas";
  if (t.includes("CIENTISTA ANCESTRAL")) return "natureza";
  if (t.includes("VULCANO PERFEITO")) return "first_perfect";
  if (t.includes("EXPLORADOR ORBITAL")) return "xp_500";
  if (t.includes("ESTRELA GUIA")) return "xp_1500";
  if (t.includes("VIAGEM SIDERAL")) return "xp_3000";
  if (t.includes("PILOTO SUPERSONICO") || t.includes("PILOTO SUPERSÔNICO")) return "speed_runner";
  if (t.includes("MARATONISTA DE ORBITA") || t.includes("MARATONISTA DE ÓRBITA")) return "marathoner";
  if (t.includes("CORUJA GALACTICA") || t.includes("CORUJA GALÁCTICA")) return "night_owl";
  if (t.includes("AVE DO ORIENTE")) return "early_bird";
  if (t.includes("ASTRO PERSISTENTE")) return "perseverante";
  if (t.includes("GLORIA MAXIMA") || t.includes("GLÓRIA MÁXIMA")) return "gloria_maxima";
  if (t.includes("COMANDANTE ORADOR")) return "simulado_linguagens_mestre";
  if (t.includes("COMANDANTE LOGICO") || t.includes("COMANDANTE LÓGICO")) return "simulado_matematica_mestre";
  if (t.includes("COMANDANTE FILOSOFO") || t.includes("COMANDANTE FILÓSOFO")) return "simulado_humanas_mestre";
  if (t.includes("COMANDANTE CIENTIST")) return "simulado_natureza_mestre";
  if (t.includes("ALFA E OMEGA") || t.includes("ALFA E ÔMEGA")) return "omega_traveler";
  if (t.includes("PROGRESSO ZERADO")) return "progresso_zerado";
  if (t.includes("ESTILISTA SIDERAL")) return "estilista_sideral";
  if (t.includes("EXPLORADOR ESTELAR")) return "explorador_estelar";
  if (t.includes("GUIA COSMOS")) return "guia_cosmos";
  if (t.includes("COLECIONADOR DE RELIQUIAS") || t.includes("COLECIONADOR DE RELÍQUIAS")) return "colecionador_reliquias";
  if (t.includes("ESTILO CYBERPUNK")) return "estilo_cyberpunk";
  if (t.includes("ESPIRITO MISTICO") || t.includes("ESPÍRITO MÍSTICO")) return "espirito_mistico";
  if (t.includes("PRESTIGIO IMPERIAL") || t.includes("PRESTÍGIO IMPERIAL")) return "prestigio_imperial";

  // Fallback to standard normalization if not matched
  return title
    .toLowerCase()
    .normalize('NFD')                     // Split accented characters into base letters and accent modifiers
    .replace(/[\u0300-\u036f]/g, '')     // Remove accents
    .replace(/[^a-z0-9]/g, '_')          // Replace all non-alphanumeric chars with underscore
    .replace(/__+/g, '_')                // Remove duplicate underscores
    .replace(/^_+|_+$/g, '');            // Trim leading/trailing underscores
}


