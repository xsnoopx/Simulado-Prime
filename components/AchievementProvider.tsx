'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles } from 'lucide-react';
import { getStats, SimuladoStats } from '@/lib/stats';
import { getAchievements, Achievement, syncAchievementsToSupabase, getAchievementIdByTitle } from '@/lib/achievements';
import { syncAllDataToSupabase } from '@/lib/supabaseSync';

interface AchievementQueueItem {
  id: string;
  title: string;
  desc: string;
  color: string;
}

interface AchievementContextType {
  triggerAchievementManually: (title: string, desc: string, color?: string) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function useAchievement() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievement must be used within an AchievementProvider');
  }
  return context;
}

// Helper to play a programmatic futuristic space-themed achievement chime (synth warp + star shimmer)
function playAchievementSound() {
  if (typeof window === 'undefined') return;

  // Respect user preference if saved in local storage
  const soundEnabled = localStorage.getItem('study_music_enabled') !== 'false';
  if (!soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // --- SOUND LAYER 1: The Galactic Warp Swoosh (Sopros Espaciais) ---
    const oscWarp = ctx.createOscillator();
    const gainWarp = ctx.createGain();
    
    oscWarp.type = 'sine';
    // Deep warp sweeping upwards in frequency
    oscWarp.frequency.setValueAtTime(140, now);
    oscWarp.frequency.exponentialRampToValueAtTime(680, now + 0.45);
    
    gainWarp.gain.setValueAtTime(0.001, now);
    gainWarp.gain.linearRampToValueAtTime(0.14, now + 0.18);
    gainWarp.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    
    oscWarp.connect(gainWarp);
    gainWarp.connect(ctx.destination);
    
    oscWarp.start(now);
    oscWarp.stop(now + 0.7);

    // --- SOUND LAYER 2: Ambient Echo Delay Filter (Filtro Espacial) ---
    // Crystalline Star Shimmer Chord (Arpégios cósmicos de quintas e oitavas perfeitas)
    const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    
    frequencies.forEach((freq, index) => {
      const delay = index * 0.07; // Cascade delays for stellar arpeggio feeling
      
      const oscBell = ctx.createOscillator();
      const gainBell = ctx.createGain();
      
      // Alternate waveforms for celestial texture depth
      oscBell.type = index % 3 === 0 ? 'sine' : 'triangle';
      
      // Slight pitch glide up (shattering gravity feeling)
      oscBell.frequency.setValueAtTime(freq, now + delay);
      oscBell.frequency.exponentialRampToValueAtTime(freq * 1.3, now + delay + 0.35);
      
      gainBell.gain.setValueAtTime(0.001, now + delay);
      gainBell.gain.linearRampToValueAtTime(0.06, now + delay + 0.04);
      gainBell.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.75);
      
      oscBell.connect(gainBell);
      gainBell.connect(ctx.destination);
      
      oscBell.start(now + delay);
      oscBell.stop(now + delay + 0.8);
    });

  } catch (e) {
    console.warn('Could not produce space achievement audio', e);
  }
}

// Helper function to normalize titles into clean, predictable IDs
function normalizeId(title: string): string {
  return getAchievementIdByTitle(title);
}

// Read seen achievements list from local storage
const getSeenAchievements = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const seen = localStorage.getItem('cosmos_seen_ach_notifications_v1');
    return seen ? JSON.parse(seen) : [];
  } catch {
    return [];
  }
};

