"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  ImagePlus,
  LifeBuoy,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import {
  CATEGORIAS_SUPORTE,
  categoriaSuporte,
  statusDoChamado,
  tempoCurto,
  type CategoriaSuporteId,
} from "@/lib/supportShared";
import {
  MAX_ANEXOS_SUPORTE,
  comprimirAnexoSuporte,
  formatarTamanhoAnexo,
  type AnexoSuporte,
} from "@/lib/supportImage";
import { cn } from "@/lib/utils";

type ThreadResumo = {
  id: string;
  category: string;
  status: string;
  unread: number;
  lastMessageAt: string;
  preview: string;
  lastSender?: string | null;
};

type Mensagem = {
  id: string;
  sender: "user" | "admin" | "note";
  body: string;
  createdAt: string;
  images: string[];
};

async function buscarTokenDaSessao(): Promise<string> {
  try {
    const client = await getSupabase();
    const { data } = await client.auth.getSession();
    return data.session?.access_token || "";
  } catch {
    return "";
  }
}

async function chamarSuporte(corpo: Record<string, unknown>) {
  const resposta = await fetch("/api/support", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = await resposta.json().catch(() => ({}));
  return { ok: resposta.ok, status: resposta.status, ...dados };
}

export function SupportChat({
  onClose,
  onUnreadChange,
}: {
  onClose: () => void;
  onUnreadChange?: (total: number) => void;
}) {
  const [token, setToken] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [carregandoConversa, setCarregandoConversa] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadResumo[]>([]);
  const [thread, setThread] = useState<ThreadResumo | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [modo, setModo] = useState<"lista" | "conversa" | "novo">("novo");
  const [categoria, setCategoria] = useState<CategoriaSuporteId>("bug");
  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<AnexoSuporte[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const fimDasMensagens = useRef<HTMLDivElement>(null);

  const categoriaAtual = categoriaSuporte(thread?.category || categoria);
  const status = statusDoChamado(thread?.status || "open", thread?.lastSender);

  useEffect(() => {
    let ativo = true;

    const iniciar = async () => {
      const acesso = await buscarTokenDaSessao();
      if (!ativo) return;
      setToken(acesso);

      if (!acesso) {
        setCarregando(false);
        setModo("novo");
        return;
      }

      try {
        await carregarThreads(acesso);
      } catch (falha: any) {
        if (ativo) setErro(falha?.message || "Não foi possível abrir o suporte.");
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    iniciar();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (modo !== "conversa" || !thread?.id || !token) return;

    const intervalo = setInterval(async () => {
      try {
        const dados = await chamarSuporte({
          action: "thread",
          threadId: thread.id,
          token,
        });
        if (dados.ok) {
          setMensagens(dados.messages || []);
          onUnreadChange?.(Number(dados.unreadTotal) || 0);
        }
      } catch {
        // Silencioso: a próxima tentativa resolve.
      }
    }, 15000);

    return () => clearInterval(intervalo);
  }, [modo, thread?.id, token, onUnreadChange]);

  useEffect(() => {
    if (fimDasMensagens.current) {
      fimDasMensagens.current.scrollIntoView({ block: "end" });
    }
  }, [mensagens.length, modo]);

  async function carregarThreads(acesso: string, abrirId?: string) {
    const dados = await chamarSuporte({ action: "list", token: acesso });
    if (!dados.ok) {
      throw new Error(dados.error || "Não foi possível carregar seus chamados.");
    }

    const lista: ThreadResumo[] = dados.threads || [];
    setThreads(lista);
    onUnreadChange?.(Number(dados.unreadTotal) || 0);

    const idParaAbrir = abrirId || lista[0]?.id;
    if (idParaAbrir) {
      await abrirThread(idParaAbrir, true);
    } else {
      setThread(null);
      setMensagens([]);
      setModo("novo");
    }
  }

  async function abrirThread(threadId: string, silencioso = false) {
    if (!token) return;
    if (!silencioso) setCarregandoConversa(true);
    setErro(null);

    try {
      const dados = await chamarSuporte({
        action: "thread",
        threadId,
        token,
      });

      if (!dados.ok) {
        if (dados.status === 401) {
          setToken("");
          setErro("Sua sessão expirou. Entre novamente para usar o suporte.");
          return;
        }
        throw new Error(dados.error || "Não foi possível abrir o chamado.");
      }

      setThread(dados.thread);
      setMensagens(dados.messages || []);
      setModo("conversa");
      setThreads((atuais) =>
        atuais.map((item) =>
          item.id === threadId ? { ...item, unread: 0 } : item,
        ),
      );
      onUnreadChange?.(Number(dados.unreadTotal) || 0);
    } catch (falha: any) {
      setErro(falha?.message || "Não foi possível abrir o chamado.");
    } finally {
      setCarregandoConversa(false);
    }
  }

  async function enviar() {
    if (enviando) return;
    if (!token) {
      setErro("Entre na sua conta para falar com o suporte.");
      return;
    }
    if (!texto.trim() && anexos.length === 0) return;

    setEnviando(true);
    setErro(null);

    try {
      const imagens = anexos.map((anexo) => anexo.dataUrl);
      const dados =
        modo === "conversa" && thread
          ? await chamarSuporte({
              action: "send",
              threadId: thread.id,
              body: texto,
              images: imagens,
              token,
            })
          : await chamarSuporte({
              action: "create",
              category: categoria,
              body: texto,
              images: imagens,
              token,
            });

      if (!dados.ok) {
        if (dados.status === 401) {
          setToken("");
          setErro("Sua sessão expirou. Entre novamente para usar o suporte.");
          return;
        }
        throw new Error(dados.error || "Não foi possível enviar a mensagem.");
      }

      const threadId =
        modo === "conversa" && thread ? thread.id : dados.threadId;
      setTexto("");
      setAnexos([]);
      await carregarThreads(token, threadId);
    } catch (falha: any) {
      setErro(falha?.message || "Não foi possível enviar a mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  async function escolherImagens(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files || []);
    evento.target.value = "";
    if (arquivos.length === 0) return;

    setErro(null);
    const espaco = MAX_ANEXOS_SUPORTE - anexos.length;
    if (espaco <= 0) {
      setErro(`Você já anexou ${MAX_ANEXOS_SUPORTE} imagens.`);
      return;
    }

    const novos: AnexoSuporte[] = [];
    for (const arquivo of arquivos.slice(0, espaco)) {
      try {
        novos.push(await comprimirAnexoSuporte(arquivo));
      } catch (falha: any) {
        setErro(falha?.message || "Não foi possível usar essa imagem.");
      }
    }

    if (novos.length > 0) {
      setAnexos((atuais) => [...atuais, ...novos].slice(0, MAX_ANEXOS_SUPORTE));
    }
  }

  const podeEnviar = Boolean(texto.trim() || anexos.length > 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#04030a]/88 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suporte-titulo"
        className="relative z-10 flex h-[88dvh] max-h-[780px] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#111324] to-[#080912] shadow-[0_24px_70px_rgba(0,0,0,0.65),0_0_50px_rgba(99,102,241,0.08)]"
      >
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#3e63dd] via-primary to-secondary" />

        <header className="flex shrink-0 items-start gap-3 border-b border-white/[0.07] px-5 pb-3 pt-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 text-primary-light">
            <LifeBuoy className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111324] bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="suporte-titulo"
              className="flex items-center gap-1.5 font-display text-sm font-black text-white"
            >
              Suporte Cósmico
              <ShieldCheck className="h-3.5 w-3.5 text-primary-light" />
            </h2>
            <p className="mt-0.5 text-[0.625rem] text-on-surface-variant">
              Equipe oficial · costuma responder em até 24h
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar suporte"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {!carregando && token && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.05] px-4 py-2">
            {modo === "conversa" ? (
              <>
                <button
                  type="button"
                  onClick={() => setModo(threads.length > 0 ? "lista" : "novo")}
                  className="flex cursor-pointer items-center gap-1 text-[0.625rem] font-black uppercase tracking-wider text-on-surface-variant transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Meus chamados
                </button>

                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[0.5rem] font-black uppercase tracking-wider",
                      categoriaAtual.selo,
                    )}
                  >
                    {categoriaAtual.emoji} {categoriaAtual.nome}
                  </span>
                  <span
                    className={cn(
                      "text-[0.5625rem] font-bold",
                      status.classe,
                    )}
                  >
                    {status.texto}
                  </span>
                </div>
              </>
            ) : (
              <>
                <span className="text-[0.625rem] font-black uppercase tracking-wider text-on-surface-variant">
                  {modo === "lista" ? "Seus chamados" : "Novo chamado"}
                </span>
                {modo === "novo" && threads.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setModo("lista")}
                    className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.5625rem] font-black uppercase tracking-wider text-white/60 transition-colors hover:text-white"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Meus chamados
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setModo("novo");
                      setThread(null);
                      setMensagens([]);
                      setErro(null);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[0.5625rem] font-black uppercase tracking-wider text-primary-light transition-colors hover:bg-primary/15"
                  >
                    <Plus className="h-3 w-3" />
                    Abrir novo
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {erro && (
          <div className="mx-4 mt-3 shrink-0 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[0.625rem] font-semibold leading-relaxed text-rose-200">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary-light" />
            <p className="text-[0.625rem] font-black uppercase tracking-widest text-on-surface-variant">
              Sintonizando suporte...
            </p>
          </div>
        ) : !token ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60">
              <Lock className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-white">Entre para falar com o suporte</p>
            <p className="text-[0.6875rem] leading-relaxed text-on-surface-variant">
              O chat fica vinculado à sua conta para você acompanhar as respostas
              da equipe.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-display text-[0.625rem] font-black uppercase tracking-widest text-[#0b0b14]"
            >
              Fechar
            </button>
          </div>
        ) : modo === "lista" ? (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {threads.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <MessageCircle className="h-8 w-8 text-white/25" />
                <p className="text-xs font-black text-white/80">
                  Nenhum chamado ainda
                </p>
                <p className="max-w-[240px] text-[0.6875rem] leading-relaxed text-on-surface-variant">
                  Escolha uma categoria e conte para a equipe o que aconteceu.
                </p>
                <button
                  type="button"
                  onClick={() => setModo("novo")}
                  className="mt-1 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2 text-[0.625rem] font-black uppercase tracking-widest text-primary-light"
                >
                  Abrir chamado
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {threads.map((item) => {
                  const cat = categoriaSuporte(item.category);
                  const st = statusDoChamado(item.status, item.lastSender);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => abrirThread(item.id)}
                      className="w-full cursor-pointer rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3 text-left transition-colors hover:border-white/10 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[0.5rem] font-black uppercase tracking-wider",
                            cat.selo,
                          )}
                        >
                          {cat.emoji} {cat.nome}
                        </span>
                        <span className={cn("text-[0.5rem] font-bold", st.classe)}>
                          {st.texto}
                        </span>
                        <span className="ml-auto text-[0.5625rem] font-semibold text-white/35">
                          {tempoCurto(item.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[0.6875rem] font-semibold text-white/80">
                          {item.preview || "Sem mensagens"}
                        </p>
                        {item.unread > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-400 px-1 text-[0.5rem] font-black text-[#2b0710]">
                            {item.unread}
                          </span>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-white/25" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex-1 overflow-y-auto px-4 pt-3",
                modo === "novo" ? "pb-2" : "pb-3",
              )}
            >
              {modo === "novo" ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[0.5625rem] font-black uppercase tracking-widest text-on-surface-variant">
                      Sobre o que você quer falar?
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CATEGORIAS_SUPORTE.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCategoria(item.id)}
                          className={cn(
                            "cursor-pointer rounded-full border px-2.5 py-1.5 text-[0.5625rem] font-black uppercase tracking-wider transition-all",
                            categoria === item.id
                              ? item.chip
                              : "border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white/70",
                          )}
                        >
                          {item.emoji} {item.nome}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[0.625rem] leading-relaxed text-on-surface-variant">
                      {categoriaAtual.descricao}. Você pode anexar até 3 prints.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[0.625rem] font-black text-white/80">
                      Como funciona
                    </p>
                    <ul className="mt-1.5 space-y-1 text-[0.625rem] leading-relaxed text-on-surface-variant">
                      <li>• Sua mensagem vai direto para os administradores.</li>
                      <li>• Você acompanha a resposta por aqui mesmo.</li>
                      <li>• Prints ajudam a resolver bugs mais rápido.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {mensagens.length === 0 && (
                    <p className="py-8 text-center text-[0.6875rem] text-on-surface-variant">
                      Nenhuma mensagem neste chamado.
                    </p>
                  )}

                  {mensagens.map((mensagem) => {
                    const doUsuario = mensagem.sender === "user";
                    return (
                      <div
                        key={mensagem.id}
                        className={cn(
                          "max-w-[86%] rounded-2xl px-3 py-2",
                          doUsuario
                            ? "ml-auto rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-700 text-white"
                            : "mr-auto rounded-bl-md border border-white/[0.07] bg-white/[0.055] text-white/90",
                        )}
                      >
                        {!doUsuario && (
                          <p className="mb-1 text-[0.5rem] font-black uppercase tracking-widest text-amber-300">
                            🛰️ Suporte Prime
                          </p>
                        )}
                        {mensagem.body && (
                          <p className="whitespace-pre-wrap text-[0.6875rem] leading-relaxed">
                            {mensagem.body}
                          </p>
                        )}

                        {mensagem.images.length > 0 && (
                          <div
                            className={cn(
                              "mt-2 grid gap-1.5",
                              mensagem.images.length > 1
                                ? "grid-cols-2"
                                : "grid-cols-1",
                            )}
                          >
                            {mensagem.images.map((url, indice) => (
                              <button
                                key={`${mensagem.id}-${indice}`}
                                type="button"
                                onClick={() => setLightbox(url)}
                                className="cursor-zoom-in overflow-hidden rounded-xl border border-white/15"
                              >
                                <img
                                  src={url}
                                  alt={`Anexo ${indice + 1} do chamado`}
                                  className="h-32 w-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        <p
                          className={cn(
                            "mt-1 flex items-center justify-end gap-1 text-[0.5rem]",
                            doUsuario ? "text-white/60" : "text-white/35",
                          )}
                        >
                          {tempoCurto(mensagem.createdAt)}
                          {doUsuario && <CheckCheck className="h-2.5 w-2.5" />}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={fimDasMensagens} />
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-white/[0.07] bg-[#0a0b14]/80 px-4 pb-4 pt-3">
              {anexos.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {anexos.map((anexo, indice) => (
                    <div
                      key={`${anexo.nome}-${indice}`}
                      className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary/10"
                    >
                      <img
                        src={anexo.dataUrl}
                        alt={anexo.nome}
                        className="h-14 w-16 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAnexos((atuais) =>
                            atuais.filter((_, posicao) => posicao !== indice),
                          )
                        }
                        aria-label={`Remover ${anexo.nome}`}
                        className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white/80"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                      <span className="block max-w-16 truncate px-1 py-0.5 text-[0.4375rem] font-semibold text-primary-light">
                        {formatarTamanhoAnexo(anexo.tamanho)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <input
                  ref={inputArquivo}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={escolherImagens}
                />
                <button
                  type="button"
                  onClick={() => inputArquivo.current?.click()}
                  aria-label="Anexar imagem"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:border-primary/30 hover:text-primary-light"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>

                <textarea
                  value={texto}
                  onChange={(evento) => setTexto(evento.target.value)}
                  onKeyDown={(evento) => {
                    if (evento.key === "Enter" && !evento.shiftKey) {
                      evento.preventDefault();
                      enviar();
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder={
                    modo === "novo"
                      ? "Descreva o que aconteceu..."
                      : "Escreva sua mensagem..."
                  }
                  className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[0.6875rem] text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={enviar}
                  disabled={!podeEnviar || enviando}
                  aria-label="Enviar mensagem"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-[#0b0b14] transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {enviando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-center text-[0.5rem] font-semibold text-white/25">
                Enter envia · Shift + Enter quebra a linha · máximo 3 imagens
              </p>
            </div>
          </>
        )}
      </motion.div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Fechar imagem"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={lightbox}
            alt="Anexo ampliado"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
