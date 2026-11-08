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

/**
 * Gera uma resposta ao impulso curta e decrescente para o reverb.
 * É sintetizada em tempo de execução (sem samples de terceiros) e fica em
 * cache no AudioContext compartilhado, então o custo é pago uma única vez.
 */
function criarRespostaAoImpulso(ctx: any, duracao: number, decaimento: number) {
  const taxa = ctx.sampleRate;
  const tamanho = Math.max(1, Math.floor(taxa * duracao));
  const impulso = ctx.createBuffer(2, tamanho, taxa);

  for (let canal = 0; canal < 2; canal++) {
    const amostras = impulso.getChannelData(canal);
    for (let i = 0; i < tamanho; i++) {
      const progresso = i / tamanho;
      const envelope = Math.pow(1 - progresso, decaimento);
      amostras[i] = (Math.random() * 2 - 1) * envelope * 0.7;
    }
  }

  return impulso;
}

/** Ruído branco curto, reaproveitado entre os efeitos. */
function getNoiseBuffer(ctx: any) {
  if (ctx.__noiseBuffer) return ctx.__noiseBuffer;

  const tamanho = Math.max(1, Math.floor(ctx.sampleRate * 0.5));
  const buffer = ctx.createBuffer(1, tamanho, ctx.sampleRate);
  const amostras = buffer.getChannelData(0);
  for (let i = 0; i < tamanho; i++) amostras[i] = Math.random() * 2 - 1;

  ctx.__noiseBuffer = buffer;
  return buffer;
}

/**
 * Barramento dos efeitos: compressão + reverb curto.
 * Deixa o som encorpado e audível mesmo com a música de fundo tocando em um
 * <audio> separado, sem estourar quando várias camadas soam juntas.
 */
function getSfxBus(ctx: any) {
  if (ctx.__sfxBus) return ctx.__sfxBus;

  const master = ctx.createGain();
  master.gain.value = 0.9;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -15;
  compressor.knee.value = 18;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.24;

  const convolver = ctx.createConvolver();
  convolver.buffer = criarRespostaAoImpulso(ctx, 1.7, 2.8);

  const wet = ctx.createGain();
  wet.gain.value = 0.4;
  const reverbSend = ctx.createGain();

  // Ganho de compensação: devolve o volume "engolido" pelo compressor,
  // deixando o efeito no mesmo nível de um alerta de celular (sem estourar).
  const makeup = ctx.createGain();
  makeup.gain.value = 2.5;

  reverbSend.connect(convolver);
  convolver.connect(wet);
  wet.connect(master);
  master.connect(compressor);
  compressor.connect(makeup);
  makeup.connect(ctx.destination);

  const bus = { master, reverbSend };
  ctx.__sfxBus = bus;
  return bus;
}

/**
 * Sino cristalino (FM) com envelope suave e pan estéreo.
 * A modulação dá o brilho metálico; o pan cria a sensação de notas
 * espalhadas pelo céu, em vez de um bipe seco no centro.
 */
function playBell(
  ctx: any,
  bus: { master: any; reverbSend: any },
  freq: number,
  quando: number,
  duracao: number,
  volume: number,
  pan = 0
) {
  const saida = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (saida) saida.pan.value = pan;

  const portadora = ctx.createOscillator();
  const moduladora = ctx.createOscillator();
  const indiceMod = ctx.createGain();
  const envelope = ctx.createGain();

  portadora.type = 'sine';
  portadora.frequency.setValueAtTime(freq, quando);

  moduladora.type = 'sine';
  moduladora.frequency.setValueAtTime(freq * 2.01, quando); // 2:1 levemente desafinado
  indiceMod.gain.setValueAtTime(freq * 1.6, quando);
  indiceMod.gain.exponentialRampToValueAtTime(Math.max(1, freq * 0.05), quando + duracao * 0.55);

  moduladora.connect(indiceMod);
  indiceMod.connect(portadora.frequency);

  envelope.gain.setValueAtTime(0.0001, quando);
  envelope.gain.linearRampToValueAtTime(volume, quando + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, quando + duracao);

  portadora.connect(envelope);
  if (saida) {
    envelope.connect(saida);
    saida.connect(bus.master);
    saida.connect(bus.reverbSend);
  } else {
    envelope.connect(bus.master);
    envelope.connect(bus.reverbSend);
  }

  const fim = quando + duracao + 0.06;
  portadora.start(quando);
  portadora.stop(fim);
  moduladora.start(quando);
  moduladora.stop(fim);
}

