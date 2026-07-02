'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircleQuestion, 
  ChevronLeft, 
  RefreshCcw, 
  Eye, 
  EyeOff, 
  Sparkles,
  Laugh,
  Quote,
  Lock,
  Crown
} from 'lucide-react';
import Link from 'next/link';
import { cn, playCategorySound, playSubcategorySound } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { PremiumGateway } from '@/components/PremiumGateway';

// Grátis categories (approx 500 items representatively)
const CATEGORIAS_GRATIS = [
  { id: "animais", label: "Animais 🐾", query: "animais engraçados ou de estimação" },
  { id: "escola", label: "Escola 🎒", query: "escola, matérias ou estudantes" },
  { id: "comida", label: "Comida 🍕", query: "tipos de alimentos ou lanches" },
  { id: "trocadilhos", label: "Trocadilhos 🤪", query: "trocadilho com nomes ou expressões" },
  { id: "o que é o que é", label: "O que é, o que é? 🤔", query: "o que é o que é inteligente e bobo" }
];

// Premium-only categories
const CATEGORIAS_PREMIUM = [
  { id: "impossiveis", label: "Impossíveis 🧠", query: "charadas absurdamente difíceis e impossíveis de resolver sem pensar muito fora da caixa", isPremium: true },
  { id: "historicas", label: "Históricas 📜", query: "figuras históricas conhecidas, civilizações do passado ou fatos históricos emblemáticos", isPremium: true },
  { id: "matematicas", label: "Matemáticas Avançadas 📐", query: "lógica matemática muito inteligente, contagens e enigmas numéricos", isPremium: true }
];

const ESTILOS = [
  "engraçado", "muito engraçado", "humor brasileiro", "tiozão", 
  "piada ruim", "internet brasileira", "meme", "charada curta"
];

const ESTRUTURAS = [
  "O que é o que é", "Por que", "Qual é", "Como", 
  "Quem é", "O que o", "Qual animal", "Qual comida", "Qual profissão"
];

const INTRODUCOES = [
  "Prepare-se para essa:", "Essa é clássica:", "Só os inteligentes entendem:", 
  "Essa é tão ruim que fica boa:", "Piada nível tiozão:", 
  "Humor brasileiro ativado:", "Essa faz qualquer um rir:",
];

const FINAIS = [
  "Kkkkk.", "Essa foi pesada.", "Piada ruim é arte.", 
  "Essa merece aplausos.", "Difícil não rir.", "Humor duvidoso aprovado.",
];

const PROMPT_BASE = `
Crie UMA charada engraçada ORIGINAL em português brasileiro.

IMPORTANTE:
- NÃO copie charadas famosas
- Crie trocadilhos inéditos
- Estilo brasileiro de humor
- Resposta curta e engraçada
- Formato parecido com sites de charadas engraçadas
- Humor simples e viral
- Evite conteúdo ofensivo

Formato JSON:
{
  "categoria": "",
  "introducao": "",
  "pergunta": "",
  "resposta": "",
  "final": ""
}
`;

function gerarPrompt(categoriaId: string) {
  const allCats = [...CATEGORIAS_GRATIS, ...CATEGORIAS_PREMIUM];
  const selected = allCats.find(c => c.id === categoriaId) || CATEGORIAS_GRATIS[0];
  const estilo = ESTILOS[Math.floor(Math.random() * ESTILOS.length)];
  const estrutura = ESTRUTURAS[Math.floor(Math.random() * ESTRUTURAS.length)];
  const intro = INTRODUCOES[Math.floor(Math.random() * INTRODUCOES.length)];
  const final = FINAIS[Math.floor(Math.random() * FINAIS.length)];

  return `
${PROMPT_BASE}

Tema e categoria obrigatórios: ${selected.query}
Estilo: ${estilo}
Estrutura principal: ${estrutura}

Introdução:
${intro}

Final:
${final}
`;
}

