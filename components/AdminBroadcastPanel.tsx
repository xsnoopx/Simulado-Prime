"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Megaphone,
  Pencil,
  Power,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  HORAS_REEXIBICAO,
  MAX_TEXTO_AVISO,
  MAX_TITULO_AVISO,
  TONS_AVISO,
  formatarDataCurta,
  rotuloHoras,
  tomDoAviso,
  type TomAvisoId,
} from "@/lib/broadcastShared";
import { cn } from "@/lib/utils";

type AvisoAdmin = {
  id: string;
  title: string;
  body: string;
  tone: string;
  active: boolean;
  reexibirHoras: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export function AdminBroadcastPanel({
  getToken,
}: {
  getToken: () => Promise<string>;
}) {
  const [carregando, setCarregando] = useState(true);
  const [avisos, setAvisos] = useState<AvisoAdmin[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [acaoId, setAcaoId] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [tom, setTom] = useState<TomAvisoId>("info");
  const [horas, setHoras] = useState<number>(12);

  const tomAtual = tomDoAviso(tom);
  const ativo = avisos.find((item) => item.active) || null;
  const historico = avisos.filter((item) => !item.active);

  async function chamarAdmin(corpo: Record<string, unknown>) {
    const token = await getToken();
    if (!token) {
      return {
        ok: false,
        error: "Sessão administrativa expirada. Entre novamente.",
      } as any;
    }

    const resposta = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...corpo, token }),
    });
    const dados = await resposta.json().catch(() => ({}));
    return { ok: resposta.ok, status: resposta.status, ...dados } as any;
  }

  async function carregar() {
    try {
      const dados = await chamarAdmin({ action: "list" });
      if (!dados.ok) throw new Error(dados.error || "Não foi possível carregar os avisos.");
      setAvisos(dados.avisos || []);
      setErro(null);
    } catch (falha: any) {
      setErro(falha?.message || "Não foi possível carregar os avisos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparFormulario() {
    setEditandoId(null);
    setTitulo("");
    setTexto("");
    setTom("info");
    setHoras(12);
  }

  function editar(item: AvisoAdmin) {
    setEditandoId(item.id);
    setTitulo(item.title);
    setTexto(item.body);
    setTom(item.tone as TomAvisoId);
    setHoras(item.reexibirHoras);
    setErro(null);
    setSucesso(null);
  }

  async function publicar() {
    if (salvando) return;
    if (texto.trim().length < 3) {
      setErro("Escreva o texto do lembrete.");
      return;
    }

    setSalvando(true);
    setErro(null);
    setSucesso(null);

    try {
      const dados = await chamarAdmin({
        action: editandoId ? "update" : "publish",
        id: editandoId || undefined,
        title: titulo.trim(),
        body: texto.trim(),
        tone: tom,
        horas,
      });

      if (!dados.ok) throw new Error(dados.error || "Não foi possível salvar o aviso.");

      setSucesso(
        editandoId
          ? "Aviso atualizado. Todos voltam a ver o lembrete agora."
          : "Aviso publicado. Ele já está aparecendo para os jogadores.",
      );
      limparFormulario();
      await carregar();
    } catch (falha: any) {
      setErro(falha?.message || "Não foi possível salvar o aviso.");
    } finally {
      setSalvando(false);
    }
  }

  async function executarAcao(id: string, action: "deactivate" | "republish" | "delete") {
    if (acaoId) return;

    if (action === "delete" && typeof window !== "undefined") {
      const confirmado = window.confirm(
        "Excluir este aviso do histórico? Ele some da lista e não pode ser reenviado.",
      );
      if (!confirmado) return;
    }

    setAcaoId(id);
    setErro(null);
    setSucesso(null);

    try {
      const dados = await chamarAdmin({ action, id });
      if (!dados.ok) throw new Error(dados.error || "Não foi possível concluir a ação.");

      setSucesso(
        action === "deactivate"
          ? "Aviso desativado. O balão para de aparecer."
          : action === "republish"
            ? "Aviso reenviado: todo mundo vê de novo, mesmo quem já fechou."
            : "Aviso excluído.",
      );
      if (editandoId === id) limparFormulario();
      await carregar();
    } catch (falha: any) {
      setErro(falha?.message || "Não foi possível concluir a ação.");
    } finally {
      setAcaoId(null);
    }
  }

  const previaValida = texto.trim().length > 0;

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
          <Megaphone className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-black text-white">Avisos do aplicativo</p>
          <p className="mt-0.5 text-[0.5625rem] leading-relaxed text-white/45">
            O lembrete fica fixo no topo para todos. Ao fechar, o jogador só vê de
            novo depois do tempo escolhido — ou na hora, se você editar e publicar.
          </p>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[0.625rem] font-semibold text-rose-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="flex items-start gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[0.625rem] font-semibold text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {previaValida && (
        <div>
          <p className="mb-1 text-[0.5rem] font-black uppercase tracking-widest text-white/35">
            Prévia — é assim que o jogador vê
          </p>
          <div className={cn("overflow-hidden rounded-2xl border bg-[#0b0c15]", tomAtual.borda)}>
            <div className={cn("h-0.5 w-full bg-gradient-to-r", tomAtual.barra)} />
            <div className="flex items-start gap-2.5 p-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[0.75rem]",
                  tomAtual.chip,
                )}
              >
                {tomAtual.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-[0.5rem] font-black uppercase tracking-widest", tomAtual.icone)}>
                  Lembrete · {tomAtual.nome}
                </p>
                {titulo.trim() && (
                  <p className="mt-0.5 text-[0.75rem] font-black leading-snug text-white">
                    {titulo.trim()}
                  </p>
                )}
                <p className="mt-1 whitespace-pre-wrap text-[0.6875rem] leading-relaxed text-white/80">
                  {texto.trim()}
                </p>
              </div>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/40">
                <X className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
        <div>
          <label className="text-[0.5rem] font-black uppercase tracking-widest text-white/40">
            Título (opcional)
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            maxLength={MAX_TITULO_AVISO}
            placeholder="Ex.: Simulado da semana liberado"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/25 px-2.5 py-2 text-[0.6875rem] text-white placeholder:text-white/25 focus:border-amber-400/50 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-[0.5rem] font-black uppercase tracking-widest text-white/40">
              Mensagem
            </label>
            <span className="text-[0.5rem] font-semibold text-white/25">
              {texto.length}/{MAX_TEXTO_AVISO}
            </span>
          </div>
          <textarea
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            rows={3}
            maxLength={MAX_TEXTO_AVISO}
            placeholder="Ex.: Novo simulado de Humanas já está disponível. Bons estudos!"
            className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/25 px-2.5 py-2 text-[0.6875rem] leading-relaxed text-white placeholder:text-white/25 focus:border-amber-400/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[0.5rem] font-black uppercase tracking-widest text-white/40">
            Tipo
          </label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {TONS_AVISO.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTom(item.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-2 py-1 text-[0.5rem] font-black uppercase tracking-wider transition-all",
                  tom === item.id
                    ? item.chip
                    : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70",
                )}
              >
                {item.emoji} {item.nome}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[0.5rem] font-black uppercase tracking-widest text-white/40">
            Voltar a aparecer depois de
          </label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {HORAS_REEXIBICAO.map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setHoras(opcao)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-[0.5rem] font-black uppercase tracking-wider transition-all",
                  horas === opcao
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
                    : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70",
                )}
              >
                {rotuloHoras(opcao)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={publicar}
            disabled={salvando || texto.trim().length < 3}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 py-2 text-[0.5625rem] font-black uppercase tracking-wider text-[#1a1200] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {salvando ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : editandoId ? (
              <Pencil className="h-3 w-3" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            {editandoId ? "Salvar e republicar" : "Publicar aviso"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.5625rem] font-black uppercase tracking-wider text-white/50 transition-colors hover:text-white"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
          <span className="text-[0.5rem] font-black uppercase tracking-widest text-amber-300/80">
            Carregando avisos...
          </span>
        </div>
      ) : (
        <>
          <div>
            <p className="mb-1.5 text-[0.5rem] font-black uppercase tracking-widest text-white/35">
              Aviso ativo
            </p>

            {ativo ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-400 px-1 text-[0.4375rem] font-black text-[#04231a]">
                    ON
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0.5 text-[0.4375rem] font-black uppercase tracking-wider",
                      tomDoAviso(ativo.tone).chip,
                    )}
                  >
                    {tomDoAviso(ativo.tone).emoji} {tomDoAviso(ativo.tone).nome}
                  </span>
                  <span className="ml-auto text-[0.5rem] font-semibold text-white/35">
                    {formatarDataCurta(ativo.updatedAt)}
                  </span>
                </div>

                {ativo.title && (
                  <p className="mt-1.5 text-[0.625rem] font-black text-white">{ativo.title}</p>
                )}
                <p className="mt-1 line-clamp-3 text-[0.5625rem] leading-relaxed text-white/65">
                  {ativo.body}
                </p>
                <p className="mt-1 text-[0.5rem] font-semibold text-emerald-300/80">
                  Volta a aparecer {rotuloHoras(ativo.reexibirHoras).toLowerCase()} depois de
                  fechado · v{ativo.version}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => editar(ativo)}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.5rem] font-black uppercase tracking-wider text-white/60 transition-colors hover:text-white"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => executarAcao(ativo.id, "republish")}
                    disabled={acaoId === ativo.id}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-sky-400/25 bg-sky-500/10 px-2 py-1 text-[0.5rem] font-black uppercase tracking-wider text-sky-200 transition-colors hover:bg-sky-500/15 disabled:opacity-50"
                  >
                    {acaoId === ativo.id ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-2.5 w-2.5" />
                    )}
                    Reenviar a todos
                  </button>
                  <button
                    type="button"
                    onClick={() => executarAcao(ativo.id, "deactivate")}
                    disabled={acaoId === ativo.id}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.5rem] font-black uppercase tracking-wider text-white/55 transition-colors hover:text-white disabled:opacity-50"
                  >
                    <Power className="h-2.5 w-2.5" />
                    Desativar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-5 text-center">
                <Megaphone className="h-5 w-5 text-white/20" />
                <p className="text-[0.5625rem] font-black text-white/60">
                  Nenhum aviso aparecendo agora
                </p>
                <p className="text-[0.5rem] text-white/30">
                  Publique um lembrete acima para exibir a todos.
                </p>
              </div>
            )}
          </div>

          {historico.length > 0 && (
            <div>
              <p className="mb-1.5 text-[0.5rem] font-black uppercase tracking-widest text-white/35">
                Histórico
              </p>
              <div className="space-y-1.5">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.5rem]">
                        {tomDoAviso(item.tone).emoji}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[0.5625rem] font-bold text-white/70">
                        {item.title || item.body}
                      </span>
                      <span className="shrink-0 text-[0.4375rem] font-semibold text-white/25">
                        {formatarDataCurta(item.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => executarAcao(item.id, "republish")}
                        disabled={acaoId === item.id}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-sky-400/20 bg-sky-500/[0.08] px-1.5 py-0.5 text-[0.4375rem] font-black uppercase tracking-wider text-sky-200/90 transition-colors hover:bg-sky-500/15 disabled:opacity-40"
                      >
                        <RefreshCw className="h-2 w-2" />
                        Reenviar
                      </button>
                      <button
                        type="button"
                        onClick={() => editar(item)}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[0.4375rem] font-black uppercase tracking-wider text-white/45 transition-colors hover:text-white/80"
                      >
                        <Pencil className="h-2 w-2" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => executarAcao(item.id, "delete")}
                        disabled={acaoId === item.id}
                        className="ml-auto flex cursor-pointer items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/[0.07] px-1.5 py-0.5 text-[0.4375rem] font-black uppercase tracking-wider text-rose-300/80 transition-colors hover:bg-rose-500/15 disabled:opacity-40"
                      >
                        <Trash2 className="h-2 w-2" />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="flex items-start gap-1 text-[0.5rem] leading-relaxed text-white/25">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
        O horário do fechamento fica no navegador de cada jogador. Limpar os dados do
        site faz o lembrete voltar a aparecer.
      </p>
    </div>
  );
}
