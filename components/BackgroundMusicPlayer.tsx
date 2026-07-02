'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { syncAllDataToSupabase } from '@/lib/supabaseSync';

const LOCAL_TRACKS = [
  '/background.mp3',
  '/background2.mp3',
  '/background3.mp3',
  '/background4.mp3',
  '/background5.mp3',
  '/background6.mp3',
  '/background7.mp3',
  '/background8.mp3',
  '/background9.mp3',
];

const FALLBACK_ONLINE_TRACKS = [
  '/background.mp3',
  '/background2.mp3',
  '/background3.mp3',
  '/background4.mp3',
  '/background5.mp3',
  '/background6.mp3',
  '/background7.mp3',
  '/background8.mp3',
  '/background9.mp3',
];

export function BackgroundMusicPlayer() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [currentTrack, setCurrentTrack] = useState<string>('');
  const [activePool, setActivePool] = useState<string[]>(FALLBACK_ONLINE_TRACKS);
  const [isStudyMusicEnabled, setIsStudyMusicEnabled] = useState<boolean>(true);
  const [musicVolume, setMusicVolume] = useState<number>(0.15);
  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);

  // 1. Initialize local tracks at mount time
  useEffect(() => {
    setActivePool(LOCAL_TRACKS);
    const randomIndex = Math.floor(Math.random() * LOCAL_TRACKS.length);
    setCurrentTrack(LOCAL_TRACKS[randomIndex]);
  }, []);

  // 2. Poll settings for fallback and add instant window events
  useEffect(() => {
    const syncSettings = () => {
      if (typeof window !== 'undefined' && localStorage.getItem('study_music_enabled') === null) {
        localStorage.setItem('study_music_enabled', 'true');
      }
      const studyMusicPref = localStorage.getItem('study_music_enabled') !== 'false';
      setIsStudyMusicEnabled(studyMusicPref);

      const savedVol = localStorage.getItem('study_music_volume');
      setMusicVolume(savedVol !== null ? parseFloat(savedVol) : 0.15);

      if (pathname === '/') {
        const hasSeenSplash = sessionStorage.getItem('hasSeenSplash_v3') === 'true';
        setIsSplashActive(!hasSeenSplash);
      } else {
        setIsSplashActive(false);
      }
    };

    syncSettings();
    const intervalId = setInterval(syncSettings, 500);
    window.addEventListener('study_music_sync', syncSettings);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('study_music_sync', syncSettings);
    };
  }, [pathname]);

  const shouldPlay = isStudyMusicEnabled && !isSplashActive && !!currentTrack;

  // 3. Audio player play/pause controller
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (shouldPlay) {
      audio.volume = musicVolume; // Extremely clean, dynamically syncs ambient volume slider settings
      audio.play().catch(() => {
        // Ignored: awaits user engagement trigger
      });
    } else {
      audio.pause();
    }
  }, [shouldPlay, currentTrack, musicVolume]);

  // 4. Track completion transition: picks another random track from the active pool
  const handleTrackEnded = () => {
    const candidates = activePool.filter((track) => track !== currentTrack);
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const nextTrack = candidates[randomIndex] || activePool[0];
    setCurrentTrack(nextTrack);
  };

  // 5. Handle any unexpected errors gracefully: shift to one of the online fallback tracks
  const handleTrackError = () => {
    console.log(`Track ${currentTrack} failed. Substituting track dynamically.`);
    const fallbackPool = FALLBACK_ONLINE_TRACKS;
    const candidates = fallbackPool.filter((track) => track !== currentTrack);
    const randomIndex = Math.floor(Math.random() * candidates.length);
    setCurrentTrack(candidates[randomIndex] || fallbackPool[0]);
  };

  // 6. Rescue audio output from browser restrictions
  useEffect(() => {
    const rescuePlay = () => {
      if (shouldPlay && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', rescuePlay);
    window.addEventListener('keydown', rescuePlay);
    window.addEventListener('touchstart', rescuePlay);

    return () => {
      window.removeEventListener('click', rescuePlay);
      window.removeEventListener('keydown', rescuePlay);
      window.removeEventListener('touchstart', rescuePlay);
    };
  }, [shouldPlay]);

  // UI Event Handlers
  const handleToggleVolume = () => {
    const nextEnabled = !isStudyMusicEnabled;
    setIsStudyMusicEnabled(nextEnabled);
    localStorage.setItem('study_music_enabled', String(nextEnabled));
    window.dispatchEvent(new Event('study_music_sync'));
    syncAllDataToSupabase().catch(() => {});
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMusicVolume(value);
    localStorage.setItem('study_music_volume', String(value));
    
    // Auto-enable if sliding volume up
    if (value > 0 && !isStudyMusicEnabled) {
      setIsStudyMusicEnabled(true);
      localStorage.setItem('study_music_enabled', 'true');
    }
    
    window.dispatchEvent(new Event('study_music_sync'));
    syncAllDataToSupabase().catch(() => {});
  };

  const isRankingPage = pathname === '/ranking';

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack || undefined}
        onEnded={handleTrackEnded}
        onError={handleTrackError}
        preload="auto"
      />

      {/* Floating control capsule on top left */}
      {!isRankingPage && (
        <div 
          className="fixed top-4 left-4 z-[9999] flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 group select-none pointer-events-auto"
        >
          <button
            type="button"
            onClick={handleToggleVolume}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer flex items-center justify-center focus:outline-none"
            title={isStudyMusicEnabled ? "Mutar Música de Fundo" : "Ativar Música de Fundo"}
          >
            {isStudyMusicEnabled && musicVolume > 0 ? (
              <Volume2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            ) : (
              <VolumeX className="w-4 h-4 text-white/40" />
            )}
          </button>

          <div className="flex items-center gap-1.5 max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-500 ease-out">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isStudyMusicEnabled ? musicVolume : 0}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none transition-all duration-300"
              title="Ajustar Volume"
            />
            <span className="text-[9px] font-mono font-bold text-white/50 w-6 text-right">
              {isStudyMusicEnabled ? Math.round(musicVolume * 100) : 0}%
            </span>
          </div>
        </div>
      )}
    </>
  );
}
