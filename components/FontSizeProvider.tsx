"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Limites do ajuste de fonte do aplicativo, em px. */
export const FONTE_MIN = 10;
export const FONTE_MAX = 30;
export const FONTE_PADRAO = 16;

/** Chave usada no localStorage e evento para sincronizar abas/componentes. */
export const CHAVE_FONTE = "cosmos_font_size";
export const EVENTO_FONTE = "cosmos:fonte";

/** Mantém o valor sempre inteiro e dentro da faixa permitida. */
export function normalizarFonte(valor: number): number {
  if (!Number.isFinite(valor)) return FONTE_PADRAO;
  const inteiro = Math.round(valor);
  return Math.min(FONTE_MAX, Math.max(FONTE_MIN, inteiro));
}

/** Lê a preferência salva sem quebrar em navegadores com storage bloqueado. */
export function lerFonteSalva(): number {
  if (typeof window === "undefined") return FONTE_PADRAO;
  try {
    const bruto = window.localStorage.getItem(CHAVE_FONTE);
    if (bruto === null) return FONTE_PADRAO;
    return normalizarFonte(parseFloat(bruto));
  } catch {
    return FONTE_PADRAO;
  }
}

/** Aplica o tamanho na raiz: todo o texto do app usa rem e acompanha. */
export function aplicarFonteNoDocumento(px: number): number {
  const valor = normalizarFonte(px);
  if (typeof document !== "undefined") {
    document.documentElement.style.fontSize = `${valor}px`;
    document.documentElement.dataset.fonte = String(valor);
  }
  return valor;
}

interface FonteContexto {
  tamanho: number;
  definirTamanho: (px: number) => void;
  restaurarPadrao: () => void;
}

const ContextoFonte = createContext<FonteContexto | null>(null);

export function FontSizeProvider({ children }: { children: ReactNode }) {
  // Começa no padrão para o servidor e o cliente combinarem na hidratação;
  // o script inline do layout já aplicou o valor salvo antes do primeiro paint.
  const [tamanho, setTamanho] = useState(FONTE_PADRAO);

  useEffect(() => {
    const salvo = lerFonteSalva();
    setTamanho(aplicarFonteNoDocumento(salvo));

    const aoMudarArmazenamento = (evento: StorageEvent) => {
      if (evento.key !== CHAVE_FONTE) return;
      setTamanho(aplicarFonteNoDocumento(lerFonteSalva()));
    };

    const aoMudarFonte = (evento: Event) => {
      const detalhe = (evento as CustomEvent<number>).detail;
      setTamanho(aplicarFonteNoDocumento(detalhe));
    };

    window.addEventListener("storage", aoMudarArmazenamento);
    window.addEventListener(EVENTO_FONTE, aoMudarFonte);
    return () => {
      window.removeEventListener("storage", aoMudarArmazenamento);
      window.removeEventListener(EVENTO_FONTE, aoMudarFonte);
    };
  }, []);

  const definirTamanho = useCallback((px: number) => {
    const valor = aplicarFonteNoDocumento(px);
    setTamanho(valor);
    try {
      window.localStorage.setItem(CHAVE_FONTE, String(valor));
    } catch {
      // Sem storage (modo privado/limites): o ajuste vale só nesta sessão.
    }
    window.dispatchEvent(new CustomEvent<number>(EVENTO_FONTE, { detail: valor }));
  }, []);

  const restaurarPadrao = useCallback(() => {
    definirTamanho(FONTE_PADRAO);
  }, [definirTamanho]);

  const valor = useMemo(
    () => ({ tamanho, definirTamanho, restaurarPadrao }),
    [tamanho, definirTamanho, restaurarPadrao]
  );

  return <ContextoFonte.Provider value={valor}>{children}</ContextoFonte.Provider>;
}

export function useFontSize(): FonteContexto {
  const contexto = useContext(ContextoFonte);
  if (!contexto) {
    throw new Error("useFontSize precisa estar dentro de FontSizeProvider.");
  }
  return contexto;
}
