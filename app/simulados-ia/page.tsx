'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  ChevronLeft, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Wifi,
  Timer,
  Clock,
  Crown
} from 'lucide-react';
import Link from 'next/link';
import { cn, playTickSound, playCorrectSound, playIncorrectSound } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { PremiumGateway } from '@/components/PremiumGateway';

// Logic based on the user's questao script
const AREAS = ["Linguagens", "Matemática", "Ciências Humanas", "Ciências da Natureza"];

const TEMAS: Record<string, string[]> = {
  "Linguagens": [
    "interpretação de texto", "figuras de linguagem", "modernismo", 
    "gêneros textuais", "variação linguística", "mídias digitais", "literatura brasileira"
  ],
  "Matemática": [
    "porcentagem", "probabilidade", "estatística", "funções", 
    "geometria", "análise combinatória", "razão e proporção"
  ],
  "Ciências Humanas": [
    "globalização", "revolução industrial", "ditadura militar", 
    "geopolítica", "cidadania", "filosofia moderna", "movimentos sociais"
  ],
  "Ciências da Natureza": [
    "ecologia", "genética", "eletroquímica", "física mecânica", 
    "energia", "química orgânica", "biotecnologia"
  ]
};

const COMPETENCIAS = [
  "interpretação crítica", "resolução de problemas", "análise interdisciplinar", 
  "pensamento lógico", "contextualização social", "análise científica"
];

const DIFICULDADES = ["fácil", "média", "difícil"];

const INTRODUCOES = [
  "Analise o texto a seguir.", "Observe a situação apresentada.", 
  "Leia o trecho abaixo.", "Considere o contexto descrito.", 
  "A partir das informações seguintes."
];

const PROMPT_BASE = `
Crie UMA questão ORIGINAL no padrão de exames nacionais e vestibulares.

IMPORTANTE:
- NÃO copie questões reais
- Estilo pedagógico moderno, desafiador e contextualizado
- Contextualizada
- Texto-base obrigatório
- 5 alternativas (A até E)
- Apenas UMA correta
- Distratores plausíveis
- Linguagem formal brasileira
- Explique o gabarito
- Use interdisciplinaridade quando possível

Formato JSON:
{
  "area": "",
  "tema": "",
  "dificuldade": "",
  "texto_base": "",
  "pergunta": "",
  "alternativas": {
    "A": "",
    "B": "",
    "C": "",
    "D": "",
    "E": ""
  },
  "gabarito": "",
  "explicacao": ""
}
`;

function gerarPrompt() {
  const area = AREAS[Math.floor(Math.random() * AREAS.length)];
  const tema = TEMAS[area][Math.floor(Math.random() * TEMAS[area].length)];
  const dificuldade = DIFICULDADES[Math.floor(Math.random() * DIFICULDADES.length)];
  const competencia = COMPETENCIAS[Math.floor(Math.random() * COMPETENCIAS.length)];
  const intro = INTRODUCOES[Math.floor(Math.random() * INTRODUCOES.length)];

  return `
${PROMPT_BASE}

Área: ${area}
Tema: ${tema}
Dificuldade: ${dificuldade}
Competência principal: ${competencia}

Introdução sugerida:
${intro}
`;
}

interface Questao {
  area: string;
  tema: string;
  dificuldade: string;
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
  explicacao: string;
}

