'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  CheckCircle2, 
  XCircle,
  Shuffle,
  ArrowRight,
  Sparkles,
  Zap,
  Languages,
  Globe2,
  Microscope,
  Calculator,
  RefreshCcw,
  Timer,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { cn, playTickSound, playCorrectSound, playIncorrectSound } from '@/lib/utils';
import { CIENCIAS_HUMANAS_E_SUAS_TECNOLOGIAS_DATA as HUMANAS_DATA } from '@/lib/questoes_ciencias_humanas_e_suas_tecnologias';
import { CIENCIAS_DA_NATUREZA_E_SUAS_TECNOLOGIAS_DATA as NATUREZA_DATA } from '@/lib/questoes_ciencias_da_natureza_e_suas_tecnologias';
import { MATEMATICA_E_SUAS_TECNOLOGIAS_DATA as MATEMATICA_DATA } from '@/lib/questoes_matematica_e_suas_tecnologias';
import { LINGUAGENS_CODIGOS_E_SUAS_TECNOLOGIAS_DATA as LINGUAGENS_DATA } from '@/lib/questoes_linguagens_codigos_e_suas_tecnologias';
import { BottomNav } from '@/components/BottomNav';
import { recordAnswer } from '@/lib/stats';
import { Confetti } from '@/components/Confetti';
import { ShareResults } from '@/components/ShareResults';

type Category = 'humanas' | 'natureza' | 'matematica' | 'linguagens';

interface Questao {
  id: string;
  ano: string;
  texto_base: string;
  pergunta: string;
  alternativas: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  gabarito: string;
  category?: Category;
}