interface Charada {
  categoria: string;
  introducao: string;
  pergunta: string;
  resposta: string;
  final: string;
}

export default function CharadasPage() {
  const [charada, setCharada] = useState<Charada | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("animais");
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
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
  }, []);

  const generateCharada = async (overrideCategory?: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setShowAnswer(false);

    try {
      const catToUse = overrideCategory || selectedCategory;
      const prompt = gerarPrompt(catToUse);

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
              categoria: { type: "STRING" },
              introducao: { type: "STRING" },
              pergunta: { type: "STRING" },
              resposta: { type: "STRING" },
              final: { type: "STRING" },
            },
            required: ["categoria", "introducao", "pergunta", "resposta", "final"]
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
        setCharada(data);
      } else {
        throw new Error(resData.error || "Nenhum texto retornado pela IA");
      }
    } catch (err: any) {
      console.error("Charada fetch error:", err);
      const errMsg = String(err.message || err);
      if (errMsg.includes("Failed to fetch") || errMsg.includes("fetch failed") || errMsg.includes("NetworkError") || errMsg.includes("conexão") || errMsg.includes("connect")) {
        setError("Erro de rede: Não foi possível se conectar aos servidores espaciais do Gemini. Verifique sua conexão de internet e tente novamente nos próximos segundos.");
      } else if (errMsg.includes("JSON") || errMsg.includes("SyntaxError")) {
        setError("A inteligência artificial retornou um formato inesperado. Por favor, tente de novo para gerar outra charada!");
      } else {
        setError(errMsg || "Houve um problema ao contar a piada. Tente de novo!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShowAnswer(false);
  }, [charada]);

  useEffect(() => {
    if (!isMounted) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    generateCharada("animais");
  }, [isMounted]);

  const handleSelectCategory = (catId: string, isPremiumCat?: boolean) => {
    playSubcategorySound();
    if (isPremiumCat && !isPremium) {
      setShowPremiumUpgrade(true);
      return;
    }
    setSelectedCategory(catId);
    generateCharada(catId);
  };

  if (!isMounted) {
    return (
      <div className="relative h-screen flex flex-col overflow-hidden">
        <div className="starfield" />
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div className="starfield" />
      
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full -z-10" />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-y-auto flex flex-col pb-32"
      >
        <div className="w-full max-w-xl mx-auto pt-12 px-6">
          <header className="mb-6 flex items-center justify-between">
            <Link href="/">
              <motion.button 
                whileHover={{ scale: 1.1, x: -2 }}
                className="p-2 glass-panel rounded-full text-on-surface-variant hover:text-on-surface"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-secondary">Charadas</h1>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">O Riso é Garantido</p>
            </div>
            <div className="w-9" />
          </header>

          {/* ACTIVE LICENSE STATUS BANNER */}
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-secondary tracking-widest block">Licença de Uso</span>
              <p className="text-xs font-bold text-white/90">
                {isPremium ? "🏆 Pacote Cosmos Premium Ativado" : "🌱 Plano Grátis Liberado"}
              </p>
              <p className="text-[10px] text-white/50 leading-tight">
                {isPremium 
                  ? "Acesso ilimitado a charadas premium, impossíveis, históricas e matemáticas." 
                  : "Acesso a charadas de humor diário. Faça upgrade para desbloquear mais charadas."}
              </p>
            </div>
            <div className="shrink-0 pl-2">
              {isPremium ? (
                <div className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/20 flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-wider animate-pulse">
                  <Crown className="w-3 h-3" />
                  Premium
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPremiumUpgrade(true)}
                  className="px-3 py-1.5 rounded-full bg-secondary text-white font-bold text-[9px] uppercase tracking-wider hover:bg-secondary/80 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Upgrade
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY SWITCHERS */}
          <div className="mb-6 space-y-3">
            <div>
              <span className="text-[8px] font-black uppercase text-white/40 tracking-wider block mb-1.5 px-0.5">Categorias Grátis</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIAS_GRATIS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id, false)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-[10px] font-medium transition-all cursor-pointer",
                      selectedCategory === cat.id 
                        ? "bg-secondary border-secondary text-white font-bold shadow-md shadow-secondary/10" 
                        : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider block mb-1.5 px-0.5 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                Categorias Premium
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIAS_PREMIUM.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id, true)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1",
                      selectedCategory === cat.id 
                        ? "bg-amber-500 border-amber-500 text-black font-bold shadow-lg shadow-amber-500/20" 
                        : "bg-amber-500/5 border-amber-500/10 text-amber-400 hover:bg-amber-500/10"
                    )}
                  >
                    {!isPremium && <Lock className="w-2.5 h-2.5 shrink-0" />}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center gap-6 border border-white/5 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-secondary/5 animate-pulse" />
                <div className="relative">
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="p-4 bg-secondary/20 rounded-full border border-secondary/30"
                  >
                    <Laugh className="w-12 h-12 text-secondary" />
                  </motion.div>
                </div>
                <p className="font-display font-bold text-lg tracking-widest animate-pulse text-on-surface">CONTANDO PIADA...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-8 rounded-3xl text-center space-y-4 border border-secondary/20"
              >
                <p className="text-secondary font-medium">{error}</p>
                <button onClick={() => generateCharada()} className="px-6 py-2 bg-secondary/20 text-secondary rounded-xl font-bold text-sm border border-secondary/30">
                  Tentar Novamente
                </button>
              </motion.div>
            ) : charada ? (
              <motion.div 
                key="charada"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
                  <div className="h-2 bg-gradient-to-r from-secondary/40 via-secondary to-secondary/40" />
                  
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20">
                        <Sparkles className="w-3 h-3 text-secondary" />
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{charada.categoria}</span>
                      </div>
                      <Quote className="w-4 h-4 text-on-surface-variant opacity-20" />
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-medium text-on-surface-variant italic border-l-2 border-secondary/30 pl-4">
                        {charada.introducao}
                      </p>
                      
                      <h2 className="text-xl font-display font-medium leading-relaxed text-on-surface">
                        {charada.pergunta}
                      </h2>

                      <p className="text-xs text-on-surface-variant/60 font-medium">
                        {charada.final}
                      </p>
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={() => setShowAnswer(!showAnswer)}
                        className={cn(
                          "w-full py-4 rounded-2xl font-display font-bold tracking-widest transition-all flex items-center justify-center gap-3",
                          showAnswer 
                            ? "bg-on-surface/10 text-on-surface border border-white/10" 
                            : "gradient-secondary text-white shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                      >
                        {showAnswer ? (
                          <>
                            <EyeOff className="w-5 h-5" />
                            FECHAR RESPOSTA
                          </>
                        ) : (
                          <>
                            <Eye className="w-5 h-5" />
                            VER RESPOSTA
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-secondary/10 border-t border-secondary/20 overflow-hidden"
                      >
                        <div className="p-8 text-center">
                          <p className="text-[10px] uppercase tracking-[0.4em] text-secondary font-bold mb-3">A Resposta era...</p>
                          <p className="text-2xl font-display font-bold text-on-surface">{charada.resposta}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => generateCharada()}
                  className="w-full py-4 glass-panel rounded-2xl flex items-center justify-center gap-3 text-on-surface font-display font-bold tracking-widest border border-white/5 hover:bg-white/5 active:scale-95 transition-all"
                >
                  <RefreshCcw className="w-5 h-5 text-secondary" />
                  MAIS UMA PIADA
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        
        <BottomNav />
      </motion.main>

      <AnimatePresence>
        {showPremiumUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <PremiumGateway 
                title="PACOTE PREMIUM DE CHARADAS" 
                onSuccess={() => {
                  setIsPremium(true);
                  setShowPremiumUpgrade(false);
                }} 
                onClose={() => setShowPremiumUpgrade(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .gradient-secondary {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
      `}</style>
    </div>
  );
}
