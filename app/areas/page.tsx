'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles,
  Calculator,
  Languages,
  Globe2,
  Microscope,
  Shuffle,
  HelpCircle,
  ChevronRight,
  Zap,
  Flame,
  ShieldAlert,
  Play,
  Crown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn, playCategorySound, playSubcategorySound } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { PremiumGateway } from '@/components/PremiumGateway';

const CategoryButton = ({ name, tech, icon: Icon, color, bg, href, description }: any) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative group/container">
      <Link href={href} className="block" onClick={() => playCategorySound()}>
        <motion.div 
          whileHover={{ scale: 1.01, x: 2 }}
          whileTap={{ scale: 0.99 }}
          className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 text-left transition-all hover:bg-white/5 border border-white/5 shadow-lg"
        >
          <div className={cn("p-3 rounded-xl", bg)}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold leading-tight">{name}</p>
            {tech && <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">{tech}</p>}
          </div>
          <div className="w-8" />
        </motion.div>
      </Link>
      
      <motion.button 
        whileHover={{ scale: 1.2, color: "var(--color-primary)" }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant/30 transition-all z-20"
      >
        <HelpCircle className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <>
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setShowTooltip(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
              className="absolute right-0 bottom-full mb-3 w-64 p-5 glass-panel rounded-3xl border border-primary/20 shadow-2xl z-40 backdrop-blur-xl"
            >
              <div className="relative">
                <p className="text-[13px] text-on-surface font-medium leading-relaxed italic">
                  "{description}"
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AreasPage() {
  const [specialMode, setSpecialMode] = useState<'regular' | 'challenge' | 'hardcore' | 'survival'>('regular');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState<boolean>(false);
  const [attemptedMode, setAttemptedMode] = useState<'regular' | 'challenge' | 'hardcore' | 'survival' | null>(null);

  useEffect(() => {
    // Determine premium status
    const profile = localStorage.getItem('user_profile');
    const logged = localStorage.getItem('cosmos_logged_user');
    let prem = false;
    if (profile) {
      try {
        if (JSON.parse(profile).isPremium) prem = true;
      } catch (_) {}
    }
    if (logged) {
      try {
        if (JSON.parse(logged).isPremium) prem = true;
      } catch (_) {}
    }
    setIsPremium(prem);

    const saved = localStorage.getItem('simulado_special_mode');
    if (saved === 'challenge' || saved === 'hardcore' || saved === 'survival') {
      if ((saved === 'challenge' || saved === 'survival') && !prem) {
        setSpecialMode('regular');
        localStorage.setItem('simulado_special_mode', 'regular');
      } else {
        setSpecialMode(saved as any);
      }
    } else {
      setSpecialMode('regular');
    }
  }, []);

  const handleSelectMode = (mode: 'regular' | 'challenge' | 'hardcore' | 'survival') => {
    playSubcategorySound();
    if ((mode === 'challenge' || mode === 'survival') && !isPremium) {
      setAttemptedMode(mode);
      setShowPremiumUpgrade(true);
      return;
    }
    setSpecialMode(mode);
    localStorage.setItem('simulado_special_mode', mode);
  };

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div className="starfield" />
      
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full -z-10" />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 overflow-y-auto flex flex-col pb-32"
      >
        <div className="w-full max-w-xl mx-auto pt-12 px-6 space-y-8">
          <header className="text-center space-y-4">
            <div className="space-y-2">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display font-bold uppercase tracking-tight leading-tight"
              >
                Escolha Uma Matéria<br />
                <span className="gradient-text text-4xl">E De Início Ao SIMULADO</span>
              </motion.h1>
            </div>
          </header>

          {/* DYNAMIC TRAINING MODES */}
          <section className="glass-panel p-5 rounded-[2rem] border border-white/5 space-y-4 bg-white/[0.01]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <h2 className="text-xs font-display font-black uppercase tracking-widest text-secondary">Modos de Treino Especial</h2>
              </div>
              <span className="text-[8px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md tracking-wider animate-pulse">
                Modo Ativo
              </span>
            </div>

            <p className="text-[10px] text-white/50 leading-relaxed text-left">
              Selecione o modo que afetará o comportamento de todos os simulados e as perguntas do app:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'regular',
                  name: 'Regular',
                  desc: 'Com dicas e voltar questões.',
                  color: 'text-green-400 bg-green-500/10 border-green-500/30',
                  activeColor: 'border-green-500/50 bg-green-500/10 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
                  icon: Play,
                },
                {
                  id: 'challenge',
                  name: 'Desafio',
                  desc: '30s por questão. Raciocínio rápido!',
                  color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                  activeColor: 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
                  icon: Zap,
                  isPremium: true,
                },
                {
                  id: 'hardcore',
                  name: 'Hardcore',
                  desc: 'Sem dicas e sem voltar questões.',
                  color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                  activeColor: 'border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
                  icon: ShieldAlert,
                },
                {
                  id: 'survival',
                  name: 'Sobrevivência',
                  desc: 'Morte súbita: Errou = Fim do jogo!',
                  color: 'text-red-400 bg-red-500/10 border-red-500/30',
                  activeColor: 'border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
                  icon: Flame,
                  isPremium: true,
                },
              ].map((m) => {
                const isSelected = specialMode === m.id;
                const ModeIcon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMode(m.id as any)}
                    className={cn(
                      "relative overflow-hidden p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all outline-none cursor-pointer hover:scale-[1.02]",
                      isSelected ? m.activeColor : "border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
                    )}
                  >
                    {m.isPremium && (
                      <div className="absolute top-3 right-3 select-none">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20 animate-pulse" />
                      </div>
                    )}

                    <div className={cn(
                      "flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider w-full",
                      m.isPremium ? "pr-6" : ""
                    )}>
                      <div className={cn("p-1.5 rounded-lg shrink-0", isSelected ? "" : "bg-white/5")}>
                        <ModeIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-[12px]">{m.name}</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-normal font-semibold pr-2">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <Sparkles className="w-5 h-5 text-tertiary" />
              <h2 className="text-sm font-display font-bold uppercase tracking-widest text-on-surface/80">Simulados por Área</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <CategoryButton 
                name="Matemática" 
                icon={Calculator} 
                color="text-primary" 
                bg="bg-primary/10" 
                href="/matematica"
                description="Abrange Álgebra, Geometria, Estatística e Raciocínio Lógico."
              />
              <CategoryButton 
                name="Linguagens" 
                icon={Languages} 
                color="text-secondary" 
                bg="bg-secondary/10" 
                href="/linguagens"
                description="Foco em Interpretação de Texto, Literatura, Artes e Língua Estrangeira."
              />
              <CategoryButton 
                name="Ciências da Natureza" 
                icon={Microscope} 
                color="text-error" 
                bg="bg-error/10" 
                href="/natureza"
                description="Questões de Biologia, Física e Química com foco em aplicações práticas."
              />
              <CategoryButton 
                name="Ciências Humanas" 
                icon={Globe2} 
                color="text-tertiary" 
                bg="bg-tertiary/10" 
                href="/humanas"
                description="Estudos de História, Geografia, Filosofia e Sociologia."
              />
              <CategoryButton 
                name="Matérias Aleatórias" 
                tech="Trilhas Diversas" 
                icon={Shuffle} 
                color="text-on-surface" 
                bg="bg-on-surface/10" 
                href="/aleatorio"
                description="Um mix desafiador de todas as áreas do conhecimento em um só lugar."
              />
            </div>
          </section>

          <footer className="text-center pt-8">
            <p className="text-[9px] text-on-surface-variant/30 uppercase tracking-[0.3em]">
              Criado Por xSnoopx
            </p>
          </footer>
        </div>
        
        <BottomNav />
      </motion.main>

      <AnimatePresence>
        {showPremiumUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <PremiumGateway 
                title="MODO DE TREINO ESPECIAL" 
                onSuccess={() => {
                  setIsPremium(true);
                  setShowPremiumUpgrade(false);
                  if (attemptedMode) {
                    setSpecialMode(attemptedMode);
                    localStorage.setItem('simulado_special_mode', attemptedMode);
                    setAttemptedMode(null);
                  }
                }} 
                onClose={() => setShowPremiumUpgrade(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
