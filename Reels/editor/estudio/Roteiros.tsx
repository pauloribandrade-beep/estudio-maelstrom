import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, FileText, FolderOpen, Search } from "lucide-react";
import { copyText } from "./util";
import { PilarTag } from "./perfil";

// ABA ROTEIROS (pedido do Paulo, 2026-09-28): os roteiros que saem do chat (Reels/roteiros/*.md) ficam aqui, com o
// status de cada um: pendente (sem vídeo), em edição (projeto sem render), pronto (renderizado) e postado (à mão).
type Rot = { slug: string; title: string; date: string; formato: string; tacoh: string; urgency: string; duracao: string; status: string; auto: string; project: boolean; scheduled: string | null; mtime: number };
const ST: Record<string, string> = { pendente: "Pendente", edicao: "Em edição", pronto: "Pronto", postado: "Postado" };
const URG: Record<string, string> = { hoje: "Hoje", "48h": "48h", semana: "Semana" };
const FILTERS = ["todos", "pendente", "edicao", "pronto", "postado"] as const;
const URG_ORDER: Record<string, number> = { hoje: 0, "48h": 1, semana: 2, atemporal: 3 };
const ST_ORDER: Record<string, number> = { pendente: 0, edicao: 1, pronto: 2, postado: 3 };

// markdown simples -> HTML (títulos, listas, tabelas, negrito, itálico, código, links, citação)
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
const mdToHtml = (md: string) => {
  const L = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < L.length) {
    const l = L[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(l);
    if (h) {
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      i++;
      continue;
    }
    if (/^\s*\|/.test(l)) {
      const rows: string[][] = [];
      while (i < L.length && /^\s*\|/.test(L[i])) {
        if (!/^\s*\|[\s:|-]+\|\s*$/.test(L[i])) rows.push(L[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      const [head, ...body] = rows;
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items: string[] = [];
      while (i < L.length && /^\s*([-*]|\d+\.)\s+/.test(L[i])) {
        items.push(`<li>${inline(L[i].replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>`);
        i++;
      }
      out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^>\s?/.test(l)) {
      const q: string[] = [];
      while (i < L.length && /^>\s?/.test(L[i])) q.push(inline(L[i++].replace(/^>\s?/, "")));
      out.push(`<blockquote>${q.join("<br/>")}</blockquote>`);
      continue;
    }
    const p: string[] = [];
    while (i < L.length && L[i].trim() && !/^(#{1,4}\s|\s*\||\s*([-*]|\d+\.)\s|>)/.test(L[i])) p.push(inline(L[i++]));
    out.push(`<p>${p.join("<br/>")}</p>`);
  }
  return out.join("\n");
};

const fmtDate = (k: string) => {
  const [y, m, d] = k.split("-");
  return `${d}/${m}/${y}`;
};

export const Roteiros: React.FC<{ onOpen: (slug: string) => void; toast: (m: string) => void }> = ({ onOpen, toast }) => {
  const [list, setList] = useState<Rot[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todos");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [md, setMd] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const load = () =>
    fetch("/api/roteiros")
      .then((r) => r.json())
      .then((l: Rot[]) => setList(l));
  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // roteiro novo que saiu do chat aparece sozinho
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!sel) return;
    fetch(`/api/roteiros/${sel}`)
      .then((r) => r.json())
      .then((j) => setMd(j.md ?? ""));
  }, [sel]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: list?.length ?? 0 };
    for (const r of list ?? []) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [list]);
  const shown = useMemo(
    () =>
      (list ?? [])
        .filter((r) => filter === "todos" || r.status === filter)
        .filter((r) => !q || (r.title + " " + r.slug).toLowerCase().includes(q.toLowerCase()))
        // pendentes primeiro, dentro deles os mais urgentes; depois os mais novos
        .sort((a, b) => ST_ORDER[a.status] - ST_ORDER[b.status] || (URG_ORDER[a.urgency] ?? 3) - (URG_ORDER[b.urgency] ?? 3) || b.slug.localeCompare(a.slug)),
    [list, filter, q],
  );
  useEffect(() => {
    if (!sel && shown.length) setSel(shown[0].slug);
  }, [shown, sel]);

  const setStatus = async (slug: string, status: string) => {
    const r = list?.find((x) => x.slug === slug);
    const value = r && status === r.auto ? null : status; // igual ao automático = volta a ser automático
    setList((l) => l?.map((x) => (x.slug === slug ? { ...x, status } : x)) ?? l);
    await fetch(`/api/roteiros/${slug}`, { method: "PUT", body: JSON.stringify({ status: value }) });
    toast(`"${r?.title ?? slug}" marcado como ${ST[status].toLowerCase()}`);
  };
  const cur = list?.find((r) => r.slug === sel);
  const html = useMemo(() => mdToHtml(md), [md]);

  return (
    <div className="rot">
      <aside className="rot-side">
        <div className="rot-filters">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "todos" ? "Todos" : ST[f]} <span>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="rot-search">
          <Search size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar roteiro" />
        </label>
        {!list ? <div className="status">carregando...</div> : null}
        {list && !shown.length ? <div className="status" style={{ padding: 12 }}>Nenhum roteiro aqui.</div> : null}
        {shown.map((r) => (
          <div key={r.slug} className={`rot-item ${sel === r.slug ? "on" : ""}`} onClick={() => setSel(r.slug)}>
            <div className="rot-t">{r.title}</div>
            <div className="rot-m">
              <span className={`stpill s-${r.status}`}>{ST[r.status]}</span>
              {r.tacoh ? <PilarTag id={r.tacoh} /> : null}
              {URG[r.urgency] && r.status === "pendente" ? <span className={`urgtag u-${r.urgency}`}>{URG[r.urgency]}</span> : null}
              <span>{fmtDate(r.date)}</span>
            </div>
          </div>
        ))}
      </aside>
      <section className="rot-main">
        {cur ? (
          <>
            <div className="rot-bar">
              <FileText size={16} />
              <b className="rot-title">{cur.title}</b>
              <div className="spacer" />
              <div className="seg">
                {(["pendente", "edicao", "pronto", "postado"] as const).map((s) => (
                  <button key={s} className={cur.status === s ? "on" : ""} onClick={() => setStatus(cur.slug, s)} title={s === cur.auto ? "Status automático" : "Marcar à mão"}>
                    {ST[s]}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  if (await copyText(md)) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  }
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copiado" : "Copiar"}
              </button>
              {cur.project ? (
                <button className="primary" onClick={() => onOpen(cur.slug)}>
                  <FolderOpen size={14} /> Abrir vídeo
                </button>
              ) : null}
            </div>
            <div className="rot-meta">
              {cur.formato ? <span>{cur.formato}</span> : null}
              {cur.duracao ? <span>{cur.duracao}</span> : null}
              {cur.scheduled ? <span>Agendado: {fmtDate(cur.scheduled.slice(0, 10))} às {cur.scheduled.slice(11, 16)}</span> : null}
              {cur.status === "pendente" ? <span className="hint" style={{ margin: 0 }}>Grave e mande o vídeo para o Claude: "edita esse vídeo do roteiro {cur.title}".</span> : null}
            </div>
            <article className="rot-doc" dangerouslySetInnerHTML={{ __html: html }} />
          </>
        ) : (
          <div className="status" style={{ padding: 24 }}>
            Os roteiros que o Claude escreve no chat aparecem aqui sozinhos.
          </div>
        )}
      </section>
    </div>
  );
};