export default function SimuladosIAPage() {
  const [questao, setQuestao] = useState<Questao | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState<boolean>(false);

  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [isTimerConfigured, setIsTimerConfigured] = useState<boolean>(false);
  const [configuredSeconds, setConfiguredSeconds] = useState<number>(900);
  const [isTimerInitialized, setIsTimerInitialized] = useState(false);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Tempo Esgotado";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load timer settings
  useEffect(() => {
    if (loading || !questao || isTimerInitialized) return;
    
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
      setIsTimerInitialized(true);
    }
  }, [questao, loading, isTimerInitialized]);

  // Countdown effect
  useEffect(() => {
    if (!timerActive || !isTimerConfigured || showExplanation || loading) return;
    
    if (timeLeft <= 0) {
      setTimerActive(false);
      setShowExplanation(true);
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
  }, [timeLeft, timerActive, isTimerConfigured, showExplanation, loading]);

  const generateQuestao = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSelectedAnswer(null);
    setShowExplanation(false);

    try {
      const prompt = gerarPrompt();

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          responseSchema: {
            type: "OBJECT",
            properties: {
              area: { type: "STRING" },
              tema: { type: "STRING" },
              dificuldade: { type: "STRING" },
              texto_base: { type: "STRING" },
              pergunta: { type: "STRING" },
              alternativas: {
                type: "OBJECT",
                properties: {
                  A: { type: "STRING" },
                  B: { type: "STRING" },
                  C: { type: "STRING" },
                  D: { type: "STRING" },
                  E: { type: "STRING" },
                },
                required: ["A", "B", "C", "D", "E"]
              },
              gabarito: { type: "STRING" },
              explicacao: { type: "STRING" },
            },
            required: ["area", "tema", "dificuldade", "texto_base", "pergunta", "alternativas", "gabarito", "explicacao"]
          }
        })
      });

      if (!response.ok) {
        let errorMsg = "Erro na requisição para a API";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const resData = await response.json();

      if (resData.text) {
        const data = JSON.parse(resData.text);
        if (!data || typeof data !== 'object') {
          throw new Error("Formato de resposta inválido retornado pela IA.");
        }

        // Ensure alternativas is a valid object
        if (!data.alternativas || typeof data.alternativas !== 'object') {
          data.alternativas = {};
        }

        // Standardize keys to uppercase A, B, C, D, E
        const standardAlternativas: any = {};
        const keys = ['A', 'B', 'C', 'D', 'E'];
        for (const key of keys) {
          standardAlternativas[key] = data.alternativas[key] || data.alternativas[key.toLowerCase()] || "";
        }
        data.alternativas = standardAlternativas;

        // Ensure gabarito is uppercase and exists
        if (data.gabarito) {
          data.gabarito = String(data.gabarito).toUpperCase().trim();
        } else {
          data.gabarito = "A";
        }

        setQuestao(data);
      } else {
        throw new Error(resData.error || "Nenhum texto retornado pela IA");
      }
    } catch (err: any) {
      console.error("Simulado IA fetch error:", err);
      const errMsg = String(err.message || err);
      if (errMsg.includes("Failed to fetch") || errMsg.includes("fetch failed") || errMsg.includes("NetworkError") || errMsg.includes("conexão") || errMsg.includes("connect")) {
        setError("Erro de rede: Conexão interrompida ou instável com o servidor do Cosmos. Verifique sua rede e tente novamente nos próximos segundos.");
      } else if (errMsg.includes("JSON") || errMsg.includes("SyntaxError")) {
        setError("Ocorreu uma falha ao estruturar a questão gerada pela IA. Por favor, tente novamente para gerar uma nova questão!");
      } else {
        setError(errMsg || "Não conseguimos gerar a questão. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    // Check premium status
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

    if (hasFetched.current) return;
    hasFetched.current = true;
    generateQuestao();
  }, []);

  if (!isMounted) {
    return (
      <div className="relative h-screen flex flex-col overflow-hidden">
        <div className="starfield" />
      </div>
    );
  }

  const handleSelectAnswer = (letter: string) => {
    if (showExplanation) return;
    setSelectedAnswer(letter);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || showExplanation) return;
    setShowExplanation(true);
    const isCorrect = selectedAnswer === questao?.gabarito;
    if (isCorrect) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
  };

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div className="starfield" />
      
      {/* Background Orbs */}
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-tertiary/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full -z-10" />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-y-auto flex flex-col pb-32"
      >
        <div className="w-full max-w-2xl mx-auto pt-12 px-6">
          <header className="mb-8 flex items-center justify-between">
            <Link href="/">
              <motion.button 
                whileHover={{ scale: 1.1, x: -2 }}
                className="p-2 glass-panel rounded-full text-on-surface-variant hover:text-on-surface"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-tertiary">Simulado IA</h1>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <Wifi className="w-2.5 h-2.5 text-primary" />
                  <span className="text-[8px] font-bold text-primary tracking-wider uppercase">Online</span>
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">Questões Inéditas de Alta Performance</p>
            </div>
            <div className="w-9" />
          </header>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="glass-panel p-16 rounded-3xl flex flex-col items-center justify-center gap-8 border border-white/5 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-tertiary/5 animate-pulse" />
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-6 bg-tertiary/20 rounded-full border border-tertiary/30"
                >
                  <Brain className="w-16 h-16 text-tertiary" />
                </motion.div>
                <div className="text-center space-y-2">
                  <p className="font-display font-bold text-xl tracking-widest text-on-surface">PROCESSANDO IA...</p>
                  <p className="text-xs text-on-surface-variant animate-pulse lowercase font-mono">Gerando distratores plausíveis...</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-10 rounded-3xl text-center space-y-6 border border-red-500/20"
              >
                <p className="text-on-surface font-medium">{error}</p>
                <button 
                  onClick={generateQuestao} 
                  className="px-8 py-3 bg-tertiary/20 text-tertiary rounded-2xl font-bold text-sm border border-tertiary/30 hover:bg-tertiary/30 transition-all"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            ) : questao ? (
              <motion.div 
                key="questao"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Meta Labels */}
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-tertiary/10 rounded-full border border-tertiary/20 flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-tertiary" />
                    <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">{questao.area}</span>
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{questao.tema}</span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                    questao.dificuldade === "fácil" ? "bg-green-500/10 border-green-500/20 text-green-500" :
                    questao.dificuldade === "média" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                    "bg-red-500/10 border-red-500/20 text-red-500"
                  )}>
                    {questao.dificuldade}
                  </div>
                </div>

                {isTimerConfigured && (
                  <div className="glass-panel rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1.5 text-white/50">
                        <Timer className="w-3.5 h-3.5 text-tertiary" />
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
                          timeLeft <= configuredSeconds / 2 ? "bg-amber-500" : "bg-tertiary"
                        )}
                        style={{ width: `${Math.max(0, (timeLeft / configuredSeconds) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Question Card */}
                <div className="glass-panel rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
                   <div className="h-1.5 w-full bg-tertiary/40" />
                   
                   <div className="p-8 space-y-8">
                     {/* Texto Base */}
                     <div className="space-y-4">

                      {questao.texto_base && (
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 italic text-on-surface-variant leading-relaxed text-sm">
                          {questao.texto_base}
                        </div>
                      )}
                     </div>

                     {/* Pergunta */}
                     <div className="space-y-4">
                        <h2 className="text-lg font-display font-bold leading-relaxed text-on-surface">
                          {questao.pergunta}
                        </h2>
                     </div>

                     {/* Alternativas */}
                     <div className="grid grid-cols-1 gap-3">
                        {Object.entries(questao.alternativas || {}).map(([letter, text]) => {
                          const isSelected = selectedAnswer === letter;
                          const isCorrect = letter === questao.gabarito;
                          const showResult = showExplanation;

                          return (
                            <button
                              key={letter}
                              disabled={showExplanation}
                              onClick={() => handleSelectAnswer(letter)}
                              className={cn(
                                "p-4 rounded-2xl border text-left transition-all relative flex items-center gap-4 group",
                                isSelected ? "border-tertiary bg-tertiary/10" : "border-white/5 bg-white/5 hover:bg-white/10",
                                showResult && isCorrect && "border-green-500 bg-green-500/10",
                                showResult && isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                                showExplanation && "cursor-default"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 transition-all",
                                isSelected ? "bg-tertiary text-white" : "bg-white/10 text-on-surface-variant group-hover:bg-tertiary/20",
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

                     {/* Footer Actions */}
                     <div className="pt-4 space-y-4">
                        <AnimatePresence>
                          {selectedAnswer && !showExplanation && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              onClick={handleCheckAnswer}
                              className="w-full py-4 gradient-tertiary rounded-2xl text-white font-display font-bold tracking-widest shadow-xl shadow-tertiary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                              CONFERIR RESPOSTA
                              <ArrowRight className="w-5 h-5" />
                            </motion.button>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {showExplanation && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              className="overflow-hidden bg-tertiary/5 rounded-2xl border border-tertiary/10"
                            >
                              <div className="p-6 space-y-4">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-tertiary/20 rounded-lg">
                                    <HelpCircle className="w-4 h-4 text-tertiary" />
                                  </div>
                                  <h4 className="font-display font-bold text-sm uppercase tracking-widest text-tertiary">Explicação da Resposta</h4>
                                </div>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                  {questao.explicacao}
                                </p>
                                <div className="pt-4">
                                  <button 
                                    onClick={generateQuestao}
                                    className="w-full py-3 bg-white/5 rounded-xl text-on-surface font-bold text-xs uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <RefreshCcw className="w-4 h-4" />
                                    OBTER PRÓXIMA QUESTÃO
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                   </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        
        <BottomNav />
      </motion.main>

      {/* PREMIUM GATEWAY MODAL OVERLAY */}
      <AnimatePresence>
        {showPremiumUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-lg my-8">
              <PremiumGateway 
                onClose={() => {
                  window.location.href = '/'; // Go back home if closed or cancelled
                }} 
                onSuccess={() => {
                  setIsPremium(true);
                  setShowPremiumUpgrade(false);
                  generateQuestao();
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .gradient-tertiary {
          background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
        }
      `}</style>
    </div>
  );
}
