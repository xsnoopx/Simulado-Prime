'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Eye,
  EyeOff,
  Ghost,
  Library,
  Lock,
  Quote,
  RefreshCcw,
  Sparkles,
  Wand2,
  XCircle,
} from 'lucide-react';
import { requestAi } from '@/lib/aiClient';
import { cn, playSubcategorySound } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { PremiumGateway } from '@/components/PremiumGateway';
import type { StatusEnigma } from '@/lib/enigmas';

const TEMAS_IA = [
  { id: 'logica', label: 'Lógica 🧠', query: 'raciocínio lógico e charadas de esperteza', especial: false },
  { id: 'misterio', label: 'Mistério 🌌', query: 'mistérios e charadas inteligentes de decifrar', especial: false },
  { id: 'pensamento_lateral', label: 'Pensamento Lateral 🔀', query: 'enigmas com soluções surpreendentes e pensamento lateral', especial: false },
  { id: 'enigmas_antigos', label: 'Enigmas Antigos 🏺', query: 'enigmas mitológicos, históricos ou inspirados em esfinges', especial: false },
  { id: 'criminais', label: 'Criminais 🔪', query: 'investigação de assassinato misterioso e pistas criminais', especial: true },
  { id: 'detetive', label: 'Detetive 🔍', query: 'caso de detetive estilo Sherlock Holmes com pistas escondidas', especial: true },
  { id: 'escape_room', label: 'Escape Room 🚪', query: 'enigma de trancado em uma sala e achar a combinação ou chave lógica', especial: true },
  { id: 'misterios_historicos', label: 'Mistérios Históricos 🏛️', query: 'lendas históricas, relíquias arqueológicas ou civilizações perdidas', especial: true },
  { id: 'casos_investigativos', label: 'Casos Investigativos 🕵️‍♂️', query: 'caso de investigação complexo que exige analisar depoimentos contraditórios', especial: true },
];

const ESTILOS = [
  'difícil',
  'muito difícil',
  'extremamente difícil',
  'estilo Sherlock Holmes',
  'estilo investigação criminal',
  'estilo escape room',
];

const INTRODUCOES = [
  'Um detetive encontrou a seguinte mensagem:',
  'Em uma sala secreta estava escrito:',
  'Um manuscrito antigo continha o seguinte enigma:',
  'Uma inteligência artificial criou este desafio:',
  'Durante uma investigação surgiu a pergunta:',
];

