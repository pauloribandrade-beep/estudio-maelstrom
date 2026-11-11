// PENDÊNCIAS (pedido do Paulo, 08/10/2026): a lista do que ele pediu enquanto assistia, mantida pelo Claude em
// out/<slug>/pendencias.json. Duas abas — "Não ajustadas" e "Ajustadas" (para ele validar) —; o tempo de cada item leva
// a prévia e a timeline até o trecho; o X tira o item da lista (salvo no servidor; "Trazer de volta" desfaz).
import React, { useEffect, useMemo, useState } from "react";
import { Check, ListChecks, RotateCcw, X } from "lucide-react";

export type PendItem = { id: string; a: number; b?: number; text: string; status: "pendente" | "ajustada"; note?: string; ts?: number };
type PendFile = { updated?: number; items: PendItem[] };

const key = (slug: string) => `estudio.pend.removidas.${slug}`;
const loadRemoved = (slug: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(key(slug)) || "[]");
  } catch {
    return [];
  }
};
const saveRemoved = (slug: string, ids: string[]) => {
  try {
    localStorage.setItem(key(slug), JSON.stringify(ids));
  } catch {
    /* sem armazenamento */
  }
};
export const fmtT = (t: number) => {
  const s = Math.max(0, Math.floor(t));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

// lê a lista (o Claude atualiza o arquivo; a página confere a cada 4 s) e as removidas.
// 09/10 (os itens tirados voltavam): o que ele tira da lista fica num ARQUIVO no servidor (out/<slug>/pendencias_vistas.json,
// rota /api/pendvistas) — o localStorage do Estúdio não persistia. O que estava no localStorage é juntado na 1ª carga.
const postVistas = (slug: string, ids: string[]) =>
  fetch(`/api/pendvistas/${slug}`, { method: "POST", body: JSON.stringify({ ids }) }).catch(() => undefined);
export const usePendencias = (slug: string) => {
  const [file, setFile] = useState<PendFile | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const removedRef = React.useRef<string[]>([]);
  const setR = (ids: string[]) => {
    removedRef.current = ids;
    setRemoved(ids);
  };
  useEffect(() => {
    setR([]);
    if (!slug) return;
    let alive = true;
    let last = "";
    // as removidas vêm SÓ do arquivo do servidor (o navegador não manda mais nada; o que tinha lá é apagado)
    saveRemoved(slug, []);
    let busy = 0;
    const loadVistas = () =>
      fetch(`/api/pendvistas/${slug}?v=${Date.now()}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { ids?: string[] } | null) => {
          if (!alive || !j || Date.now() < busy) return;
          const ids = j.ids ?? [];
          if (ids.join("|") !== removedRef.current.join("|")) setR(ids);
        })
        .catch(() => undefined);
    void loadVistas();
    const check = async () => {
      void loadVistas();
      const txt = await fetch(`/api/file?p=${encodeURIComponent(`out/${slug}/pendencias.json`)}&v=${Date.now()}`)
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => "");
      if (!alive || !txt || txt === last) return;
      try {
        const j = JSON.parse(txt) as PendFile;
        if (Array.isArray(j.items)) {
          last = txt;
          setFile(j);
        }
      } catch {
        /* arquivo no meio da gravação: tenta de novo */
      }
    };
    check();
    const id = setInterval(check, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug]);
  const items = useMemo(() => (file?.items ?? []).filter((x) => !removed.includes(x.id)), [file, removed]);
  const remove = (id: string) => {
    const next = [...new Set([...removedRef.current, id])];
    setR(next);
    void postVistas(slug, next);
  };
  const restore = () => {
    setR([]);
    void postVistas(slug, []);
  };
  const nRemoved = (file?.items ?? []).filter((x) => removed.includes(x.id)).length;
  return { items, remove, restore, nRemoved, updated: file?.updated };
};

export const PendButton: React.FC<{ open: boolean; n: number; onClick: () => void }> = ({ open, n, onClick }) => (
  <button className={`icon ghost pendbtn ${open ? "on" : ""}`} onClick={onClick} title="Pendências: o que falta ajustar e o que já foi ajustado (clique no tempo para ir ao trecho)">
    <ListChecks size={16} />
    {n ? <span className="pendcount">{n}</span> : null}
  </button>
);

export const PendDrawer: React.FC<{ pend: ReturnType<typeof usePendencias>; onGo: (it: PendItem) => void; onClose: () => void }> = ({ pend, onGo, onClose }) => {
  const [tab, setTab] = useState<"pendente" | "ajustada">("pendente");
  // o que foi editado por último aparece primeiro (pedido dele, 09/10); empate → ordem no vídeo
  const list = pend.items.filter((x) => x.status === tab).sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0) || a.a - b.a);
  const nP = pend.items.filter((x) => x.status === "pendente").length;
  const nA = pend.items.filter((x) => x.status === "ajustada").length;
  return (
    <div className="capdrawer penddrawer">
      <div className="drawer-head">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ListChecks size={16} /> Pendências
        </span>
        <button className="icon ghost" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="pendtabs">
        <button className={tab === "pendente" ? "on" : ""} onClick={() => setTab("pendente")}>
          Não ajustadas <b>{nP}</b>
        </button>
        <button className={tab === "ajustada" ? "on" : ""} onClick={() => setTab("ajustada")}>
          Ajustadas <b>{nA}</b>
        </button>
      </div>
      <div className="pendlist">
        {!list.length ? <div className="pendnone">{tab === "pendente" ? "Nada pendente." : "Nada ajustado para validar."}</div> : null}
        {list.map((it) => (
          <div key={it.id} className={`pendrow ${it.status}`}>
            <button className="pendt" onClick={() => onGo(it)} title="Ir para este trecho">
              {fmtT(it.a)}
            </button>
            <div className="pendtxt">
              <div>{it.text}</div>
              {it.note ? (
                <div className="pendnote">
                  {it.status === "ajustada" ? <Check size={12} /> : null} {it.note}
                </div>
              ) : null}
            </div>
            <button className="icon ghost pendx" onClick={() => pend.remove(it.id)} title="Tirar da lista (já vi)">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="caprow capmeta">
        {pend.updated ? `atualizada ${new Date(pend.updated).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}
        <div className="spacer" />
        {pend.nRemoved ? (
          <button className="ghost" onClick={pend.restore} title="Mostrar de novo os itens que você tirou da lista">
            <RotateCcw size={13} /> Trazer de volta ({pend.nRemoved})
          </button>
        ) : null}
      </div>
    </div>
  );
};
