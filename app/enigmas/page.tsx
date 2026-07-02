'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ghost, 
  ChevronLeft, 
  RefreshCcw, 
  Eye, 
  EyeOff, 
  Sparkles,
  Search,
  Quote,
  Lock,
  Crown
} from 'lucide-react';
import Link from 'next/link';
import { cn, playCategorySound, playSubcategorySound } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { PremiumGateway } from '@/components/PremiumGateway';

// Free categories
const CATEGORIAS_GRATIS = [
  { id: "logica", label: "Lógica 🧠", query: "raciocínio lógico e charadas de esperteza" },
  { id: "misterio", label: "Mistério Geral 🌌", query: "mistérios e charadas inteligentes de decifrar" },
  { id: "pensamento_lateral", label: "Pensamento Lateral 🔀", query: "enigmas com soluções surpreendentes e pensamento lateral" },
  { id: "enigmas_antigos", label: "Enigmas Antigos 🏺", query: "enigmas mitológicos históricos ou inspirados em esfinges" }
];

// Premium exclusive categories
const CATEGORIAS_PREMIUM = [
  { id: "criminais", label: "Criminais 🔪", query: "investigação de assassinato misterioso e pistas criminais", isPremium: true },
  { id: "detetive", label: "Detetive 🔍", query: "caso de detetive estilo Sherlock Holmes com pistas escondidas", isPremium: true },
  { id: "escape_room", label: "Escape Room 🚪", query: "enigma de trancado em uma sala e achar a combinação ou chave lógica", isPremium: true },
  { id: "misterios_historicos", label: "Mistérios Históricos 🏛️", query: "lendas históricas, relíquias arqueológicas ou civilizações perdidas", isPremium: true },
  { id: "casos_investigativos", label: "Casos Investigativos 🕵️‍♂️", query: "caso de investigação real complexo que requer analisar depoimentos contradictórios", isPremium: true }
];

const ESTILOS = [
  "difícil", "muito difícil", "extremamente difícil", 
  "estilo Sherlock Holmes", "estilo investigação criminal", "estilo escape room"
];

const INTRODUCOES = [
  "Um detetive encontrou a seguinte mensagem:",
  "Em uma sala secreta estava escrito:",
  "Um manuscrito antigo continha o seguinte enigma:",
  "Uma inteligência artificial criou este desafio:",
  "Durante uma investigação surgiu a pergunta:"
];

const FINAIS = [
  "Poucos conseguem resolver.",
  "A resposta exige raciocínio avançado.",
  "O segredo está escondido nos detalhes.",
  "A maioria erra na primeira tentativa.",
  "Observe cuidadosamente antes de responder."
];

const PROMPT_BASE = `
Crie um enigma ORIGINAL em português brasileiro.

Regras:
- O enigma deve ser difícil
- Não copie enigmas famosos
- Crie perguntas inéditas
- Gere resposta curta e lógica
- Use pensamento lateral
- Seja criativo
- Evite repetição

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
  const intro = INTRODUCOES[Math.floor(Math.random() * INTRODUCOES.length)];
  const final = FINAIS[Math.floor(Math.random() * FINAIS.length)];

  return `
${PROMPT_BASE}

Categoria específica e tema: ${selected.query}
Estilo de design: ${estilo}

Introdução sugerida:
${intro}

