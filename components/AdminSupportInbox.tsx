"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  ImagePlus,
  Inbox,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  StickyNote,
  X,
} from "lucide-react";
import {
  categoriaSuporte,
  statusDoChamado,
  tempoCurto,
} from "@/lib/supportShared";
import {
  MAX_ANEXOS_SUPORTE,
  comprimirAnexoSuporte,
  formatarTamanhoAnexo,
  type AnexoSuporte,
} from "@/lib/supportImage";
import { cn } from "@/lib/utils";

type ThreadAdmin = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  status: string;
  unread: number;
  lastMessageAt: string;
  preview: string;
  lastSender?: string | null;
  createdAt: string;
};

type MensagemAdmin = {
  id: string;
  sender: "user" | "admin" | "note";
  body: string;
  createdAt: string;
  images: string[];
};

type Filtro = "todos" | "nao_lidos" | "abertos" | "resolvidos";

const RESPOSTAS_RAPIDAS = [
  "Olá! Recebemos seu chamado e já estamos verificando. 🚀",
  "Pode enviar um print da tela para a gente?",
  "Corrigimos! Obrigado por avisar. 💜",
  "Vamos analisar e retornamos em breve.",
];

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "EX";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function AdminSupportInbox({
  getToken,
  onUnreadChange,
}: {
  getToken: () => Promise<string>;
  onUnreadChange?: (total: number) => void;
}) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadAdmin[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [selecionado, setSelecionado] = useState<ThreadAdmin | null>(null);
  const [mensagens, setMensagens] = useState<MensagemAdmin[]>([]);
  const [carregandoConversa, setCarregandoConversa] = useState(false);
  const [resposta, setResposta] = useState("");
  const [anexos, setAnexos] = useState<AnexoSuporte[]>([]);
  const [notaInterna, setNotaInterna] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resolvendo, setResolvendo] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const fimDasMensagens = useRef<HTMLDivElement>(null);

  async function chamarAdmin(corpo: Record<string, unknown>) {
    const token = await getToken();
    if (!token) {
      return {
        ok: false,
        status: 401,
        error: "Sessão administrativa expirada. Entre novamente.",
      } as any;
    }

    const respostaApi = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...corpo, token }),
    });
    const dados = await respostaApi.json().catch(() => ({}));
    return { ok: respostaApi.ok, status: respostaApi.status, ...dados } as any;
  }

  async function carregarLista() {
    try {
      const dados = await chamarAdmin({ action: "list" });
      if (!dados.ok) {
        throw new Error(dados.error || "Não foi possível carregar a IMBOX.");
      }
      setThreads(dados.threads || []);
      onUnreadChange?.(Number(dados.unreadTotal) || 0);
      setErro(null);
    } catch (falha: any) {
      setErro(falha?.message || "Não foi possível carregar a IMBOX.");
    } finally {
      setCarregando(false);
    }
  }

  async function abrirThread(threadId: string) {
    setCarregandoConversa(true);
    setErro(null);

    try {
      const dados = await chamarAdmin({ action: "thread", threadId });
      if (!dados.ok) {
        throw new Error(dados.error || "Não foi possível abrir o chamado.");
      }

      const threadAtual: ThreadAdmin = dados.thread;
      setSelecionado(threadAtual);
      setMensagens(dados.messages || []);
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

  useEffect(() => {
    carregarLista();
    const intervalo = setInterval(() => {
      carregarLista();
    }, 25000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selecionado?.id) return;

    const intervalo = setInterval(async () => {
      try {
        const dados = await chamarAdmin({
          action: "thread",
          threadId: selecionado.id,
        });
        if (dados.ok) {
          setMensagens(dados.messages || []);
          onUnreadChange?.(Number(dados.unreadTotal) || 0);
        }
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, 15000);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionado?.id]);

  useEffect(() => {
    if (fimDasMensagens.current) {
      fimDasMensagens.current.scrollIntoView({ block: "end" });
    }
  }, [mensagens.length, selecionado?.id]);

  async function enviarResposta() {
    if (!selecionado || enviando) return;
    if (!resposta.trim() && anexos.length === 0) return;

    setEnviando(true);
    setErro(null);

    try {
      const dados = await chamarAdmin({
        action: "reply",
        threadId: selecionado.id,
        body: resposta,
        images: anexos.map((anexo) => anexo.dataUrl),
        note: notaInterna,
      });

      if (!dados.ok) {
        throw new Error(dados.error || "Não foi possível enviar a resposta.");
      }

      setResposta("");
      setAnexos([]);
      setNotaInterna(false);
      await abrirThread(selecionado.id);
      await carregarLista();
    } catch (falha: any) {
      setErro(falha?.message || "Não foi possível enviar a resposta.");
    } finally {
      setEnviando(false);
    }
  }

  async function alternarResolvido() {
    if (!selecionado || resolvendo) return;
    setResolvendo(true);
    setErro(null);

    try {
      const resolvido = selecionado.status !== "resolved";
      const dados = await chamarAdmin({
        action: "resolve",
        threadId: selecionado.id,
        resolved: resolvido,
      });

      if (!dados.ok) {
        throw new Error(dados.error || "Não foi possível atualizar o chamado.");
      }

      const novoStatus = dados.status || (resolvido ? "resolved" : "open");
      setSelecionado({ ...selecionado, status: novoStatus });
      setThreads((atuais) =>
        atuais.map((item) =>
          item.id === selecionado.id ? { ...item, status: novoStatus } : item,
        ),
      );
      onUnreadChange?.(Number(dados.unreadTotal) || 0);
    } catch (falha: any) {
      setErro(falha?.message || "Não foi possível atualizar o chamado.");
    } finally {
      setResolvendo(false);
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

  const naoLidos = threads.filter((item) => item.unread > 0).length;
  const abertos = threads.filter((item) => item.status === "open").length;
  const resolvidos = threads.filter((item) => item.status === "resolved").length;
  const totalNaoLidas = threads.reduce((soma, item) => soma + item.unread, 0);

  const listaFiltrada = threads.filter((item) => {
    if (filtro === "nao_lidos") return item.unread > 0;
    if (filtro === "abertos") return item.status === "open";
    if (filtro === "resolvidos") return item.status === "resolved";
    return true;
  });

  if (selecionado) {
    const categoria = categoriaSuporte(selecionado.category);
    const status = statusDoChamado(selecionado.status, selecionado.lastSender);

    return (
      <div className="space-y-3 text-left">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelecionado(null);
              setMensagens([]);
              setErro(null);
              carregarLista();
            }}
            className="flex cursor-pointer items-center gap-1 text-[0.625rem] font-black uppercase tracking-wider text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            IMBOX
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[0.5rem] font-black uppercase tracking-wider",
                categoria.selo,
              )}
            >
              {categoria.emoji} {categoria.nome}
            </span>
            <span className={cn("text-[0.5625rem] font-bold", status.classe)}>
              {status.texto}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-[0.625rem] font-black text-amber-300">
            {iniciais(selecionado.userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.6875rem] font-black text-white">
              {selecionado.userName}
            </p>
            <p className="truncate text-[0.5625rem] text-white/40">
              {selecionado.userEmail || "sem e-mail"} ·{" "}
              {tempoCurto(selecionado.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={alternarResolvido}
            disabled={resolvendo}
            className={cn(
              "shrink-0 cursor-pointer rounded-lg border px-2 py-1.5 text-[0.5rem] font-black uppercase tracking-wider transition-colors disabled:opacity-50",
              selecionado.status === "resolved"
                ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15",
            )}
          >
            {resolvendo
              ? "..."
              : selecionado.status === "resolved"
                ? "Reabrir"
                : "✓ Resolver"}
          </button>
        </div>

        {erro && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[0.625rem] font-semibold text-rose-200">
            {erro}
          </div>
        )}

        <div className="max-h-[36vh] space-y-2 overflow-y-auto rounded-2xl border border-white/[0.05] bg-black/20 p-2.5">
          {carregandoConversa ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
            </div>
          ) : mensagens.length === 0 ? (
            <p className="py-8 text-center text-[0.625rem] text-white/40">
              Nenhuma mensagem ainda.
            </p>
          ) : (
            mensagens.map((mensagem) => {
              const nota = mensagem.sender === "note";
              const doAdmin = mensagem.sender === "admin";
              const doUsuario = mensagem.sender === "user";

              return (
                <div
                  key={mensagem.id}
                  className={cn(
                    "rounded-2xl px-3 py-2",
                    nota
                      ? "border border-amber-500/30 bg-amber-500/[0.07]"
                      : doAdmin
                        ? "ml-auto max-w-[88%] rounded-br-md bg-gradient-to-br from-indigo-600/80 to-violet-700/80 text-white"
                        : "mr-auto max-w-[88%] rounded-bl-md border border-white/[0.07] bg-white/[0.055] text-white/90",
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-[0.5rem] font-black uppercase tracking-widest",
                      nota
                        ? "text-amber-300"
                        : doAdmin
                          ? "text-primary-light"
                          : "text-white/40",
                    )}
                  >
                    {nota
                      ? "🔒 Nota interna (só admin vê)"
                      : doAdmin
                        ? "🛰️ Você (admin)"
                        : selecionado.userName}
                  </p>

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
                            className="h-28 w-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <p
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-[0.5rem]",
                      doAdmin ? "text-white/60" : "text-white/35",
                    )}
                  >
                    {tempoCurto(mensagem.createdAt)}
                    {(doAdmin || doUsuario) && (
                      <CheckCheck className="h-2.5 w-2.5" />
                    )}
                  </p>
                </div>
              );
            })
          )}
          <div ref={fimDasMensagens} />
        </div>

        {anexos.length > 0 && (
          <div className="flex flex-wrap gap-2">
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

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {RESPOSTAS_RAPIDAS.map((rapida) => (
            <button
              key={rapida}
              type="button"
              onClick={() => setResposta(rapida)}
              className="shrink-0 cursor-pointer rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[0.5rem] font-bold text-white/50 transition-colors hover:border-primary/30 hover:text-primary-light"
            >
              {rapida.length > 34 ? `${rapida.slice(0, 32)}...` : rapida}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2">
          <textarea
            value={resposta}
            onChange={(evento) => setResposta(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter" && !evento.shiftKey) {
                evento.preventDefault();
                enviarResposta();
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder={
              notaInterna
                ? "Escreva uma nota visível apenas para administradores..."
                : "Responder para o jogador..."
            }
            className={cn(
              "w-full resize-none rounded-xl border bg-black/20 px-2.5 py-2 text-[0.6875rem] text-white placeholder:text-white/30 focus:outline-none",
              notaInterna
                ? "border-amber-500/35 focus:border-amber-400/60"
                : "border-white/10 focus:border-primary/40",
            )}
          />

          <div className="mt-1.5 flex items-center gap-1.5">
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
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/55 transition-colors hover:text-white"
            >
              <ImagePlus className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setNotaInterna((atual) => !atual)}
              className={cn(
                "flex h-7 cursor-pointer items-center gap-1 rounded-lg border px-2 text-[0.5rem] font-black uppercase tracking-wider transition-colors",
                notaInterna
                  ? "border-amber-500/35 bg-amber-500/10 text-amber-300"
                  : "border-white/10 bg-white/[0.04] text-white/45 hover:text-white/75",
              )}
            >
              {notaInterna ? (
                <StickyNote className="h-3 w-3" />
              ) : (
                <MessageSquare className="h-3 w-3" />
              )}
              Nota interna
            </button>

            <span className="ml-auto hidden text-[0.5rem] text-white/25 sm:block">
              Enter envia
            </span>

            <button
              type="button"
              onClick={enviarResposta}
              disabled={
                enviando || (!resposta.trim() && anexos.length === 0)
              }
              className="flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 px-2.5 text-[0.5rem] font-black uppercase tracking-wider text-[#1a1200] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Enviar
            </button>
          </div>
        </div>

        {lightbox && (
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-6"
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

  return (
    <div className="space-y-3 text-left">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.035] px-2 py-2 text-center">
          <p className="text-[0.5rem] font-black uppercase tracking-widest text-white/40">
            Não lidos
          </p>
          <p className="mt-0.5 font-display text-base font-black text-rose-300">
            {totalNaoLidas}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.035] px-2 py-2 text-center">
          <p className="text-[0.5rem] font-black uppercase tracking-widest text-white/40">
            Em aberto
          </p>
          <p className="mt-0.5 font-display text-base font-black text-amber-300">
            {abertos}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.035] px-2 py-2 text-center">
          <p className="text-[0.5rem] font-black uppercase tracking-widest text-white/40">
            Resolvidos
          </p>
          <p className="mt-0.5 font-display text-base font-black text-emerald-300">
            {resolvidos}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {(
          [
            { id: "todos", nome: "Todos", total: threads.length },
            { id: "nao_lidos", nome: "Não lidos", total: naoLidos },
            { id: "abertos", nome: "Abertos", total: abertos },
            { id: "resolvidos", nome: "Resolvidos", total: resolvidos },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id)}
            className={cn(
              "cursor-pointer rounded-full border px-2 py-1 text-[0.5rem] font-black uppercase tracking-wider transition-colors",
              filtro === item.id
                ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
                : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70",
            )}
          >
            {item.nome}
            {item.total > 0 && (
              <span className="ml-1 text-white/35">{item.total}</span>
            )}
          </button>
        ))}

        <button
          type="button"
          onClick={carregarLista}
          aria-label="Atualizar IMBOX"
          className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:text-white"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {erro && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[0.625rem] font-semibold text-rose-200">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
          <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
          <span className="text-[0.5625rem] font-black uppercase tracking-widest text-amber-300/80">
            Sintonizando IMBOX...
          </span>
        </div>
      ) : listaFiltrada.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
          <Inbox className="h-7 w-7 text-white/20" />
          <p className="text-[0.6875rem] font-black text-white/70">
            Nenhum chamado {filtro !== "todos" ? "neste filtro" : "ainda"}
          </p>
          <p className="max-w-[220px] text-[0.5625rem] leading-relaxed text-white/35">
            Quando um jogador falar com o suporte, o chamado aparece aqui com
            notificação.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {listaFiltrada.map((item) => {
            const cat = categoriaSuporte(item.category);
            const st = statusDoChamado(item.status, item.lastSender);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => abrirThread(item.id)}
                className={cn(
                  "w-full cursor-pointer rounded-2xl border p-2.5 text-left transition-all hover:border-white/15",
                  item.unread > 0
                    ? "border-rose-500/25 bg-gradient-to-r from-rose-500/[0.07] to-white/[0.02]"
                    : "border-white/[0.06] bg-white/[0.032] hover:bg-white/[0.05]",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/10 text-[0.5rem] font-black text-amber-300">
                    {iniciais(item.userName)}
                  </div>
                  <span className="truncate text-[0.625rem] font-black text-white">
                    {item.userName}
                  </span>
                  {item.unread > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-400 px-1 text-[0.5rem] font-black text-[#2b0710]">
                      {item.unread}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[0.5rem] font-semibold text-white/35">
                    {tempoCurto(item.lastMessageAt)}
                  </span>
                </div>

                <p className="mt-1.5 truncate text-[0.625rem] font-semibold text-white/80">
                  {item.preview || "Sem mensagens"}
                </p>

                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0.5 text-[0.4375rem] font-black uppercase tracking-wider",
                      cat.selo,
                    )}
                  >
                    {cat.emoji} {cat.nome}
                  </span>
                  <span className={cn("text-[0.5rem] font-bold", st.classe)}>
                    {st.texto}
                  </span>
                  <ChevronRight className="ml-auto h-3 w-3 text-white/25" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-1 text-[0.5rem] leading-relaxed text-white/25">
        <ShieldAlert className="h-3 w-3 shrink-0" />
        Área exclusiva dos administradores. O jogador não vê notas internas.
      </p>

      {lightbox && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-6"
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
