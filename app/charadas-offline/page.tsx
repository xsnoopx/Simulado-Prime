'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Laugh,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { CharadaCard } from '@/components/CharadaCard';
import {
  CATEGORIAS_CHARADAS,
  DIFICULDADES,
  STATIC_CHARADAS,
  charadaDoDia,
  estatisticasProgresso,
  filtrarCharadas,
  lerProgresso,
  registrarResposta,
  salvarProgresso,
  type CategoriaCharadaId,
  type DificuldadeCharada,
  type ProgressoCharadas,
} from '@/lib/charadas';

const MAPA_DIFICULDADE: Record<string, DificuldadeCharada> = {
  simples: 'Simples',
  medio: 'Médio',
  medios: 'Médio',
  complexo: 'Complexo',
  complexos: 'Complexo',
};

function CharadasContent() {
  const searchParams = useSearchParams();
  const parametrosAplicados = useRef<string | null>(null);

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<CategoriaCharadaId | 'todas'>('todas');
  const [dificuldade, setDificuldade] = useState<DificuldadeCharada | 'todas'>('todas');
  const [somenteNaoVistas, setSomenteNaoVistas] = useState(false);
  const [indice, setIndice] = useState(0);
  const [progresso, setProgresso] = useState<ProgressoCharadas>({});

  useEffect(() => {
    setProgresso(lerProgresso());
  }, []);

  useEffect(() => {
    const chave = searchParams.toString();
    if (parametrosAplicados.current === chave) return;
    parametrosAplicados.current = chave;

    const categoriaParam = searchParams.get('categoria');
    if (categoriaParam && CATEGORIAS_CHARADAS.some((item) => item.id === categoriaParam)) {
      setCategoria(categoriaParam as CategoriaCharadaId);
    }

    const dificuldadeParam = searchParams.get('dificuldade');
    if (dificuldadeParam) {
      const mapeada = MAPA_DIFICULDADE[dificuldadeParam.toLowerCase()];
      if (mapeada) setDificuldade(mapeada);
    }

    if (searchParams.get('dia') === '1') {
      const dia = charadaDoDia();
      const posicao = STATIC_CHARADAS.findIndex((item) => item.id === dia.id);
      setBusca('');
      setCategoria('todas');
      setDificuldade('todas');
      setSomenteNaoVistas(false);
      setIndice(posicao >= 0 ? posicao : 0);
    }
  }, [searchParams]);

  const lista = useMemo(
    () =>
      filtrarCharadas(STATIC_CHARADAS, {
        busca,
        categoria,
        dificuldade,
        somenteNaoVistas,
        progresso,
      }),
    [busca, categoria, dificuldade, somenteNaoVistas, progresso]
  );

  const dia = useMemo(() => charadaDoDia(), []);
  const stats = useMemo(() => estatisticasProgresso(progresso), [progresso]);

  const indiceSeguro = lista.length > 0 ? Math.min(indice, lista.length - 1) : 0;
  const atual = lista[indiceSeguro];
  const ehCharadaDoDia = atual?.id === dia.id;
  const temFiltro =
    busca.trim().length > 0 ||
    categoria !== 'todas' ||
    dificuldade !== 'todas' ||
    somenteNaoVistas;

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

  const abrirCharadaDoDia = () => {
    const posicao = STATIC_CHARADAS.findIndex((item) => item.id === dia.id);
    setBusca('');
    setCategoria('todas');
    setDificuldade('todas');
    setSomenteNaoVistas(false);
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
    setSomenteNaoVistas(false);
    setIndice(0);
  };

  return (
    <>
      <header className="mb-7 flex items-center justify-between">
        <Link href="/charadas" aria-label="Voltar para o hub de charadas">
          <span className="p-2 glass-panel rounded-full text-on-surface-variant inline-flex hover:text-on-surface transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </span>
        </Link>
        <div className="text-center flex-1 px-2">
          <h1 className="text-[clamp(1.1rem,4.8vw,1.5rem)] font-display font-bold tracking-[0.12em] text-secondary">
            ACERVO DE CHARADAS
          </h1>
          <p className="text-[0.625rem] text-on-surface-variant uppercase tracking-[0.28em] mt-1">
            Busca, dicas e progresso local
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
              {stats.resolvidos} charadas sabidas
            </p>
          </div>
          <span className="text-lg font-display font-black text-secondary">
            {stats.percentual === 0 && stats.resolvidos > 0 ? '<1' : stats.percentual}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-secondary/60 via-secondary to-secondary transition-all duration-500"
            style={{ width: `${stats.percentual}%` }}
          />
        </div>
        <p className="text-[0.625rem] text-on-surface-variant/50 mt-2">
          {stats.tentados > 0
            ? stats.tentados === 1
              ? '1 charada já vista neste dispositivo.'
              : `${stats.tentados} charadas já vistas neste dispositivo.`
            : 'Marque “Eu sabia” ou “Não sabia” para acompanhar seu desempenho.'}
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
          placeholder="Buscar por pergunta, resposta ou tema..."
          aria-label="Buscar charadas"
          className="w-full glass-panel rounded-2xl pl-10 pr-10 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 border border-white/5 focus:border-secondary/40 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
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
              ? 'bg-secondary border-secondary text-white shadow-md shadow-secondary/10'
              : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'
          )}
        >
          Todas
        </button>

        {CATEGORIAS_CHARADAS.map((item) => (
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
                ? 'bg-secondary border-secondary text-white shadow-md shadow-secondary/10'
                : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'
            )}
          >
            <span aria-hidden="true">{item.emoji}</span>
            {item.label}
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
            setSomenteNaoVistas((valor) => !valor);
            setIndice(0);
          }}
          className={cn(
            'px-3 py-1.5 rounded-full border text-[0.625rem] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5',
            somenteNaoVistas
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
              : 'bg-white/[0.03] border-white/5 text-on-surface-variant/70 hover:bg-white/10'
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Só não vistas
        </button>

        {temFiltro && (
          <button
            type="button"
            onClick={limparFiltros}
            className="px-3 py-1.5 rounded-full border border-secondary/20 bg-secondary/10 text-[0.625rem] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {!ehCharadaDoDia && (
        <button
          type="button"
          onClick={abrirCharadaDoDia}
          className="w-full glass-panel rounded-2xl p-3.5 mb-5 flex items-center gap-3 text-left border border-secondary/20 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <span className="p-2 rounded-xl bg-secondary/10 text-secondary shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[0.5625rem] font-black uppercase tracking-[0.22em] text-secondary">
              Charada do dia
            </span>
            <span className="block text-sm font-bold text-on-surface truncate">{dia.pergunta}</span>
          </span>
          <ArrowRight className="w-4 h-4 text-secondary shrink-0" />
        </button>
      )}

      {lista.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/5 space-y-4">
          <Laugh className="w-10 h-10 text-secondary/60 mx-auto" />
          <div className="space-y-1">
            <p className="font-display font-bold text-lg">Nenhuma charada encontrada</p>
            <p className="text-sm text-on-surface-variant">
              Tente outra busca ou remova alguns filtros.
            </p>
          </div>
          <button
            type="button"
            onClick={limparFiltros}
            className="px-5 py-2.5 rounded-2xl bg-secondary text-white text-sm font-bold cursor-pointer"
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
                : CATEGORIAS_CHARADAS.find((item) => item.id === categoria)?.label}
              {' · '}
              Charada {indiceSeguro + 1}
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
            <CharadaCard
              key={atual.id}
              charada={atual}
              progresso={progresso[atual.id]}
              destaque={atual.id === dia.id}
              onResponder={responder}
              onProximo={proximo}
            />
          )}

          <p className="text-center text-[0.625rem] text-on-surface-variant/40 pt-2">
            O acervo funciona sem internet. O gerador com IA é exclusivo do COSMOS PRIME.
          </p>
        </section>
      )}
    </>
  );
}

export default function CharadasOfflinePage() {
  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      <div className="starfield" />
      <main className="flex-1 overflow-y-auto pt-10 px-5 sm:px-6 max-w-xl mx-auto w-full pb-32">
        <Suspense
          fallback={
            <div className="text-center text-on-surface-variant pt-20">Carregando charadas...</div>
          }
        >
          <CharadasContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
