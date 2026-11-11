import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { Bookmark, Captions, LocateFixed, Rows3, Clapperboard, Film, Lock, LockOpen, Magnet, Mic, MousePointer2, Music, Plus, Scissors, Stamp, Trash2, Undo2, Volume2, VolumeX, Wind, ZoomIn, ZoomOut, type LucideIcon } from "lucide-react";
import type { SegSpec } from "../src/lib/timeline";
import { EditDoc, SceneClip, SoundClip, SoundTrack } from "../src/lib/edit/types";
import { packFxTracks, shiftInner } from "./util";

export type Sel =
  | { kind: "scene"; id: string }
  | { kind: "sound"; id: string }
  | { kind: "word"; i: number }
  | { kind: "snap"; i: number }
  | { kind: "push"; i: number }
  | { kind: "voice" }
  | { kind: "marker"; id: string }
  | { kind: "clip"; i: number } // clipe da trilha Vídeo (Delete tira o trecho do vídeo, com ripple)
  | null;

const HEAD = 168;
const ROW = 30;
const SROW = 46; // altura de cada linha da trilha de sons (cabe a onda)
const VROW = 44; // trilha de voz
const CROW = 44; // trilha Vídeo (clipes da gravação)
const r3 = (x: number) => Math.round(x * 1000) / 1000;
export const Timeline: React.FC<{
  doc: EditDoc;
  fps: number;
  total: number;
  now: number;
  peaks: number[];
  sel: Sel;
  setSel: (s: Sel) => void;
  multi: string[]; // seleção múltipla: "scene:<id>" / "sound:<id>"
  setMulti: (m: string[]) => void;
  actions: { remove: () => void; duplicate: () => void; copy: () => boolean; cut: () => void; paste: () => void }; // menu do botão direito
  seek: (t: number) => void;
  live: (fn: (d: EditDoc) => void) => void;
  checkpoint: () => void;
  onDropSound: (src: string, t: number, track?: string) => void;
  libSel: string;
  onOpenLib: () => void;
  pauses: { a: number; b: number; dur: number; kind: string; src?: [number, number] }[];
  onCutBreaths: () => void;
  onIgnorePause?: (p: { a: number; b: number; dur: number; kind: string; src?: [number, number] }) => void;
  commit: (fn: (d: EditDoc) => void) => void;
  player: React.RefObject<PlayerRef | null>;
  inOut: { a?: number; b?: number };
  fitSig: number; // muda = ajustar o zoom para caber o vídeo inteiro (tecla \)
  reveal?: { a: number; b: number; n: number }; // muda `n` = enquadrar o trecho a..b (a última edição do Claude)
  lastEdit?: { label: string } | null;
  onLastEdit?: () => void;
  onAddMarker: () => void;
  onCutRange: () => void;
  spec: SegSpec;
  srcPeaks: number[]; // onda da gravação inteira, 100 valores/s
  onTrimClip: (i: number, side: "a" | "b", delta: number, at: number) => Promise<void>;
  magnet: boolean;
  setMagnet: (m: boolean) => void;
  solo: string[]; // trilhas em solo (só elas tocam, sem a voz); não é salvo no edit.json
  setSolo: (s: string[]) => void;
  voiceMute: boolean; // voz calada só na prévia (não é salva)
  setVoiceMute: (v: boolean) => void;
  tool: "select" | "blade"; // ferramenta do mouse: seta ou lâmina (C)
  setTool: (t: "select" | "blade") => void;
  onBlade: (target: { kind: "clip" } | { kind: "scene" | "sound"; id: string }, t: number) => void;
  locked?: boolean; // 11/11: render rodando/pausado: a timeline não edita (só assistir e navegar)
}> = (props) => <TimelineMemo {...props} />;