// Save newly seen achievement to local storage
const saveSeenAchievement = (key: string) => {
  if (typeof window === 'undefined') return;
  try {
    const seen = getSeenAchievements();
    if (!seen.includes(key)) {
      seen.push(key);
      localStorage.setItem('cosmos_seen_ach_notifications_v1', JSON.stringify(seen));
      // Sync seen state to Supabase in background
      syncAllDataToSupabase().catch((err) => {
        console.warn("Could not sync seen achievements list to Supabase:", err);
      });
    }
  } catch (e) {
    console.error('Error saving seen achievement to local storage:', e);
  }
};

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<AchievementQueueItem[]>([]);
  const [current, setCurrent] = useState<AchievementQueueItem | null>(null);
  const knownUnlockedRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef<boolean>(false);

  // 1. Initialize known unlocked achievements on mount (avoid duplicate triggers of past progress)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialStats = getStats();
    const seenList = getSeenAchievements();
    const seenSet = new Set(seenList);

    if (initialStats) {
      const initialAchievements = getAchievements(initialStats);
      initialAchievements.forEach(a => {
        if (a.unlocked) {
          knownUnlockedRef.current.add(a.id);
          const normTitle = normalizeId(a.title);
          knownUnlockedRef.current.add(normTitle);
          
          if (!seenSet.has(a.id)) {
            saveSeenAchievement(a.id);
            seenSet.add(a.id);
          }
          if (!seenSet.has(normTitle)) {
            saveSeenAchievement(normTitle);
            seenSet.add(normTitle);
          }
        }
      });
    }

    // Trigger initial Supabase achievements sync on mount
    syncAchievementsToSupabase();

    // Listener for stats-updated custom event
    const handleStatsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SimuladoStats>;
      const statsData = customEvent.detail || getStats();
      if (!statsData) return;

      const currentAchievements = getAchievements(statsData);
      
      const newlyUnlocked: AchievementQueueItem[] = [];
      const currentSeen = getSeenAchievements();

      currentAchievements.forEach(ach => {
        const normTitle = normalizeId(ach.title);
        // Only notify if unlocked, not triggered this session, AND has never been shown historically (Single-View)
        if (ach.unlocked && 
            !knownUnlockedRef.current.has(ach.id) && 
            !knownUnlockedRef.current.has(normTitle) &&
            !currentSeen.includes(ach.id) &&
            !currentSeen.includes(normTitle)) {
          
          // Mark as seen immediately in both memory and local storage to prevent duplicate queueing
          knownUnlockedRef.current.add(ach.id);
          knownUnlockedRef.current.add(normTitle);
          saveSeenAchievement(ach.id);
          saveSeenAchievement(normTitle);

          newlyUnlocked.push({
            id: ach.id,
            title: ach.title,
            desc: ach.desc,
            color: ach.color || 'from-amber-400 to-orange-500'
          });
        }
      });

      if (newlyUnlocked.length > 0) {
        setQueue(prev => [...prev, ...newlyUnlocked]);
        // Sync any newly unlocked achievements to Supabase
        syncAchievementsToSupabase();
      }
    };

    // Listener for achievements-synced custom event to swallow/mark as known any remote/historical achievements downloaded
    const handleAchievementsSynced = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      const syncedIds = customEvent.detail || [];
      syncedIds.forEach(id => {
        knownUnlockedRef.current.add(id);
        saveSeenAchievement(id);
      });
    };

    window.addEventListener('stats-updated', handleStatsUpdated);
    window.addEventListener('achievements-synced', handleAchievementsSynced as EventListener);
    return () => {
      window.removeEventListener('stats-updated', handleStatsUpdated);
      window.removeEventListener('achievements-synced', handleAchievementsSynced as EventListener);
    };
  }, []);

  // 2. Process queue one by one (Ensures zero overlap / flawless sequencing)
  useEffect(() => {
    if (queue.length > 0 && !current && !isProcessingRef.current) {
      isProcessingRef.current = true;
      const nextItem = queue[0];
      
      // Remove from queue and set as current
      setQueue(prev => prev.slice(1));
      setCurrent(nextItem);
      
      // Sound effect play
      playAchievementSound();
      
      // Haptic Feedback vibe simulated via navigator
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        const hapticEnabled = localStorage.getItem('haptic_feedback_enabled') !== 'false';
        if (hapticEnabled) {
          navigator.vibrate([100, 50, 100]);
        }
      }

      // Display duration and auto shutdown
      setTimeout(() => {
        setCurrent(null);
        // Cooldown between notifications to let exit animation fully finish
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 600);
      }, 4200);
    }
  }, [queue, current]);

  // Manually trigger mock achievement (with bypass for seen restrictions on direct user testing/action)
  const triggerAchievementManually = (title: string, desc: string, color: string = 'from-violet-500 to-pink-600') => {
    const normId = normalizeId(title);

    // Save to local unlocked achievements list
    let localAch: string[] = [];
    try {
      const stored = localStorage.getItem('cosmos_unlocked_achievements_v1');
      if (stored) {
        localAch = JSON.parse(stored);
      }
    } catch (_) {}

    if (!localAch.includes(normId)) {
      localAch.push(normId);
      try {
        localStorage.setItem('cosmos_unlocked_achievements_v1', JSON.stringify(localAch));
      } catch (e) {
        console.warn("Erro ao salvar conquista manual:", e);
      }
    }

    // Bypass seen check completely for manual triggering, using a unique dynamic ID so it always triggers uniquely
    const manualItem: AchievementQueueItem = {
      id: `${normId}-${Date.now()}`,
      title,
      desc,
      color
    };
    setQueue(prev => [...prev, manualItem]);

    // Async sync all and achievements to Supabase
    syncAchievementsToSupabase();
    syncAllDataToSupabase().catch((err) => {
      console.warn("Could not sync manual achievements to Supabase:", err);
    });
  };

  return (
    <AchievementContext.Provider value={{ triggerAchievementManually }}>
      {children}

      {/* Flawless Xbox / Epic Games Store achievement popup interface */}
      <div className="fixed top-6 left-0 right-0 z-[99999] pointer-events-none flex justify-center px-4">
        <AnimatePresence>
          {current && (
            <motion.div
              id="achievement-notification-banner"
              initial={{ opacity: 0, y: -80, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.9, transition: { duration: 0.35, ease: 'easeIn' } }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              className="pointer-events-auto flex items-center gap-4 bg-slate-950/95 backdrop-blur-xl border border-amber-500/25 px-5 py-3.5 rounded-2xl md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_20px_rgba(245,158,11,0.15)] w-full max-w-sm sm:max-w-md select-none"
            >
              {/* Glowing Trophy Icon with Xbox style circular pulse */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-md opacity-60 animate-pulse" />
                <div className="relative h-11 w-11 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-inner">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>

              {/* Achievement Text & Details */}
              <div className="flex-1 text-left min-w-0 pr-1">
                <div className="flex items-center gap-1.5 h-4.5">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 font-sans">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-bounce" />
                    Conquista Desbloqueada
                  </span>
                </div>
                {/* Specific achievement Title with linear gradient background */}
                <h3 className="text-sm font-semibold text-white truncate font-display tracking-tight leading-snug">
                  {current.title}
                </h3>
                {/* Achievement description details style */}
                <p className="text-[10.5px] text-gray-400 truncate font-sans tracking-wide leading-none mt-0.5">
                  {current.desc}
                </p>
              </div>

              {/* Epic games / Space visual tag pill accent */}
              <div className="hidden sm:flex flex-shrink-0 h-6 px-2.5 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-300">
                  +50 XP
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AchievementContext.Provider>
  );
};