export function playCorrectSound() {
  if (typeof window === 'undefined') return;
  const soundEnabled = localStorage.getItem('study_music_enabled') !== 'false';
  if (!soundEnabled) return;

  withActiveAudioContext((ctx) => {
    const bus = getSfxBus(ctx);
    const agora = ctx.currentTime + 0.01;

    // 1. Corpo grave e quente: dá peso de conquista ao acerto.
    const corpo = ctx.createOscillator();
    const corpoGain = ctx.createGain();
    corpo.type = 'sine';
    corpo.frequency.setValueAtTime(130.81, agora); // C3
    corpo.frequency.exponentialRampToValueAtTime(196, agora + 0.18); // G3
    corpoGain.gain.setValueAtTime(0.0001, agora);
    corpoGain.gain.linearRampToValueAtTime(0.22, agora + 0.02);
    corpoGain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.45);
    corpo.connect(corpoGain);
    corpoGain.connect(bus.master);
    corpo.start(agora);
    corpo.stop(agora + 0.5);

    // 2. Arpejo ascendente em Dó maior com nona: C5 E5 G5 C6 E6 G6.
    const arpejo = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    arpejo.forEach((freq, i) => {
      playBell(
        ctx,
        bus,
        freq,
        agora + i * 0.055,
        1.1 - i * 0.08,
        0.2 - i * 0.015,
        i % 2 === 0 ? -0.25 : 0.25
      );
    });

    // 3. Faíscas agudas: brilho curto no topo do espectro.
    [2093, 2637, 3136].forEach((freq, i) => {
      playBell(ctx, bus, freq, agora + 0.12 + i * 0.05, 0.4, 0.05, (i - 1) * 0.35);
    });

    // 4. Varredura de ar: ruído filtrado subindo, como um whoosh de luz.
    const ruido = ctx.createBufferSource();
    ruido.buffer = getNoiseBuffer(ctx);
    const filtroAr = ctx.createBiquadFilter();
    filtroAr.type = 'bandpass';
    filtroAr.Q.value = 1.2;
    filtroAr.frequency.setValueAtTime(900, agora);
    filtroAr.frequency.exponentialRampToValueAtTime(6500, agora + 0.35);
    const arGain = ctx.createGain();
    arGain.gain.setValueAtTime(0.0001, agora);
    arGain.gain.linearRampToValueAtTime(0.09, agora + 0.05);
    arGain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.4);
    ruido.connect(filtroAr);
    filtroAr.connect(arGain);
    arGain.connect(bus.master);
    arGain.connect(bus.reverbSend);
    ruido.start(agora);
    ruido.stop(agora + 0.45);
  });
}

export function playIncorrectSound() {
  if (typeof window === 'undefined') return;
  const soundEnabled = localStorage.getItem('study_music_enabled') !== 'false';
  if (!soundEnabled) return;

  withActiveAudioContext((ctx) => {
    const bus = getSfxBus(ctx);
    const agora = ctx.currentTime + 0.01;

    // 1. Queda grave: o peso do erro, sentido antes de ser ouvido.
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150, agora);
    sub.frequency.exponentialRampToValueAtTime(48, agora + 0.55);
    subGain.gain.setValueAtTime(0.0001, agora);
    subGain.gain.linearRampToValueAtTime(0.5, agora + 0.02);
    subGain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.6);
    sub.connect(subGain);
    subGain.connect(bus.master); // o grave fica seco para não embolar
    sub.start(agora);
    sub.stop(agora + 0.65);

    // 2. Madeiras desafinadas descendo, com filtro fechando (sensação de queda).
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(2000, agora);
    filtro.frequency.exponentialRampToValueAtTime(260, agora + 0.5);
    filtro.Q.value = 5;

    const envMadeira = ctx.createGain();
    envMadeira.gain.setValueAtTime(0.0001, agora);
    envMadeira.gain.linearRampToValueAtTime(0.34, agora + 0.02);
    envMadeira.gain.exponentialRampToValueAtTime(0.0001, agora + 0.55);
    filtro.connect(envMadeira);
    envMadeira.connect(bus.master);
    envMadeira.connect(bus.reverbSend);

    [196, 207.65].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, agora);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, agora + 0.5);
      const ganhoOsc = ctx.createGain();
      ganhoOsc.gain.value = i === 0 ? 0.4 : 0.55;
      osc.connect(ganhoOsc);
      ganhoOsc.connect(filtro);
      osc.start(agora);
      osc.stop(agora + 0.55);
    });

    // 3. Impacto de ruído: dá corpo e presença ao erro.
    const ruido = ctx.createBufferSource();
    ruido.buffer = getNoiseBuffer(ctx);
    const filtroRuido = ctx.createBiquadFilter();
    filtroRuido.type = 'bandpass';
    filtroRuido.frequency.value = 1500;
    filtroRuido.Q.value = 0.7;
    const ruidoGain = ctx.createGain();
    ruidoGain.gain.setValueAtTime(0.0001, agora);
    ruidoGain.gain.linearRampToValueAtTime(0.16, agora + 0.01);
    ruidoGain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.2);
    ruido.connect(filtroRuido);
    filtroRuido.connect(ruidoGain);
    ruidoGain.connect(bus.master);
    ruidoGain.connect(bus.reverbSend);
    ruido.start(agora);
    ruido.stop(agora + 0.25);
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

