'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { syncAllDataToSupabase } from '@/lib/supabaseSync';

// Só entram na lista as faixas que realmente existem em public/.
// Os arquivos background.mp3 até background7.mp3 estavam com 0 byte: cada
// tentativa de tocar devolvia 416 (Range Not Satisfiable), o player pulava para
// outra faixa vazia e ficava em laço, gastando rede e CPU sem tocar nada.
const LOCAL_TRACKS = ['/background8.mp3', '/background9.mp3'];

const FALLBACK_ONLINE_TRACKS = ['/background8.mp3', '/background9.mp3'];

// Depois de algumas falhas seguidas o player para de tentar em vez de entrar
// em loop de requisições.
const MAX_TRACK_FAILURES = 3;

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

  // 2. Settings are event-driven: nothing here runs a timer, so the app does
  // not wake up twice per second on low-end phones just to read localStorage.
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
    window.addEventListener('study_music_sync', syncSettings);
    // Outras abas/componentes podem alterar o volume.
    window.addEventListener('storage', syncSettings);

    return () => {
      window.removeEventListener('study_music_sync', syncSettings);
      window.removeEventListener('storage', syncSettings);
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
    if (candidates.length === 0) return;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    setCurrentTrack(candidates[randomIndex]);
  };

  // 5. Toda faixa da lista é válida hoje, mas se algo falhar o player tenta
  // outra faixa algumas vezes e então desiste (sem laço de 416/404).
  const failedTracksRef = useRef<Set<string>>(new Set());
  const failureCountRef = useRef(0);

  const handleTrackError = () => {
    failedTracksRef.current.add(currentTrack);
    failureCountRef.current += 1;

    if (failureCountRef.current >= MAX_TRACK_FAILURES) {
      console.warn('Música de fundo indisponível. Player desativado.');
      setCurrentTrack('');
      return;
    }

    const candidates = activePool.filter((track) => !failedTracksRef.current.has(track));
    if (candidates.length === 0) {
      setCurrentTrack('');
      return;
    }
    const randomIndex = Math.floor(Math.random() * candidates.length);
    setCurrentTrack(candidates[randomIndex]);
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

  // Gravação/sincronização do volume é adiada para não disparar uma requisição
  // a cada passo do slider (o fingerprint do navegador enviava várias por segundo).
  const volumeSyncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSync = () => {
    if (volumeSyncTimeout.current) clearTimeout(volumeSyncTimeout.current);
    volumeSyncTimeout.current = setTimeout(() => {
      syncAllDataToSupabase().catch(() => {});
    }, 1200);
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
    scheduleSync();
  };

  const isRankingPage = pathname === '/ranking';

  return (
    <>
      <audio
        ref={audioRef}
        src={shouldPlay ? currentTrack || undefined : undefined}
        onEnded={handleTrackEnded}
        onError={handleTrackError}
        preload="none"
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
