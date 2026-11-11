import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Copy, Flame, FolderOpen, Sparkles, Trash2, X } from "lucide-react";
import { copyText } from "./util";
import { PILAR_CAMPO, PilarTag, pilarNome } from "./perfil";

// CALENDÁRIO DE POSTAGEM (pedido do Paulo, 2026-09-28): visão por dia, semana e mês; arrastar os vídeos entre dias e
// horários; o sistema sugere a agenda (Reels/calendario.json via /api/calendar). Postagem automática fica para depois.
// O SERVIDOR é a fonte da verdade: toda mudança devolve o calendário inteiro e a tela troca o estado por ele (a
// sugestão em cima de uma tela desatualizada duplicava eventos). O balão de edição segue o Google Agenda.
export type CalProj = { slug: string; title: string; render: { file: string; mtime: number; stale?: boolean } | null; caption: string | null; tacoh?: string; urgency?: Urg; fact?: string; mtime: number };
type Urg = "hoje" | "48h" | "semana" | "atemporal";
const URG_TXT: Record<Urg, string> = { hoje: "Hoje", "48h": "48h", semana: "Semana", atemporal: "Atemporal" };
type Item = { slug: string; at: string }; // "AAAA-MM-DDTHH:MM", horário local
type Cal = { items: Item[]; perDay: number; urgent: string[]; urgency: Record<string, Urg> };
type View = "dia" | "semana" | "mes";

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DOW_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const HOURS = Array.from({ length: 17 }, (_, i) => 7 + i); // 07h a 23h
const TIMES = Array.from({ length: (24 - 6) * 4 }, (_, i) => `${String(6 + Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`); // 06:00 a 23:45

const dkey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromKey = (k: string) => new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d: Date) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7)); // semana começa na segunda
const longDate = (k: string) => {
  const d = fromKey(k);
  return `${DOW_LONG[d.getDay()]}, ${d.getDate()} de ${MES[d.getMonth()]}`;
};

