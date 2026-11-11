import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Flame, Lightbulb, Maximize2, Plus, Star, Trash2, UserPlus, X, ZoomIn, ZoomOut } from "lucide-react";

// ABA IDEIAS (pedido do Paulo, 10/11/2026): brainstorming visual. Cada pauta é uma bolha num quadro infinito:
// arrasta o fundo pra mover, roda do mouse = zoom, clica na bolha pra abrir, marca prioridade (ordem de gravação)
// e o que já foi feito. Salva em Reels/ideias.json (rota /api/ideias). Posição/zoom da tela ficam no navegador.
type Idea = {
  id: string;
  title: string;
  hook: string;
  why: string;
  group: string;
  kind: "alcance" | "seguidor" | "outro";
  status: "ideia" | "prioridade" | "gravando" | "feito";
  order: number; // ordem dentro das prioridades (1 = a próxima)
  x: number;
  y: number;
  created: number;
};
const ST: Record<Idea["status"], string> = { ideia: "Ideia", prioridade: "Prioridade", gravando: "Gravando", feito: "Feito" };
const KIND: Record<Idea["kind"], { t: string; c: string }> = {
  alcance: { t: "Alcance", c: "#f59e0b" },
  seguidor: { t: "Seguidor", c: "#22c55e" },
  outro: { t: "Outro", c: "#a78bfa" },
};
const FILTERS = ["todas", "ideia", "prioridade", "gravando", "feito"] as const;
const BW = 230; // largura da bolha
const BH = 110;
type View = { x: number; y: number; z: number };
const readView = (): View => {
  try {
    const v = JSON.parse(localStorage.getItem("ideias.view") || "");
    if (typeof v?.z === "number") return v;
  } catch {}
  return { x: 40, y: 40, z: 1 };
};

