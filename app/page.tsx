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
          className="w-full glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all group/sub"
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl bg-white/5", opt.color)}>
              <opt.icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-display font-bold text-sm tracking-wide">{opt.name}</span>
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-2.5 h-2.5 text-on-surface-variant/40" />
                <span className="text-[8px] font-bold text-on-surface-variant/50 tracking-widest uppercase">
                  {isSubOpen ? 'Fechar Categorias' : 'Ver Categorias'}
                </span>
              </div>
            </div>
          </div>
          <motion.div 
            animate={{ rotate: isSubOpen ? 180 : 0 }}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5"
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
                    <div className={cn("p-1.5 rounded-lg bg-white/5", sub.color)}>
                      <sub.icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-display font-bold text-xs tracking-wide">{sub.name}</span>
                      {sub.subtitle && (
                        <p className="text-[7px] text-on-surface-variant/50 font-bold uppercase tracking-[0.1em] -mt-0.5">
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
          "w-full glass-panel p-4 rounded-2xl flex items-center justify-between border transition-all",
          isLocked 
            ? "border-amber-500/10 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10" 
            : "border-white/5 hover:bg-white/10 active:scale-[0.98]"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl bg-white/5", opt.color)}>
            <opt.icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-display font-bold text-sm tracking-wide">{opt.name}</span>
            {opt.subtitle && (
              <p className="text-[8px] text-on-surface-variant/60 font-bold uppercase tracking-widest -mt-0.5 mb-0.5">
                {opt.subtitle}
              </p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {opt.isOnline ? <Wifi className="w-2.5 h-2.5 text-primary" /> : <WifiOff className="w-2.5 h-2.5 text-on-surface-variant/40" />}
              <span className="text-[8px] font-bold text-on-surface-variant/50 tracking-widest uppercase">
                {opt.isOnline ? 'Online' : 'Offline'}
              </span>
              {opt.isPremium && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-500 text-[6px] font-black uppercase text-black tracking-widest flex items-center gap-0.5 shadow-md shadow-amber-400/10 self-center">
                  ⚡ PRIME
                </span>
              )}
            </div>
          </div>
        </div>
        {isLocked ? (
          <div className="p-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-[8px] font-display font-medium uppercase text-amber-300 flex items-center gap-1 shadow-sm shadow-amber-500/5 animate-pulse">
            <Lock className="w-3 h-3 text-amber-400" /> Locked
          </div>
        ) : (
          <div className="w-1 h-6 bg-current opacity-20 rounded-full" style={{ backgroundColor: color }} />
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
          className="w-full glass-panel p-6 rounded-3xl flex items-center gap-4 text-left transition-all hover:bg-white/5 border border-white/5 shadow-xl relative overflow-hidden"
        >
          <div className={cn("p-4 rounded-2xl", bg, color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg uppercase tracking-wider">{name}</h3>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
              {isOpen ? 'Clique para fechar' : 'Clique para ver subcategorias'}
            </p>
          </div>
          <div className="w-10" />
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
                <p className="text-[13px] text-on-surface font-medium leading-relaxed italic">
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
                    <p className="text-[11px] leading-relaxed text-amber-300/80">
                      Você está no modo convidado. Faça login ou crie uma conta gratuita para liberar o <strong className="text-amber-200 font-semibold">Cronômetro Personalizado</strong>, competir no <strong className="text-amber-200 font-semibold">Ranking Geral</strong>, salvar seu progresso na nuvem e analisar estatísticas completas!
                    </p>
                    <div className="pt-2">
                      <Link href="/profile">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 hover:text-amber-100 underline decoration-dotted transition-colors">
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
    console.log(`Homepage track ${homepageTrack} failed to load. Falling back to local background.mp3.`);
    setHomepageTrack('/background.mp3');
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
      <div className="relative min-h-screen flex flex-col overflow-x-hidden">
        <div className="starfield" />
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div className="starfield" />
      
      {/* Dynamic Background Music Track with automatic online fallback */}
      <audio 
        ref={audioRef} 
        loop 
        src={homepageTrack} 
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

      {/* Background Glows for Galaxy Style */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
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
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center space-y-12 z-10"
          >
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-64 h-64 rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl shadow-primary/30"
              >
                <Image
                  src={rocketLogo}
                  alt="Logo"
                  fill
                  className="object-cover scale-[1.3] object-top"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Text Section */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-display font-bold tracking-tight uppercase leading-tight">
                Seja Bem-Vindo ao <br />
                <span className="gradient-text text-5xl">
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
                    <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden border border-primary/30 shadow-2xl shadow-primary/20">
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
                    className="text-4xl font-display font-bold uppercase tracking-tight leading-tight"
                  >
                    Bem-Vindo ao<br />
                    <span className="gradient-text text-5xl">Dashboard Prime</span>
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
                  description="Divirta-se com charadas clássicas disponíveis offline ou peça para nossa IA criar novas piadas e trocadilhos exclusivos para você."
                  isPremium={isPremium}
                  onPremiumClick={() => setShowPremiumUpgrade(true)}
                  options={[
                    { name: "Charadas Off-line", href: "/charadas-offline", icon: Laugh, isOnline: false, color: "text-on-surface-variant/60" },
                    { name: "Charadas Online (IA)", href: "/charadas", icon: Wifi, isOnline: true, isPremium: true, color: "text-secondary" }
                  ]}
                />

                <DashboardGroup 
                  name="Enigmas"
                  icon={Ghost}
                  bg="bg-error/10"
                  color="text-error"
                  description="Desafie seu raciocínio lógico com enigmas de mistério. Resolva os clássicos sem internet ou encare novos mistérios da IA."
                  isPremium={isPremium}
                  onPremiumClick={() => setShowPremiumUpgrade(true)}
                  options={[
                    { 
                      name: "Enigmas Off-line", 
                      icon: Ghost, 
                      color: "text-on-surface-variant/60",
                      subOptions: [
                        { name: "Enigmas SIMPLES", href: "/enigmas-offline?difficulty=simples", icon: Ghost, color: "text-primary" },
                        { name: "Enigmas COMPLEXOS", href: "/enigmas-offline?difficulty=complexos", icon: Ghost, color: "text-error" },
                      ]
                    },
                    { name: "Enigmas Online (IA)", href: "/enigmas", icon: Wifi, isOnline: true, isPremium: true, color: "text-error" }
                  ]}
                />
              </section>

              {/* Footer info */}
              <footer className="text-center pt-8">
                <p className="text-[9px] text-on-surface-variant/30 uppercase tracking-[0.3em]">
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
              className="w-full max-w-sm glass-panel border border-primary/30 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden backdrop-blur-2xl text-center space-y-5"
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
                      <p className="text-[11px] text-white/70 leading-relaxed">
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
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Como podemos melhorar?</label>
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
                        className="flex-1 py-3 px-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                      >
                        Mais Tarde ⏰
                      </button>
                      <button
                        onClick={() => {
                          setShowRatingReminder(false);
                          localStorage.setItem('cosmos_rating_dismissed', 'true');
                        }}
                        className="flex-1 py-3 px-2 border border-white/10 hover:border-white/20 text-white/40 hover:text-white/60 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
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
                  <p className="text-[11px] text-white/70 leading-relaxed px-1">
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
              className="w-full max-w-lg glass-panel border border-white/15 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden backdrop-blur-2xl space-y-5 max-h-[85vh] flex flex-col text-left text-white"
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
                    <p className="text-[10px] text-white/45">Dúvidas comuns sobre o Simulado Prime</p>
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
                    answer: "O Simulado Prime é uma plataforma de estudos inovadora desenvolvida para simular provas oficiais da forma mais imersiva e prazerosa possível, combinando simulados offline tradicionais por áreas do conhecimento, desafios dinâmicos gerados com Inteligência Artificial, e jogos de raciocínio como Enigmas e Charadas para potencializar sua preparação."
                  },
                  {
                    question: "🧠 Como funcionam os Simulados com IA?",
                    answer: "Além da nossa base de estudos tradicionais offline, você conta com um gerador online de simulados alimentado pelo modelo de Inteligência Artificial Gemini de última geração. Clicando em 'Simulado Online', a IA formula na hora questões inéditas com gabaritos comentados baseados na área escolhida."
                  },
                  {
                    question: "📡 É possível praticar sem conexão de rede (Offline)?",
                    answer: "Sim! O Simulado Prime foi projetado para alta acessibilidade. Os simulados por área, as charadas e dezenas de enigmas (tanto os simples quanto os complexos) rodam de forma 100% offline sem consumir seus dados móveis ou internet."
                  },
                  {
                    question: "⚡ Como funciona a assinatura Cosmos Prime?",
                    answer: (
                      <div className="space-y-2">
                        <p>O <strong>Cosmos Prime</strong> é um passe vitalício de R$ 14,90 pago uma única vez (sem assinaturas recorrentes ou mensalidades). Ele concede acesso instantâneo aos seguintes benefícios exclusivos:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                          <li><strong>Charadas Online por IA:</strong> Geração instantânea e ilimitada de novas piadas e trocadilhos por Inteligência Artificial.</li>
                          <li><strong>Enigmas Online por IA:</strong> Desafios de raciocínio lógico-dedutivo e mistérios de última geração gerados e avaliados por algoritmos de Machine Learning.</li>
                          <li><strong>Galeria desbloqueada:</strong> Mais de 50 novas molduras premium exclusivas e 50 avatares espaciais de alto nível para sua identidade cósmica.</li>
                        </ul>
                      </div>
                    )
                  },
                  {
                    question: "🔮 Como funciona o sistema de XP, Nível e Títulos?",
                    answer: (
                      <div className="space-y-2">
                        <p>Ao responder simulados, você acumula pontos de experiência (XP) cósmicos de maneira contínua:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                          <li><strong>Ganho de XP:</strong> Você ganha 15 XP por cada resposta correta e 5 XP por tentativas incorretas nos simulados.</li>
                          <li><strong>Níveis cósmicos:</strong> Cada nível exige precisamente 150 XP. Por exemplo, alcançar o Nível 5 exige 600 XP e o Nível 10 exige 1350 XP.</li>
                          <li><strong>Títulos Evolutivos:</strong> Seu título no Perfil evolui dinamicamente conforme seu nível: <strong>Recruta do Cosmos</strong> (Nível 1-2), <strong>Explorador de Nebulosas</strong> (Nível 3-5), <strong>Viajante Sideral</strong> (Nível 6-9), <strong>Explorador de Galáxias</strong> (Nível 10-14) e finalizando como <strong>Sábio do Universo</strong> (Nível 15+).</li>
                        </ul>
                      </div>
                    )
                  },
                  {
                    question: "🏆 Como funcionam as Medalhas e Conquistas?",
                    answer: "O Cosmos analisa continuamente suas sessões finalizadas para coroar você com insígnias e troféus em tempo real! Conquistas como 'Mestre de Newton' (Matemática), 'Darwin Sideral' (Natureza) e 'Aristóteles Galáctico' (Humanas) podem ser desbloqueadas. Você pode visualizar e ostentar suas medalhas na galeria de conquistas do seu perfil."
                  },
                  {
                    question: "🖼️ O que são as Molduras de Prestígio e como equipá-las?",
                    answer: (
                      <div className="space-y-2">
                        <p>As molduras envolvem e destacam o seu avatar no Dashboard e no Ranking Geral. Estão divididas em séries temáticas e podem ser ativadas na página de Edição de Perfil:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                          <li><strong>Série Cyberpunk:</strong> Molduras futuristas e dinâmicas com temática cibernética (IDs 11 a 20).</li>
                          <li><strong>Série Místico:</strong> Molduras arcanas e mágicas com gradientes brilhantes (IDs 21 a 30).</li>
                          <li><strong>Série Imperial:</strong> Molduras nobres com detalhes metálicos dourados e prateados de soberano (IDs 31 a 40).</li>
                        </ul>
                      </div>
                    )
                  },
                  {
                    question: "🎵 Como funciona o controle de música de fundo e som ambiente?",
                    answer: "Projetamos uma trilha sonora relaxante com 9 faixas espaciais sob medida para incentivar seu estado de hiperfoco. Você pode controlar a música no pequeno painel fixado no topo esquerdo da tela: ligue/desligue tocando no ícone do alto-falante ou passe o mouse por cima do controle para abrir o slider de ajuste fino de volume."
                  },
                  {
                    question: "🕵️ Quais tipos de Enigmas posso desvendar?",
                    answer: "Você pode exercitar seu cérebro de duas maneiras: a seção Offline oferece enigmas clássicos subdivididos entre 'Simples' e 'Complexos' de mistério. A seção Online (Exclusivo Prime) gera misteriosos cenários interativos usando IA, nos quais você digita sua teoria e a IA julga o quão perto você está de solucionar o crime cósmico."
                  },
                  {
                    question: "☁️ Como funciona a sincronização e o salvamento em nuvem?",
                    answer: "Através da aba 'Perfil', você pode se cadastrar ou fazer login gratuitamente. Suas estatísticas de acertos, tempo médio de resolução, preferências de temporizador e todas as conquistas desbloqueadas são automaticamente sincronizadas e protegidas na nuvem via Supabase."
                  },
                  {
                    question: "🧮 Quais tópicos inovadores são abordados em Matemática?",
                    answer: (
                      <div className="space-y-2">
                        <p>As novas questões cobram rigorosamente tópicos recorrentes nos principais exames e vestibulares com roupagem altamente inovadora e tecnológica:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                          <li><strong>Otimização de Custos e Aprendizado:</strong> Cálculo de taxas de aprendizado de redes neurais com funções quadráticas para minimizar perdas em satélites em órbita de mineração cósmica.</li>
                          <li><strong>Crescimento Exponencial Estável:</strong> Cálculo de tempos de reação e eficiência em reatores de fusão nuclear estável (Tokamaks).</li>
                          <li><strong>Análise Combinatória Avançada:</strong> Arranjos geométricos de criptografia pós-quântica compostos por fótons emaranhados e spins quânticos binários.</li>
                          <li><strong>Sistemas Lineares e Matrizes:</strong> Gestão compartilhada de dados diários de sondas meteorológicas monitorando mudanças climáticas severas.</li>
                          <li><strong>Progressão Geométrica Cumulativa:</strong> Planejamento progressivo de plantio de árvores clonadas para neutralização urbana de emissões.</li>
                        </ul>
                      </div>
                    )
                  },
                  {
                    question: "🔬 Quais temas de vanguarda são cobrados em Ciências da Natureza?",
                    answer: (
                      <div className="space-y-2">
                        <p>As novas questões de Ciências da Natureza cobrem temas inovadores e interdisciplinares:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                          <li><strong>Biotecnologia CRISPR:</strong> Pareamento de pontes de hidrogênio e nucleotídeos em fitas moldes de DNA promovido por Cas14-Max para tratamento oncológico celular.</li>
                          <li><strong>Física Quântica de Supercondutores:</strong> Efeito Meissner, condutividade e formação de pares de Cooper em hidretos dopados sob regime de baixas resistências.</li>
                          <li><strong>Química Verde:</strong> Reações de clivagem de ésteres por hidrólise enzimática para recuperação e biorremediação de microplásticos degradados.</li>
                          <li><strong>Fisiologia de Nanomedicina:</strong> Imunologia oncológica, atração de células dendríticas e ação citotóxica direcionada de linfócitos T.</li>
                          <li><strong>Ecologia Climática:</strong> Captura acelerada de carbono atmosférico através de folhas artificiais e algas com ciclos enzimáticos de RuBisCO.</li>
                        </ul>
                      </div>
                    )
                  },
                  {
                    question: "🗺️ Como as Ciências Humanas abordam o impacto das inovações?",
                    answer: (
                      <div className="space-y-2">
                        <p>As questões de Ciências Humanas analisam de forma crítica as profundas transformações contemporâneas:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                          <li><strong>Geopolítica e Direitos Humanos:</strong> Cidadania climática em nuvem e soberania virtual para refugiados de nações insulares ameaçadas por elevações do nível dos oceanos.</li>
                          <li><strong>Sociologia do Trabalho:</strong> Análise do fenômeno da "Plataformização Mutualista" através de cooperativas de entregadores auto-reguladas por blockchain.</li>
                          <li><strong>Ética e Filosofia Algorítmica:</strong> Análise do imperativo moral da justificação diante do erro da opacidade de algoritmos "Caixa-Preta" em seleções de emprego e triagens judiciais.</li>
                          <li><strong>Geo-Governança de Mobilidade:</strong> Sustentabilidade socioambiental, micro-mobilidade ativa conectada e direito das populações ciclistas ao ordenamento territorial.</li>
                          <li><strong>Antropologia Digital:</strong> Análise da criação identitária no Metaverso com avatares e superação de vieses coloniais clássicos de raça e gênero.</li>
                        </ul>
                      </div>
                    )
                  },
                  {
                    question: "✍️ Como Linguagens e Códigos explora os novos discursos?",
                    answer: (
                      <div className="space-y-2">
                        <p>As novas questões de Linguagens e Códigos abordam a evolução das mídias, semiótica e comunicação digital:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                          <li><strong>Letramento Midiático Crítico:</strong> Habilidades de checagem contra a desconstrução da evidência factual direta provocada por sínteses de vídeos e fotos através de Deepfakes.</li>
                          <li><strong>Poéticas Imersivas e Digitais:</strong> Integração entre literatura de hipertexto e feedback corporal fisiológico (sensores cardíacos de leitores coautores).</li>
                          <li><strong>Pragmática de Redes de Computadores:</strong> Semiótica e expressividade humana através das variações e cores dos chamados "Neo-Emojis Neurais".</li>
                          <li><strong>Variação Linguística e Neologismo:</strong> Dicionarização e produtividade lexical urbana por gírias e expressões do campo do software (ex: "alopar a IA", "dar um prompt-falso").</li>
                          <li><strong>Semiótica e Curadoria Artística:</strong> Desafios estéticos, jurídicos e conceituais do gênio criador único em obras de arte geradas em coautoria com algoritmos de IA.</li>
                        </ul>
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
                            <div className="px-4 pb-4 pt-1.5 text-[11px] text-white/70 leading-relaxed border-t border-white/[0.03] bg-white/[0.01]">
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
