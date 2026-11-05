'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Ghost,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { EnigmaCard } from '@/components/EnigmaCard';
import {
  CATEGORIAS_ENIGMAS,
  DIFICULDADES,
  STATIC_ENIGMAS,
  TOTAL_ENIGMAS,
  contarPorCategoria,
  enigmaDoDia,
  estatisticasProgresso,
  filtrarEnigmas,
  lerProgresso,
  registrarResposta,
  salvarProgresso,
  type CategoriaEnigmaId,
  type DificuldadeEnigma,
  type ProgressoEnigmas,
} from '@/lib/enigmas';

const MAPA_DIFICULDADE: Record<string, DificuldadeEnigma> = {
  simples: 'Simples',
  medio: 'Médio',
  medios: 'Médio',
  complexo: 'Complexo',
  complexos: 'Complexo',
};

function EnigmasContent() {
  const searchParams = useSearchParams();
  const parametrosAplicados = useRef<string | null>(null);

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<CategoriaEnigmaId | 'todas'>('todas');
  const [dificuldade, setDificuldade] = useState<DificuldadeEnigma | 'todas'>('todas');
  const [somenteNaoResolvidos, setSomenteNaoResolvidos] = useState(false);
  const [indice, setIndice] = useState(0);
  const [progresso, setProgresso] = useState<ProgressoEnigmas>({});

  useEffect(() => {
    setProgresso(lerProgresso());
  }, []);

  useEffect(() => {
    // Em navegação direta, o Next pode montar com a query vazia e preencher
    // os parâmetros logo depois. Aplicamos cada combinação de busca uma vez.
    const chave = searchParams.toString();
    if (parametrosAplicados.current === chave) return;
    parametrosAplicados.current = chave;

    const categoriaParam = searchParams.get('categoria');
    if (categoriaParam && CATEGORIAS_ENIGMAS.some((item) => item.id === categoriaParam)) {
      setCategoria(categoriaParam as CategoriaEnigmaId);
    }

    const dificuldadeParam =
      searchParams.get('dificuldade') ?? searchParams.get('difficulty');
    if (dificuldadeParam) {
      const mapeada = MAPA_DIFICULDADE[dificuldadeParam.toLowerCase()];
      if (mapeada) setDificuldade(mapeada);
    }

    if (searchParams.get('dia') === '1') {
      const dia = enigmaDoDia();
      const posicao = STATIC_ENIGMAS.findIndex((item) => item.id === dia.id);
      setBusca('');
      setCategoria('todas');
      setDificuldade('todas');
      setSomenteNaoResolvidos(false);
      setIndice(posicao >= 0 ? posicao : 0);
    }
  }, [searchParams]);

  const lista = useMemo(
    () =>
      filtrarEnigmas(STATIC_ENIGMAS, {
        busca,
        categoria,
        dificuldade,
        somenteNaoResolvidos,
        progresso,
      }),
    [busca, categoria, dificuldade, somenteNaoResolvidos, progresso]
  );

  const baseContagem = useMemo(
    () =>
      filtrarEnigmas(STATIC_ENIGMAS, {
        busca,
        dificuldade,
        somenteNaoResolvidos,
        progresso,
      }),
    [busca, dificuldade, somenteNaoResolvidos, progresso]
  );

  const contagem = useMemo(() => contarPorCategoria(baseContagem), [baseContagem]);
  const dia = useMemo(() => enigmaDoDia(), []);
  const stats = useMemo(() => estatisticasProgresso(progresso), [progresso]);

  const indiceSeguro = lista.length > 0 ? Math.min(indice, lista.length - 1) : 0;
  const atual = lista[indiceSeguro];
  const ehEnigmaDoDia = atual?.id === dia.id;
  const temFiltro =
    busca.trim().length > 0 ||
    categoria !== 'todas' ||
    dificuldade !== 'todas' ||
    somenteNaoResolvidos;

  const proximo = () => {
    if (lista.length <= 1) return;
    setIndice((valor) => (valor + 1) % lista.length);
  };

  const sortear = () => {
    if (lista.length <= 1) return;
    let novo = indiceSeguro;
    while (novo === indiceSeguro) {
      novo = Math.floor(Math.random() * lista.length);
    }
    setIndice(novo);
  };

  const abrirEnigmaDoDia = () => {
    const posicao = STATIC_ENIGMAS.findIndex((item) => item.id === dia.id);
    setBusca('');
    setCategoria('todas');
    setDificuldade('todas');
    setSomenteNaoResolvidos(false);
    setIndice(posicao >= 0 ? posicao : 0);
  };

  const responder = (status: 'acertei' | 'errei') => {
    if (!atual) return;
    setProgresso((anterior) => {
      const novo = registrarResposta(anterior, atual.id, status);
      salvarProgresso(novo);
      return novo;
    });
  };

  const limparFiltros = () => {
    setBusca('');
    setCategoria('todas');
    setDificuldade('todas');
    setSomenteNaoResolvidos(false);
    setIndice(0);
  };

  return (
    <>
      <header className="mb-7 flex items-center justify-between">
        <Link href="/" aria-label="Voltar para o início">
          <span className="p-2 glass-panel rounded-full text-on-surface-variant inline-flex hover:text-on-surface transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </span>
        </Link>
        <div className="text-center flex-1 px-2">
          <h1 className="text-[clamp(1.1rem,4.8vw,1.5rem)] font-display font-bold tracking-[0.12em] text-error">
            ACERVO DE ENIGMAS
          </h1>
          <p className="text-[0.625rem] text-on-surface-variant uppercase tracking-[0.28em] mt-1">
            {TOTAL_ENIGMAS} desafios · 8 categorias
          </p>
        </div>
        <div className="w-9" />
      </header>

      <section className="glass-panel rounded-2xl p-4 mb-5 border border-white/5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
              Seu progresso
            </p>
            <p className="text-sm font-bold text-on-surface">
              {stats.resolvidos} de {stats.total} resolvidos
            </p>
          </div>
          <span className="text-lg font-display font-black text-error">
            {stats.percentual === 0 && stats.resolvidos > 0 ? '<1' : stats.percentual}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-error/60 via-error to-error transition-all duration-500"
            style={{ width: `${stats.percentual}%` }}
          />
        </div>
        <p className="text-[0.625rem] text-on-surface-variant/50 mt-2">
          {stats.tentados > 0
            ? stats.tentados === 1
              ? '1 enigma já tentado neste dispositivo.'
              : `${stats.tentados} enigmas já tentados neste dispositivo.`
            : 'Marque “Eu acertei” ou “Não sabia” para acompanhar seu desempenho.'}
        </p>
      </section>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
        <input
          type="search"
          value={busca}
          onChange={(evento) => {
            setBusca(evento.target.value);
            setIndice(0);
          }}
          placeholder="Buscar por título, texto, resposta ou tema..."
          aria-label="Buscar enigmas"
          className="w-full glass-panel rounded-2xl pl-10 pr-10 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 border border-white/5 focus:border-error/40 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        />
        {busca && (
          <button
            type="button"
            onClick={() => {
              setBusca('');
              setIndice(0);
            }}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-on-surface-variant/60 hover:text-on-surface cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        <button
          type="button"
          onClick={() => {
            setCategoria('todas');
            setIndice(0);
          }}
          className={cn(
            'px-3.5 py-2 rounded-full border text-[0.6875rem] font-bold whitespace-nowrap transition-all cursor-pointer',
            categoria === 'todas'
              ? 'bg-error border-error text-white shadow-md shadow-error/10'
              : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'
          )}
        >
          Todas · {TOTAL_ENIGMAS}
        </button>

        {CATEGORIAS_ENIGMAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCategoria(item.id);
              setIndice(0);
            }}
            className={cn(
              'px-3.5 py-2 rounded-full border text-[0.6875rem] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
              categoria === item.id
                ? 'bg-error border-error text-white shadow-md shadow-error/10'
                : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'
            )}
          >
            <span aria-hidden="true">{item.emoji}</span>
            {item.label}
            <span className="text-[0.5625rem] opacity-60">{contagem[item.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {(['todas', ...DIFICULDADES] as const).map((nivel) => (
          <button
            key={nivel}
            type="button"
            onClick={() => {
              setDificuldade(nivel);
              setIndice(0);
            }}
            className={cn(
              'px-3 py-1.5 rounded-full border text-[0.625rem] font-bold uppercase tracking-wider transition-all cursor-pointer',
              dificuldade === nivel
                ? 'bg-white/15 border-white/20 text-on-surface'
                : 'bg-white/[0.03] border-white/5 text-on-surface-variant/70 hover:bg-white/10'
            )}
          >
            {nivel === 'todas' ? 'Todos os níveis' : nivel}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setSomenteNaoResolvidos((valor) => !valor);
            setIndice(0);
          }}
          className={cn(
            'px-3 py-1.5 rounded-full border text-[0.625rem] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5',
            somenteNaoResolvidos
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
              : 'bg-white/[0.03] border-white/5 text-on-surface-variant/70 hover:bg-white/10'
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Só não resolvidos
        </button>

        {temFiltro && (
          <button
            type="button"
            onClick={limparFiltros}
            className="px-3 py-1.5 rounded-full border border-error/20 bg-error/10 text-[0.625rem] font-bold uppercase tracking-wider text-error flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {!ehEnigmaDoDia && (
        <button
          type="button"
          onClick={abrirEnigmaDoDia}
          className="w-full glass-panel rounded-2xl p-3.5 mb-5 flex items-center gap-3 text-left border border-error/20 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <span className="p-2 rounded-xl bg-error/10 text-error shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[0.5625rem] font-black uppercase tracking-[0.22em] text-error">
              Enigma do dia
            </span>
            <span className="block text-sm font-bold text-on-surface truncate">{dia.titulo}</span>
          </span>
          <ArrowRight className="w-4 h-4 text-error shrink-0" />
        </button>
      )}

      {lista.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/5 space-y-4">
          <Ghost className="w-10 h-10 text-error/60 mx-auto" />
          <div className="space-y-1">
            <p className="font-display font-bold text-lg">Nenhum enigma encontrado</p>
            <p className="text-sm text-on-surface-variant">
              Tente outra busca ou remova alguns filtros.
            </p>
          </div>
          <button
            type="button"
            onClick={limparFiltros}
            className="px-5 py-2.5 rounded-2xl bg-error text-white text-sm font-bold cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.625rem] uppercase tracking-[0.18em] text-on-surface-variant/50 font-bold">
              {categoria === 'todas'
                ? 'Todos os temas'
                : CATEGORIAS_ENIGMAS.find((item) => item.id === categoria)?.label}
              {' · '}
              {indiceSeguro + 1} de {lista.length}
            </p>
            <button
              type="button"
              onClick={sortear}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[0.625rem] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Sortear
            </button>
          </div>

          {atual && (
            <EnigmaCard
              key={atual.id}
              enigma={atual}
              progresso={progresso[atual.id]}
              destaque={atual.id === dia.id}
              onResponder={responder}
              onProximo={proximo}
            />
          )}

          <p className="text-center text-[0.625rem] text-on-surface-variant/40 pt-2">
            O acervo funciona sem internet. O modo com IA é exclusivo do COSMOS PRIME.
          </p>
        </section>
      )}
    </>
  );
}

export default function EnigmasOfflinePage() {
  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      <div className="starfield" />
      <main className="flex-1 overflow-y-auto pt-10 px-5 sm:px-6 max-w-xl mx-auto w-full pb-32">
        <Suspense
          fallback={
            <div className="text-center text-on-surface-variant pt-20">Carregando enigmas...</div>
          }
        >
          <EnigmasContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
