'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BottomNav } from '@/components/BottomNav';
import { 
  BookOpen, 
  Calculator, 
  Globe, 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  Award, 
  ChevronRight, 
  Rocket, 
  Sparkles,
  PlayCircle,
  TrendingUp,
  Compass,
  Zap,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { getStats, resetStats, saveStats, SimuladoStats } from '@/lib/stats';
import { useAchievement } from '@/components/AchievementProvider';
import { getAchievements } from '@/lib/achievements';
import { syncAllDataToSupabase } from '@/lib/supabaseSync';
import { ShareResults } from '@/components/ShareResults';

const CATEGORIES_CONFIG = [
  {
    key: 'linguagens' as const,
    label: 'Linguagens e Códigos',
    icon: BookOpen,
    color: 'text-indigo-300',
    borderColor: 'border-indigo-500/20',
    bgColor: 'bg-indigo-500/10',
    barColor: 'bg-indigo-500',
    link: '/linguagens',
    pontoCritico: 'Variação Linguística e Funções da Linguagem',
  },
  {
    key: 'matematica' as const,
    label: 'Matemática e suas Tecnologias',
    icon: Calculator,
    color: 'text-amber-300',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/10',
    barColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
    link: '/matematica',
    pontoCritico: 'Análise Combinatória e Geometria Plana',
  },
  {
    key: 'humanas' as const,
    label: 'Ciências Humanas e Sociais',
    icon: Globe,
    color: 'text-cyan-300',
    borderColor: 'border-cyan-500/20',
    bgColor: 'bg-cyan-500/10',
    barColor: 'bg-cyan-500',
    link: '/humanas',
    pontoCritico: 'Geopolítica Contemporânea e Cidadania',
  },
  {
    key: 'natureza' as const,
    label: 'Ciências da Natureza',
    icon: FlaskConical,
    color: 'text-emerald-300',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/10',
    barColor: 'bg-emerald-500',
    link: '/natureza',
    pontoCritico: 'Eletrodinâmica, Citologia e Termoquímica',
  }
];

export default function ResultsPage() {
  const { triggerAchievementManually } = useAchievement();
  const [stats, setStats] = useState<SimuladoStats | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  useEffect(() => {
    setStats(getStats());
  }, []);

  const handleResetHistory = () => {
    setIsConfirmingReset(true);
  };

  const confirmReset = async () => {
    // 1. Lock-in achievements before resetting statistics
    const currentStats = getStats();
    getAchievements(currentStats);

    // 2. Reset statistics
    resetStats();
    setStats(getStats());
    setIsConfirmingReset(false);

    // 3. Synchronize reset stats to Supabase, keeping current achievements intact
    try {
      await syncAllDataToSupabase();
    } catch (e) {
      console.warn("Erro ao sincronizar progresso resetado no Supabase:", e);
    }

    // Trigger PROGRESSO ZERADO achievement notification
    setTimeout(() => {
      triggerAchievementManually(
        "PROGRESSO ZERADO 🧹",
        "Limpou com êxito o seu histórico de simulados para reiniciar sua órbita cósmica."
      );
    }, 400);
  };

  if (!stats) {
    return (
      <div className="relative h-screen flex items-center justify-center">
        <div className="starfield" />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calc metrics
  const totalAnswered = 
    stats.linguagens.answered + 
    stats.matematica.answered + 
    stats.humanas.answered + 
    stats.natureza.answered;

  const totalCorrect = 
    stats.linguagens.correct + 
    stats.matematica.correct + 
    stats.humanas.correct + 
    stats.natureza.correct;

  const totalIncorrect = 
    stats.linguagens.incorrect + 
    stats.matematica.incorrect + 
    stats.humanas.incorrect + 
    stats.natureza.incorrect;

  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Find weakness and strength
  let criticalCategory = CATEGORIES_CONFIG[0];
  let strongCategory = CATEGORIES_CONFIG[0];
  let minAccuracy = 101;
  let maxAccuracy = -1;
  let anyAnswered = false;

  CATEGORIES_CONFIG.forEach(cfg => {
    const catData = stats[cfg.key];
    if (catData.answered > 0) {
      anyAnswered = true;
      const accuracy = (catData.correct / catData.answered) * 100;
      if (accuracy < minAccuracy) {
        minAccuracy = accuracy;
        criticalCategory = cfg;
      }
      if (accuracy >= maxAccuracy) {
        maxAccuracy = accuracy;
        strongCategory = cfg;
      }
    }
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <div className="starfield" />
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -z-10" />

      <main className="flex-1 overflow-y-auto pt-8 px-6 max-w-xl mx-auto space-y-8 pb-32 w-full">
        {/* Page Title */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-black uppercase tracking-widest text-[#ffffff] flex items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-light" />
            Seu Progresso
          </h1>
          <p className="text-xs text-on-surface-variant uppercase tracking-[0.2em] mt-1">Geral de Acertos e Desempenho</p>
        </div>

        {totalAnswered > 0 ? (
          <div className="space-y-8">
            {/* Overview Circular Metric */}
            <section className="glass-panel p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] rounded-full -z-10" />
              
              <div className="relative w-44 h-44 mb-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 origin-center">
                  <circle 
                    cx="88" 
                    cy="88" 
                    r="76" 
                    className="stroke-white/5 fill-transparent"
                    strokeWidth="8"
                  />
                  <motion.circle 
                    cx="88" 
                    cy="88" 
                    r="76" 
                    className="stroke-primary fill-transparent"
                    strokeWidth="8"
                    strokeDasharray={477}
                    initial={{ strokeDashoffset: 477 }}
                    animate={{ strokeDashoffset: 477 - (477 * (overallAccuracy / 100)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="font-display text-4xl font-extrabold text-white drop-shadow-xl"
                  >
                    {overallAccuracy}%
                  </motion.span>
                  <span className="text-[9px] tracking-[0.2em] text-on-surface-variant uppercase font-bold mt-0.5">Aproveitamento</span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-lg font-bold text-white">
                  {overallAccuracy >= 80 ? "Desempenho Estelar!" : 
                   overallAccuracy >= 60 ? "No Caminho Certo!" : 
                   "Continue Praticando!"}
                </h2>
                <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                  Você resolveu <span className="text-white font-bold">{totalAnswered}</span> questões no total, garantindo <span className="text-emerald-400 font-bold">{totalCorrect}</span> acertos e <span className="text-red-400 font-bold">{totalIncorrect}</span> erros.
                </p>
              </div>

              {/* Mini Stats Row */}
              <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-5 border-t border-white/5 text-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">Respondidas</span>
                  <p className="text-lg font-display font-bold text-white">{totalAnswered}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Acertos</span>
                  <p className="text-lg font-display font-bold text-emerald-400">{totalCorrect}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">Erros</span>
                  <p className="text-lg font-display font-bold text-red-400">{totalIncorrect}</p>
                </div>
              </div>
            </section>

            {/* Disciplinas List Section */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-[0.2em]">Desempenho por Categoria</h3>
              
              <div className="space-y-4">
                {CATEGORIES_CONFIG.map((cfg, idx) => {
                  const catStats = stats[cfg.key];
                  const Icon = cfg.icon;
                  const accuracy = catStats.answered > 0 ? Math.round((catStats.correct / catStats.answered) * 100) : 0;
                  
                  return (
                    <motion.div
                      key={cfg.key}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-3 relative overflow-hidden group"
                    >
                      {/* Top Row with Category name and Icon */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${cfg.bgColor} ${cfg.borderColor} border`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-sm text-white">{cfg.label}</h4>
                            <p className="text-[11px] text-on-surface-variant">
                              {catStats.answered} respondidas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-base font-display font-extrabold ${cfg.color}`}>
                            {accuracy}%
                          </span>
                          <span className="text-[8px] uppercase tracking-wider text-on-surface-variant/70 block">Precisão</span>
                        </div>
                      </div>

                      {/* Accuracy Progress Bar */}
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${accuracy}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${cfg.barColor}`}
                        />
                      </div>

                      {/* Correct and Incorrect badges */}
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
                            {catStats.correct} acertos
                          </span>
                          <span className="flex items-center gap-1.5 text-red-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 block" />
                            {catStats.incorrect} erros
                          </span>
                        </div>
                        <Link href={cfg.link} className="flex items-center gap-1 text-[10px] text-primary hover:text-white transition-colors uppercase font-bold tracking-widest">
                          Revisar
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Adaptive Smart Study Plane */}
            {anyAnswered && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] rounded-full -z-10" />
                
                <div className="flex items-center gap-4 mb-5">
                  <div className="p-3 rounded-xl bg-surface-container-high relative">
                    <Rocket className="text-primary w-6 h-6" />
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">Plano de Estudo Sugerido</h4>
                    <p className="text-[11px] text-on-surface-variant">Trilhas inteligentes baseadas no seu desempenho:</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* Weak subject block */}
                  <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 space-y-1">
                    <span className="text-[9px] text-red-400 font-black uppercase tracking-[0.2em] block">
                      REVISÃO CRÍTICA (Foco Imediato)
                    </span>
                    <p className="text-xs font-bold text-white">
                      {criticalCategory.label}
                    </p>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Sugerimos focar em: <span className="text-red-300 font-medium">{criticalCategory.pontoCritico}</span> para elevar o seu aproveitamento nesta disciplina.
                    </p>
                  </div>

                  {/* Strong subject block */}
                  {strongCategory.key !== criticalCategory.key && (
                    <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 space-y-1">
                      <span className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] block">
                        PONTO FORTE (Excelente Ritmo!)
                      </span>
                      <p className="text-xs font-bold text-white">
                        {strongCategory.label}
                      </p>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        Ótima precisão geral. Mantenha os simulados periódicos para fixação de longo prazo.
                      </p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* Actions Footer */}
            <div className="flex flex-col gap-3 pt-2">
              <ShareResults
                totalCovered={totalAnswered}
                correctCount={totalCorrect}
                incorrectCount={totalIncorrect}
                accuracy={overallAccuracy}
                categoryName="Estatísticas Gerais"
                themeColor="indigo"
                textTrigger="Compartilhar Desempenho Geral 🚀"
              />
              <Link href="/areas" className="w-full">
                <button className="w-full py-3.5 bg-primary hover:bg-primary/80 text-white rounded-2xl font-display font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/10 flex items-center justify-center gap-2 active:scale-98 transition-all">
                  <PlayCircle className="w-4 h-4" />
                  Voltar para Áreas e Iniciar Teste
                </button>
              </Link>
            </div>
          </div>
        ) : (
          /* Empty State Display */
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-10"
            >
              <div className="glass-panel p-8 rounded-[2rem] border border-white/5 space-y-6 max-w-sm mx-auto relative overflow-hidden">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative">
                  <Compass className="w-8 h-8 text-primary-light" />
                  <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-lg text-white">Nenhum simulado feito ainda</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Você ainda não respondeu nenhuma questão de simulado. Seus acertos, erros e aproveitamento por área do conhecimento surgirão de forma interativa aqui.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/areas" className="block w-full">
                    <button className="w-full py-3 gradient-primary text-white rounded-xl font-display font-bold text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                      <Zap className="w-3.5 h-3.5" />
                      Escolher Disciplina e Começar
                    </button>
                  </Link>
                </div>
              </div>

              {/* Static Category Previews to motivate user */}
              <div className="space-y-3 max-w-sm mx-auto text-left">
                <h4 className="text-[10px] uppercase font-bold text-on-surface-variant tracking-[0.2em] px-2">Disciplinas Disponíveis</h4>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES_CONFIG.map(cfg => {
                    const Icon = cfg.icon;
                    return (
                      <Link href={cfg.link} key={cfg.key}>
                        <div className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer">
                          <div className={`p-1.5 rounded-lg ${cfg.bgColor}`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <span className="text-[11px] font-bold text-white truncate">{cfg.key.toUpperCase()}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <BottomNav />

      <style jsx global>{`
        .gradient-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
      `}</style>
    </div>
  );
}
