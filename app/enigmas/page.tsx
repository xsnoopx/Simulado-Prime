'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
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
} from 'lucide-react';
import { requestAi } from '@/lib/aiClient';
import { cn, playCategorySound, playSubcategorySound } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { EnigmaCard } from '@/components/EnigmaCard';
import { PremiumGateway } from '@/components/PremiumGateway';
import {
  CATEGORIAS_ENIGMAS,
  STATIC_ENIGMAS,
  TOTAL_ENIGMAS,
  contarPorCategoria,
  enigmaDoDia,
  lerProgresso,
  registrarResposta,
  salvarProgresso,
  type ProgressoEnigmas,
  type StatusEnigma,
} from '@/lib/enigmas';

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
  const [progresso, setProgresso] = useState<ProgressoEnigmas>({});

  const [enigmaDestaque, setEnigmaDestaque] = useState(STATIC_ENIGMAS[0]);

  const [enigmaIa, setEnigmaIa] = useState<EnigmaIa | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarRespostaIa, setMostrarRespostaIa] = useState(false);
  const [categoriaIa, setCategoriaIa] = useState('logica');
  const jaGerou = useRef(false);
  const contagem = useMemo(() => contarPorCategoria(), []);

  useEffect(() => {
    setMontado(true);
    setIsPremium(lerPremium());
    setProgresso(lerProgresso());
    setEnigmaDestaque(enigmaDoDia());

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
    // A geração inicial acontece apenas na primeira entrada na aba de IA.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montado, modo, isPremium]);

  const selecionarTemaIa = (temaId: string) => {
    playSubcategorySound();
    setCategoriaIa(temaId);
    void gerarEnigma(temaId);
  };

  const responderDestaque = (status: StatusEnigma) => {
    setProgresso((anterior) => {
      const novo = registrarResposta(anterior, enigmaDestaque.id, status);
      salvarProgresso(novo);
      return novo;
    });
  };

  const proximoDestaque = () => {
    const candidatos = STATIC_ENIGMAS.filter((item) => item.id !== enigmaDestaque.id);
    setEnigmaDestaque(candidatos[Math.floor(Math.random() * candidatos.length)]);
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
            <Link href="/" aria-label="Voltar para o início">
              <span className="p-2 glass-panel rounded-full text-on-surface-variant inline-flex hover:text-on-surface transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </span>
            </Link>
            <div className="text-center flex-1 px-2">
              <h1 className="text-[clamp(1.25rem,5.5vw,1.5rem)] font-display font-bold uppercase tracking-[0.18em] text-error">
                Enigmas
              </h1>
              <p className="text-[0.625rem] text-on-surface-variant uppercase tracking-[0.3em] mt-1">
                O mistério te espera
              </p>
            </div>
            <div className="w-9" />
          </header>

          <div className="glass-panel p-1.5 rounded-2xl border border-white/5 grid grid-cols-2 gap-1.5 mb-6">
            <button
              type="button"
              onClick={() => {
                playSubcategorySound();
                setModo('acervo');
              }}
              className={cn(
                'py-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer',
                modo === 'acervo'
                  ? 'bg-error text-white shadow-lg shadow-error/20'
                  : 'text-on-surface-variant hover:bg-white/5'
              )}
            >
              <Library className="w-4 h-4" />
              Acervo local
            </button>
            <button
              type="button"
              onClick={() => {
                playSubcategorySound();
                setModo('ia');
              }}
              className={cn(
                'py-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer',
                modo === 'ia'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-on-surface-variant hover:bg-white/5'
              )}
            >
              <Wand2 className="w-4 h-4" />
              Gerar com IA
              {!isPremium && <Lock className="w-3 h-3" />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {modo === 'acervo' ? (
              <motion.section
                key="acervo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="glass-panel rounded-3xl p-6 border border-error/20 relative overflow-hidden">
                  <div className="absolute -top-16 -right-10 w-44 h-44 bg-error/10 blur-3xl rounded-full" />
                  <p className="text-[0.5625rem] font-black uppercase tracking-[0.25em] text-error">
                    Biblioteca offline
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold mt-1.5 leading-tight">
                    {TOTAL_ENIGMAS} enigmas para quebrar a cabeça
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                    Oito categorias, três níveis de dificuldade, dicas e explicações.
                    Tudo funciona sem internet, direto no seu aparelho.
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-5">
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center">
                      <p className="text-lg font-display font-black text-error">{TOTAL_ENIGMAS}</p>
                      <p className="text-[0.5rem] uppercase tracking-wider text-on-surface-variant/60">
                        enigmas
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center">
                      <p className="text-lg font-display font-black text-error">8</p>
                      <p className="text-[0.5rem] uppercase tracking-wider text-on-surface-variant/60">
                        categorias
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center">
                      <p className="text-lg font-display font-black text-error">3</p>
                      <p className="text-[0.5rem] uppercase tracking-wider text-on-surface-variant/60">
                        níveis
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-5">
                    <Link
                      href="/enigmas-offline"
                      onClick={() => playCategorySound()}
                      className="flex-1 py-3.5 rounded-2xl bg-error text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-error/90 transition-colors"
                    >
                      Explorar acervo
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/enigmas-offline?dia=1"
                      onClick={() => playCategorySound()}
                      className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-on-surface font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-error" />
                      Enigma do dia
                    </Link>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h3 className="text-[0.625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
                      Navegue por categoria
                    </h3>
                    <Link
                      href="/enigmas-offline"
                      className="text-[0.5625rem] font-bold uppercase tracking-wider text-error"
                    >
                      Ver todos
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {CATEGORIAS_ENIGMAS.map((categoria) => (
                      <Link
                        key={categoria.id}
                        href={`/enigmas-offline?categoria=${categoria.id}`}
                        onClick={() => playSubcategorySound()}
                        className="glass-panel rounded-2xl p-4 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-2xl" aria-hidden="true">
                            {categoria.emoji}
                          </span>
                          <span className="text-[0.5625rem] font-bold text-on-surface-variant/40">
                            {contagem[categoria.id]}
                          </span>
                        </div>
                        <p className="font-display font-bold text-sm mt-2 leading-snug">
                          {categoria.label}
                        </p>
                        <p className="text-[0.625rem] text-on-surface-variant/60 mt-1 leading-relaxed line-clamp-2">
                          {categoria.descricao}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wider text-error mt-2.5">
                          Abrir
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h3 className="text-[0.625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
                      Destaque de hoje
                    </h3>
                    <span className="text-[0.5625rem] font-bold uppercase tracking-wider text-error">
                      Grátis
                    </span>
                  </div>
                  <EnigmaCard
                    enigma={enigmaDestaque}
                    destaque
                    rotuloDestaque="Enigma do dia"
                    progresso={progresso[enigmaDestaque.id]}
                    onResponder={responderDestaque}
                    onProximo={proximoDestaque}
                  />
                </div>

                <p className="text-center text-[0.625rem] text-on-surface-variant/40 px-4">
                  O acervo é gratuito e funciona offline. O progresso fica salvo neste dispositivo.
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
                      <Link
                        href="/enigmas-offline"
                        className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-on-surface font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                      >
                        <Library className="w-4 h-4" />
                        Continuar no acervo grátis
                      </Link>
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