export const Ideias: React.FC<{ toast: (m: string) => void }> = ({ toast }) => {
  const [items, setItems] = useState<Idea[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todas");
  const [view, setView] = useState<View>(readView);
  const [listOpen, setListOpen] = useState(true);
  const [panning, setPanning] = useState(false);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const pan = useRef<{ sx: number; sy: number; x: number; y: number; moved: boolean } | null>(null);
  const board = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("ideias.view", JSON.stringify(view));
    } catch {}
  }, [view]);

  const load = () =>
    fetch("/api/ideias")
      .then((r) => r.json())
      .then((j) => {
        if (!dirty.current && !drag.current) setItems(j.items ?? []);
      });
  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // pauta nova que saiu do chat aparece sozinha
    return () => clearInterval(id);
  }, []);

  const save = (next: Idea[]) => {
    setItems(next);
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      await fetch("/api/ideias", { method: "PUT", body: JSON.stringify({ items: next }) });
      dirty.current = false;
    }, 500);
  };
  const patch = (id: string, p: Partial<Idea>) => items && save(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const prios = useMemo(() => (items ?? []).filter((i) => i.status === "prioridade").sort((a, b) => a.order - b.order), [items]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: items?.length ?? 0 };
    for (const i of items ?? []) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [items]);

  // ---- câmera do quadro ----
  const toBoard = (cx: number, cy: number) => {
    const r = board.current!.getBoundingClientRect();
    return { x: (cx - r.left - view.x) / view.z, y: (cy - r.top - view.y) / view.z };
  };
  const zoomAt = (cx: number, cy: number, f: number) =>
    setView((v) => {
      const r = board.current!.getBoundingClientRect();
      const z = Math.min(2, Math.max(0.25, v.z * f));
      const px = cx - r.left,
        py = cy - r.top;
      return { z, x: px - ((px - v.x) / v.z) * z, y: py - ((py - v.y) / v.z) * z };
    });
  const zoomCenter = (f: number) => {
    const r = board.current!.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, f);
  };
  const fit = () => {
    if (!items?.length || !board.current) return;
    const r = board.current.getBoundingClientRect();
    const x0 = Math.min(...items.map((i) => i.x)),
      y0 = Math.min(...items.map((i) => i.y));
    const x1 = Math.max(...items.map((i) => i.x + BW + 30)),
      y1 = Math.max(...items.map((i) => i.y + BH));
    const z = Math.min(1.4, Math.max(0.25, Math.min((r.width - 80) / (x1 - x0), (r.height - 160) / (y1 - y0))));
    setView({ z, x: (r.width - (x1 - x0) * z) / 2 - x0 * z, y: 80 + (r.height - 160 - (y1 - y0) * z) / 2 - y0 * z });
  };
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest(".ide-side, .ide-next")) return; // rolar dentro dos painéis
      e.preventDefault();
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
      else setView((v) => ({ ...v, x: v.x - e.deltaX }));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  });

  // ---- ações ----
  const setStatus = (it: Idea, status: Idea["status"]) => {
    const order = status === "prioridade" && it.status !== "prioridade" ? prios.length + 1 : it.order;
    patch(it.id, { status, order });
    toast(`"${it.title}" → ${ST[status].toLowerCase()}`);
  };
  const move = (it: Idea, d: number) => {
    const L = prios.map((p) => p.id);
    const k = L.indexOf(it.id);
    const j = k + d;
    if (j < 0 || j >= L.length) return;
    [L[k], L[j]] = [L[j], L[k]];
    save(items!.map((i) => (L.includes(i.id) ? { ...i, order: L.indexOf(i.id) + 1 } : i)));
  };
  const add = () => {
    const r = board.current!.getBoundingClientRect();
    const c = toBoard(r.left + r.width / 2, r.top + r.height / 2);
    const it: Idea = { id: Math.random().toString(36).slice(2, 10), title: "Nova ideia", hook: "", why: "", group: "", kind: "outro", status: "ideia", order: 0, x: Math.round(c.x - BW / 2), y: Math.round(c.y - BH / 2), created: Date.now() };
    save([...(items ?? []), it]);
    setSel(it.id);
  };
  const del = (it: Idea) => {
    if (!confirm(`Apagar "${it.title}"?`)) return;
    save(items!.filter((i) => i.id !== it.id));
    setSel(null);
  };

  // ---- arraste: bolha move a bolha; fundo move o quadro ----
  const onBubbleDown = (e: React.PointerEvent, it: Idea) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const p = toBoard(e.clientX, e.clientY);
    drag.current = { id: it.id, dx: p.x - it.x, dy: p.y - it.y, moved: false };
    board.current!.setPointerCapture(e.pointerId);
  };
  const onBoardDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    pan.current = { sx: e.clientX, sy: e.clientY, x: view.x, y: view.y, moved: false };
    setPanning(true);
    board.current!.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const P = pan.current;
    if (P) {
      const dx = e.clientX - P.sx,
        dy = e.clientY - P.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) P.moved = true;
      setView((v) => ({ ...v, x: P.x + dx, y: P.y + dy }));
      return;
    }
    const d = drag.current;
    if (!d || !items) return;
    const p = toBoard(e.clientX, e.clientY);
    d.moved = true;
    setItems(items.map((i) => (i.id === d.id ? { ...i, x: Math.round(p.x - d.dx), y: Math.round(p.y - d.dy) } : i)));
  };
  const onUp = () => {
    const P = pan.current;
    if (P) {
      pan.current = null;
      setPanning(false);
      if (!P.moved) setSel(null); // clique no vazio fecha o painel
      return;
    }
    const d = drag.current;
    drag.current = null;
    if (!d || !items) return;
    if (d.moved) save(items);
    else setSel(d.id);
  };

  if (!items) return <div className="status">carregando...</div>;
  const cur = items.find((i) => i.id === sel);
  const shown = (i: Idea) => filter === "todas" || i.status === filter;
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div className="ide">
      <div className="ide-bar">
        <div className="rot-filters" style={{ margin: 0 }}>
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "todas" ? "Todas" : ST[f]} <span>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="ide-legend">
          {Object.values(KIND).map((k) => (
            <span key={k.t}>
              <i style={{ background: k.c }} /> {k.t}
            </span>
          ))}
        </div>
        <div className="spacer" />
        <button className="primary" onClick={add}>
          <Plus size={15} /> Nova ideia
        </button>
      </div>

      <div className={`ide-board ${panning ? "panning" : ""}`} ref={board} onPointerDown={onBoardDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div
          className="ide-grid"
          style={{ backgroundPosition: `${view.x}px ${view.y}px`, backgroundSize: `${26 * view.z}px ${26 * view.z}px` }}
        />
        <div className="ide-canvas" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
          {items.map((it) => {
            const k = KIND[it.kind];
            const big = it.status === "prioridade";
            return (
              <div
                key={it.id}
                className={`ide-bub ${it.status} ${sel === it.id ? "sel" : ""} ${shown(it) ? "" : "dim"}`}
                style={{ left: it.x, top: it.y, ["--k" as string]: k.c, width: big ? BW + 30 : BW }}
                onPointerDown={(e) => onBubbleDown(e, it)}
              >
                {big ? <b className="ide-num">{it.order}</b> : null}
                {it.status === "feito" ? (
                  <b className="ide-num ok">
                    <Check size={13} />
                  </b>
                ) : null}
                <div className="ide-kind">
                  {it.kind === "alcance" ? <Flame size={11} /> : it.kind === "seguidor" ? <UserPlus size={11} /> : <Lightbulb size={11} />} {k.t}
                  {it.group ? <span> · {it.group}</span> : null}
                  {it.status === "gravando" ? <span className="ide-rec"> · gravando</span> : null}
                </div>
                <div className="ide-title">{it.title}</div>
                {it.hook && big ? <div className="ide-hook">“{it.hook}”</div> : null}
              </div>
            );
          })}
        </div>

        {/* próximas a gravar: cartão flutuante, recolhível */}
        <div className="ide-next" onPointerDown={stop}>
          <button className="ide-next-h" onClick={() => setListOpen((o) => !o)}>
            <Star size={13} /> Próximas a gravar <span className="ide-count">{prios.length}</span>
            <div className="spacer" />
            {listOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {listOpen ? (
            prios.length ? (
              <div className="ide-next-l">
                {prios.map((p) => (
                  <button key={p.id} className={sel === p.id ? "on" : ""} onClick={() => setSel(p.id)}>
                    <b style={{ background: KIND[p.kind].c }}>{p.order}</b>
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="ide-next-empty">Abra uma bolha e marque Prioridade.</div>
            )
          ) : null}
        </div>

        {/* zoom */}
        <div className="ide-zoom" onPointerDown={stop}>
          <button className="icon ghost" title="Diminuir" onClick={() => zoomCenter(1 / 1.2)}>
            <ZoomOut size={15} />
          </button>
          <button className="ghost ide-zv" title="Voltar a 100%" onClick={() => setView((v) => ({ ...v, z: 1 }))}>
            {Math.round(view.z * 100)}%
          </button>
          <button className="icon ghost" title="Aumentar" onClick={() => zoomCenter(1.2)}>
            <ZoomIn size={15} />
          </button>
          <span className="ide-zsep" />
          <button className="icon ghost" title="Ver tudo" onClick={fit}>
            <Maximize2 size={14} />
          </button>
        </div>
        <div className="ide-tip">arraste o fundo pra mover · roda do mouse = zoom</div>

        {/* editor da bolha: painel flutuante, só com uma bolha aberta */}
        {cur ? (
          <aside className="ide-side" onPointerDown={stop}>
            <div className="ide-side-h">
              <b style={{ color: KIND[cur.kind].c }}>{KIND[cur.kind].t}</b>
              <div className="spacer" />
              <button className="icon ghost" title="Fechar" onClick={() => setSel(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="ide-st seg">
              {(Object.keys(ST) as Idea["status"][]).map((s) => (
                <button key={s} className={cur.status === s ? "on" : ""} onClick={() => setStatus(cur, s)}>
                  {s === "prioridade" ? <Star size={12} /> : s === "feito" ? <Check size={12} /> : null} {ST[s]}
                </button>
              ))}
            </div>
            {cur.status === "prioridade" ? (
              <div className="ide-order">
                Prioridade nº <b>{cur.order}</b>
                <div className="spacer" />
                <button className="chip" onClick={() => move(cur, -1)} disabled={cur.order <= 1}>
                  ↑ antes
                </button>
                <button className="chip" onClick={() => move(cur, 1)} disabled={cur.order >= prios.length}>
                  ↓ depois
                </button>
              </div>
            ) : null}
            <label>Título</label>
            <input value={cur.title} onChange={(e) => patch(cur.id, { title: e.target.value })} />
            <label>Frase de abertura</label>
            <textarea rows={3} value={cur.hook} onChange={(e) => patch(cur.id, { hook: e.target.value })} />
            <label>Por quê / notas</label>
            <textarea rows={6} value={cur.why} onChange={(e) => patch(cur.id, { why: e.target.value })} />
            <div className="ide-row">
              <div>
                <label>Tipo</label>
                <select value={cur.kind} onChange={(e) => patch(cur.id, { kind: e.target.value as Idea["kind"] })}>
                  {(Object.keys(KIND) as Idea["kind"][]).map((k) => (
                    <option key={k} value={k}>
                      {KIND[k].t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Grupo</label>
                <input value={cur.group} placeholder="ex.: Deadlock" onChange={(e) => patch(cur.id, { group: e.target.value })} />
              </div>
            </div>
            <button className="ghost ide-del" onClick={() => del(cur)}>
              <Trash2 size={14} /> Apagar ideia
            </button>
          </aside>
        ) : null}
      </div>
    </div>
  );
};