// A timeline só redesenha quando o documento, a seleção, o zoom ou o `now` (4x/s) mudam.
const TimelineInner: React.FC<React.ComponentProps<typeof Timeline>> = ({ doc, fps, total, now, peaks, sel, setSel, multi, setMulti, actions, seek, live, checkpoint, onDropSound, libSel, onOpenLib, player, pauses, onCutBreaths, onIgnorePause, commit, inOut, fitSig, reveal, lastEdit, onLastEdit, onAddMarker, onCutRange, spec, srcPeaks, onTrimClip, magnet, setMagnet, solo, setSolo, voiceMute, setVoiceMute, tool, setTool, onBlade, locked }) => {
  const commitDoc = commit;
  const commitTracks = (fn: (ts: SoundTrack[]) => void) =>
    commit((d) => {
      const ts = d.soundTracks?.length ? d.soundTracks : [{ id: "t1", name: "Sons" }];
      fn(ts);
      d.soundTracks = ts;
    });
  const [pps, setPpsRaw] = useState(40); // pixels por segundo
  const body = useRef<HTMLDivElement>(null);
  // JANELA VISÍVEL (2026-10-05): com 2 h de vídeo a timeline tinha ~28 mil elementos (5,4 mil takes, 2,3 mil sons,
  // 20 mil palavras) e o navegador recalculava o layout de todos a cada quadro do play — a prévia inteira travava e a
  // voz repetia. Agora só entra no DOM o que está na tela, com folga; a rolagem fica guardada (ler scrollLeft a cada
  // quadro forçava o layout).
  const scr = useRef({ left: 0, width: 1600 });
  const [view, setView] = useState({ a: 0, b: 60 });
  const viewRaf = useRef(0);
  const timeLabel = useRef<HTMLSpanElement>(null);
  // zoom ancorado: o ponto escolhido (o cursor vermelho; se ele estiver fora da tela, onde está o mouse) fica parado
  // na tela enquanto a escala muda. Antes o zoom só trocava a escala e a rolagem ficava onde estava ("zoom aleatório").
  const anchor = useRef<{ t: number; off: number } | null>(null);
  const setPps = (next: number | ((p: number) => number), mouseClientX?: number) => {
    const el = body.current;
    if (el) {
      const box = el.getBoundingClientRect();
      const tHead = (player.current?.getCurrentFrame() ?? 0) / fps;
      const headOff = HEAD + tHead * pps - el.scrollLeft;
      const visible = headOff >= HEAD && headOff <= el.clientWidth;
      if (visible) anchor.current = { t: tHead, off: headOff };
      else {
        const off = mouseClientX !== undefined ? mouseClientX - box.left : HEAD + (el.clientWidth - HEAD) / 2;
        anchor.current = { t: (off + el.scrollLeft - HEAD) / pps, off };
      }
    }
    setPpsRaw(next);
  };
  useLayoutEffect(() => {
    const el = body.current;
    const a = anchor.current;
    if (!el || !a) return;
    anchor.current = null;
    el.scrollLeft = Math.max(0, HEAD + a.t * pps - a.off);
  }, [pps]);
  const syncView = useCallback(() => {
    const el = body.current;
    if (!el) return;
    scr.current = { left: el.scrollLeft, width: el.clientWidth };
    const a = Math.max(0, (el.scrollLeft - HEAD) / pps);
    const span = Math.max(1, el.clientWidth / pps);
    const pad = Math.max(20, span * 0.75);
    setView((v) => {
      const na = Math.max(0, a - pad);
      const nb = a + span + pad;
      // só redesenha quando a borda da janela chega perto (rolar devagar não refaz a timeline a cada pixel)
      if (a >= v.a && a + span <= v.b && Math.abs(v.b - v.a - (nb - na)) < span * 0.5) return v;
      return { a: na, b: nb };
    });
  }, [pps]);
  useLayoutEffect(() => {
    syncView();
    const el = body.current;
    if (!el) return;
    const onScroll = () => {
      scr.current = { left: el.scrollLeft, width: el.clientWidth };
      if (!viewRaf.current) viewRaf.current = requestAnimationFrame(() => ((viewRaf.current = 0), syncView()));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [syncView]);
  const inView = (a: number, b: number) => b >= view.a && a <= view.b;
  const wave = useRef<HTMLCanvasElement>(null);
  const W = Math.ceil(total * pps) + 200;
  const playhead = useRef<HTMLDivElement>(null);
  const rhandle = useRef<HTMLDivElement>(null); // alça do cursor dentro da régua (sempre visível)
  // cursor vermelho: acompanha o player a cada quadro de tela, sem redesenhar a timeline.
  // "Seguir o cursor" (cadeado) liga/desliga a rolagem automática; mesmo ligado, se o Paulo rolar
  // a timeline na mão (barrinha, rodinha), a rolagem automática espera 4 s para não brigar com ele.
  const [follow, setFollow] = useState(true);
  // MENU DO BOTÃO DIREITO (como nos editores de vídeo): em cena, som, palavra, zoom, marcador ou no vazio
  const [menu, setMenu] = useState<{ x: number; y: number; kind: string } | null>(null);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const t = setTimeout(() => {
      window.addEventListener("pointerdown", close);
      window.addEventListener("keydown", close);
      window.addEventListener("wheel", close);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
      window.removeEventListener("wheel", close);
    };
  }, [menu]);
  const openMenu = (kind: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, kind });
  };
  const followRef = useRef(true);
  followRef.current = follow;
  const userScrollAt = useRef(0);
  const autoScrolling = useRef(false);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const onScroll = () => {
      if (!autoScrolling.current) userScrollAt.current = performance.now();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const p = player.current;
      const el = body.current;
      if (p && playhead.current && el) {
        if (p.isPlaying() && timeLabel.current) {
          const fr = p.getCurrentFrame();
          const txt = `${fmt(fr / fps)} · ${fr}`;
          if (timeLabel.current.dataset.t !== txt) {
            timeLabel.current.dataset.t = txt;
            timeLabel.current.innerHTML = `${fmt(fr / fps)} <span>· ${fr}</span>`;
          }
        }
        const px = HEAD + (p.getCurrentFrame() / fps) * pps;
        playhead.current.style.left = `${px}px`;
        if (rhandle.current) rhandle.current.style.left = `${px - HEAD}px`;
        // fora da área visível (atrás dos nomes das trilhas): esconde linha e alça
        const sl = scr.current.left;
        const hidden = px < sl + HEAD - 1;
        playhead.current.style.visibility = hidden ? "hidden" : "visible";
        if (rhandle.current) rhandle.current.style.visibility = hidden ? "hidden" : "visible";
        const quiet = performance.now() - userScrollAt.current > 4000;
        if (followRef.current && quiet && p.isPlaying() && (px > sl + scr.current.width - 40 || px < sl + HEAD)) {
          autoScrolling.current = true;
          el.scrollLeft = Math.max(0, px - HEAD - 80);
          setTimeout(() => (autoScrolling.current = false), 150);
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [player, fps, pps]);
  const x = (t: number) => t * pps;
  const q = (t: number) => Math.round(t * fps) / fps; // encaixa no frame

  const tracks: SoundTrack[] = doc.soundTracks?.length ? doc.soundTracks : [{ id: "t1", name: "Sons" }];
  const trackOf = (s: SoundClip) => (tracks.some((t) => t.id === s.track) ? (s.track as string) : tracks[0].id);
  const lane0 = doc.scenes.filter((s) => (s.lane ?? 0) === 0);
  const lane1 = doc.scenes.filter((s) => (s.lane ?? 0) !== 0);

  // pontos de encaixe: cursor, palavras, bordas de cenas
  const snaps = useMemo(() => {
    const p = [now];
    for (const w of doc.captions.words) p.push(w.start, w.end);
    for (const s of doc.scenes) p.push(s.start, s.end);
    for (const m of doc.markers ?? []) p.push(m.t);
    return p;
  }, [doc, now]);
  // ---------- seleção múltipla ----------
  // Ctrl/Shift + clique soma ou tira o item; Shift + arrastar no vazio laça o que começa no trecho (cenas, carimbos, sons);
  // arrastar um item do grupo move o grupo inteiro junto (cada som fica na sua trilha).
  // laço em RETÂNGULO (como no Premiere/CapCut): do ponto onde começou até onde o mouse está, pega só o que ele toca
  const [band, setBand] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const endOf = (k: string, d: EditDoc) => {
    const [kind, id] = [k.slice(0, k.indexOf(":")), k.slice(k.indexOf(":") + 1)];
    if (kind === "scene") {
      const c = d.scenes.find((z) => z.id === id);
      return c ? { s: c.start, e: c.end } : null;
    }
    const c = d.sounds.find((z) => z.id === id);
    return c ? { s: c.start, e: c.start + (c.dur ?? 1) } : null;
  };
  const toggleMulti = (k: string) => {
    const base = multi.length ? multi : sel && (sel.kind === "scene" || sel.kind === "sound") ? [`${sel.kind}:${sel.id}`] : [];
    setMulti(base.includes(k) ? base.filter((z) => z !== k) : [...base, k]);
  };
  const moveGroup = (e: React.PointerEvent, primary0: number) => {
    const orig = multi.map((k) => ({ k, r: endOf(k, doc) })).filter((o) => o.r) as { k: string; r: { s: number; e: number } }[];
    const min0 = Math.min(...orig.map((o) => o.r.s));
    drag(e, (dt, ev) =>
      live((d) => {
        const delta = Math.max(snap(primary0 + dt, ev.altKey) - primary0, -min0);
        for (const { k, r } of orig) {
          const id = k.slice(k.indexOf(":") + 1);
          if (k.startsWith("scene:")) {
            const c = d.scenes.find((z) => z.id === id);
            if (c) {
              c.start = r3(r.s + delta);
              c.end = r3(r.e + delta);
            }
          } else {
            const c = d.sounds.find((z) => z.id === id);
            if (c) c.start = r3(r.s + delta);
          }
        }
      }),
    );
  };
  const marquee = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = body.current!;
    const box = el.getBoundingClientRect();
    // coordenadas no conteúdo da timeline (acompanham a rolagem)
    const cx = (clientX: number) => clientX - box.left + el.scrollLeft;
    const cy = (clientY: number) => clientY - box.top + el.scrollTop;
    const x0 = cx(e.clientX);
    const y0 = cy(e.clientY);
    let last = { x0, y0, x1: x0, y1: y0 };
    setBand(last);
    const move = (ev: PointerEvent) => {
      last = { x0, y0, x1: cx(ev.clientX), y1: cy(ev.clientY) };
      setBand(last);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setBand(null);
      const L = Math.min(last.x0, last.x1);
      const R = Math.max(last.x0, last.x1);
      const T = Math.min(last.y0, last.y1);
      const B = Math.max(last.y0, last.y1);
      if (R - L < 4 && B - T < 4) return;
      const keys: string[] = [];
      el.querySelectorAll<HTMLElement>("[data-key]").forEach((n) => {
        const r = n.getBoundingClientRect();
        const l = cx(r.left);
        const t = cy(r.top);
        if (l < R && l + r.width > L && t < B && t + r.height > T) keys.push(n.dataset.key!);
      });
      setMulti(keys);
      setSel(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  // clique no vazio: leva o cursor; clicar e arrastar no vazio: desenha o retângulo de seleção
  const emptyDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget || e.button !== 0) return;
    setSel(null);
    if (multi.length) setMulti([]);
    seek(tFromEvent(e));
    marquee(e);
  };

  const snap = (t: number, alt: boolean) => {
    if (alt) return q(t);
    let best = t;
    let bd = 7 / pps;
    for (const p of snaps) {
      const d = Math.abs(p - t);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return q(best);
  };

  // onda da voz: desenhada SÓ no trecho visível (+ folga), redesenhada ao rolar/zoom. Antes era um canvas da largura
  // da timeline inteira: com zoom alto (23 min × 400 px/s = 560 mil px) passava do limite do navegador e ficava branco.
  const drawWave = useCallback(() => {
    const c = wave.current;
    const el = body.current;
    if (!c || !el) return;
    const PAD = 300;
    const x0 = Math.max(0, Math.floor(el.scrollLeft - PAD));
    const x1 = Math.min(Math.ceil(total * pps), Math.ceil(el.scrollLeft + el.clientWidth - HEAD + PAD));
    const w = Math.max(1, x1 - x0);
    if (c.width !== w) c.width = w;
    c.height = VROW;
    c.style.left = `${x0}px`;
    c.style.width = `${w}px`;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, w, VROW);
    const gain = Math.pow(10, (doc.voice?.gain ?? 0) / 20);
    g.fillStyle = doc.voice?.fx && Object.values(doc.voice.fx).some(Boolean) ? "#60a5fa" : "#56657d";
    const step = 100 / pps; // peaks por pixel
    for (let px = x0; px < x1; px++) {
      let m = 0;
      for (let i = Math.floor(px * step); i < Math.floor((px + 1) * step) + 1 && i < peaks.length; i++) m = Math.max(m, peaks[i]);
      const h = Math.max(1, Math.min(1, m * gain) * (VROW - 6));
      g.fillRect(px - x0, (VROW - h) / 2, 1, h);
    }
  }, [peaks, pps, total, doc.voice?.gain, doc.voice?.fx]);
  useEffect(() => {
    drawWave();
    const el = body.current;
    if (!el) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(drawWave);
    };
    el.addEventListener("scroll", on, { passive: true });
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", on);
      ro.disconnect();
    };
  }, [drawWave, W]);

  // tecla \ : zoom para caber o vídeo inteiro na largura
  useEffect(() => {
    if (!fitSig || !body.current) return;
    setPpsRaw(Math.min(400, Math.max(8, (body.current.clientWidth - HEAD - 40) / Math.max(1, total))));
    body.current.scrollLeft = 0;
  }, [fitSig]);

  // enquadra o trecho que o Claude editou (a..b com folga), começando um pouco depois dos nomes das trilhas
  useEffect(() => {
    const el = body.current;
    if (!reveal || !el) return;
    const span = Math.max(1, reveal.b - reveal.a);
    const np = Math.min(400, Math.max(8, Math.round((el.clientWidth - HEAD - 160) / span)));
    if (np === pps) el.scrollLeft = Math.max(0, reveal.a * pps - 60);
    else {
      anchor.current = { t: reveal.a, off: HEAD + 60 };
      setPpsRaw(np);
    }
  }, [reveal?.n]);

  // Ctrl + rodinha = zoom da timeline
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setPps((p) => Math.min(400, Math.max(8, p * (e.deltaY < 0 ? 1.15 : 1 / 1.15))), e.clientX);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pps, fps]);

  const drag = (e: React.PointerEvent, onMove: (dt: number, ev: PointerEvent) => void) => {
    e.stopPropagation();
    e.preventDefault();
    const x0 = e.clientX;
    const y0 = e.clientY;
    let started = false; // só entra no "desfazer" se o item realmente se mexer (para o lado ou para cima/baixo)
    const move = (ev: PointerEvent) => {
      if (!started) {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 3) return;
        started = true;
        checkpoint();
      }
      onMove((ev.clientX - x0) / pps, ev);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // ARRASTAR O CURSOR (scrub): segurar a alça vermelha ou a régua e mover para os lados
  // leva o vídeo junto, quadro a quadro. Pausa se estiver tocando.
  const tFromX = (clientX: number) => {
    const el = body.current!;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(total, (clientX - rect.left + el.scrollLeft - HEAD) / pps));
  };
  const scrub = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    player.current?.pause();
    document.body.style.cursor = "ew-resize";
    seek(tFromX(e.clientX));
    let raf = 0;
    let lastX = e.clientX;
    const move = (ev: PointerEvent) => {
      lastX = ev.clientX;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          seek(tFromX(lastX));
          // rola a timeline quando o cursor chega na borda
          const el = body.current;
          if (el) {
            const r = el.getBoundingClientRect();
            if (lastX > r.right - 30) el.scrollLeft += 20;
            else if (lastX < r.left + HEAD + 20) el.scrollLeft -= 20;
          }
        });
    };
    const up = () => {
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // som arrastado da biblioteca: linha mostra onde vai cair; soltar põe naquela trilha e naquele tempo
  const [dropAt, setDropAt] = useState<{ t: number; track: string } | null>(null);
  const isSfxDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("application/x-estudio-sfx");
  const tFromEvent = (e: React.MouseEvent) => {
    const el = body.current!;
    const rect = el.getBoundingClientRect();
    return Math.max(0, (e.clientX - rect.left + el.scrollLeft - HEAD) / pps);
  };

  // ---------- cenas ----------
  const sceneClip = (s: SceneClip) => {
    const key = `scene:${s.id}`;
    const on = (sel?.kind === "scene" && sel.id === s.id) || multi.includes(key);
    const s0 = s.start;
    const e0 = s.end;
    const props0 = s.props;
    const moveAll = (e: React.PointerEvent) =>
      drag(e, (dt, ev) =>
        live((d) => {
          const c = d.scenes.find((z) => z.id === s.id)!;
          const ns = snap(Math.max(0, s0 + dt), ev.altKey);
          c.start = r3(ns);
          c.end = r3(ns + (e0 - s0));
        }),
      );
    const moveL = (e: React.PointerEvent) =>
      drag(e, (dt, ev) =>
        live((d) => {
          const c = d.scenes.find((z) => z.id === s.id)!;
          const ns = Math.min(snap(Math.max(0, s0 + dt), ev.altKey), e0 - 1 / fps);
          c.start = r3(ns);
          c.props = shiftInner(props0, s0 - ns) as Record<string, unknown>;
        }),
      );
    const moveR = (e: React.PointerEvent) =>
      drag(e, (dt, ev) =>
        live((d) => {
          const c = d.scenes.find((z) => z.id === s.id)!;
          c.end = r3(Math.max(snap(e0 + dt, ev.altKey), s0 + 1 / fps));
        }),
      );
    return (
      <div
        key={s.id}
        data-key={key}
        className={`clip ${(s.lane ?? 0) ? "over" : "scene"} ${on ? "sel" : ""}`}
        style={{ left: x(s.start), width: Math.max(14, x(s.end - s.start)) }}
        title={`${s.label ?? s.id} (${s.type})`}
        onContextMenu={openMenu("scene")}
        onPointerDown={(e) => {
          if (tool === "blade") {
            e.stopPropagation();
            onBlade({ kind: "scene", id: s.id }, tFromEvent(e));
            return;
          }
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            e.stopPropagation();
            toggleMulti(key);
            setSel({ kind: "scene", id: s.id });
            return;
          }
          setSel({ kind: "scene", id: s.id });
          if (multi.length > 1 && multi.includes(key)) return moveGroup(e, s0);
          if (multi.length) setMulti([]);
          moveAll(e);
        }}
      >
        {s.label ?? s.id}
        <div className="edge l" onPointerDown={(e) => (setSel({ kind: "scene", id: s.id }), moveL(e))} />
        <div className="edge r" onPointerDown={(e) => (setSel({ kind: "scene", id: s.id }), moveR(e))} />
      </div>
    );
  };

  // ---------- sons ----------
  const soundClip = (s: SoundClip) => {
    const key = `sound:${s.id}`;
    const on = (sel?.kind === "sound" && sel.id === s.id) || multi.includes(key);
    const dur = s.dur ?? 1;
    const st0 = s.start;
    const d0 = dur;
    const tr0 = s.trim ?? 0;
    const fi0 = s.fadeIn ?? 0;
    const fo0 = s.fadeOut ?? 0;
    const w = Math.max(18, x(dur)); // som curto (blip de 0,1 s) continua clicável com qualquer zoom
    const H = SROW - 6;
    const upd = (fn: (c: SoundClip) => void) => live((d) => fn(d.sounds.find((z) => z.id === s.id)!));
    const choose = () => setSel({ kind: "sound", id: s.id });
    const name = (s.label ?? s.src).replace(/^sfx\//, "").replace(/\.wav$/, "");
    return (
      <div
        key={s.id}
        data-key={key}
        className={`sclip ${on ? "sel" : ""} ${s.muted ? "muted" : ""}`}
        style={{ left: x(s.start), width: w, top: 3, height: H }}
        title={`${name} · ${s.start.toFixed(2)}s · vol ${Math.round(s.vol * 100)}%`}
        onContextMenu={openMenu("sound")}
        onPointerDown={(e) => {
          if (tool === "blade") {
            e.stopPropagation();
            onBlade({ kind: "sound", id: s.id }, tFromEvent(e));
            return;
          }
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            e.stopPropagation();
            toggleMulti(key);
            choose();
            return;
          }
          choose();
          if (multi.length > 1 && multi.includes(key)) return moveGroup(e, st0);
          if (multi.length) setMulti([]);
          drag(e, (dt, ev) =>
            upd((c) => {
              c.start = r3(snap(Math.max(0, st0 + dt), ev.altKey));
              // arrastar para cima/baixo troca de trilha
              const el = document.elementsFromPoint(ev.clientX, ev.clientY).find((n) => (n as HTMLElement).dataset?.track) as HTMLElement | undefined;
              if (el?.dataset.track) c.track = el.dataset.track;
            }),
          );
        }}
      >
        <SoundWave src={s.fxSrc ?? s.src} trim={tr0} dur={dur} width={w} height={H} vol={s.vol} fadeIn={fi0} fadeOut={fo0} pps={pps} />
        {w > 40 ? <span className="sname">{name}</span> : null}
        <div
          className="edge l"
          onPointerDown={(e) => {
            choose();
            drag(e, (dt, ev) =>
              upd((c) => {
                const ns = Math.min(Math.max(0, snap(st0 + dt, ev.altKey)), st0 + d0 - 1 / fps);
                const shift = Math.max(-tr0, ns - st0);
                c.start = r3(st0 + shift);
                c.trim = r3(tr0 + shift);
                c.dur = r3(d0 - shift);
              }),
            );
          }}
        />
        <div
          className="edge r"
          onPointerDown={(e) => {
            choose();
            drag(e, (dt) => upd((c) => (c.dur = r3(Math.max(1 / fps, q(d0 + dt))))));
          }}
        />
        {/* alças de fade (como no CapCut): puxe a bolinha do canto para dentro */}
        <div
          className="fdot"
          style={{ left: Math.min(x(fi0), w - 10) - 6 }}
          title="fade de entrada: arraste"
          onPointerDown={(e) => {
            choose();
            drag(e, (dt) => upd((c) => (c.fadeIn = r3(Math.min(Math.max(0, fi0 + dt), d0)))));
          }}
        />
        <div
          className="fdot"
          style={{ left: Math.max(w - x(fo0), 10) - 6 }}
          title="fade de saída: arraste"
          onPointerDown={(e) => {
            choose();
            drag(e, (dt) => upd((c) => (c.fadeOut = r3(Math.min(Math.max(0, fo0 - dt), d0)))));
          }}
        />
      </div>
    );
  };

  // ---------- legenda ----------
  const hot = new Set(doc.captions.hot);
  const wordClip = (wd: { word: string; start: number; end: number }, i: number) => {
    const on = sel?.kind === "word" && sel.i === i;
    const s0 = wd.start;
    const e0 = wd.end;
    const upd = (fn: (w: { start: number; end: number }) => void) => live((d) => fn(d.captions.words[i]));
    return (
      <div
        key={i}
        className={`clip word ${on ? "sel" : ""} ${hot.has(wd.word) ? "hot" : ""}`}
        style={{ left: x(wd.start), width: Math.max(3, x(wd.end - wd.start) - 1) }}
        title={wd.word}
        onContextMenu={openMenu("word")}
        onPointerDown={(e) => {
          setSel({ kind: "word", i });
          drag(e, (dt) =>
            upd((w) => {
              w.start = r3(q(Math.max(0, s0 + dt)));
              w.end = r3(w.start + (e0 - s0));
            }),
          );
        }}
      >
        {wd.word}
        <div className="edge l" onPointerDown={(e) => (setSel({ kind: "word", i }), drag(e, (dt) => upd((w) => (w.start = r3(Math.min(q(s0 + dt), e0 - 1 / fps))))))} />
        <div className="edge r" onPointerDown={(e) => (setSel({ kind: "word", i }), drag(e, (dt) => upd((w) => (w.end = r3(Math.max(q(e0 + dt), s0 + 1 / fps))))))} />
      </div>
    );
  };

  // ---------- clipes da gravação (trilha Vídeo) ----------
  // Cada bloco é um take colado na edição. Puxar a borda (como no CapCut) estica ou encolhe o take na gravação:
  // a onda mostra o que existe além da borda, para achar o fim da palavra. Com o ÍMÃ ligado, tudo o que vem
  // depois (cenas, sons, zoom, legenda) anda junto; desligado, só a legenda acompanha a voz.
  const [clipDrag, setClipDrag] = useState<{ i: number; side: "a" | "b"; d: number; busy?: boolean } | null>(null);
  const srcDur = srcPeaks.length ? srcPeaks.length / 100 : Infinity;
  const clips = useMemo(() => {
    let t = 0;
    return spec.segments.map((g, i) => {
      const fr = g.frames ?? Math.round((g.b - g.a) * fps);
      const c = { i, a: g.a, b: g.b, e0: t / fps, dur: fr / fps };
      t += fr;
      return c;
    });
  }, [spec, fps]);
  // prévia durante o arrasto: o clipe puxado muda de tamanho e os seguintes andam
  const clipView = clips.map((c) => {
    if (!clipDrag) return { ...c, a1: c.a, b1: c.b, x0: c.e0, w: c.dur };
    const { i, side, d } = clipDrag;
    const grow = side === "b" ? d : -d;
    if (c.i < i) return { ...c, a1: c.a, b1: c.b, x0: c.e0, w: c.dur };
    if (c.i > i) return { ...c, a1: c.a, b1: c.b, x0: c.e0 + grow, w: c.dur };
    return side === "b" ? { ...c, a1: c.a, b1: c.b + d, x0: c.e0, w: c.dur + d } : { ...c, a1: c.a + d, b1: c.b, x0: c.e0, w: c.dur - d };
  });
  const clipEdge = (c: (typeof clips)[number], side: "a" | "b") => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (clipDrag?.busy) return;
    player.current?.pause();
    const x0 = e.clientX;
    const minFr = 3 / fps;
    let d = 0;
    const move = (ev: PointerEvent) => {
      const dt = q((ev.clientX - x0) / pps);
      d = side === "b" ? Math.min(Math.max(dt, minFr - c.dur), srcDur - c.b) : Math.max(Math.min(dt, c.dur - minFr), -c.a);
      d = r3(d);
      setClipDrag({ i: c.i, side, d });
    };
    const up = async () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (Math.abs(d) < 1 / fps / 2) return setClipDrag(null);
      setClipDrag({ i: c.i, side, d, busy: true });
      try {
        // 12/10: nunca mais "ajustando…" infinito — se o servidor não responder em 45 s, solta a borda
        await Promise.race([onTrimClip(c.i, side, d, side === "b" ? c.e0 + c.dur + d : c.e0), new Promise((res) => setTimeout(res, 45000))]);
      } catch {
        /* o erro já aparece no aviso */
      } finally {
        setClipDrag(null);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const clipText = (c: (typeof clips)[number]) =>
    doc.captions.words
      .filter((w) => w.start >= c.e0 - 0.01 && w.start < c.e0 + c.dur)
      .slice(0, 8)
      .map((w) => w.word)
      .join(" ");
  const fmtD = (d: number) => `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(2).replace(".", ",")} s`;

  // ---------- régua ----------
  const tickEvery = pps > 120 ? 0.5 : pps > 50 ? 1 : pps > 20 ? 2 : 5;
  const ticks: number[] = [];
  for (let t = 0; t <= total; t += tickEvery) ticks.push(t);
  const fmt = (t: number) => {
    const sec = (t % 60).toFixed(tickEvery < 1 ? 1 : 0).padStart(tickEvery < 1 ? 4 : 2, "0");
    return t >= 3600 ? `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}:${sec}` : `${Math.floor(t / 60)}:${sec}`;
  };

  const head = (label: string, h = ROW, extra?: React.ReactNode, Icon?: LucideIcon, color?: string) => (
    <div className="thead" style={{ width: HEAD, minWidth: HEAD, height: h }}>
      {color ? <span className="stripe" style={{ background: color }} /> : null}
      {Icon ? <Icon size={14} /> : null}
      {label}
      {extra}
    </div>
  );
  const rowStyle = (h = ROW): React.CSSProperties => ({ display: "flex", height: h, borderBottom: "1px solid var(--line)", width: W + HEAD });
  const lane = (h = ROW, onDbl?: (t: number) => void, children?: React.ReactNode) => (
    <div
      style={{ position: "relative", width: W, height: h }}
      onPointerDown={emptyDown}
      onContextMenu={(e) => e.target === e.currentTarget && openMenu("empty")(e)}
      onDoubleClick={(e) => onDbl && e.target === e.currentTarget && onDbl(tFromEvent(e))}
    >
      {children}
    </div>
  );

  const selSound = sel?.kind === "sound" ? doc.sounds.find((z) => z.id === sel.id) : undefined;
  const many = multi.length > 1;
  const item = (label: string, keys: string, fn: () => void, danger = false) => (
    <div
      className="ctx-item"
      style={danger ? { color: "#ff6b57" } : undefined}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.button !== 0) return;
        setMenu(null);
        fn();
      }}
    >
      <span>{label}</span>
      <span className="ctx-k">{keys}</span>
    </div>
  );
  const ctx = menu ? (
    <div className="ctx" style={{ left: Math.min(menu.x, window.innerWidth - 230), top: Math.min(menu.y, window.innerHeight - 250) }} onContextMenu={(e) => e.preventDefault()}>
      {menu.kind === "empty" ? (
        item("Colar aqui", "Ctrl+V", actions.paste)
      ) : many ? (
        item(`Apagar ${multi.length} itens`, "Del", actions.remove, true)
      ) : menu.kind === "scene" || menu.kind === "sound" ? (
        <>
          {item("Copiar", "Ctrl+C", () => void actions.copy())}
          {item("Recortar", "Ctrl+X", actions.cut)}
          {item("Duplicar no cursor", "Ctrl+D", actions.duplicate)}
          {item("Colar no cursor", "Ctrl+V", actions.paste)}
          {selSound
            ? item(selSound.muted ? "Ligar som" : "Silenciar som", "", () =>
                commitDoc((d) => {
                  const c = d.sounds.find((z) => z.id === selSound.id);
                  if (c) c.muted = !c.muted;
                }),
              )
            : null}
          <div className="ctx-sep" />
          {item("Apagar", "Del", actions.remove, true)}
        </>
      ) : (
        item("Apagar", "Del", actions.remove, true)
      )}
    </div>
  ) : null;

  return (
    <div className={`tl ${tool === "blade" ? "blade" : ""} ${locked ? "locked" : ""}`} style={{ display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
      {locked ? (
        // 11/11: capa por cima da timeline INTEIRA (barra + trilhas): nenhum clique, arraste, menu ou rolagem chega nela
        <div
          className="tl-lockcover"
          onPointerDownCapture={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onMouseDownCapture={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onContextMenu={(e) => e.preventDefault()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
          title="Tem um render rodando ou pausado. A timeline volta quando o render terminar ou for cancelado."
        >
          <div className="tl-lockmsg">
            <Lock size={16} /> Timeline trancada pelo render · volta quando o render terminar ou for cancelado
          </div>
        </div>
      ) : null}
      {ctx}
      <div className="tl-bar">
        <span className="time" ref={timeLabel}>
          {fmt(now)} <span>· {Math.round(now * fps)}</span>
        </span>
        <div className="toolseg">
          <button className={`icon ${tool === "select" ? "on" : ""}`} onClick={() => setTool("select")} title="Seta: escolher e arrastar (V)">
            <MousePointer2 size={15} />
          </button>
          <button
            className={`icon ${tool === "blade" ? "on" : ""}`}
            onClick={() => setTool(tool === "blade" ? "select" : "blade")}
            title="Lâmina: clique num clipe, cena ou som para dividir ali (C). Depois escolha o pedaço com a seta e aperte Delete"
          >
            <Scissors size={15} />
          </button>
        </div>
        <button className="icon" onClick={onOpenLib} title="Adicionar som (abre a biblioteca)">
          <Plus size={15} />
        </button>
        <button className="icon" onClick={onCutBreaths} title={`Respiros e pausas${pauses.length ? ` · ${pauses.length} encontrados` : ""}: ver e cortar`}>
          <Wind size={15} />
          {pauses.length ? <span className="ibadge">{pauses.length}</span> : null}
        </button>
        <button className="icon" onClick={() => commitDoc((d) => void packFxTracks(d))} title="Organizar trilhas: sons diferentes nunca ficam encavalados na mesma trilha (Ctrl+Z desfaz)">
          <Rows3 size={15} />
        </button>
        {solo.length ? (
          <button onClick={() => setSolo([])} title="Sair do solo e ouvir todos os sons e a voz" style={{ background: "#f5c542", color: "#1a1300", borderColor: "#f5c542", fontWeight: 700 }}>
            <Volume2 size={14} /> Solo · ouvir tudo
          </button>
        ) : null}
        {lastEdit ? (
          <button className="icon" onClick={onLastEdit} title={`Ir para a última edição do Claude: ${lastEdit.label}`}>
            <LocateFixed size={15} />
          </button>
        ) : null}
        <button className="icon" onClick={onAddMarker} title="Marcador no cursor, com nota (M)">
          <Bookmark size={15} />
        </button>
        {inOut.a !== undefined && inOut.b !== undefined ? (
          <button className="cutbtn" onClick={onCutRange} title="Tira esse trecho do vídeo e puxa o resto (Shift+Del)">
            <Scissors size={14} /> Cortar trecho · {(inOut.b - inOut.a).toFixed(2)} s
          </button>
        ) : null}
        <div className="spacer" />
        {locked ? (
          <span className="tl-locked" title="Tem um render rodando ou pausado. Para não mudar os blocos que ele já fez, a timeline só volta a editar quando o render terminar ou for cancelado. Dá para assistir e navegar normalmente.">
            <Lock size={13} /> Timeline trancada pelo render
          </span>
        ) : null}
        <button
          className={`chip ${follow ? "on" : ""}`}
          onClick={() => setFollow((f) => !f)}
          title={follow ? "A timeline acompanha o cursor enquanto toca (clique para soltar)" : "A timeline fica parada onde você deixar (clique para acompanhar o cursor)"}
        >
          {follow ? <Lock size={13} /> : <LockOpen size={13} />} {follow ? "Seguindo o cursor" : "Timeline livre"}
        </button>
        <span className="zoomctl">
          <ZoomOut size={14} />
          <input type="range" min={8} max={400} value={pps} onChange={(e) => setPps(+e.target.value)} style={{ width: 150 }} />
          <ZoomIn size={14} />
        </span>
      </div>
      <div ref={body} className="tl-scroll" style={{ position: "relative", overflow: "auto", flex: 1 }}>
        <div style={{ position: "relative", width: W + HEAD }}>
          {band ? (
            <div
              style={{ position: "absolute", left: Math.min(band.x0, band.x1), width: Math.abs(band.x1 - band.x0), top: Math.min(band.y0, band.y1), height: Math.abs(band.y1 - band.y0), background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.7)", borderRadius: 3, pointerEvents: "none", zIndex: 8 }}
            />
          ) : null}
          {/* régua */}
          <div style={{ ...rowStyle(24), position: "sticky", top: 0, zIndex: 7, background: "var(--surface)" }}>
            {head("")}
            <div style={{ position: "relative", width: W, height: 24, cursor: "ew-resize" }} onPointerDown={scrub} title="clique e arraste para escolher o momento">
              <div ref={rhandle} className="rhandle" style={{ left: x(now) }} onPointerDown={scrub} title="segure e arraste" />
              {inOut.a !== undefined ? <div className="io-mark in" style={{ left: x(inOut.a) }} title="entrada (I)" /> : null}
              {inOut.b !== undefined ? <div className="io-mark out" style={{ left: x(inOut.b) }} title="saída (O)" /> : null}
              {(doc.markers ?? []).map((m) => {
                const t0 = m.t;
                const on = sel?.kind === "marker" && sel.id === m.id;
                return (
                  <div
                    key={m.id}
                    className={`mkflag ${on ? "sel" : ""} ${m.done ? "done" : ""}`}
                    style={{ left: x(m.t) }}
                    title={m.note || "marcador sem nota"}
                    onContextMenu={openMenu("marker")}
                    onPointerDown={(e) => {
                      setSel({ kind: "marker", id: m.id });
                      seek(m.t);
                      drag(e, (dt, ev) =>
                        live((d) => {
                          const c = (d.markers ?? []).find((z) => z.id === m.id);
                          if (c) c.t = r3(snap(Math.max(0, t0 + dt), ev.altKey));
                        }),
                      );
                    }}
                  >
                    {m.note ? <span className="mknote">{m.note}</span> : null}
                  </div>
                );
              })}
              {ticks.filter((t) => inView(t, t + tickEvery)).map((t) => (
                <React.Fragment key={t}>
                  <div className="tl-tick" style={{ left: x(t) }}>
                    {fmt(t)}
                  </div>
                  {[1, 2, 3, 4].map((k) => (
                    <div key={k} className="tl-tick minor" style={{ left: x(t + (tickEvery * k) / 5) }} />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div style={rowStyle(CROW)}>
            {head(
              "Vídeo",
              CROW,
              <button
                className={`chip mag ${magnet ? "on" : ""}`}
                onClick={() => setMagnet(!magnet)}
                title={
                  magnet
                    ? "Ímã ligado: ao puxar a borda de um clipe, tudo o que vem depois (cenas, sons, zoom e legenda) anda junto. Clique para desligar."
                    : "Ímã desligado: ao puxar a borda de um clipe, só a legenda acompanha a voz; cenas, sons e zoom ficam onde estão. Clique para ligar."
                }
              >
                <Magnet size={12} /> Ímã
              </button>,
              Film,
              "#e2e8f0",
            )}
            <div style={{ position: "relative", width: W, height: CROW }} onPointerDown={emptyDown}>
              {clipView.filter((c) => inView(c.x0, c.x0 + c.w)).map((c) => {
                const dragging = clipDrag?.i === c.i;
                const label = clipText(c);
                const w = Math.max(4, x(c.w) - 1);
                return (
                  <div
                    key={c.i}
                    className={`vclip ${c.i % 2 ? "alt" : ""} ${dragging ? "drag" : ""} ${sel?.kind === "clip" && sel.i === c.i ? "sel" : ""}`}
                    style={{ left: x(c.x0), width: w }}
                    title={
                      tool === "blade"
                        ? "clique para dividir o clipe aqui"
                        : `clipe ${c.i + 1} · ${c.a1.toFixed(2)}–${c.b1.toFixed(2)} s da gravação · clique para escolher (Delete tira do vídeo) · puxe as bordas para esticar ou encolher`
                    }
                    onPointerDown={(e) => {
                      if (tool === "blade") {
                        e.stopPropagation();
                        onBlade({ kind: "clip" }, tFromEvent(e));
                        return;
                      }
                      if (e.target !== e.currentTarget) return;
                      setSel({ kind: "clip", i: c.i });
                      seek(tFromEvent(e));
                    }}
                  >
                    <ClipWave peaks={srcPeaks} a={c.a1} b={c.b1} a0={c.a} b0={c.b} width={w} height={CROW - 8} />
                    {w > 60 ? <span className="vname">{label}</span> : null}
                    <div className="edge l" onPointerDown={clipEdge(c, "a")} title="puxe para começar antes ou depois" />
                    <div className="edge r" onPointerDown={clipEdge(c, "b")} title="puxe para terminar depois ou antes" />
                    {dragging && clipDrag ? <span className={`vbadge ${clipDrag.side}`}>{clipDrag.busy ? "ajustando…" : fmtD(clipDrag.side === "b" ? clipDrag.d : -clipDrag.d)}</span> : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={rowStyle(VROW)}>
            {head(
              "Voz",
              VROW,
              <>
                {doc.voice?.fx && Object.values(doc.voice.fx).some(Boolean) ? <span className="fxbadge">fx</span> : null}
                <button
                  className="icon ghost tbtn"
                  title={solo.includes("__voz") ? "Tirar a voz do solo" : "Solo: ouvir só a voz (Ctrl+clique soma trilhas de som). Só na prévia."}
                  style={{ fontWeight: 800, fontSize: 11, width: 22, marginLeft: "auto", color: solo.includes("__voz") ? "#1a1300" : undefined, background: solo.includes("__voz") ? "#f5c542" : undefined, borderRadius: 5 }}
                  onClick={(e) => {
                    const on = solo.includes("__voz");
                    if (e.ctrlKey || e.metaKey) setSolo(on ? solo.filter((x) => x !== "__voz") : [...solo, "__voz"]);
                    else setSolo(on && solo.length === 1 ? [] : ["__voz"]);
                  }}
                >
                  S
                </button>
                <button className="icon ghost tbtn" title={voiceMute ? "Ligar a voz na prévia" : "Calar a voz na prévia (o render continua com voz)"} style={{ color: voiceMute ? "#f87171" : undefined }} onClick={() => setVoiceMute(!voiceMute)}>
                  {voiceMute ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </>,
              Mic,
              "var(--voice)",
            )}
            <div
              className={`vlane ${sel?.kind === "voice" ? "sel" : ""}`}
              style={{ position: "relative", width: W, height: VROW, cursor: "pointer" }}
              onPointerDown={(e) => {
                setSel({ kind: "voice" });
                seek(tFromEvent(e));
              }}
              title="clique para os efeitos da voz"
            >
              <canvas ref={wave} className="wave" style={{ pointerEvents: "none" }} />
              {pauses.map((p, i) => !inView(p.a, p.b) ? null : (
                <div
                  key={i}
                  className="pmark"
                  style={{ left: x(p.a), width: Math.max(3, x(p.b - p.a)) }}
                  title={`${p.kind} de ${p.dur.toFixed(2)} s · clique para ver o corte de respiros · botão direito: desconsiderar`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onIgnorePause?.(p);
                  }}
                  onPointerDown={(e) => {
                    if (e.button === 2) return;
                    e.stopPropagation();
                    seek(p.a);
                    onCutBreaths();
                  }}
                />
              ))}
            </div>
          </div>
          <div style={rowStyle()}>
            {head("Cenas", ROW, null, Clapperboard, "var(--scene)")}
            {lane(ROW, undefined, lane0.filter((sc) => inView(sc.start, sc.end)).map(sceneClip))}
          </div>
          <div style={rowStyle()}>
            {head("Carimbos", ROW, null, Stamp, "var(--over)")}
            {lane(ROW, undefined, lane1.filter((sc) => inView(sc.start, sc.end)).map(sceneClip))}
          </div>
          {tracks.map((tk, ti) => (
            <div key={tk.id} style={{ ...rowStyle(SROW + 4), opacity: solo.length ? (solo.includes(tk.id) ? 1 : 0.35) : tk.muted ? 0.55 : 1 }}>
              <div className="thead" style={{ width: HEAD, minWidth: HEAD, height: SROW + 4 }} title="duplo clique para renomear">
                <span className="stripe" style={{ background: "var(--sound)" }} />
                <Music size={14} />
                <span
                  className="tname"
                  onDoubleClick={() => {
                    const n = prompt("Nome da trilha", tk.name);
                    if (n) commitTracks((ts) => (ts.find((x) => x.id === tk.id)!.name = n));
                  }}
                >
                  {tk.name}
                </span>
                <button
                  className="icon ghost tbtn"
                  title={solo.includes(tk.id) ? "Tirar do solo" : "Solo: ouvir só esta trilha (Ctrl+clique soma outras). A voz fica muda enquanto houver solo."}
                  style={{ fontWeight: 800, fontSize: 11, width: 22, color: solo.includes(tk.id) ? "#1a1300" : undefined, background: solo.includes(tk.id) ? "#f5c542" : undefined, borderRadius: 5 }}
                  onClick={(e) => {
                    const on = solo.includes(tk.id);
                    if (e.ctrlKey || e.metaKey) setSolo(on ? solo.filter((x) => x !== tk.id) : [...solo, tk.id]);
                    else setSolo(on && solo.length === 1 ? [] : [tk.id]);
                  }}
                >
                  S
                </button>
                <button className="icon ghost tbtn" title={tk.muted ? "Ligar som da trilha" : "Silenciar trilha"} onClick={() => commitTracks((ts) => (ts.find((x) => x.id === tk.id)!.muted = !tk.muted))}>
                  {tk.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                {tracks.length > 1 ? (
                  <button
                    className="icon ghost tbtn"
                    title={/^m[uú]sica/i.test(tk.name) ? "Apagar trilha e a música dela (Ctrl+Z desfaz)" : `Apagar trilha; os sons vão para "${tracks[ti === 0 ? 1 : 0].name}" (Ctrl+Z desfaz)`}
                    onClick={() => {
                      // um clique só (o confirm() do navegador é bloqueado no painel do app e o "clique duas vezes" confundia)
                      const to = tracks[ti === 0 ? 1 : 0].id;
                      const isMusic = /^m[uú]sica/i.test(tk.name); // trilha de música: some com a música (mover para Efeitos não faz sentido)
                      commitDoc((d) => {
                        d.soundTracks = (d.soundTracks ?? []).filter((x) => x.id !== tk.id);
                        if (isMusic) d.sounds = d.sounds.filter((snd) => (snd.track ?? tracks[0].id) !== tk.id);
                        else for (const snd of d.sounds) if ((snd.track ?? tracks[0].id) === tk.id) snd.track = to;
                      });
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                ) : null}
              </div>
              <div
                data-track={tk.id}
                style={{ position: "relative", width: W, height: SROW + 4 }}
                onPointerDown={emptyDown}
                onContextMenu={(e) => e.target === e.currentTarget && openMenu("empty")(e)}
                onDoubleClick={(e) => libSel && e.target === e.currentTarget && onDropSound(libSel, q(tFromEvent(e)), tk.id)}
                onDragOver={(e) => {
                  if (!isSfxDrag(e)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  const t = q(tFromEvent(e));
                  if (!dropAt || dropAt.t !== t || dropAt.track !== tk.id) setDropAt({ t, track: tk.id });
                }}
                onDragLeave={(e) => {
                  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDropAt(null);
                }}
                onDrop={(e) => {
                  const src = e.dataTransfer.getData("application/x-estudio-sfx");
                  setDropAt(null);
                  if (!src) return;
                  e.preventDefault();
                  onDropSound(src, q(tFromEvent(e)), tk.id);
                }}
              >
                {doc.sounds.filter((snd) => trackOf(snd) === tk.id && inView(snd.start, snd.start + (snd.dur ?? 1))).map(soundClip)}
                {dropAt && dropAt.track === tk.id ? <div style={{ position: "absolute", left: x(dropAt.t) - 1, top: 0, bottom: 0, width: 2, background: "var(--voice, #2dd4bf)", boxShadow: "0 0 8px var(--voice, #2dd4bf)", pointerEvents: "none" }} /> : null}
              </div>
            </div>
          ))}
          <div style={rowStyle(26)}>
            <div className="thead" style={{ width: HEAD, minWidth: HEAD, height: 26 }}>
              <button
                className="ghost"
                style={{ padding: "2px 6px", fontSize: 12 }}
                onClick={() =>
                  commitDoc((d) => {
                    const ts = d.soundTracks?.length ? d.soundTracks : [{ id: "t1", name: "Sons" }];
                    ts.push({ id: `t${Date.now().toString(36)}`, name: `Sons ${ts.length + 1}` });
                    d.soundTracks = ts;
                  })
                }
              >
                <Plus size={13} /> Trilha
              </button>
            </div>
            <div style={{ width: W }} />
          </div>
          <div style={rowStyle()}>
            {head("Legenda", ROW, null, Captions, "var(--word)")}
            {lane(ROW, undefined, doc.captions.words.map((w, i) => (inView(w.start, w.end) ? wordClip(w, i) : null)))}
          </div>
          <div style={rowStyle()}>
            {head("Zoom", ROW, null, ZoomIn, "var(--zoom)")}
            {lane(
              ROW,
              undefined,
              <>
                {doc.zoom.pushes.map((p, i) => {
                  const end = p.until === "end" ? total : p.until;
                  const t0 = p.t;
                  const e0 = end;
                  const on = sel?.kind === "push" && sel.i === i;
                  return (
                    <div
                      key={`p${i}`}
                      className={`clip push ${on ? "sel" : ""}`}
                      style={{ left: x(p.t), width: Math.max(4, x(end - p.t)) }}
                      title={`aproximação ${p.z}x`}
                      onContextMenu={openMenu("push")}
                      onPointerDown={(e) => {
                        setSel({ kind: "push", i });
                        drag(e, (dt, ev) =>
                          live((d) => {
                            const c = d.zoom.pushes[i];
                            const nt = snap(Math.max(0, t0 + dt), ev.altKey);
                            c.t = r3(nt);
                            if (c.until !== "end") c.until = r3(nt + (e0 - t0));
                          }),
                        );
                      }}
                    >
                      {p.z}x
                      <div
                        className="edge r"
                        onPointerDown={(e) => {
                          setSel({ kind: "push", i });
                          drag(e, (dt, ev) => live((d) => (d.zoom.pushes[i].until = r3(Math.max(snap(e0 + dt, ev.altKey), t0 + 0.1)))));
                        }}
                      />
                    </div>
                  );
                })}
                {doc.zoom.snaps.map((s, i) => {
                  const t0 = s.t;
                  return (
                    <div
                      key={`s${i}`}
                      className={`diamond ${sel?.kind === "snap" && sel.i === i ? "sel" : ""}`}
                      style={{ left: x(s.t) }}
                      title={`enquadramento ${s.z}x`}
                      onContextMenu={openMenu("snap")}
                      onPointerDown={(e) => {
                        setSel({ kind: "snap", i });
                        drag(e, (dt, ev) => live((d) => (d.zoom.snaps[i].t = r3(snap(Math.max(0, t0 + dt), ev.altKey)))));
                      }}
                    />
                  );
                })}
              </>,
            )}
          </div>
          {inOut.a !== undefined && inOut.b !== undefined ? <div className="io-band" style={{ left: HEAD + x(inOut.a), width: Math.max(2, x(inOut.b - inOut.a)) }} /> : null}
          {(doc.markers ?? []).map((m) => (
            <div key={`ml${m.id}`} className="mkline" style={{ left: HEAD + x(m.t) }} />
          ))}
          <div ref={playhead} className="playhead" style={{ left: HEAD + x(now) }} />
        </div>
      </div>
      <HScroll body={body} />
    </div>
  );
};

// Barra de rolagem horizontal PRÓPRIA (a nativa ficava minúscula, passava por baixo dos nomes das trilhas e piscava):
// só embaixo das trilhas, alça com largura mínima de 90 px, arrastar a alça ou clicar na trilha para pular.
const HScroll: React.FC<{ body: React.RefObject<HTMLDivElement | null> }> = ({ body }) => {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const MIN = 90;
  const layout = useCallback(() => {
    const el = body.current;
    const tr = track.current;
    const th = thumb.current;
    if (!el || !tr || !th) return;
    const view = el.clientWidth - HEAD;
    const full = el.scrollWidth - HEAD;
    const tw = tr.clientWidth;
    if (full <= view + 1) {
      th.style.display = "none";
      return;
    }
    th.style.display = "block";
    const w = Math.max(MIN, Math.min(tw, (view / full) * tw));
    const x = (el.scrollLeft / Math.max(1, full - view)) * (tw - w);
    th.style.width = `${w}px`;
    th.style.transform = `translateX(${x}px)`;
  }, [body]);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    layout();
    el.addEventListener("scroll", layout, { passive: true });
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    if (track.current) ro.observe(track.current);
    return () => {
      el.removeEventListener("scroll", layout);
      ro.disconnect();
    };
  }, [layout, body]);
  const drag = (e: React.PointerEvent) => {
    const el = body.current;
    const tr = track.current;
    const th = thumb.current;
    if (!el || !tr || !th) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const s0 = el.scrollLeft;
    const kFull = (el.scrollWidth - el.clientWidth) / Math.max(1, tr.clientWidth - th.offsetWidth);
    // 11/10 (pedido dele: com o vídeo longo e a timeline aproximada, arrastar esta barra pulava minutos): arrastar anda
    // devagar (no máximo 6 px da timeline por px do mouse) para passear entre cenas próximas; com Shift, rápido como antes.
    const k = Math.min(kFull, 6);
    th.classList.add("on");
    const mv = (ev: PointerEvent) => (el.scrollLeft = s0 + (ev.clientX - startX) * (ev.shiftKey ? kFull : k));
    const up = () => {
      th.classList.remove("on");
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };
  const jump = (e: React.PointerEvent) => {
    const el = body.current;
    const tr = track.current;
    const th = thumb.current;
    if (!el || !tr || !th || e.target !== tr) return;
    const r = tr.getBoundingClientRect();
    const w = th.offsetWidth;
    const x = Math.min(Math.max(0, e.clientX - r.left - w / 2), r.width - w);
    el.scrollLeft = (x / Math.max(1, r.width - w)) * (el.scrollWidth - el.clientWidth);
    drag(e);
  };
  return (
    <div className="hscroll">
      <div style={{ width: HEAD, flex: "none" }} />
      <div ref={track} className="hscroll-track" onPointerDown={jump}>
        <div ref={thumb} className="hscroll-thumb" onPointerDown={drag} />
      </div>
    </div>
  );
};

const TimelineMemo = React.memo(TimelineInner);

// Onda do trecho da GRAVAÇÃO que o clipe mostra; o que o arrasto revelou aparece em amarelo.
const ClipWave: React.FC<{ peaks: number[]; a: number; b: number; a0: number; b0: number; width: number; height: number }> = ({ peaks, a, b, a0, b0, width, height }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !peaks.length) return;
    const w = Math.max(1, Math.min(8000, Math.round(width)));
    c.width = w;
    c.height = height;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, w, height);
    const span = b - a;
    for (let px = 0; px < w; px++) {
      const t0 = a + (px / w) * span;
      const t1 = a + ((px + 1) / w) * span;
      let m = 0;
      for (let i = Math.floor(t0 * 100); i <= Math.floor(t1 * 100) && i < peaks.length; i++) m = Math.max(m, peaks[i] ?? 0);
      const h = Math.max(1, Math.min(1, m * 1.6) * (height - 4));
      const fresh = t0 < a0 - 1e-3 || t1 > b0 + 1e-3; // fora do clipe original
      g.fillStyle = fresh ? "rgba(253, 224, 71, 0.95)" : "rgba(226, 232, 240, 0.55)";
      g.fillRect(px, (height - h) / 2, 1, h);
    }
  }, [peaks, a, b, a0, b0, width, height]);
  return <canvas ref={ref} style={{ position: "absolute", left: 0, top: 4, width, height, pointerEvents: "none" }} />;
};

// Onda de um som dentro do bloco: o trecho tocado (trim + dur), altura pelo volume
// e a curva de fade de entrada/saída por cima (como no CapCut).
const waveCache: Record<string, Promise<number[]>> = {};
const getWave = (src: string) => (waveCache[src] ??= fetch(`/api/wave?src=${encodeURIComponent(src)}`).then((r) => r.json()));

const SoundWave: React.FC<{ src: string; trim: number; dur: number; width: number; height: number; vol: number; fadeIn: number; fadeOut: number; pps: number }> = ({
  src,
  trim,
  dur,
  width,
  height,
  vol,
  fadeIn,
  fadeOut,
  pps,
}) => {
  const [pk, setPk] = useState<number[] | null>(null);
  useEffect(() => {
    let ok = true;
    getWave(src).then((p) => ok && setPk(p));
    return () => {
      ok = false;
    };
  }, [src]);
  const bars: string[] = [];
  if (Array.isArray(pk)) {
    const peak = Math.max(0.05, ...pk);
    const step = Math.max(1, Math.round(width / 160)); // no máximo ~160 barras por bloco
    for (let px = 0; px < width; px += step) {
      const t = trim + px / pps;
      let m = 0;
      for (let i = Math.floor(t * 100); i < Math.floor((t + step / pps) * 100) + 1 && i < pk.length; i++) m = Math.max(m, pk[i] ?? 0);
      const env = Math.min(1, fadeIn > 0 ? px / pps / fadeIn : 1, fadeOut > 0 ? (width - px) / pps / fadeOut : 1);
      const h = Math.max(1, (m / peak) * Math.min(1, vol * 1.6) * env * (height - 16));
      bars.push(`M${px + 0.5} ${height / 2 + 4 - h / 2}v${h}`);
    }
  }
  const fi = Math.min(width, fadeIn * pps);
  const fo = Math.min(width, fadeOut * pps);
  return (
    <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      <path d={bars.join("")} stroke="rgba(170,255,215,0.85)" strokeWidth={Math.max(1, Math.round(width / 160)) > 1 ? 2 : 1} />
      {fi > 0 ? <path d={`M0 ${height} Q${fi * 0.15} ${height * 0.25} ${fi} 8 L0 8 Z`} fill="rgba(0,0,0,0.35)" /> : null}
      {fo > 0 ? <path d={`M${width} ${height} Q${width - fo * 0.15} ${height * 0.25} ${width - fo} 8 L${width} 8 Z`} fill="rgba(0,0,0,0.35)" /> : null}
      {fi > 0 ? <path d={`M0 ${height} Q${fi * 0.15} ${height * 0.25} ${fi} 8`} stroke="#fff" strokeWidth={1.5} fill="none" /> : null}
      {fo > 0 ? <path d={`M${width} ${height} Q${width - fo * 0.15} ${height * 0.25} ${width - fo} 8`} stroke="#fff" strokeWidth={1.5} fill="none" /> : null}
    </svg>
  );
};
