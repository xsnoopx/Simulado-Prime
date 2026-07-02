import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let sharedAudioCtx: any = null;

function getAudioContext(): any {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContextClass();
  }
  return sharedAudioCtx;
}

// Automatically resume on user interaction to bypass autoplay restrictions!
if (typeof window !== 'undefined') {
  const resume = () => {
    const ctx = getAudioContext();
    if (ctx) {
      ctx.resume().then(() => {
        // Play a very short, almost silent tone to fully unlock the audio hardware/context on mobile devices
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(1000, ctx.currentTime);
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.01);
        } catch (e) {
          console.warn("Could not play unlock sound:", e);
        }
      }).catch((err: any) => {
        console.warn("Failed to resume AudioContext", err);
      });
    }
  };
  document.addEventListener('click', resume);
  document.addEventListener('touchstart', resume);
  document.addEventListener('keydown', resume);
}

/**
 * Ensures the single shared AudioContext is fully resumed and running 
 * before playing synthesized sounds, allowing them to mix correctly even with background music.
 */
function withActiveAudioContext(callback: (ctx: any) => void) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      try { callback(ctx); } catch (e) { console.warn(e); }
    }).catch((err: any) => {
      console.warn("Could not resume AudioContext on the fly:", err);
      try { callback(ctx); } catch (e) { console.warn(e); }
    });
  } else {
    try { callback(ctx); } catch (e) { console.warn(e); }
  }
}

export function playTickSound(secondsLeft: number | boolean = false) {
  if (typeof window === 'undefined') return;
  
  const soundEnabled = localStorage.getItem('study_music_enabled') !== 'false';
  if (!soundEnabled) return;

  withActiveAudioContext((ctx) => {
    let secs = typeof secondsLeft === 'number' ? secondsLeft : 30;
    
    // Increase volume multiplier every 5 seconds as the time winds down
    let volMultiplier = 1.0;
    if (secs <= 5) {
      volMultiplier = 2.8;
    } else if (secs <= 10) {
      volMultiplier = 2.2;
    } else if (secs <= 15) {
      volMultiplier = 1.7;
    } else if (secs <= 20) {
      volMultiplier = 1.4;
    } else if (secs <= 25) {
      volMultiplier = 1.15;
    } else {
      volMultiplier = 1.0;
    }
    
    const playTone = (freq: number, startDelay: number, duration: number, type: OscillatorType = 'sine', vol = 0.03) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
      
      const finalVol = vol * volMultiplier;
      gain.gain.setValueAtTime(finalVol, ctx.currentTime + startDelay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startDelay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + startDelay);
      osc.stop(ctx.currentTime + startDelay + duration);
    };

    if (secs <= 5) {
      // Extremely urgent: high double alert (rapid tension warning)
      playTone(1100, 0, 0.08, 'sine', 0.05);
      playTone(1300, 0.1, 0.08, 'sine', 0.05);
    } else if (secs <= 15) {
      // Very urgent: "tic-tac" digital sequence with high pitch
      playTone(880, 0, 0.06, 'triangle', 0.04);
      playTone(740, 0.12, 0.06, 'triangle', 0.035);
    } else {
      // Moderate warning (16-30s): gentle high-tech heartbeat
      playTone(520, 0, 0.05, 'sine', 0.035);
      playTone(440, 0.15, 0.05, 'sine', 0.03);
    }
  });
}

export function playCorrectSound() {
  if (typeof window === 'undefined') return;
  const soundEnabled = localStorage.getItem('study_music_enabled') !== 'false';
  if (!soundEnabled) return;

  withActiveAudioContext((ctx) => {
    const now = ctx.currentTime;
    
    const playTone = (freq: number, delay: number, duration: number, vol = 0.35, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(vol, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    // Ascending arpeggio (C Major / Star Shimmer Theme) - significantly boosted volume to pierce background music playing on audio tags
    playTone(523.25, 0, 0.12, 0.28); // C5
    playTone(659.25, 0.05, 0.15, 0.28); // E5
    playTone(783.99, 0.10, 0.18, 0.28); // G5
    playTone(1046.50, 0.15, 0.25, 0.32); // C6
  });
}

export function playIncorrectSound() {
  if (typeof window === 'undefined') return;
  const soundEnabled = localStorage.getItem('study_music_enabled') !== 'false';
  if (!soundEnabled) return;

  withActiveAudioContext((ctx) => {
    const now = ctx.currentTime;

    // Cosmic failure beep: Descending, detuned, low warning sound (A3 minor third drop, sliding)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(220.00, now); // A3
    osc1.frequency.exponentialRampToValueAtTime(146.83, now + 0.35); // D3 glide

    osc2.type = 'sine';
    // Slightly detuned second oscillator for a thicker "richer" warning sound
    osc2.frequency.setValueAtTime(218.00, now); 
    osc2.frequency.exponentialRampToValueAtTime(145.83, now + 0.35);

    // Significantly boosted volume output (0.42) to stand out clearly against background music waveforms
    gainNode.gain.setValueAtTime(0.42, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now);
    osc2.stop(now + 0.4);
  });
}

export function playCategorySound() {
  if (typeof window === 'undefined') return;
  const soundEnabled = localStorage.getItem('study_music_enabled') !== 'false';
  if (!soundEnabled) return;

  withActiveAudioContext((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Gentle upward movement
    osc.frequency.setValueAtTime(330, now); // E4
    osc.frequency.exponentialRampToValueAtTime(392, now + 0.1); // G4
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  });
}

export function playSubcategorySound() {
  if (typeof window === 'undefined') return;
  const soundEnabled = localStorage.getItem('study_music_enabled') !== 'false';
  if (!soundEnabled) return;

  withActiveAudioContext((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.08); // D5
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.08);
  });
}