export default function AleatorioPage() {
  const [questions, setQuestions] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeQuestions = questions ? questions.slice(0, 10) : [];
  const currentQuestao = activeQuestions[currentIndex];

  const randomizedHintWords = useMemo(() => {
    if (!currentQuestao) return '';
    const answerText = currentQuestao.alternativas[currentQuestao.gabarito as keyof typeof currentQuestao.alternativas] || '';
    const words = answerText
      .split(/\s+/)
      .map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim())
      .filter(w => w.length > 0);
    
    if (words.length <= 3) {
      return words.join(', ');
    }
    
    const chosenIndices = new Set<number>();
    while (chosenIndices.size < 3 && chosenIndices.size < words.length) {
      const randIndex = Math.floor(Math.random() * words.length);
      chosenIndices.add(randIndex);
    }
    
    return Array.from(chosenIndices).map(idx => words[idx]).join(', ');
  }, [currentQuestao]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Special Training Modes States
  const [specialMode, setSpecialMode] = useState<'regular' | 'challenge' | 'hardcore' | 'survival'>('regular');
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(30);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [wasTimeout, setWasTimeout] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('simulado_special_mode');
    if (saved === 'challenge' || saved === 'hardcore' || saved === 'survival') {
      setSpecialMode(saved as any);
    } else {
      setSpecialMode('regular');
    }
  }, []);

  // Question Challenge countdown
  useEffect(() => {
    if (specialMode !== 'challenge' || showResult || isFinished || loading) return;
    setChallengeTimeLeft(30);
    setWasTimeout(false);
    setHintRevealed(false);
  }, [currentIndex, specialMode, showResult, isFinished, loading]);

  useEffect(() => {
    if (specialMode !== 'challenge' || showResult || isFinished || loading) return;
    if (challengeTimeLeft <= 0) {
      setWasTimeout(true);
      setShowResult(true);
      setIncorrectCount(prev => prev + 1);
      playIncorrectSound();
      recordAnswer('aleatorio', false);
      return;
    }

    const interval = setInterval(() => {
      setChallengeTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 5 && next > 0) {
          playTickSound(next);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [challengeTimeLeft, specialMode, showResult, isFinished, loading]);

  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [isTimerConfigured, setIsTimerConfigured] = useState<boolean>(false);
  const [configuredSeconds, setConfiguredSeconds] = useState<number>(900);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Tempo Esgotado";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load timer settings
  useEffect(() => {
    if (loading || !questions || questions.length === 0) return;
    
    // Check if user is logged in (has id)
    const loggedUser = localStorage.getItem('cosmos_logged_user');
    let isUserLoggedIn = false;
    if (loggedUser) {
      try {
        const parsed = JSON.parse(loggedUser);
        isUserLoggedIn = !!(parsed && parsed.id);
      } catch (_) {}
    }

    // Guests have timer enabled by default with 15 mins (900s)
    const enabled = !isUserLoggedIn || localStorage.getItem('simulado_timer_enabled') === 'true';
    setIsTimerConfigured(enabled);
    if (enabled) {
      const savedSecs = isUserLoggedIn ? localStorage.getItem('simulado_timer_seconds') : null;
      const secs = savedSecs ? parseInt(savedSecs, 10) : 900;
      setConfiguredSeconds(secs);
      setTimeLeft(secs);
      setTimerActive(true);
    }
  }, [loading, questions]);

  // Countdown effect
  useEffect(() => {
    if (!timerActive || !isTimerConfigured || isFinished) return;
    
    if (timeLeft <= 0) {
      setTimerActive(false);
      // Mark all remaining un-answered questions as incorrect
      const answeredSoFar = correctCount + incorrectCount;
      const remaining = Math.max(0, 10 - answeredSoFar);
      setIncorrectCount(prev => prev + remaining);
      setIsFinished(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 30 && next > 0) {
          playTickSound(next);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, timerActive, isTimerConfigured, isFinished, correctCount, incorrectCount]);

  useEffect(() => {
    const combined = [
      ...HUMANAS_DATA.map(q => ({ ...q, category: 'humanas' as Category })),
      ...NATUREZA_DATA.map(q => ({ ...q, category: 'natureza' as Category })),
      ...MATEMATICA_DATA.map(q => ({ ...q, category: 'matematica' as Category })),
      ...LINGUAGENS_DATA.map(q => ({ ...q, category: 'linguagens' as Category }))
    ];
    const shuffled = [...combined].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setLoading(false);
  }, []);

  if (loading || questions.length === 0) {
    return (
      <div className="relative h-screen flex items-center justify-center">
        <div className="starfield" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Shuffle className="w-12 h-12 text-primary/50" />
        </motion.div>
      </div>
    );
  }

  if (activeQuestions.length === 0) return null;

  const handleSelectAnswer = (letter: string) => {
    if (showResult) return;
    setSelectedAnswer(letter);
  };

  const handleCheckAnswer = () => {
    setShowResult(true);
    const isCorrect = selectedAnswer === currentQuestao.gabarito;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      playCorrectSound();
    } else {
      setIncorrectCount(prev => prev + 1);
      playIncorrectSound();
      if (specialMode === 'survival') {
        setIsFinished(true);
      }
    }
    recordAnswer(currentQuestao.category || 'linguagens', isCorrect);
  };

  const handleNextQuestion = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setHintRevealed(false);
      setWasTimeout(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsFinished(false);
    setHintRevealed(false);
    setWasTimeout(false);
    setChallengeTimeLeft(30);

    // Reset global timer
    const loggedUser = localStorage.getItem('cosmos_logged_user');
    let isUserLoggedIn = false;
    if (loggedUser) {
      try {
        const parsed = JSON.parse(loggedUser);
        isUserLoggedIn = !!(parsed && parsed.id);
      } catch (_) {}
    }

    const enabled = !isUserLoggedIn || localStorage.getItem('simulado_timer_enabled') === 'true';
    if (enabled) {
      const savedSecs = isUserLoggedIn ? localStorage.getItem('simulado_timer_seconds') : null;
      const secs = savedSecs ? parseInt(savedSecs, 10) : 900;
      setConfiguredSeconds(secs);
      setTimeLeft(secs);
      setTimerActive(true);
    }
  };

  const getCategoryTheme = (cat?: Category) => {
    switch(cat) {
      case 'humanas': return { label: 'C. Humanas', color: 'text-tertiary', bgColor: 'bg-tertiary/10', borderColor: 'border-tertiary/20', icon: Globe2 };
      case 'natureza': return { label: 'C. Natureza', color: 'text-error', bgColor: 'bg-error/10', borderColor: 'border-error/20', icon: Microscope };
      case 'matematica': return { label: 'Matemática', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20', icon: Calculator };
      case 'linguagens': return { label: 'Linguagens', color: 'text-secondary', bgColor: 'bg-secondary/10', borderColor: 'border-secondary/20', icon: Languages };
      default: return { label: 'Aleatória', color: 'text-on-surface', bgColor: 'bg-white/10', borderColor: 'border-white/20', icon: Shuffle };
    }
  };

  const theme = getCategoryTheme(currentQuestao.category);
  const CategoryIcon = theme.icon;

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div className="starfield" />
      
      {/* Background Orbs */}
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full -z-10" />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-y-auto flex flex-col pb-32"
      >
        <div className="w-full max-w-2xl mx-auto pt-12 px-6">
          <header className="mb-8 flex items-center justify-between">
            <Link href="/areas">
              <motion.button 
                whileHover={{ scale: 1.1, x: -2 }}
                className="p-2 glass-panel rounded-full text-on-surface-variant hover:text-on-surface"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-white">Aleatória</h1>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/20">
                  <Shuffle className="w-2.5 h-2.5 text-white" />
                  <span className="text-[8px] font-bold text-white tracking-wider uppercase">Mix Prime</span>
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">
                {isFinished ? "Simulado Concluído" : `Desafio ${currentIndex + 1} de ${activeQuestions.length}`}
              </p>
            </div>
            <div className="w-9" />
          </header>

          <AnimatePresence mode="wait">
            {isFinished ? (
              <>
                {(correctCount / activeQuestions.length) >= 0.8 && <Confetti />}
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden text-center space-y-8"
                >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500/40" />
                <div className="space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Sparkles className="w-8 h-8 text-indigo-300" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-on-surface">Simulado Concluído!</h2>
                  <p className="text-sm text-on-surface-variant">Confira o seu desempenho de hoje.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20 flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-2xl font-display font-bold text-green-500">{correctCount}</span>
                    <span className="text-xs font-medium text-green-500/80 uppercase tracking-wider mt-1">Acertos</span>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 flex flex-col items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500 mb-2" />
                    <span className="text-2xl font-display font-bold text-red-500">{incorrectCount}</span>
                    <span className="text-xs font-medium text-red-500/80 uppercase tracking-wider mt-1">Erros</span>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Taxa de Acerto</p>
                  <p className="text-4xl font-display font-bold text-indigo-300">
                    {Math.round((correctCount / activeQuestions.length) * 100)}%
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {correctCount >= 7 ? "Excelente desempenho! Continue assim." :
                     correctCount >= 5 ? "Bom trabalho! Pratique mais para gabaritar." :
                     "Não desanime! Revise o conteúdo e tente novamente."}
                  </p>
                </div>

                <ShareResults
                  totalCovered={activeQuestions.length}
                  correctCount={correctCount}
                  incorrectCount={incorrectCount}
                  accuracy={Math.round((correctCount / activeQuestions.length) * 100)}
                  categoryName="Mix de Questões"
                  themeColor="indigo"
                  textTrigger="Compartilhar Simulado Concluído 🚀"
                />

                <button
                  onClick={handleReset}
                  className="w-full py-4 gradient-aleatorio text-white font-display font-bold tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <RefreshCcw className="w-5 h-5 animate-spin-once" />
                  REFAZER TESTE
                </button>
              </motion.div>
              </>
            ) : (
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap gap-2">
                  <div className={cn("px-3 py-1 rounded-full border flex items-center gap-2", theme.bgColor, theme.borderColor)}>
                    <CategoryIcon className={cn("w-3 h-3", theme.color)} />
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme.color)}>{theme.label}</span>
                  </div>

                </div>

                {specialMode === 'challenge' && !isFinished && !showResult && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="font-bold uppercase tracking-wider text-[10px]">Tempo da Questão (Desafio)</span>
                      </div>
                      <div className={cn(
                        "font-mono font-black text-xs px-2.5 py-0.5 rounded-full border",
                        challengeTimeLeft <= 8 
                        ? "bg-red-500/20 text-red-400 border-red-500/20 animate-pulse" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/10"
                      )}>
                        {challengeTimeLeft}s
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden relative mt-2">
                      <motion.div 
                        className={cn(
                          "h-full transition-all duration-1000", 
                          challengeTimeLeft <= 8 ? "bg-red-500" : "bg-amber-500"
                        )}
                        style={{ width: `${Math.max(0, (challengeTimeLeft / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {wasTimeout && showResult && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center animate-bounce">
                    <p className="text-sm font-bold text-red-500 uppercase tracking-wider">⏱️ Tempo Esgotado para esta questão!</p>
                  </div>
                )}

                {specialMode !== 'challenge' && isTimerConfigured && !isFinished && (
                  <div className="glass-panel rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1.5 text-white/50">
                        <Timer className={cn("w-3.5 h-3.5 animate-pulse", theme.color)} />
                        <span className="font-mono font-medium lowercase">tempo restante para responder</span>
                      </div>
                      <div className={cn(
                        "font-mono font-black text-xs px-2.5 py-0.5 rounded-full border",
                        timeLeft <= 15 
                        ? "bg-red-500/20 text-red-400 border-red-500/20 animate-pulse" 
                        : timeLeft <= configuredSeconds / 2 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/10" 
                        : "bg-white/5 text-white/80 border-white/10"
                      )}>
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden relative">
                      <motion.div 
                        className={cn(
                          "h-full transition-all duration-1000", 
                          timeLeft <= 15 ? "bg-red-500" : 
                          timeLeft <= configuredSeconds / 2 ? "bg-amber-500" : theme.color ? theme.color.replace('text-', 'bg-') : 'bg-primary'
                        )}
                        style={{ width: `${Math.max(0, (timeLeft / configuredSeconds) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="glass-panel rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
                  <div className={cn("h-1.5 w-full", theme.bgColor.replace('/10', '/40'))} />
                  
                  <div className="p-8 space-y-8">
                    <div className="space-y-4">
                      {currentQuestao.texto_base && (
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 italic text-on-surface-variant leading-relaxed text-sm whitespace-pre-wrap">
                          {currentQuestao.texto_base}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-display font-bold leading-relaxed text-on-surface">
                          {currentQuestao.pergunta}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(currentQuestao.alternativas).map(([letter, text]) => {
                          const isSelected = selectedAnswer === letter;
                          const isCorrect = letter === currentQuestao.gabarito;
                          
                          return (
                            <button
                              key={letter}
                              disabled={showResult}
                              onClick={() => handleSelectAnswer(letter)}
                              className={cn(
                                "p-4 rounded-2xl border text-left transition-all relative flex items-center gap-4 group",
                                isSelected ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10",
                                showResult && isCorrect && "border-green-500 bg-green-500/10",
                                showResult && isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                                showResult && "cursor-default"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 transition-all",
                                isSelected ? "bg-primary text-white" : "bg-white/10 text-on-surface-variant group-hover:bg-primary/20",
                                showResult && isCorrect && "bg-green-500 text-white",
                                showResult && isSelected && !isCorrect && "bg-red-500 text-white"
                              )}>
                                {letter}
                              </div>
                              <span className="text-sm font-medium leading-relaxed flex-1">
                                {text}
                              </span>
                              {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                              {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                            </button>
                          );
                        })}
                    </div>

                     <div className="pt-4 space-y-4">
                        {/* NAVIGATION & UTILITIES */}
                        {!showResult && (
                          <div className="flex gap-3 justify-between items-center transition-all">
                            {/* Voltar Button */}
                            {currentIndex > 0 && specialMode !== 'hardcore' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentIndex(prev => prev - 1);
                                  setSelectedAnswer(null);
                                  setShowResult(false);
                                  setHintRevealed(false);
                                  setWasTimeout(false);
                                }}
                                className="px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-white/70 font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
                              >
                                « Voltar
                              </button>
                            )}

                            {/* Dica Button */}
                            {specialMode !== 'hardcore' && (
                              <button
                                type="button"
                                onClick={() => setHintRevealed(true)}
                                className="px-4 py-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-400 font-bold text-xs uppercase tracking-wider hover:bg-amber-500/10 transition-all flex items-center gap-2 cursor-pointer ml-auto"
                              >
                                💡 Ver Dica
                              </button>
                            )}
                          </div>
                        )}

                        {/* Hint Display Card */}
                        {hintRevealed && !showResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-left"
                          >
                            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider block mb-1">Dica de Estudo</span>
                            <p className="text-xs text-white/80 leading-relaxed font-sans">
                              Três palavras aleatórias presentes na resposta correta são: <span className="text-amber-300 font-medium italic">"{randomizedHintWords}"</span>
                            </p>
                          </motion.div>
                        )}

                        <AnimatePresence>
                          {selectedAnswer && !showResult && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              onClick={handleCheckAnswer}
                              className="w-full py-4 gradient-aleatorio rounded-2xl text-white font-display font-bold tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                              CONFERIR RESPOSTA
                              <ArrowRight className="w-5 h-5" />
                            </motion.button>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {showResult && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              className="bg-primary/5 rounded-2xl border border-primary/10 p-4 space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-primary-light">
                                      <CheckCircle2 className="w-5 h-5" />
                                      <span className="font-bold uppercase tracking-wider text-xs">Resposta: {currentQuestao.gabarito}</span>
                                  </div>
                                  <button 
                                    onClick={handleNextQuestion}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/80 transition-all"
                                  >
                                    Próxima Questão
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <BottomNav />
      </motion.main>

      <style jsx global>{`
        .gradient-aleatorio {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        }
      `}</style>
    </div>
  );
}
