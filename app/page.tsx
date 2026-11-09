'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Rocket, 
  Sparkles,
  BarChart2,
  HelpCircle,
  WifiOff,
  Wifi,
  Brain,
  MessageCircleQuestion,
  Ghost,
  Laugh,
  Library,
  Calculator,
  Languages,
  Globe2,
  Microscope,
  Shuffle,
  ChevronLeft,
  ChevronDown,
  Star,
  Volume2,
  VolumeX,
  Lock,
  X
} from 'lucide-react';
import { cn, playCategorySound, playSubcategorySound } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { GalaxyTransition } from '@/components/GalaxyTransition';
import { syncAllDataFromSupabase } from '@/lib/supabaseSync';
import { PremiumGateway } from '@/components/PremiumGateway';

import rocketLogo from '@/src/assets/images/regenerated_image_1778473861554.png';

const DashboardOption = ({ opt, i, color, isPremium, onPremiumClick }: any) => {
  const [isSubOpen, setIsSubOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (opt.isPremium && !isPremium) {
      e.preventDefault();
      if (onPremiumClick) {
        onPremiumClick();
      }
    }
  };

  if (opt.subOptions) {
    return (
      <div className="space-y-2">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => {
            playCategorySound();
            setIsSubOpen(!isSubOpen);
          }}
          whileHover={{ x: 8 }}
          className="w-full glass-panel p-4 rounded-2xl flex items-center justify-between gap-2 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all group/sub"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("p-2 rounded-xl bg-white/5 shrink-0", opt.color)}>
              <opt.icon className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <span className="font-display font-bold text-sm tracking-wide break-words">{opt.name}</span>
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-2.5 h-2.5 shrink-0 text-on-surface-variant/40" />
                <span className="text-[0.625rem] font-bold text-on-surface-variant/50 tracking-widest uppercase">
                  {isSubOpen ? 'Fechar Categorias' : 'Ver Categorias'}
                </span>
              </div>
            </div>
          </div>
          <motion.div 
            animate={{ rotate: isSubOpen ? 180 : 0 }}
            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-white/5"
          >
            <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isSubOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pl-4 space-y-2 border-l border-white/10 ml-6"
            >
              {opt.subOptions.map((sub: any, j: number) => (
                <Link key={j} href={sub.href} onClick={() => playSubcategorySound()}>
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: j * 0.05 }}
                    whileHover={{ x: 5 }}
                    className="w-full glass-panel p-3 rounded-xl flex items-center gap-3 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all"
                  >
                    <div className={cn("p-1.5 rounded-lg bg-white/5 shrink-0", sub.color)}>
                      <sub.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-display font-bold text-xs tracking-wide break-words">{sub.name}</span>
                      {sub.subtitle && (
                        <p className="text-[0.625rem] text-on-surface-variant/50 font-bold uppercase tracking-[0.1em]">
                          {sub.subtitle}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const isLocked = opt.isPremium && !isPremium;

  return (
    <Link 
      href={isLocked ? "#" : opt.href}
      onClick={(e) => {
        playSubcategorySound();
        handleClick(e);
      }}
    >
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        whileHover={isLocked ? {} : { x: 8 }}
        className={cn(
          "w-full glass-panel p-4 rounded-2xl flex items-center justify-between gap-2 border transition-all",
          isLocked 
            ? "border-amber-500/10 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10" 
            : "border-white/5 hover:bg-white/10 active:scale-[0.98]"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("p-2 rounded-xl bg-white/5 shrink-0", opt.color)}>
            <opt.icon className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="font-display font-bold text-sm tracking-wide break-words">{opt.name}</span>
            {opt.subtitle && (
              <p className="text-[0.625rem] text-on-surface-variant/60 font-bold uppercase tracking-widest">
                {opt.subtitle}
              </p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {opt.isOnline ? <Wifi className="w-2.5 h-2.5 shrink-0 text-primary" /> : <WifiOff className="w-2.5 h-2.5 shrink-0 text-on-surface-variant/40" />}
              <span className="text-[0.625rem] font-bold text-on-surface-variant/50 tracking-widest uppercase">
                {opt.isOnline ? 'Online' : 'Offline'}
              </span>
              {opt.isPremium && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-500 text-[0.5625rem] font-black uppercase text-black tracking-widest flex items-center gap-0.5 shadow-md shadow-amber-400/10 self-center">
                  ⚡ PRIME
                </span>
              )}
            </div>
          </div>
        </div>
        {isLocked ? (
          <div className="shrink-0 p-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-[0.625rem] font-display font-medium uppercase text-amber-300 flex items-center gap-1 shadow-sm shadow-amber-500/5">
            <Lock className="w-3 h-3 text-amber-400" /> Locked
          </div>
        ) : (
          <div className="w-1 h-6 shrink-0 bg-current opacity-20 rounded-full" style={{ backgroundColor: color }} />
        )}
      </motion.div>
    </Link>
  );
};

const DashboardGroup = ({ 
  name, 
  icon: Icon, 
  color, 
  bg, 
  description, 
  options,
  isLoggedIn,
  showLoginWarning,
  isPremium,
  onPremiumClick
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative space-y-2">
      <div className="relative group/container">
        <motion.button 
          onClick={() => {
            playCategorySound();
            setIsOpen(!isOpen);
          }}
          whileHover={{ scale: 1.01, x: 2 }}
          whileTap={{ scale: 0.99 }}
          className="w-full glass-panel p-5 sm:p-6 rounded-3xl flex items-center gap-3 sm:gap-4 text-left transition-all hover:bg-white/5 border border-white/5 shadow-xl relative overflow-hidden"
        >
          <div className={cn("p-3 sm:p-4 rounded-2xl shrink-0", bg, color)}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-[clamp(0.95rem,4.2vw,1.125rem)] uppercase tracking-wide leading-snug">{name}</h3>
            <p className="text-[0.625rem] text-on-surface-variant uppercase tracking-wider font-bold leading-snug">
              {isOpen ? 'Clique para fechar' : 'Clique para ver subcategorias'}
            </p>
          </div>
          <div className="w-6 sm:w-8 shrink-0" />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.2, color: "var(--color-primary)" }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant/30 transition-all z-20 hover:text-primary"
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {showTooltip && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowTooltip(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute right-0 bottom-full mb-3 w-64 p-5 glass-panel rounded-3xl border border-primary/20 shadow-2xl z-40 backdrop-blur-xl"
              >
                <p className="text-[0.8125rem] text-on-surface font-medium leading-relaxed italic">
                  "{description}"
                </p>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="overflow-hidden px-2 space-y-2 pt-2"
          >
            {options.map((opt: any, i: number) => (
              <DashboardOption 
                key={i} 
                opt={opt} 
                i={i} 
                color={color} 
                isPremium={isPremium}
                onPremiumClick={onPremiumClick}
              />
            ))}

            {showLoginWarning && !isLoggedIn && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full mt-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-lg relative overflow-hidden text-amber-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex gap-3 text-left">
                  <div className="p-2 h-fit rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-xs tracking-wide uppercase text-amber-200">
                      🌌 Recursos Exclusivos Bloqueados
                    </h4>
                    <p className="text-[0.6875rem] leading-relaxed text-amber-300/80">
                      Você está no modo convidado. Faça login ou crie uma conta gratuita para liberar o <strong className="text-amber-200 font-semibold">Cronômetro Personalizado</strong>, competir no <strong className="text-amber-200 font-semibold">Ranking Geral</strong>, salvar seu progresso na nuvem e analisar estatísticas completas!
                    </p>
                    <div className="pt-2">
                      <Link href="/profile">
                        <span className="inline-flex items-center gap-1 text-[0.6875rem] font-bold text-amber-200 hover:text-amber-100 underline decoration-dotted transition-colors">
                          Acesse sua conta agora &rarr;
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AppPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState<boolean>(false);

  // Background Music State & Ref
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [homepageTrack, setHomepageTrack] = useState('/homepage.mp3');

  // Sync preference state on mount and pre-verify local track legality
  useEffect(() => {
    if (localStorage.getItem('study_music_enabled') === null) {
      localStorage.setItem('study_music_enabled', 'true');
    }
    const syncFromStorage = () => {
      const musicEnabled = localStorage.getItem('study_music_enabled') !== 'false';
      setIsMusicPlaying(musicEnabled);
      const audio = audioRef.current;
      if (audio) {
        const savedVol = localStorage.getItem('study_music_volume');
        audio.volume = savedVol !== null ? parseFloat(savedVol) : 0.25;
      }
    };
    syncFromStorage();
    window.addEventListener('study_music_sync', syncFromStorage);
    return () => {
      window.removeEventListener('study_music_sync', syncFromStorage);
    };
  }, []);

  // Control HTMLAudioElement playback based on state (only while on splash screen)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicPlaying && showSplash) {
      const savedVol = localStorage.getItem('study_music_volume');
      audio.volume = savedVol !== null ? parseFloat(savedVol) : 0.25; // Dynamic ambient level sync
      audio.play().catch((err) => {
        console.log("Autoplay of background music was postponed until user clicks / interacts.", err);
      });
    } else {
      audio.pause();
    }
  }, [isMusicPlaying, showSplash]);

  const handleHomepageTrackError = () => {
    // A faixa tema é a única da home; se falhar, usa uma das faixas válidas
    // (antes caía em /background.mp3, que está vazio e gerava 416 em loop).
    console.warn(`Faixa ${homepageTrack} indisponível. Usando faixa alternativa.`);
    setHomepageTrack('/background8.mp3');
  };

  // Rescue browser autoplay blocks upon any window interaction (only while on splash screen)
  useEffect(() => {
    const handleRescuePlay = () => {
      if (isMusicPlaying && showSplash && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', handleRescuePlay);
    window.addEventListener('keydown', handleRescuePlay);
    window.addEventListener('touchstart', handleRescuePlay);

    return () => {
      window.removeEventListener('click', handleRescuePlay);
      window.removeEventListener('keydown', handleRescuePlay);
      window.removeEventListener('touchstart', handleRescuePlay);
    };
  }, [isMusicPlaying, showSplash]);

  // Lembrete de avaliação estados
  const [showRatingReminder, setShowRatingReminder] = useState(false);
  const [reminderRating, setReminderRating] = useState(0);
  const [reminderHoverRating, setReminderHoverRating] = useState(0);
  const [reminderFeedback, setReminderFeedback] = useState('');
  const [reminderSubmitted, setReminderSubmitted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Use a versioned key to ensure it shows up once after this update
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash_v3');
    if (hasSeenSplash === 'true') {
      setShowSplash(false);
    }

    // Check if user is logged in
    const loggedUser = localStorage.getItem('cosmos_logged_user');
    const profile = localStorage.getItem('user_profile');
    
    let prem = false;
    if (profile) {
      try {
        if (JSON.parse(profile).isPremium) prem = true;
      } catch (_) {}
    }
    
    if (loggedUser) {
      try {
        const parsed = JSON.parse(loggedUser);
        if (parsed && parsed.id) {
          setIsLoggedIn(true);
        }
        if (parsed && parsed.isPremium) {
          prem = true;
        }
      } catch (_) {}
    }
    setIsPremium(prem);

    // Lembrete de avaliação Play Store periódico ("de tempos em tempos")
    const isRated = localStorage.getItem('cosmos_app_rated') === 'true';
    const isDismissed = localStorage.getItem('cosmos_rating_dismissed') === 'true';
    if (!isRated && !isDismissed) {
      const visits = parseInt(localStorage.getItem('cosmos_visit_count') || '0', 10);
      const newVisits = visits + 1;
      localStorage.setItem('cosmos_visit_count', newVisits.toString());
      
      // Mostrar lembrete a cada 3 visitas a partir da 2ª (2ª, 5ª, 8ª, 11ª, etc.)
      if (newVisits >= 2 && (newVisits - 2) % 3 === 0) {
        const timer = setTimeout(() => {
          setShowRatingReminder(true);
        }, 3500); // 3.5 segundos de atraso
        
        // Initial silent background sync from Supabase
        syncAllDataFromSupabase().catch((err) => {
          console.warn("Background initial sync from Supabase failed:", err);
        });

        return () => clearTimeout(timer);
      }
    }

    // Initial silent background sync from Supabase
    syncAllDataFromSupabase().catch((err) => {
      console.warn("Background initial sync from Supabase failed:", err);
    });
  }, []);

  const handleStart = () => {
    setIsTransitioning(true);
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash_v3', 'true');
  };

  // Return shell during hydration to avoid mismatch
  if (!isMounted) {
    return (
      <div className="relative min-h-[100dvh] flex flex-col overflow-x-hidden">
        <div className="starfield" />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      <div className="starfield" />
      
      {/* Trilha da splash: o src só existe enquanto a splash está na tela, para
          não baixar ~5 MB no dashboard nem no caminho em que a splash foi pulada. */}
      <audio
        ref={audioRef}
        loop
        src={showSplash && isMusicPlaying ? homepageTrack : undefined}
        preload="none"
        onError={handleHomepageTrackError}
      />

      {/* Floating Header Controls */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        {/* FAQ Toggle Button */}
        {!showSplash && (
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFaqOpen(true)}
            className="p-3 rounded-full bg-white/[0.03] border border-white/10 shadow-lg text-white/80 hover:text-white backdrop-blur-md transition-all cursor-pointer"
            title="Perguntas Frequentes (FAQ)"
          >
            <HelpCircle className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
          </motion.button>
        )}
      </div>

      {/* Halos estáticos: sem animate-pulse para não re-rasterizar o desfoque. */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full -z-10" />

      <AnimatePresence mode="wait">
        {isTransitioning && (
          <GalaxyTransition onComplete={handleTransitionComplete} />
        )}
        
        {showSplash ? (
          <motion.main
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center space-y-12 z-10"
          >
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative w-[min(16rem,68vw)] aspect-square rounded-[64px] overflow-hidden border border-white/10 shadow-2xl shadow-primary/30">
                <Image
                  src={rocketLogo}
                  alt="Logo"
                  fill
                  className="object-cover scale-[1.3] object-top"
                  priority
                />
              </div>
            </motion.div>

            {/* Text Section */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-[clamp(1.5rem,6.2vw,2.25rem)] font-display font-bold tracking-tight uppercase leading-tight">
                Seja Bem-Vindo ao <br />
                <span className="gradient-text text-[clamp(1.9rem,8.4vw,3rem)]">
                  SIMULADO PRIME
                </span>
              </h1>
              <p className="text-on-surface-variant text-base leading-relaxed px-4 font-light max-w-sm">
                A plataforma de simulação mais imersiva da Galáxia. Prepare-se para o seu futuro.
              </p>
            </motion.section>

            {/* Action Button */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="w-full max-w-xs"
            >
              <button 
                onClick={handleStart}
                className="w-full py-4 px-8 rounded-2xl font-display font-bold text-xl tracking-widest glass-panel text-on-surface border border-white/5 shadow-xl transition-all transform active:scale-95 hover:bg-white/10 flex items-center justify-center gap-3 group"
              >
                COMEÇAR
                <Rocket className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </motion.section>
          </motion.main>
        ) : (
          <motion.main
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-y-auto flex flex-col pb-32"
          >
            <div className="w-full max-w-xl mx-auto pt-12 px-6 space-y-12">
              {/* Header Section */}
              <header className="text-center space-y-8">
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center"
                  >
                    <div className="relative w-32 h-32 rounded-[40px] overflow-hidden border border-primary/30 shadow-2xl shadow-primary/20">
                      <Image
                        src={rocketLogo}
                        alt="Logo"
                        fill
                        className="object-cover scale-[1.5] object-top"
                      />
                    </div>
                  </motion.div>
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[clamp(1.5rem,6.2vw,2.25rem)] font-display font-bold uppercase tracking-tight leading-tight"
                  >
                    Bem-Vindo ao<br />
                    <span className="gradient-text text-[clamp(1.9rem,8.4vw,3rem)]">Dashboard Prime</span>
                  </motion.h1>
                  <p className="text-on-surface-variant text-base leading-relaxed max-w-sm mx-auto opacity-70">
                    Sua jornada para o sucesso começa aqui. Explore os simulados, Resolva Enigmas ou Se Divirta nas Charadas
                  </p>
                </div>
              </header>

              {/* Quick Navigation Cards */}
              <section className="grid grid-cols-1 gap-6">
                <DashboardGroup 
                  name="Simulados"
                  icon={Sparkles}
                  bg="bg-primary/10"
                  color="text-primary"
                  description="Acesse uma base sólida de questões tradicionais para estudo offline ou use nossa IA para gerar simulados inéditos e personalizados."
                  isLoggedIn={isLoggedIn}
                  showLoginWarning={true}
                  isPremium={isPremium}
                  onPremiumClick={() => setShowPremiumUpgrade(true)}
                  options={[
                    { 
                      name: "Simulado Off-line", 
                      icon: WifiOff, 
                      color: "text-on-surface-variant/60",
                      href: "/areas"
                    },
                    { name: "Simulado Online (IA)", href: "/simulados-ia", icon: Brain, isOnline: true, isPremium: false, color: "text-tertiary" }
                  ]}
                />

                <DashboardGroup 
                  name="Charadas"
                  icon={MessageCircleQuestion}
                  bg="bg-secondary/10"
                  color="text-secondary"
                  description="Charadas com busca, dicas e progresso local. Jogue offline ou gere trocadilhos inéditos com a IA."
                  isPremium={isPremium}
                  onPremiumClick={() => setShowPremiumUpgrade(true)}
                  options={[
                    { 
                      name: "Acervo de Charadas", 
                      icon: Laugh, 
                      color: "text-on-surface-variant/60",
                      subOptions: [
                        { name: "Hub de charadas", href: "/charadas", icon: Library, color: "text-secondary", subtitle: "Acervo local + gerador com IA" },
                        { name: "Todas as charadas", href: "/charadas-offline", icon: Laugh, color: "text-secondary", subtitle: "Busca, dicas e progresso local" },
                        { name: "Charada do dia", href: "/charadas-offline?dia=1", icon: Sparkles, color: "text-primary", subtitle: "Uma nova piada a cada dia" },
                      ]
                    },
                    { name: "Charadas Online (IA)", href: "/charadas?modo=ia", icon: Wifi, isOnline: true, isPremium: true, color: "text-secondary" }
                  ]}
                />

                <DashboardGroup 
                  name="Enigmas"
                  icon={Ghost}
                  bg="bg-error/10"
                  color="text-error"
                  description="Enigmas de lógica, matemática, palavras, mistério, ciência e muito mais. Jogue offline ou gere novos casos com a IA."
                  isPremium={isPremium}
                  onPremiumClick={() => setShowPremiumUpgrade(true)}
                  options={[
                    { 
                      name: "Acervo de Enigmas", 
                      icon: Ghost, 
                      color: "text-on-surface-variant/60",
                      subOptions: [
                        { name: "Todos os enigmas", href: "/enigmas-offline", icon: Ghost, color: "text-error", subtitle: "Busca, dicas e progresso local" },
                        { name: "Enigma do dia", href: "/enigmas-offline?dia=1", icon: Sparkles, color: "text-primary", subtitle: "Um novo mistério a cada dia" },
                      ]
                    },
                    { name: "Enigmas Online (IA)", href: "/enigmas?modo=ia", icon: Wifi, isOnline: true, isPremium: true, color: "text-error" }
                  ]}
                />
              </section>

              {/* Footer info */}
              <footer className="text-center pt-8">
                <p className="text-[0.5625rem] text-on-surface-variant/30 uppercase tracking-[0.3em]">
                  Criado Por xSnoopx
                </p>
              </footer>
            </div>
            
            <BottomNav />
          </motion.main>
        )}
      </AnimatePresence>

      {/* PLAY STORE RATING REMINDER MODAL */}
      <AnimatePresence>
        {showRatingReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm glass-panel border border-primary/30 p-6 rounded-[32px] shadow-2xl relative overflow-hidden backdrop-blur-2xl text-center space-y-5"
            >
              {/* Visual accents */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none -z-10" />
              
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400/20 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-base font-black uppercase tracking-wider text-amber-300">Avalie o Simulado Prime</h3>
                <p className="text-xs text-white/70 leading-relaxed px-2">
                  Está gostando da sua preparação para o SUCESSO? Sua avaliação de 5 estrelas é o combustível que impulsiona nossa galáxia de aprendizado!
                </p>
              </div>

              {!reminderSubmitted ? (
                <div className="space-y-4">
                  {/* Interactive Stars Row */}
                  <div className="flex justify-center gap-2 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isLit = starVal <= (reminderHoverRating || reminderRating);
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setReminderHoverRating(starVal)}
                          onMouseLeave={() => setReminderHoverRating(0)}
                          onClick={() => setReminderRating(starVal)}
                          className="p-1 px-1.5 transition-all text-amber-400 hover:scale-125 duration-150 cursor-pointer"
                        >
                          <Star 
                            className={`w-8 h-8 transition-all ${
                              isLit 
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                              : 'text-white/20'
                            }`} 
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* PlayStore Action */}
                  {reminderRating >= 4 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/15 text-left space-y-3"
                    >
                      <p className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        Ficamos imensamente gratos pelo carinho!
                      </p>
                      <p className="text-[0.6875rem] text-white/70 leading-relaxed">
                        Deixe sua avaliação de 5 estrelas diretamente na Google Play Store. Isso ajuda outros vestibulandos a descobrirem o Cosmos!
                      </p>
                      <a
                        href="https://play.google.com/store/apps/details?id=com.cosmos.enem"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setReminderSubmitted(true);
                          localStorage.setItem('cosmos_app_rated', 'true');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md"
                      >
                        Avaliar na Google Play 🚀
                      </a>
                    </motion.div>
                  )}

                  {/* Written Feedback Form for < 4 stars */}
                  {reminderRating > 0 && reminderRating < 4 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2 text-left"
                    >
                      <label className="text-[0.625rem] font-black uppercase tracking-widest text-white/40">Como podemos melhorar?</label>
                      <textarea
                        value={reminderFeedback}
                        onChange={(e) => setReminderFeedback(e.target.value)}
                        placeholder="Quais erros você encontrou, ou o que podemos adicionar na próxima atualização espacial?"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-all text-white placeholder-white/30 h-24 resize-none"
                      />
                      <button
                        onClick={() => {
                          if (reminderFeedback.trim()) {
                            setReminderSubmitted(true);
                            localStorage.setItem('cosmos_app_rated', 'true');
                          }
                        }}
                        disabled={!reminderFeedback.trim()}
                        className="w-full py-3 bg-primary hover:bg-opacity-90 disabled:opacity-40 disabled:hover:bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                      >
                        Enviar Sugestão 💫
                      </button>
                    </motion.div>
                  )}

                  {/* Standard Dismiss Options */}
                  {reminderRating === 0 && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setShowRatingReminder(false);
                          // Just close it, keeping the visits so they get reminded again in 3 visits
                        }}
                        className="flex-1 py-3 px-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl font-bold text-[0.625rem] uppercase tracking-wider transition-all"
                      >
                        Mais Tarde ⏰
                      </button>
                      <button
                        onClick={() => {
                          setShowRatingReminder(false);
                          localStorage.setItem('cosmos_rating_dismissed', 'true');
                        }}
                        className="flex-1 py-3 px-2 border border-white/10 hover:border-white/20 text-white/40 hover:text-white/60 rounded-xl font-bold text-[0.625rem] uppercase tracking-wider transition-all"
                      >
                        Não Mostrar 🪐
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <p className="text-[1.8rem]">⭐🌌⭐</p>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Obrigado por ajudar a crescer!</h4>
                  <p className="text-[0.6875rem] text-white/70 leading-relaxed px-1">
                    Seu feedback ajuda a moldar a inteligência do Cosmos para apoiar milhares de estudantes.
                  </p>
                  <button
                    onClick={() => {
                      setShowRatingReminder(false);
                      // reset states
                      setTimeout(() => {
                        setReminderRating(0);
                        setReminderFeedback('');
                        setReminderSubmitted(false);
                      }, 500);
                    }}
                    className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Prosseguir ao Painel
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FAQ MODAL */}
      <AnimatePresence>
        {isFaqOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-lg glass-panel border border-white/15 p-6 rounded-[32px] shadow-2xl relative overflow-hidden backdrop-blur-2xl space-y-5 max-h-[85vh] flex flex-col text-left text-white"
            >
              {/* Visual accent glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/15 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/15 text-primary">
                    <HelpCircle className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
                      Perguntas Frequentes
                    </h3>
                    <p className="text-[0.625rem] text-white/45">Dúvidas comuns sobre o Simulado Prime</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFaqOpen(false)}
                  className="p-2 hover:bg-white/5 active:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable FAQ Accordion */}
              <div className="flex-1 overflow-y-auto pr-1/2 -mr-1/2 space-y-3.5 pt-2 max-h-[60vh] scrollbar-thin">
                {[
                  {
                    question: "🚀 O que é o Simulado Prime?",
                    answer: "É uma plataforma de estudos para o Ensino Médio e vestibulares. Reúne simulados por área, questões geradas por IA, enigmas e charadas, com XP, níveis, conquistas e ranking. O conteúdo tradicional fica no próprio app; os recursos de IA e o ranking usam a internet."
                  },
                  {
                    question: "📚 Quais áreas posso treinar?",
                    answer: (
                      <div className="space-y-2">
                        <p>Cada simulado por área traz 10 questões com alternativas de A a E. As áreas são:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[0.6563rem]">
                          <li><strong>Matemática:</strong> Álgebra, Geometria, Estatística e Raciocínio Lógico.</li>
                          <li><strong>Linguagens:</strong> Interpretação de Texto, Literatura, Artes e Língua Estrangeira.</li>
                          <li><strong>Ciências da Natureza:</strong> Biologia, Física e Química.</li>
                          <li><strong>Ciências Humanas:</strong> História, Geografia, Filosofia e Sociologia.</li>
                          <li><strong>Matérias Aleatórias:</strong> um mix das quatro áreas em um só simulado.</li>
                        </ul>
                      </div>
                    )
                  },
                  {
                    question: "🎮 Quais são os modos de treino?",
                    answer: (
                      <div className="space-y-2">
                        <p>O modo escolhido vale para todos os simulados por área:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[0.6563rem]">
                          <li><strong>Regular:</strong> permite usar dicas e voltar a questões anteriores.</li>
                          <li><strong>Hardcore:</strong> sem dicas e sem voltar. Disponível para todos.</li>
                          <li><strong>Desafio:</strong> 30 segundos por questão, sem dicas e sem voltar. Requer PRIME.</li>
                          <li><strong>Sobrevivência:</strong> um erro encerra o simulado, sem dicas e sem voltar. Requer PRIME.</li>
                        </ul>
                        <p>Desafio e Sobrevivência dependem do PRIME, que ainda não está com pagamento liberado.</p>
                      </div>
                    )
                  },
                  {
                    question: "💡 Como funcionam as dicas?",
                    answer: "As dicas aparecem apenas no modo Regular. Elas são montadas a partir do enunciado e, quando necessário, do texto-base: identificam o tema (porcentagem, filosofia, genética, figuras de linguagem etc.) e o comando da questão (causa, consequência, objetivo, inferência...). A dica orienta o raciocínio e não entrega a alternativa correta. Nos modos Desafio, Hardcore e Sobrevivência não há dicas."
                  },
                  {
                    question: "⚡ Como funcionam o XP, os níveis e os títulos?",
                    answer: (
                      <div className="space-y-2">
                        <p>O XP é acumulado por resposta, conforme o modo de treino:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[0.6563rem]">
                          <li><strong>Regular:</strong> 5 XP por acerto; erro não rende XP.</li>
                          <li><strong>Hardcore:</strong> 15 XP por acerto e 5 XP por erro.</li>
                          <li><strong>Desafio:</strong> 25 XP por acerto e 10 XP por erro.</li>
                          <li><strong>Sobrevivência:</strong> 30 XP por acerto e 15 XP por erro.</li>
                        </ul>
                        <p>Cada nível exige 150 XP. O título evolui com o nível:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[0.6563rem]">
                          <li><strong>Cadete do Cosmos:</strong> níveis 1 e 2.</li>
                          <li><strong>Explorador de Nebulosas:</strong> níveis 3 a 5.</li>
                          <li><strong>Viajante Sideral:</strong> níveis 6 a 9.</li>
                          <li><strong>Explorador de Galáxias:</strong> níveis 10 a 14.</li>
                          <li><strong>Sábio do Universo:</strong> nível 15 em diante.</li>
                        </ul>
                      </div>
                    )
                  },
                  {
                    question: "🏆 Como funciona o ranking?",
                    answer: "O Ranking Estelar compara o XP dos exploradores. Para participar e aparecer no quadro, é preciso ter uma conta ativa no Perfil. Com conexão, a lista é atualizada em tempo real; sem conta, a página mostra o aviso de acesso restrito. O ranking é apenas de classificação: não altera seu XP nem suas estatísticas."
                  },
                  {
                    question: "🥇 Como funcionam as conquistas?",
                    answer: "O app reúne dezenas de conquistas ligadas a acertos, questões respondidas, XP, níveis e uso das áreas. Elas são calculadas a partir do seu progresso e aparecem na seção Conquistas do Perfil. Com conta, também são sincronizadas na nuvem."
                  },
                  {
                    question: "🖼️ Como funcionam avatares e molduras?",
                    answer: (
                      <div className="space-y-2">
                        <p>Há uma galeria com mais de 100 avatares e 50 molduras liberados por XP. Você escolhe os itens no Perfil, nas seções Avatares e Molduras Interativas.</p>
                        <p>Também existem avatares e molduras premium. Eles só serão liberados com o PRIME ativo — e o pagamento do PRIME ainda não está disponível. O avatar e a moldura escolhidos aparecem no Perfil e no Ranking.</p>
                      </div>
                    )
                  },
                  {
                    question: "📡 O app funciona sem internet?",
                    answer: "Os simulados por área, o acervo de charadas e o acervo de enigmas usam dados que ficam no próprio app e não dependem de IA nem de consulta a banco de dados online. Já os simulados com IA, as charadas e enigmas online, o ranking e a sincronização da conta precisam de conexão. Para usar os recursos online, é necessário estar logado."
                  },
                  {
                    question: "🧠 Como funcionam os simulados com IA?",
                    answer: "Em Simulado Online (IA), a IA gera uma questão por vez. A cada nova questão, o app sorteia área, tema e dificuldade e monta um enunciado inédito com texto-base, cinco alternativas, gabarito e explicação. O recurso exige conta e conexão, mas não exige PRIME."
                  },
                  {
                    question: "🕵️ O que são Charadas e Enigmas?",
                    answer: (
                      <div className="space-y-2">
                        <p><strong>Charadas:</strong> acervo local com busca, filtros, dicas e progresso. Há também a Charada do dia.</p>
                        <p><strong>Enigmas:</strong> acervo local com busca, filtros, dicas e progresso. Há também o Enigma do dia.</p>
                        <p>As versões online com IA são exclusivas do PRIME. Como o pagamento ainda não está liberado, elas permanecem bloqueadas.</p>
                      </div>
                    )
                  },
                  {
                    question: "☁️ Preciso criar conta? O que muda?",
                    answer: (
                      <div className="space-y-2">
                        <p>Você pode treinar como convidado: os simulados e o progresso local funcionam, e o XP fica salvo no navegador.</p>
                        <p>A conta gratuita libera o Ranking Estelar, o cronômetro personalizado, a sincronização na nuvem e os recursos de IA.</p>
                        <p>O PRIME é separado: só será liberado após a confirmação de um pagamento real, e o checkout ainda não está disponível.</p>
                      </div>
                    )
                  },
                  {
                    question: "💎 Como funciona o PRIME?",
                    answer: (
                      <div className="space-y-2">
                        <p>O PRIME (Cosmos Prime) é o plano de recursos especiais. Ele inclui os modos <strong>Desafio</strong> e <strong>Sobrevivência</strong>, as <strong>charadas e enigmas online por IA</strong> e os <strong>avatares e molduras premium</strong>.</p>
                        <p>O pagamento ainda não está habilitado: o botão mostra “Assinatura em breve” e nenhuma ativação de demonstração é liberada. O acesso só será concedido após a confirmação de um pagamento real.</p>
                      </div>
                    )
                  }
                ].map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div 
                      key={idx} 
                      className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] active:bg-white/[0.04] transition-all cursor-pointer"
                      >
                        <span className="font-display font-medium text-xs tracking-wide text-white/90 pr-2">
                          {faq.question}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 20 }}
                          className="text-primary/70 shrink-0"
                        >
                          <ChevronDown className="w-4 h-4 text-amber-400" />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                          >
                            <div className="px-4 pb-4 pt-1.5 text-[0.6875rem] text-white/70 leading-relaxed border-t border-white/[0.03] bg-white/[0.01]">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Close Button */}
              <div className="pt-2 shrink-0">
                <button
                  onClick={() => setIsFaqOpen(false)}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 active:scale-98 rounded-xl font-display font-bold text-xs uppercase tracking-widest text-white transition-all cursor-pointer border border-white/5 shadow-md flex items-center justify-center gap-2"
                >
                  Fechar Perguntas 🌌
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM GATEWAY MODAL OVERLAY */}
      <AnimatePresence>
        {showPremiumUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto w-full h-full">
            <div className="w-full max-w-lg my-8">
              <PremiumGateway 
                onClose={() => {
                  setShowPremiumUpgrade(false);
                }} 
                onSuccess={() => {
                  setIsPremium(true);
                  setShowPremiumUpgrade(false);
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