const FINAIS = [
  'Poucos conseguem resolver.',
  'A resposta exige raciocínio avançado.',
  'O segredo está escondido nos detalhes.',
  'A maioria erra na primeira tentativa.',
  'Observe cuidadosamente antes de responder.',
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

interface EnigmaIa {
  categoria: string;
  introducao: string;
  pergunta: string;
  resposta: string;
  final: string;
}

function gerarPrompt(categoriaId: string) {
  const selecionada = TEMAS_IA.find((tema) => tema.id === categoriaId) ?? TEMAS_IA[0];
  const estilo = ESTILOS[Math.floor(Math.random() * ESTILOS.length)];
  const intro = INTRODUCOES[Math.floor(Math.random() * INTRODUCOES.length)];
  const final = FINAIS[Math.floor(Math.random() * FINAIS.length)];

  return `
${PROMPT_BASE}

Categoria específica e tema: ${selecionada.query}
Estilo de design: ${estilo}

Introdução sugerida:
${intro}

Final sugerido:
${final}
`;
}

function lerPremium(): boolean {
  if (typeof window === 'undefined') return false;

  const perfil = window.localStorage.getItem('user_profile');
  const logado = window.localStorage.getItem('cosmos_logged_user');

  if (perfil) {
    try {
      if (JSON.parse(perfil).isPremium) return true;
    } catch {
      // Ignora perfis corrompidos.
    }
  }

  if (logado) {
    try {
      if (JSON.parse(logado).isPremium) return true;
    } catch {
      // Ignora sessões corrompidas.
    }
  }

  return false;
}

function EnigmasConteudo() {
  const searchParams = useSearchParams();

  const [modo, setModo] = useState<'acervo' | 'ia'>('acervo');
  const [isPremium, setIsPremium] = useState(false);
  const [montado, setMontado] = useState(false);
  const [mostrarPrime, setMostrarPrime] = useState(false);

  const [enigmaIa, setEnigmaIa] = useState<EnigmaIa | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarRespostaIa, setMostrarRespostaIa] = useState(false);
  const [avaliacaoIa, setAvaliacaoIa] = useState<StatusEnigma | null>(null);
  const [categoriaIa, setCategoriaIa] = useState('logica');
  const jaGerou = useRef(false);

  useEffect(() => {
    setMontado(true);
    setIsPremium(lerPremium());

    if (searchParams.get('modo') === 'ia') setModo('ia');

    const reavaliarPremium = () => setIsPremium(lerPremium());
    window.addEventListener('supabase-data-synced', reavaliarPremium);
    window.addEventListener('storage', reavaliarPremium);

    return () => {
      window.removeEventListener('supabase-data-synced', reavaliarPremium);
      window.removeEventListener('storage', reavaliarPremium);
    };
  }, [searchParams]);

  const gerarEnigma = async (categoria: string) => {
    if (loading) return;

    setLoading(true);
    setErro(null);
    setMostrarRespostaIa(false);
    setAvaliacaoIa(null);

    try {
      const resposta = await requestAi(gerarPrompt(categoria), {
        type: 'OBJECT',
        properties: {
          categoria: { type: 'STRING' },
          introducao: { type: 'STRING' },
          pergunta: { type: 'STRING' },
          resposta: { type: 'STRING' },
          final: { type: 'STRING' },
        },
        required: ['categoria', 'introducao', 'pergunta', 'resposta', 'final'],
      });

      if (!resposta.text) throw new Error('Nenhum texto retornado pela IA');
      setEnigmaIa(JSON.parse(resposta.text) as EnigmaIa);
    } catch (erroGeracao: unknown) {
      const mensagem = String(
        erroGeracao instanceof Error ? erroGeracao.message : erroGeracao
      );
      console.error('Falha ao gerar enigma:', erroGeracao);

      if (
        mensagem.includes('Failed to fetch') ||
        mensagem.includes('fetch failed') ||
        mensagem.includes('NetworkError') ||
        mensagem.includes('conexão') ||
        mensagem.includes('connect')
      ) {
        setErro('Erro de rede: não foi possível conectar aos servidores do Cosmos. Verifique sua conexão e tente novamente.');
      } else if (mensagem.includes('JSON') || mensagem.includes('SyntaxError')) {
        setErro('A IA retornou um formato inválido. Tente gerar um novo enigma.');
      } else {
        setErro(mensagem || 'Falha ao gerar o enigma. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!montado || modo !== 'ia' || !isPremium || jaGerou.current) return;
    jaGerou.current = true;
    void gerarEnigma(categoriaIa);
    // A geração inicial acontece apenas na primeira entrada no modo online.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montado, modo, isPremium]);

  const selecionarTemaIa = (temaId: string) => {
    playSubcategorySound();
    setCategoriaIa(temaId);
    void gerarEnigma(temaId);
  };

  if (!montado) {
    return (
      <div className="relative h-[100dvh] flex flex-col overflow-hidden">
        <div className="starfield" />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      <div className="starfield" />

      <div className="absolute top-[-10%] right-[-10%] w-[420px] h-[420px] bg-error/10 blur-[110px] rounded-full -z-10" />
      <div className="absolute bottom-[20%] left-[-10%] w-[340px] h-[340px] bg-primary/10 blur-[100px] rounded-full -z-10" />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-y-auto flex flex-col pb-32"
      >
        <div className="w-full max-w-xl mx-auto pt-10 px-5 sm:px-6">
          <header className="mb-6 flex items-center justify-between">
            {modo === 'ia' ? (
              <button
                type="button"
                onClick={() => setModo('acervo')}
                aria-label="Voltar para as opções de enigmas"
                className="p-2 glass-panel rounded-full text-on-surface-variant inline-flex hover:text-on-surface transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <Link href="/" aria-label="Voltar para o início">
                <span className="p-2 glass-panel rounded-full text-on-surface-variant inline-flex hover:text-on-surface transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </span>
              </Link>
            )}
            <div className="text-center flex-1 px-2">
              <h1 className="text-[clamp(1rem,4.6vw,1.4rem)] font-display font-bold uppercase tracking-[0.14em] text-error">
                {modo === 'ia' ? 'Enigmas Online' : 'Enigmas'}
              </h1>
              <p className="text-[0.625rem] text-on-surface-variant uppercase tracking-[0.28em] mt-1">
                {modo === 'ia' ? 'Casos criados pela IA' : 'Escolha como quer jogar'}
              </p>
            </div>
            <div className="w-9" />
          </header>

          <AnimatePresence mode="wait">
            {modo === 'acervo' ? (
              <motion.section
                key="opcoes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <Link
                  href="/enigmas-offline"
                  className="glass-panel rounded-3xl p-5 border border-white/5 hover:bg-white/5 hover:border-error/30 transition-all group block"
                >
                  <div className="flex items-center gap-4">
                    <span className="p-3 rounded-2xl bg-error/10 text-error shrink-0">
                      <Library className="w-6 h-6" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-error">
                        Offline
                      </p>
                      <h2 className="text-base font-display font-bold text-on-surface mt-0.5">
                        Enigmas Offline
                      </h2>
                      <p className="text-[0.6875rem] text-on-surface-variant/60 leading-snug mt-1">
                        Acervo completo com dicas e explicações. Funciona sem internet.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-on-surface-variant/50 group-hover:text-error group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    playSubcategorySound();
                    setModo('ia');
                  }}
                  className="w-full text-left glass-panel rounded-3xl p-5 border border-white/5 hover:bg-white/5 hover:border-amber-500/30 transition-all group block cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0">
                      <Wand2 className="w-6 h-6" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-1.5">
                        Online · IA
                        {!isPremium && <Lock className="w-3 h-3" />}
                      </p>
                      <h2 className="text-base font-display font-bold text-on-surface mt-0.5">
                        Enigmas Online
                      </h2>
                      <p className="text-[0.6875rem] text-on-surface-variant/60 leading-snug mt-1">
                        Casos inéditos criados pela inteligência artificial.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-on-surface-variant/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </button>

                <p className="text-center text-[0.625rem] text-on-surface-variant/40 px-4 pt-1">
                  O acervo offline é gratuito. A geração com IA faz parte do COSMOS PRIME.
                </p>
              </motion.section>
            ) : (
              <motion.section
                key="ia"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {!isPremium ? (
                  <div className="glass-panel rounded-3xl p-7 border border-amber-500/20 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full" />
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Crown className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-display font-black uppercase tracking-wider text-amber-300">
                        Enigmas com IA é PRIME
                      </h2>
                      <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
                        O acervo local é gratuito e completo. A criação de casos inéditos
                        pela inteligência artificial faz parte do COSMOS PRIME, que só será
                        liberado após a confirmação do pagamento.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setMostrarPrime(true)}
                        className="w-full py-3.5 rounded-2xl bg-amber-500 text-black font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        <Crown className="w-4 h-4" />
                        Conhecer o PRIME
                      </button>
                      <button
                        type="button"
                        onClick={() => setModo('acervo')}
                        className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-on-surface font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Library className="w-4 h-4" />
                        Voltar para as opções
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-amber-300">
                          Licença PRIME ativa
                        </span>
                        <p className="text-xs font-bold text-on-surface">
                          Geração ilimitada de enigmas inéditos
                        </p>
                        <p className="text-[0.625rem] text-on-surface-variant/60 leading-tight">
                          Escolha um tema e deixe a IA criar um caso exclusivo.
                        </p>
                      </div>
                      <Crown className="w-6 h-6 text-amber-400 shrink-0" />
                    </div>

                    <div>
                      <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2 px-1">
                        Temas
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {TEMAS_IA.map((tema) => (
                          <button
                            key={tema.id}
                            type="button"
                            onClick={() => selecionarTemaIa(tema.id)}
                            className={cn(
                              'px-3 py-1.5 rounded-full border text-[0.625rem] font-medium transition-all cursor-pointer flex items-center gap-1',
                              categoriaIa === tema.id
                                ? 'bg-amber-500 border-amber-500 text-black font-bold'
                                : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'
                            )}
                          >
                            {tema.label}
                            {tema.especial && (
                              <Crown
                                className={cn(
                                  'w-2.5 h-2.5',
                                  categoriaIa === tema.id ? 'text-black/70' : 'text-amber-400/70'
                                )}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="carregando"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.02 }}
                          className="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center gap-5 border border-white/5"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="p-4 bg-amber-500/15 rounded-full border border-amber-500/25"
                          >
                            <Ghost className="w-10 h-10 text-amber-400" />
                          </motion.div>
                          <p className="font-display font-bold text-sm tracking-[0.2em] uppercase text-amber-300 animate-pulse">
                            Criando mistério...
                          </p>
                        </motion.div>
                      ) : erro ? (
                        <motion.div
                          key="erro"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="glass-panel p-7 rounded-3xl text-center space-y-4 border border-error/20"
                        >
                          <p className="text-sm text-error font-medium">{erro}</p>
                          <button
                            type="button"
                            onClick={() => void gerarEnigma(categoriaIa)}
                            className="px-6 py-2.5 bg-error/15 text-error rounded-2xl font-bold text-sm border border-error/30 hover:bg-error/25 transition-colors cursor-pointer"
                          >
                            Tentar novamente
                          </button>
                        </motion.div>
                      ) : enigmaIa ? (
                        <motion.div
                          key="enigma"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl"
                        >
                          <div className="h-1.5 bg-gradient-to-r from-amber-500/40 via-amber-400 to-amber-500/40" />
                          <div className="p-6 sm:p-8 space-y-5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-[0.625rem] font-bold uppercase tracking-wider text-amber-300">
                                <Sparkles className="w-3 h-3" />
                                {enigmaIa.categoria || 'Enigma inédito'}
                              </span>
                              <Quote className="w-4 h-4 text-on-surface-variant/20 rotate-180" />
                            </div>

                            <div className="space-y-3">
                              <p className="text-sm text-on-surface-variant italic border-l-2 border-amber-500/30 pl-3">
                                {enigmaIa.introducao}
                              </p>
                              <p className="text-base sm:text-lg font-display font-bold leading-relaxed">
                                {enigmaIa.pergunta}
                              </p>
                              <p className="text-[0.6875rem] text-on-surface-variant/50 italic">
                                {enigmaIa.final}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setMostrarRespostaIa((valor) => !valor)}
                              className={cn(
                                'w-full py-3.5 rounded-2xl font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer',
                                mostrarRespostaIa
                                  ? 'bg-white/10 text-on-surface'
                                  : 'bg-amber-500 text-black hover:bg-amber-400'
                              )}
                            >
                              {mostrarRespostaIa ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Esconder solução
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Ver solução
                                </>
                              )}
                            </button>

                            {mostrarRespostaIa && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2"
                              >
                                <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-amber-300/80">
                                  Resposta
                                </p>
                                <p className="text-lg font-display font-bold leading-snug">
                                  {enigmaIa.resposta}
                                </p>
                              </motion.div>
                            )}

                            {mostrarRespostaIa && (
                              <div className="space-y-2">
                                <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
                                  Como foi?
                                </p>

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAvaliacaoIa('acertei')}
                                    aria-pressed={avaliacaoIa === 'acertei'}
                                    className={cn(
                                      'py-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
                                      avaliacaoIa === 'acertei'
                                        ? 'bg-emerald-500 border-emerald-300 text-[#04231a] shadow-lg shadow-emerald-500/25 scale-[1.02]'
                                        : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25'
                                    )}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {avaliacaoIa === 'acertei' ? 'Eu sabia ✓' : 'Eu sabia'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAvaliacaoIa('errei')}
                                    aria-pressed={avaliacaoIa === 'errei'}
                                    className={cn(
                                      'py-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
                                      avaliacaoIa === 'errei'
                                        ? 'bg-rose-500 border-rose-300 text-[#2b0710] shadow-lg shadow-rose-500/25 scale-[1.02]'
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20'
                                    )}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    {avaliacaoIa === 'errei' ? 'Não sabia ✓' : 'Não sabia'}
                                  </button>
                                </div>

                                <AnimatePresence initial={false}>
                                  {avaliacaoIa && (
                                    <motion.p
                                      key="avaliacao-ia"
                                      initial={{ opacity: 0, y: -4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -4 }}
                                      className={cn(
                                        'flex items-center justify-center gap-1.5 text-[0.625rem] font-semibold',
                                        avaliacaoIa === 'acertei' ? 'text-emerald-300' : 'text-rose-300'
                                      )}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {avaliacaoIa === 'acertei'
                                        ? 'Você marcou: eu sabia deste enigma.'
                                        : 'Você marcou: não sabia deste enigma.'}
                                    </motion.p>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => void gerarEnigma(categoriaIa)}
                              className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-on-surface font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <RefreshCcw className="w-4 h-4 text-amber-400" />
                              Gerar outro enigma
                            </button>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </motion.main>

      <AnimatePresence>
        {mostrarPrime && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <div className="min-h-full flex items-start justify-center py-6">
              <PremiumGateway onClose={() => setMostrarPrime(false)} title="COSMOS PRIME" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

export default function EnigmasPage() {
  return (
    <Suspense
      fallback={
        <div className="relative h-[100dvh] flex flex-col overflow-hidden">
          <div className="starfield" />
          <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
            Carregando enigmas...
          </div>
        </div>
      }
    >
      <EnigmasConteudo />
    </Suspense>
  );
}