Final sugerido:
${final}
`;
}

interface Enigma {
  categoria: string;
  introducao: string;
  pergunta: string;
  resposta: string;
  final: string;
}

export default function EnigmasPage() {
  const [enigma, setEnigma] = useState<Enigma | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("logica");
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

  const generateEnigma = async (overrideCategory?: string) => {
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
        setEnigma(data);
      } else {
        throw new Error(resData.error || "Nenhum texto retornado pela IA");
      }
    } catch (err: any) {
      console.error("Enigma fetch error:", err);
      const errMsg = String(err.message || err);
      if (errMsg.includes("Failed to fetch") || errMsg.includes("fetch failed") || errMsg.includes("NetworkError") || errMsg.includes("conexão") || errMsg.includes("connect")) {
        setError("Erro de rede: Não foi possível se conectar aos servidores do Cosmos. Verifique sua conexão e tente novamente nos próximos segundos.");
      } else if (errMsg.includes("JSON") || errMsg.includes("SyntaxError")) {
        setError("A IA retornou um formato inválido para o enigma. Por favor, tente novamente para gerar um novo enigma!");
      } else {
        setError(errMsg || "Falha ao gerar o enigma. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset answer when enigma changes
  useEffect(() => {
    setShowAnswer(false);
  }, [enigma]);

  useEffect(() => {
    if (!isMounted) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    generateEnigma("logica");
  }, [isMounted]);

  const handleSelectCategory = (catId: string, isPremiumCat?: boolean) => {
    playSubcategorySound();
    if (isPremiumCat && !isPremium) {
      setShowPremiumUpgrade(true);
      return;
    }
    setSelectedCategory(catId);
    generateEnigma(catId);
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
      
      {/* Dynamic Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-error/10 blur-[120px] rounded-full -z-10 animate-pulse" />
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
              <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-error">Enigmas</h1>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">O Mistério te Espera</p>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </header>

          {/* ACTIVE LICENSE STATUS BANNER */}
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-error tracking-widest block">Licença de Uso</span>
              <p className="text-xs font-bold text-white/90">
                {isPremium ? "🏆 Pacote Cosmos Premium Ativado" : "🌱 Plano Grátis Liberado"}
              </p>
              <p className="text-[10px] text-white/50 leading-tight">
                {isPremium 
                  ? "Acesso ilimitado a todos os enigmas premium, criminais, detetive e escape room." 
                  : "Acesso a enigmas lógicos padrão. Faça upgrade para desbloquear mistérios detetive e criminais."}
              </p>
            </div>
            <div className="shrink-0 pl-2">
              {isPremium ? (
                <div className="px-2.5 py-1 rounded-full bg-error/15 text-error border border-error/20 flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-wider animate-pulse">
                  <Crown className="w-3 h-3 text-error" />
                  Premium
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPremiumUpgrade(true)}
                  className="px-3 py-1.5 rounded-full bg-error text-white font-bold text-[9px] uppercase tracking-wider hover:bg-error/80 transition-all cursor-pointer flex items-center gap-1"
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
              <span className="text-[8px] font-black uppercase text-white/40 tracking-wider block mb-1.5 px-0.5">Enigmas Grátis</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIAS_GRATIS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id, false)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-[10px] font-medium transition-all cursor-pointer",
                      selectedCategory === cat.id 
                        ? "bg-error border-error text-white font-bold shadow-md shadow-error/10" 
                        : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[8px] font-black uppercase text-red-400 tracking-wider block mb-1.5 px-0.5 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5 text-red-400" />
                Pacote Premium de Enigmas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIAS_PREMIUM.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id, true)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1",
                      selectedCategory === cat.id 
                        ? "bg-red-500 border-red-500 text-white font-bold shadow-lg shadow-red-500/20" 
                        : "bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10"
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
                <div className="absolute inset-0 bg-error/5 animate-pulse" />
                <div className="relative">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="p-4 bg-error/20 rounded-full border border-error/30"
                  >
                    <Ghost className="w-12 h-12 text-error" />
                  </motion.div>
                </div>
                <p className="font-display font-bold text-lg tracking-widest animate-pulse text-on-surface">CRIANDO MISTÉRIO...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-8 rounded-3xl text-center space-y-4 border border-error/20"
              >
                <p className="text-error font-medium">{error}</p>
                <button 
                  onClick={() => generateEnigma()}
                  className="px-6 py-2 bg-error/20 text-error rounded-xl font-bold text-sm border border-error/30 hover:bg-error/30 transition-colors"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            ) : enigma ? (
              <motion.div 
                key="enigma"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Enigma Card */}
                <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
                  <div className="h-2 bg-gradient-to-r from-error/40 via-error to-error/40" />
                  
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 px-3 py-1 bg-error/10 rounded-full border border-error/20">
                        <Sparkles className="w-3 h-3 text-error" />
                        <span className="text-[10px] font-bold text-error uppercase tracking-wider">{enigma.categoria}</span>
                      </div>
                      <Quote className="w-4 h-4 text-on-surface-variant opacity-20 rotate-180" />
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-medium text-on-surface-variant italic border-l-2 border-error/30 pl-4">
                        {enigma.introducao}
                      </p>
                      
                      <h2 className="text-xl font-display font-medium leading-relaxed text-on-surface">
                        {enigma.pergunta}
                      </h2>

                      <p className="text-xs text-on-surface-variant/60 font-medium">
                        {enigma.final}
                      </p>
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={() => setShowAnswer(!showAnswer)}
                        className={cn(
                          "w-full py-4 rounded-2xl font-display font-bold tracking-widest transition-all flex items-center justify-center gap-3",
                          showAnswer 
                            ? "bg-on-surface/10 text-on-surface border border-white/10" 
                            : "gradient-error text-white shadow-lg shadow-error/20 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                      >
                        {showAnswer ? (
                          <>
                            <EyeOff className="w-5 h-5" />
                            ESCONDER RESPOSTA
                          </>
                        ) : (
                          <>
                            <Eye className="w-5 h-5" />
                            REVELAR RESPOSTA
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
                        className="bg-error/10 border-t border-error/20 overflow-hidden"
                      >
                        <div className="p-8 text-center">
                          <p className="text-[10px] uppercase tracking-[0.4em] text-error font-bold mb-3">A Solução</p>
                          <p className="text-2xl font-display font-bold text-on-surface">{enigma.resposta}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => generateEnigma()}
                    className="flex-1 py-4 glass-panel rounded-2xl flex items-center justify-center gap-3 text-on-surface font-display font-bold tracking-widest border border-white/5 hover:bg-white/5 active:scale-95 transition-all"
                  >
                    <RefreshCcw className="w-5 h-5 text-error" />
                    NOVO ENIGMA
                  </button>
                </div>
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
                title="PACOTE PREMIUM DE ENIGMAS" 
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
        .gradient-error {
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
        }
      `}</style>
    </div>
  );
}