/** mini calendário (escolher o dia), como o do Google Agenda */
const MiniMonth: React.FC<{ value: string; onPick: (k: string) => void }> = ({ value, onPick }) => {
  const [m, setM] = useState(() => fromKey(value));
  const first = new Date(m.getFullYear(), m.getMonth(), 1);
  const g0 = startOfWeek(first);
  const today = dkey(new Date());
  return (
    <div className="mini">
      <div className="mini-h">
        <b>
          {MES[m.getMonth()]} {m.getFullYear()}
        </b>
        <button className="icon ghost" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
          <ChevronLeft size={14} />
        </button>
        <button className="icon ghost" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="mini-g">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <span key={i} className="mini-dow">
            {d}
          </span>
        ))}
        {Array.from({ length: 42 }, (_, i) => addDays(g0, i)).map((d) => {
          const k = dkey(d);
          return (
            <button key={k} className={`mini-d ${d.getMonth() !== m.getMonth() ? "out" : ""} ${k === value ? "sel" : ""} ${k === today ? "today" : ""}`} onClick={() => onPick(k)}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Calendar: React.FC<{ projects: CalProj[]; onOpen: (slug: string) => void; toast: (m: string) => void }> = ({ projects, onOpen, toast }) => {
  const [cal, setCal] = useState<Cal | null>(null);
  const [view, setView] = useState<View>(() => {
    try {
      return (localStorage.getItem("estudio.calview") as View) || "semana";
    } catch {
      return "semana";
    }
  });
  const [cur, setCur] = useState(() => new Date());
  const [pop, setPop] = useState<{ slug: string; x: number; y: number; pick?: "data" | "hora" } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const bySlug = useMemo(() => Object.fromEntries(projects.map((p) => [p.slug, p])), [projects]);

  const api = async (method: "GET" | "PUT" | "POST", body?: Partial<Cal>) => {
    try {
      const r = await fetch("/api/calendar", { method, body: body ? JSON.stringify(body) : undefined });
      const c = await r.json();
      setCal({ items: c.items ?? [], perDay: c.perDay ?? 2, urgent: c.urgent ?? [], urgency: c.urgency ?? {} });
      return c;
    } catch {
      toast("não consegui falar com o servidor do calendário");
      return null;
    }
  };
  useEffect(() => {
    api("GET");
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("estudio.calview", view);
    } catch {
      /* ok */
    }
  }, [view]);

  const items = cal?.items ?? [];
  const place = (slug: string, at: string) => {
    setCal((c) => (c ? { ...c, items: [...c.items.filter((i) => i.slug !== slug), { slug, at }] } : c)); // resposta imediata na tela
    api("PUT", { items: [...items.filter((i) => i.slug !== slug), { slug, at }] });
  };
  const unplace = (slug: string) => api("PUT", { items: items.filter((i) => i.slug !== slug) });
  // urgência (a do roteiro vem em projects; a escolhida aqui fica em calendario.json e vale mais)
  const urgOf = (slug: string): Urg => cal?.urgency[slug] ?? bySlug[slug]?.urgency ?? "atemporal";
  const setUrg = (slug: string, u: Urg) => api("PUT", { urgency: { ...(cal?.urgency ?? {}), [slug]: u } });
  const toggleUrgent = (slug: string) => api("PUT", { urgent: cal?.urgent.includes(slug) ? cal.urgent.filter((u) => u !== slug) : [...(cal?.urgent ?? []), slug] });
  const suggest = async () => {
    const c = await api("POST");
    if (!c) return;
    if (!c.added) return toast("todos os vídeos já estão no calendário");
    const first = (c.items as Item[]).map((i) => i.at).sort()[0];
    if (first) setCur(fromKey(first.slice(0, 10)));
    toast(`${c.added} vídeo(s) agendado(s): urgentes primeiro (hoje, 48h, semana), o resto todo dia, até ${c.perDay} por dia, alternando os pilares. Arraste para ajustar.`);
  };

  const scheduled = new Set(items.map((i) => i.slug));
  const urgent = new Set([...(cal?.urgent ?? []), ...projects.filter((p) => (cal?.urgency[p.slug] ?? p.urgency) === "hoje").map((p) => p.slug)]);
  const URG_ORDER: Record<Urg, number> = { hoje: 0, "48h": 1, semana: 2, atemporal: 3 };
  const unscheduled = projects.filter((p) => !scheduled.has(p.slug)).sort((a, b) => URG_ORDER[urgOf(a.slug)] - URG_ORDER[urgOf(b.slug)]);
  const onDay = (key: string) => items.filter((i) => i.at.slice(0, 10) === key).sort((a, b) => a.at.localeCompare(b.at));

  const dragProps = (slug: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", slug);
      e.dataTransfer.effectAllowed = "move";
      setPop(null);
    },
  });
  const dropProps = (cellId: string, at: (e: React.DragEvent, slug: string) => string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (over !== cellId) setOver(cellId);
    },
    onDragLeave: () => setOver((o) => (o === cellId ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(null);
      const slug = e.dataTransfer.getData("text/plain");
      if (slug) place(slug, at(e, slug));
    },
  });

  const copyCaption = async (slug: string) => {
    let text = bySlug[slug]?.caption;
    if (!text) {
      toast("gerando a legenda...");
      const r = await (await fetch(`/api/caption/${slug}`, { method: "POST" })).json();
      text = r.caption?.text;
    }
    if (text && (await copyText(text))) toast("legenda copiada");
  };

  const openPop = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const W = 330;
    const x = Math.min(window.innerWidth - W - 12, Math.max(12, r.left));
    const y = Math.min(window.innerHeight - 360, r.bottom + 6);
    setPop(pop?.slug === slug ? null : { slug, x, y });
  };

  const Chip: React.FC<{ it: Item; big?: boolean }> = ({ it, big }) => {
    const p = bySlug[it.slug];
    if (!p) return null;
    return (
      <div className={`cal-ev ${big ? "big" : ""} ${pop?.slug === it.slug ? "on" : ""} ${urgent.has(it.slug) ? "urg" : ""}`} {...dragProps(it.slug)} onClick={(e) => openPop(e, it.slug)} title={p.title}>
        {big ? <img src={`/api/thumb/${p.slug}?t=${Math.round((p.render?.mtime ?? p.mtime) / 1000)}`} alt="" /> : null}
        <span className="t">{it.at.slice(11, 16)}</span>
        <span className="n">{p.title}</span>
        {urgent.has(it.slug) ? <Flame size={11} className="fl" /> : null}
        {p.tacoh ? <PilarTag id={p.tacoh} /> : null}
        {!p.render ? <span className="warn" title="Ainda sem render">●</span> : null}
      </div>
    );
  };

  // balão do evento (estilo Google Agenda): título, data e hora por extenso; clique na data abre o mini calendário,
  // clique na hora abre a lista de horários de 15 em 15 min
  const Pop: React.FC = () => {
    if (!pop) return null;
    const it = items.find((i) => i.slug === pop.slug);
    const p = bySlug[pop.slug];
    if (!it || !p) return null;
    const day = it.at.slice(0, 10);
    const time = it.at.slice(11, 16);
    return (
      <div className="gpop" style={{ left: pop.x, top: pop.y }} onClick={(e) => e.stopPropagation()}>
        <div className="gpop-top">
          <button className="icon ghost" title="Tirar do calendário" onClick={() => (unplace(p.slug), setPop(null))}>
            <Trash2 size={15} />
          </button>
          <button className="icon ghost" onClick={() => setPop(null)}>
            <X size={15} />
          </button>
        </div>
        <div className="gpop-title">
          <span className={`sq ${urgent.has(p.slug) ? "urg" : ""}`} />
          <b>{p.title}</b>
        </div>
        <div className="gpop-when">
          <button className={`when ${pop.pick === "data" ? "on" : ""}`} onClick={() => setPop({ ...pop, pick: pop.pick === "data" ? undefined : "data" })}>
            <CalendarDays size={14} /> {longDate(day)}
          </button>
          <button className={`when ${pop.pick === "hora" ? "on" : ""}`} onClick={() => setPop({ ...pop, pick: pop.pick === "hora" ? undefined : "hora" })}>
            <Clock size={14} /> {time}
          </button>
        </div>
        {pop.pick === "data" ? <MiniMonth value={day} onPick={(k) => (place(p.slug, `${k}T${time}`), setPop({ ...pop, pick: undefined }))} /> : null}
        {pop.pick === "hora" ? (
          <div className="timelist" ref={(el) => el?.querySelector(".sel")?.scrollIntoView({ block: "center" })}>
            {TIMES.map((t) => (
              <button key={t} className={t === time ? "sel" : ""} onClick={() => (place(p.slug, `${day}T${t}`), setPop({ ...pop, pick: undefined }))}>
                {t}
              </button>
            ))}
          </div>
        ) : null}
        <div className="gpop-meta">
          {p.tacoh ? <span>Pilar: {pilarNome(p.tacoh)}</span> : null}
          <span>{p.render ? (p.render.stale ? "render desatualizado" : "renderizado") : "ainda sem render"}</span>
        </div>
        <div className="gpop-act">
          <button onClick={() => onOpen(p.slug)}>
            <FolderOpen size={14} /> Abrir
          </button>
          <button onClick={() => copyCaption(p.slug)}>
            <Copy size={14} /> Copiar legenda
          </button>
        </div>
        <div className="gpop-urg">
          <span>
            <Flame size={13} /> Urgência
          </span>
          <div className="seg">
            {(["hoje", "48h", "semana", "atemporal"] as Urg[]).map((u) => (
              <button key={u} className={urgOf(p.slug) === u ? "on" : ""} onClick={() => setUrg(p.slug, u)} title={u === "hoje" ? "Postar no mesmo dia" : u === "48h" ? "Postar em até 2 dias" : u === "semana" ? "Postar em até 7 dias" : "Entra na cadência normal"}>
                {URG_TXT[u]}
              </button>
            ))}
          </div>
        </div>
        {p.fact ? <div className="gpop-meta">Fato em {longDate(p.fact)}</div> : null}
      </div>
    );
  };

  const wk0 = startOfWeek(cur);
  const label =
    view === "mes"
      ? `${MES[cur.getMonth()]} ${cur.getFullYear()}`
      : view === "semana"
        ? `${wk0.getDate()} ${MES[wk0.getMonth()].slice(0, 3)} – ${addDays(wk0, 6).getDate()} ${MES[addDays(wk0, 6).getMonth()].slice(0, 3)} ${addDays(wk0, 6).getFullYear()}`
        : longDate(dkey(cur));
  const step = (n: number) => setCur((c) => (view === "mes" ? new Date(c.getFullYear(), c.getMonth() + n, 1) : addDays(c, n * (view === "semana" ? 7 : 1))));
  const today = dkey(new Date());

  // grade de horas (semana e dia): soltar na metade de baixo da célula = HH:30
  const HourGrid: React.FC<{ days: Date[] }> = ({ days }) => (
    <div className="cal-hours" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
      <div className="cal-corner" />
      {days.map((d) => (
        <div key={dkey(d)} className={`cal-dh ${dkey(d) === today ? "today" : ""}`} onClick={() => (setCur(d), setView("dia"))}>
          {DOW[d.getDay()]} <b>{d.getDate()}</b>
        </div>
      ))}
      {HOURS.map((h) => (
        <React.Fragment key={h}>
          <div className="cal-hl">{String(h).padStart(2, "0")}:00</div>
          {days.map((d) => {
            const k = dkey(d);
            const id = `${k}-${h}`;
            const evs = onDay(k).filter((i) => Number(i.at.slice(11, 13)) === h);
            return (
              <div
                key={id}
                className={`cal-slot ${over === id ? "over" : ""} ${k < today ? "past" : ""}`}
                {...dropProps(id, (e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  return `${k}T${String(h).padStart(2, "0")}:${e.clientY - r.top > r.height / 2 ? "30" : "00"}`;
                })}
              >
                {evs.map((it) => (
                  <Chip key={it.slug} it={it} big={days.length === 1} />
                ))}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );

  const MonthGrid: React.FC = () => {
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const g0 = startOfWeek(first);
    const weeks = Math.ceil((((first.getDay() + 6) % 7) + new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate()) / 7);
    return (
      <div className="cal-month">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} className="cal-mh">
            {d}
          </div>
        ))}
        {Array.from({ length: weeks * 7 }, (_, i) => addDays(g0, i)).map((d) => {
          const k = dkey(d);
          return (
            <div
              key={k}
              className={`cal-day ${d.getMonth() !== cur.getMonth() ? "out" : ""} ${k === today ? "today" : ""} ${over === k ? "over" : ""} ${k < today ? "past" : ""}`}
              onClick={(e) => (e.stopPropagation(), setPop(null), setCur(d), setView("dia"))} // clicar em qualquer lugar do dia abre o dia (pedido do Paulo)
              {...dropProps(k, (_e, slug) => {
                const prev = items.find((i) => i.slug === slug);
                return `${k}T${prev ? prev.at.slice(11, 16) : "19:30"}`; // mantém o horário ao trocar de dia
              })}
            >
              <div className="num">
                {d.getDate()}
              </div>
              {onDay(k).map((it) => (
                <Chip key={it.slug} it={it} />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="cal" onClick={() => setPop(null)}>
      <aside className="cal-side">
        <div className="cal-sidehead">
          Sem data <span>{unscheduled.length}</span>
        </div>
        <div className="hint">Arraste um vídeo para um dia ou horário. A urgência vem do roteiro (hoje, 48h, semana, atemporal); a chama marca para hoje.</div>
        {unscheduled.map((p) => (
          <div key={p.slug} className={`cal-card ${urgent.has(p.slug) ? "urg" : ""}`} {...dragProps(p.slug)} title="Arraste para o calendário">
            <img src={`/api/thumb/${p.slug}?t=${Math.round((p.render?.mtime ?? p.mtime) / 1000)}`} alt="" />
            <div>
              <div className="n">{p.title}</div>
              <div className="m">
                {p.tacoh ? <PilarTag id={p.tacoh} /> : null}
                {urgOf(p.slug) !== "atemporal" ? <span className={`urgtag u-${urgOf(p.slug)}`}>{URG_TXT[urgOf(p.slug)]}</span> : null}
                {p.render ? "renderizado" : "sem render"}
              </div>
            </div>
            <button className={`icon ghost flame ${urgOf(p.slug) === "hoje" ? "on" : ""}`} title={urgOf(p.slug) === "hoje" ? "Urgente para hoje (clique para voltar a atemporal)" : "Marcar para postar hoje"} onClick={(e) => (e.stopPropagation(), setUrg(p.slug, urgOf(p.slug) === "hoje" ? "atemporal" : "hoje"))}>
              <Flame size={15} />
            </button>
          </div>
        ))}
        {!unscheduled.length ? <div className="status">Tudo agendado.</div> : null}
      </aside>
      <section className="cal-main">
        <div className="cal-bar">
          <button onClick={() => setCur(new Date())}>Hoje</button>
          <button className="icon ghost" onClick={() => step(-1)} title="Anterior">
            <ChevronLeft size={16} />
          </button>
          <button className="icon ghost" onClick={() => step(1)} title="Próximo">
            <ChevronRight size={16} />
          </button>
          <b className="cal-label">
            <CalendarDays size={15} /> {label}
          </b>
          <div className="spacer" />
          <label className="cad" title="Quantos vídeos por dia a sugestão distribui (todo dia, sábado e domingo também; hoje só o urgente)">
            Cadência
            <select value={cal?.perDay ?? 2} onChange={(e) => api("PUT", { perDay: Number(e.target.value) })}>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} por dia
                </option>
              ))}
            </select>
          </label>
          <div className="seg">
            {(["dia", "semana", "mes"] as View[]).map((v) => (
              <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
                {v === "mes" ? "Mês" : v === "dia" ? "Dia" : "Semana"}
              </button>
            ))}
          </div>
          <button className="primary" onClick={suggest} title={`Distribui os vídeos sem data: todo dia, até a cadência por dia; urgentes primeiro, alternando os pilares ${PILAR_CAMPO}`}>
            <Sparkles size={14} /> Sugerir calendário
          </button>
        </div>
        {!cal ? <div className="status">carregando...</div> : view === "mes" ? <MonthGrid /> : <HourGrid days={view === "dia" ? [cur] : Array.from({ length: 7 }, (_, i) => addDays(wk0, i))} />}
      </section>
      <Pop />
    </div>
  );
};
