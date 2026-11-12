"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Info, Sparkles, Wrench, X } from "lucide-react";
import { tomDoAviso } from "@/lib/broadcastShared";
import { cn } from "@/lib/utils";

/**
 * Balão global de lembrete publicado pelo administrador.
 *
 * - aparece em qualquer tela, inclusive para visitantes;
 * - fica fixo até o jogador fechar;
 * - ao fechar, guarda o horário no navegador e só reaparece depois de
 *   `reexibirHoras` (padrão 12h) — ou na hora, se o admin publicar uma
 *   versão nova do mesmo aviso.
 */

type Aviso = {
  id: string;
  title: string;
  body: string;
  tone: string;
  version: number;
  reexibirHoras: number;
  updatedAt: string;
};

type Fechamento = { id: string; version: number; em: number };

const CHAVE_FECHAMENTO = "cosmos_aviso_fechado_v1";
const INTERVALO_CONSULTA = 5 * 60 * 1000;
const ATRASO_INICIAL = 1500;

const ICONES: Record<string, typeof Info> = {
  info: Info,
  atencao: AlertTriangle,
  novidade: Sparkles,
  manutencao: Wrench,
};

function lerFechamento(): Fechamento | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE_FECHAMENTO);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (!dados?.id || !Number.isFinite(Number(dados.em))) return null;
    return {
      id: String(dados.id),
      version: Number(dados.version) || 1,
      em: Number(dados.em),
    };
  } catch {
    return null;
  }
}

function deveMostrar(aviso: Aviso, fechado: Fechamento | null) {
  if (!fechado) return true;
  if (fechado.id !== aviso.id) return true;
  if (Number(fechado.version) !== Number(aviso.version)) return true;

  const horas = Math.max(1, Number(aviso.reexibirHoras) || 12);
  return Date.now() - fechado.em >= horas * 60 * 60 * 1000;
}

export function AppNotice() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [aberto, setAberto] = useState(false);

  const consultar = useCallback(async () => {
    try {
      const resposta = await fetch("/api/broadcast", { cache: "no-store" });
      if (!resposta.ok) return;

      const dados = await resposta.json();
      const encontrado: Aviso | null = dados?.notice || null;

      if (!encontrado) {
        setAviso(null);
        setAberto(false);
        return;
      }

      setAviso(encontrado);
      setAberto(deveMostrar(encontrado, lerFechamento()));
    } catch {
      // Sem rede: mantém o que já está na tela.
    }
  }, []);

  useEffect(() => {
    const inicial = setTimeout(consultar, ATRASO_INICIAL);
    const intervalo = setInterval(consultar, INTERVALO_CONSULTA);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") consultar();
    };

    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);

    return () => {
      clearTimeout(inicial);
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [consultar]);

  function fechar() {
    if (aviso && typeof window !== "undefined") {
      try {
        const registro: Fechamento = {
          id: aviso.id,
          version: aviso.version,
          em: Date.now(),
        };
        window.localStorage.setItem(CHAVE_FECHAMENTO, JSON.stringify(registro));
      } catch {
        // Sem localStorage: o balão some nesta visita e volta ao recarregar.
      }
    }
    setAberto(false);
  }

  const tom = tomDoAviso(aviso?.tone);
  const Icone = ICONES[tom.id] || Info;

  return (
    <AnimatePresence>
      {aberto && aviso && (
        <motion.div
          key={`${aviso.id}-${aviso.version}`}
          initial={{ opacity: 0, y: -26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border bg-[#0b0c15]/95 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl",
              tom.borda,
            )}
          >
            <div className={cn("h-0.5 w-full bg-gradient-to-r", tom.barra)} />

            <div className="flex items-start gap-2.5 p-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
                  tom.chip,
                )}
              >
                <Icone className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[0.5rem] font-black uppercase tracking-widest",
                    tom.icone,
                  )}
                >
                  Lembrete · {tom.nome}
                </p>

                {aviso.title && (
                  <p className="mt-0.5 text-[0.75rem] font-black leading-snug text-white">
                    {aviso.title}
                  </p>
                )}

                <p className="mt-1 whitespace-pre-wrap text-[0.6875rem] leading-relaxed text-white/80">
                  {aviso.body}
                </p>
              </div>

              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar lembrete"
                className="-mr-0.5 -mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
