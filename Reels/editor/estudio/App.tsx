import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { installDiag } from "./diag";
import { useHourLabel } from "./hourLabel";
import { Player, PlayerRef } from "@remotion/player";
import { Bookmark, Check, Clapperboard, Copy, Download, Film, FolderOpen, History, Keyboard, LayoutGrid, Loader2, Maximize2, MessageSquareText, Minimize2, Music, Pause as PauseIcon, Play as PlayIcon, Redo2, RotateCw, Save, Smartphone, Sparkles, Trash2, Type, Undo2, X } from "lucide-react";
import { EditRenderer } from "../src/lib/edit/EditRenderer";
import { EditDoc, SceneClip, SoundClip } from "../src/lib/edit/types";
import { SegSpec, makeTimeline } from "../src/lib/timeline";
import { Timeline, Sel } from "./Timeline";
import { packRows } from "./util";
import { Inspector } from "./Inspector";
import { Library, MusicItem, SfxItem } from "./Library";
import { GroupPanel } from "./GroupPanel";
import { clone, copyText, pickFxTrack, r3, rangeOf, shiftInner, type TextSel } from "./util";
import { SafeZones } from "./SafeZones";
import { mergeDocs } from "./merge";
import { VoiceEngine } from "./voiceEngine";
import { SfxEngine, type SfxClip } from "./sfxEngine";
import { Transcript } from "./Transcript";
import { PendButton, PendDrawer, usePendencias } from "./Pendencias";
import type { Pause, TightenOpts, TightenSt } from "./Inspector";
import { ESTUDIO } from "./perfil";

// Estúdio: o Claude monta o edit.json, a pessoa refina aqui.

type Loaded = { doc: EditDoc; spec: SegSpec };
type Snap = { json: string; gen: number };

const Comp: React.FC<{ doc: EditDoc; spec: SegSpec }> = ({ doc, spec }) => {
  const tl = useMemo(() => makeTimeline(spec), [spec]);
  return <EditRenderer doc={doc} tl={tl} lite />;
};


export const App: React.FC = () => {
  const [videos, setVideos] = useState<{ slug: string }[]>([]);
  const [slug, setSlug] = useState<string>(() => new URLSearchParams(location.search).get("v") || "");
  const [data, setData] = useState<Loaded | null>(null);
  // HISTÓRICO DO CTRL+Z (06/11/2026, desempenho): cada passo guardado como TEXTO (JSON), não como objeto. Com o HL3
  // (2,9 MB, 4 mil sons, 21 mil palavras) as até 80 cópias em objeto ocupavam muita memória e o navegador parava para
  // limpar (travava até parado). `gen` = quantas mudanças de fora já existiam quando o passo foi guardado.
  const [past, setPast] = useState<Snap[]>([]);
  const [future, setFuture] = useState<Snap[]>([]);
  const docRef = useRef<EditDoc | null>(null);
  docRef.current = data?.doc ?? null;
  // MUDANÇA DE FORA (Claude gravou o edit.json): o histórico do Ctrl+Z também recebe a mudança. Antes ele guardava as
  // versões de ANTES e um Ctrl+Z depois voltava o projeto inteiro para uma delas, apagando o que veio de fora.
  // Antes a fusão era feita na hora em TODOS os passos (até 80 × ~40 ms = a tela parava ~3 s a cada gravação de fora);
  // agora só se anota a mudança, e a fusão é feita no passo que o Ctrl+Z/Ctrl+Y de fato abrir.
  // registro das mudanças de fora (em texto); `off` = quantas já foram descartadas do começo
  const rebaseLog = useRef<{ off: number; list: { before: string; after: string }[] }>({ off: 0, list: [] });
  const histRef = useRef<{ past: Snap[]; future: Snap[] }>({ past: [], future: [] });
  histRef.current = { past, future };
  const snap = useCallback((d: EditDoc): Snap => ({ json: JSON.stringify(d), gen: rebaseLog.current.off + rebaseLog.current.list.length }), []);
  const restore = useCallback((s: Snap): EditDoc => {
    const lg = rebaseLog.current;
    let d = JSON.parse(s.json) as EditDoc;
    for (const r of lg.list.slice(Math.max(0, s.gen - lg.off))) d = mergeDocs(JSON.parse(r.before), d, JSON.parse(r.after));
    return d;
  }, []);
  const rebaseHistory = useCallback((before: EditDoc, after: EditDoc) => {
    const lg = rebaseLog.current;
    const { past: p, future: f } = histRef.current;
    const keep = [...p.slice(-40), ...f.slice(0, 40)];
    if (!keep.length) {
      // nada para desfazer: não precisa anotar nada
      lg.off += lg.list.length;
      lg.list = [];
    } else {
      // descarta o que nenhum passo guardado ainda precisa
      const min = Math.min(...keep.map((s) => s.gen));
      if (min > lg.off) {
        lg.list = lg.list.slice(min - lg.off);
        lg.off = min;
      }
      lg.list.push({ before: JSON.stringify(before), after: JSON.stringify(after) });
    }
    setPast((l) => l.slice(-40));
    setFuture((l) => l.slice(0, 40));
  }, []);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");
  // mensagens viram um aviso flutuante que some sozinho (antes ficavam no topo e quebravam o cabeçalho)
  useEffect(() => {
    if (!status || status === "salvo") return;
    const id = setTimeout(() => setStatus(""), 4500);
    return () => clearTimeout(id);
  }, [status]);
  const [sel, setSel] = useState<Sel>(null);
  const [multi, setMulti] = useState<string[]>([]); // seleção múltipla da timeline ("scene:<id>" / "sound:<id>")
  const [frame, setFrame] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [lib, setLib] = useState<SfxItem[]>([]);
  const [libSel, setLibSel] = useState<string>("");
  type RenderSt = { done: boolean; paused?: boolean; ok?: boolean; file?: string; error?: string; cancelled?: boolean; phase?: string; pct?: number; eta?: string; elapsed?: number; frames?: string; idle?: boolean; last?: { file: string; mtime: number; stale?: boolean } | null };
  const [render, setRender] = useState<RenderSt | null>(null);
  // 11/11: timeline trancada enquanto há render rodando ou pausado (só destrava quando termina ou é cancelado).
  // As mudanças de edição são descartadas aqui, e o servidor recusa qualquer gravação no vídeo (423).
  const locked = !!render && !render.done;
  const lockedRef = useRef(false);
  lockedRef.current = locked;
  const lockMsg = () => setStatus("timeline trancada durante o render: termine ou cancele o render para editar");
  const [last, setLast] = useState<{ file: string; mtime: number; stale?: boolean } | null>(null); // último vídeo pronto em out/<slug>
  const reveal = (file: string) => fetch(`/api/reveal?p=${encodeURIComponent(file)}`).then((r) => r.json()).then((j) => setStatus(j.ok ? `Aberto no Explorer: ${j.path}` : j.error));
  const [proxy, setProxy] = useState<string>("");
  const [libOpen, setLibOpen] = useState(false);
  const libRef = useRef<HTMLDivElement | null>(null);
  // biblioteca fecha ao clicar fora dela ou com Esc (antes só pelo X lá em cima)
  useEffect(() => {
    if (!libOpen) return;
    const down = (e: PointerEvent) => {
      if (libRef.current && !libRef.current.contains(e.target as Node)) setLibOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setLibOpen(false);
    // no próximo tique: o próprio clique que abriu a biblioteca não pode fechá-la
    const id = setTimeout(() => {
      window.addEventListener("pointerdown", down, true);
      window.addEventListener("keydown", key);
    }, 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("keydown", key);
    };
  }, [libOpen]);
  const [help, setHelp] = useState(false);
  const [big, setBig] = useState(false);
  const [pauses, setPauses] = useState<Pause[]>([]);
  // pausas desconsideradas (segundos da gravação, em src/videos/<slug>/pauses-ignore.json)
  const [ignored, setIgnored] = useState<[number, number][]>([]);
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/pauses-ignore/${slug}`).then((r) => r.json()).then((l) => setIgnored(Array.isArray(l) ? l : [])).catch(() => setIgnored([]));
  }, [slug]);
  const isIgn = (p: Pause) => !!p.src && ignored.some(([a, b]) => a - 0.05 <= (p.src![0] + p.src![1]) / 2 && (p.src![0] + p.src![1]) / 2 <= b + 0.05);
  const livePauses = pauses.filter((p) => !isIgn(p));
  const saveIgnored = async (l: [number, number][]) => {
    if (lockedRef.current) return lockMsg();
    setIgnored(l);
    await fetch(`/api/pauses-ignore/${slug}`, { method: "POST", body: JSON.stringify({ set: l }) }).catch(() => {});
  };
  const ignorePauses = (ps: Pause[]) => {
    if (lockedRef.current) return lockMsg();
    const add = ps.filter((p) => p.src && !isIgn(p)).map((p) => p.src!);
    if (!add.length) return;
    void saveIgnored([...ignored, ...add]);
    setStatus(`${add.length} ${add.length === 1 ? "pausa desconsiderada" : "pausas desconsideradas"} · "Analisar de novo" traz de volta`);
  };
  const reanalyzePauses = async () => {
    await saveIgnored([]);
    const p = await (await fetch(`/api/pauses/${slug}`)).json();
    if (Array.isArray(p)) setPauses(p);
  };
  // ferramentas de editor (Premiere/AE): trecho I/O, velocidade J/K/L, safe zone, painel de texto, cortes, versões
  const [inOut, setInOut] = useState<{ a?: number; b?: number }>({});
  const [rate, setRate] = useState(1);
  const [safe, setSafe] = useState(() => {
    try {
      return localStorage.getItem("estudio.safe") === "1";
    } catch {
      return false;
    }
  });
  const [fitSig, setFitSig] = useState(0);
  // ÚLTIMA EDIÇÃO DO CLAUDE (out/<slug>/focus.json, escrito por tools/focus.py): quando aparece uma nova, o Estúdio
  // leva o cursor e a timeline até o trecho (se estiver tocando, espera parar); o botão ⌖ volta para lá
  const [focus, setFocus] = useState<{ t: number; a: number; b: number; label: string; ts: number } | null>(null);
  const [tlReveal, setTlReveal] = useState<{ a: number; b: number; n: number } | undefined>(undefined);
  const goFocus = (fc: { a: number; b: number; label: string }) => {
    const fr0 = Math.max(0, Math.round(fc.a * 30));
    player.current?.pause();
    player.current?.seekTo(fr0);
    setTimeout(() => player.current && player.current.getCurrentFrame() !== fr0 && player.current.seekTo(fr0), 800);
    setTimeout(() => player.current && player.current.getCurrentFrame() !== fr0 && player.current.seekTo(fr0), 2000);
    setTlReveal((r) => ({ a: fc.a, b: fc.b, n: (r?.n ?? 0) + 1 }));
  };
  const [textOpen, setTextOpen] = useState(false);
  // pendências do Paulo (out/<slug>/pendencias.json, mantida pelo Claude): o tempo leva ao trecho, o X tira da lista
  const [pendOpen, setPendOpen] = useState(false);
  const pend = usePendencias(slug);
  // (o ref é lido pelo ouvinte do player, que não é recriado a cada render)
  // legenda do Instagram deste vídeo (gerar, editar, copiar)
  const [capOpen, setCapOpen] = useState(false);
  const [cap, setCap] = useState<{ text: string; source: string; model?: string; edited?: boolean } | null>(null);
  const [capText, setCapText] = useState("");
  const [capBusy, setCapBusy] = useState(false);
  const [capCopied, setCapCopied] = useState(false);
  const [textSel, setTextSel] = useState<TextSel>(null);
  const [undoCuts, setUndoCuts] = useState(0);
  const [redoCuts, setRedoCuts] = useState(0); // 05/11: cortes desfeitos que o Ctrl+Y refaz
  const [srcPeaks, setSrcPeaks] = useState<number[]>([]); // onda da gravação inteira (trilha Vídeo)
  // ÍMÃ: ligado, puxar a borda de um clipe empurra tudo o que vem depois (cenas, sons, zoom); desligado, só a legenda acompanha
  const [magnet, setMagnet] = useState(() => {
    try {
      return localStorage.getItem("estudio.magnet") !== "0";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("estudio.magnet", magnet ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [magnet]);
  const [versions, setVersions] = useState<{ name: string; t: number; scenes: number; duration: number }[] | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem("estudio.safe", safe ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [safe]);
  const mtime = useRef(0); // versão do edit.json que o editor tem (para saber se mudou por fora)
  const baseDoc = useRef<EditDoc | null>(null); // o edit.json como está no disco nessa versão (base da fusão)
  const saving = useRef(false); // vídeo ampliado (tela cheia própria)
  const toggleBig = () => {
    const next = !big;
    setBig(next);
    // tenta também a tela cheia do sistema (em alguns navegadores embutidos ela é bloqueada)
    try {
      if (next && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      if (!next && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    } catch {
      /* ignore */
    }
  };
  const player = useRef<PlayerRef>(null);
  const restoredPlayer = useRef<unknown>(null); // o player que já voltou para a posição salva
  const pwrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/videos").then((r) => r.json()).then((l) => {
      setVideos(l);
    });
    fetch("/api/sfx").then((r) => r.json()).then(setLib);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setMulti([]);
    history.replaceState(null, "", `?v=${slug}`);
    setData(null);
    setPast([]);
    setFuture([]);
    setDirty(false);
    setSel(null);
    fetch(`/api/doc/${slug}`).then((r) => r.json()).then((j) => {
      mtime.current = j.mtime ?? 0;
      const doc0 = j.doc as EditDoc;
      baseDoc.current = clone(doc0);
      if (!doc0.soundTracks?.length) {
        const { rows, row } = packRows(doc0.sounds);
        doc0.soundTracks = Array.from({ length: rows }, (_, i) => ({ id: `t${i + 1}`, name: `Sons ${i + 1}` }));
        for (const snd of doc0.sounds) snd.track = `t${(row[snd.id] ?? 0) + 1}`;
        setDirty(true); // salva a migração
      }
      setData({ doc: doc0, spec: j.spec });
      // som sem `dur` aparecia com 1 s na timeline e tocava até 6 s: grava a duração real do arquivo
      const miss = doc0.sounds.filter((x) => x.dur === undefined);
      if (miss.length) {
        const srcs = [...new Set(miss.map((x) => x.fxSrc ?? x.src))];
        fetch(`/api/sfxdur?src=${encodeURIComponent(srcs.join("|"))}`)
          .then((r) => r.json())
          .then((durs: Record<string, number>) => {
            setData((cur) => {
              if (!cur) return cur;
              const d = { ...cur.doc, sounds: cur.doc.sounds.map((x) => (x.dur === undefined && durs[x.fxSrc ?? x.src] ? { ...x, dur: Math.max(0.05, durs[x.fxSrc ?? x.src] - (x.trim ?? 0)) } : x)) };
              return { ...cur, doc: d };
            });
            setDirty(true);
          })
          .catch(() => {});
      }
    });
    fetch(`/api/pauses/${slug}`).then((r) => r.json()).then((p) => Array.isArray(p) && setPauses(p)).catch(() => setPauses([]));
    fetch(`/api/peaks/${slug}`).then((r) => r.json()).then(setPeaks).catch(() => setPeaks([]));
    fetch(`/api/cuts/${slug}`).then((r) => r.json()).then((j) => { setUndoCuts(j.undo ?? 0); setRedoCuts(j.redo ?? 0); }).catch(() => setUndoCuts(0));
    fetch(`/api/srcpeaks/${slug}`).then((r) => r.json()).then((p) => setSrcPeaks(Array.isArray(p) ? p : [])).catch(() => setSrcPeaks([]));
    setInOut({});
    setTextSel(null);
    setProxy("");
    fetch(`/api/proxy/${slug}`).then((r) => r.json()).then((p) => setProxy(p.src)).catch(() => setProxy(""));
  }, [slug]);

  const textOpenRef = useRef(false);
  textOpenRef.current = textOpen;
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    (window as unknown as { __player?: unknown }).__player = p; // para tools/profile_estudio.mjs medir a prévia
    // Tocando, o estado do app (e a timeline inteira) atualiza no máximo 4x por segundo;
    // o cursor vermelho anda sozinho a cada frame (Timeline lê o player direto).
    // Atualizar tudo a cada frame travava as animações e fazia o player "voltar".
    // TOCANDO, o app NÃO se redesenha (cada redesenho da timeline inteira levava ~100 ms e, 4x por segundo, travava o
    // player: o áudio escorregava e a voz "repetia"). O cursor e o relógio da timeline andam sozinhos (Timeline lê o
    // player direto); o app atualiza ao pausar/pular, e 1x por segundo só se a transcrição estiver aberta.
    let last = 0;
    // 30/10 (pedido dele: a cada atualização o player voltava para o começo): a posição fica salva por vídeo e, quando o
    // player é (re)criado — recarga da página ou remontagem —, ele volta para onde estava. Não salva até a volta terminar
    // (senão o quadro 0 da montagem apagava a posição).
    const posKey = `estudio.pos.${slug}`;
    let canSave = true;
    let lastSave = 0;
    const savePos = (fr: number) => {
      if (!canSave) return;
      try {
        localStorage.setItem(posKey, String(fr));
      } catch {
        /* sem armazenamento */
      }
    };
    if (restoredPlayer.current !== p) {
      restoredPlayer.current = p;
      let saved = 0;
      try {
        saved = +(localStorage.getItem(posKey) ?? 0) || 0;
      } catch {
        /* sem armazenamento */
      }
      if (saved > 0) {
        canSave = false;
        const go = () => p.getCurrentFrame() !== saved && !p.isPlaying() && p.seekTo(saved);
        go();
        setTimeout(go, 800);
        setTimeout(() => {
          go();
          canSave = true;
        }, 2000);
      }
    }
    const on = (e: { detail: { frame: number } }) => {
      const t = performance.now();
      if (t - lastSave > 1000) {
        lastSave = t;
        savePos(e.detail.frame);
      }
      if (!p.isPlaying()) {
        last = t;
        setFrame(e.detail.frame);
      } else if (textOpenRef.current && t - last > 1000) {
        last = t;
        setFrame(e.detail.frame);
      }
    };
    const onPause = () => {
      setFrame(p.getCurrentFrame());
      savePos(p.getCurrentFrame());
    };
    p.addEventListener("frameupdate", on);
    p.addEventListener("pause", onPause);
    p.addEventListener("seeked", onPause);
    return () => {
      p.removeEventListener("frameupdate", on);
      p.removeEventListener("pause", onPause);
      p.removeEventListener("seeked", onPause);
    };
  }, [data, proxy]);

  useEffect(() => {
    if (!capOpen || !slug) return;
    fetch(`/api/caption/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        setCap(j.caption);
        setCapText(j.caption?.text ?? "");
      });
  }, [capOpen, slug]);
  const genCaption = async () => {
    setCapBusy(true);
    const j = await (await fetch(`/api/caption/${slug}`, { method: "POST" })).json().catch(() => ({}));
    setCapBusy(false);
    if (j.caption) {
      setCap(j.caption);
      setCapText(j.caption.text);
    }
    if (j.note) setStatus(j.note);
  };
  const saveCaptionText = (t: string) => fetch(`/api/caption/${slug}`, { method: "PUT", body: JSON.stringify({ text: t }) });
  const copyCaption = async () => {
    if (capText !== (cap?.text ?? "")) await saveCaptionText(capText);
    if (await copyText(capText)) {
      setCapCopied(true);
      setTimeout(() => setCapCopied(false), 1800);
    }
  };
  const doc = data?.doc;
  const fps = doc?.fps ?? 30;
  const tl = useMemo(() => (data ? makeTimeline(data.spec) : null), [data?.spec]);

  // mudança com desfazer: `commit` guarda o estado anterior; `live` só atualiza (durante o arraste)
  // (06/11/2026, desempenho) o arraste chama `live` a cada movimento do mouse, às vezes várias vezes por quadro, e cada
  // chamada copiava o projeto inteiro (~25 ms no HL3). Agora as mudanças de um mesmo quadro de tela entram juntas, numa
  // cópia só, na mesma ordem.
  const liveQ = useRef<((d: EditDoc) => void)[]>([]);
  const liveRaf = useRef(0);
  const flushLive = useCallback(() => {
    liveRaf.current = 0;
    const fns = liveQ.current;
    liveQ.current = [];
    if (!fns.length) return;
    if (lockedRef.current) {
      lockMsg();
      return;
    }
    setData((cur) => {
      if (!cur) return cur;
      const d = clone(cur.doc);
      for (const fn of fns) fn(d);
      return { ...cur, doc: d };
    });
    setDirty(true);
  }, []);
  const live = useCallback(
    (fn: (d: EditDoc) => void) => {
      liveQ.current.push(fn);
      // aba escondida não tem quadro de tela: aplica na hora
      if (document.hidden) {
        if (liveRaf.current) cancelAnimationFrame(liveRaf.current);
        flushLive();
      } else if (!liveRaf.current) liveRaf.current = requestAnimationFrame(flushLive);
    },
    [flushLive],
  );
  const checkpoint = useCallback(() => {
    if (!data) return;
    setPast((p) => [...p.slice(-80), snap(data.doc)]);
    setFuture([]);
  }, [data, snap]);
  // mudança com desfazer: entra NA HORA (junto com o que o arraste ainda tinha na fila, na mesma ordem)
  const commit = useCallback(
    (fn: (d: EditDoc) => void) => {
      checkpoint();
      liveQ.current.push(fn);
      if (liveRaf.current) cancelAnimationFrame(liveRaf.current);
      flushLive();
    },
    [checkpoint, flushLive],
  );
  const undo = () => {
    if (!data) return;
    if (lockedRef.current) return lockMsg();
    // Cortes de takes são gravados pelo servidor. Quando não há uma mudança local
    // mais recente, o mesmo Ctrl+Z usa essa pilha em vez de expor um segundo botão.
    if (!past.length) {
      if (undoCuts > 0) void undoCut();
      return;
    }
    setFuture((f) => [snap(data.doc), ...f]);
    const prev = restore(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setData({ ...data, doc: prev });
    setDirty(true);
  };
  const redo = () => {
    if (!data) return;
    if (lockedRef.current) return lockMsg();
    // sem passo local para refazer: refaz o último corte de voz desfeito (servidor)
    if (!future.length) {
      if (redoCuts > 0) void redoCut();
      return;
    }
    setPast((p) => [...p, snap(data.doc)]);
    setData({ ...data, doc: restore(future[0]) });
    setFuture((f) => f.slice(1));
    setDirty(true);
  };

  const save = async () => {
    if (!data || saving.current) return;
    if (lockedRef.current) return; // trancada: não grava (o servidor também recusaria)
    saving.current = true;
    const sent = data.doc;
    try {
      const body = JSON.stringify(sent, null, 1);
      const r = await fetch(`/api/doc/${slug}?base=${mtime.current || 0}`, { method: "PUT", body });
      if (r.status === 409) {
        // o arquivo mudou por fora enquanto havia mudança não salva aqui: JUNTA as duas (item a item; no mesmo item
        // vale o da aba) e salva a fusão — antes recarregava a de fora e a mudança daqui ia parar em Versões
        const j = await (await fetch(`/api/doc/${slug}`)).json();
        const base = baseDoc.current;
        mtime.current = j.mtime;
        baseDoc.current = clone(j.doc);
        if (!base) {
          setData({ doc: j.doc, spec: j.spec });
          setDirty(false);
          setStatus("o projeto foi atualizado por fora — recarreguei (sua última mudança ficou em Versões)");
          return;
        }
        rebaseHistory(base, j.doc);
        setData((cur) => (cur ? { doc: mergeDocs(base, cur.doc, j.doc), spec: j.spec } : cur));
        setDirty(true); // salva a fusão no próximo ciclo
        setStatus("o projeto mudou por fora — juntei com a sua mudança");
        return;
      }
      if (r.ok) {
        mtime.current = (await r.json()).mtime ?? mtime.current;
        baseDoc.current = JSON.parse(body); // a cópia sai do texto que já foi enviado (sem serializar de novo)
        // só limpa o "não salvo" se nada mudou enquanto salvava
        setData((cur) => {
          if (cur && cur.doc === sent) setDirty(false);
          return cur;
        });
        setStatus("");
      } else setStatus("erro ao salvar");
    } finally {
      saving.current = false;
    }
  };

  // SALVAMENTO AUTOMÁTICO: 0,8 s depois da última mudança
  useEffect(() => {
    if (!dirty || !data) return;
    const id = setTimeout(save, 800);
    return () => clearTimeout(id);
  }, [data?.doc, dirty]);

  // edit.json mudou por fora (ex.: Claude cortou respiros): recarrega sem perder nada não salvo
  useEffect(() => {
    if (!slug) return;
    const id = setInterval(async () => {
      if (dirty || saving.current) return;
      try {
        const { mtime: m } = await (await fetch(`/api/mtime/${slug}`)).json();
        if (m && mtime.current && m !== mtime.current) {
          const j = await (await fetch(`/api/doc/${slug}`)).json();
          mtime.current = j.mtime;
          const before = docRef.current;
          if (before) rebaseHistory(before, j.doc);
          baseDoc.current = clone(j.doc);
          setData({ doc: j.doc, spec: j.spec });
          fetch(`/api/peaks/${slug}`).then((r) => r.json()).then(setPeaks);
          // 10/11: a onda da trilha Vídeo também (a gravação pode ter sido trocada por fora e a onda ficava a antiga)
          fetch(`/api/srcpeaks/${slug}`).then((r) => r.json()).then((p) => Array.isArray(p) && setSrcPeaks(p)).catch(() => {});
          setStatus("atualizado");
        }
      } catch {
        /* sem rede, tenta de novo */
      }
    }, 2500);
    return () => clearInterval(id);
  }, [slug, dirty]);

  // "Cortar respiros" roda como tarefa no servidor: a página acompanha as etapas e, no fim, recarrega o edit.json
  const [tightenSt, setTightenSt] = useState<TightenSt | null>(null);
  const reloadAfterTighten = async () => {
    const d = await (await fetch(`/api/doc/${slug}`)).json();
    const before = docRef.current;
    mtime.current = d.mtime;
    baseDoc.current = clone(d.doc);
    if (before) rebaseHistory(before, d.doc);
    setData({ doc: d.doc, spec: d.spec });
    fetch(`/api/peaks/${slug}`).then((x) => x.json()).then(setPeaks);
    fetch(`/api/srcpeaks/${slug}`).then((x) => x.json()).then((p) => Array.isArray(p) && setSrcPeaks(p)).catch(() => {});
    fetch(`/api/pauses/${slug}`).then((x) => x.json()).then((p) => Array.isArray(p) && setPauses(p));
  };
  const tighten = async (o: TightenOpts) => {
    if (lockedRef.current) return lockMsg();
    if (dirty) await save();
    const r = await fetch(`/api/tighten/${slug}`, { method: "POST", body: JSON.stringify(o) });
    setTightenSt(await r.json());
  };
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/tighten/${slug}`)
      .then((r) => r.json())
      .then((st: TightenSt) => setTightenSt(st.idle || st.done ? null : st))
      .catch(() => {});
  }, [slug]);
  useEffect(() => {
    if (!tightenSt || tightenSt.done) return;
    const id = setInterval(async () => {
      const st: TightenSt = await (await fetch(`/api/tighten/${slug}`)).json();
      if (st.idle) return setTightenSt(null);
      setTightenSt(st);
      if (st.done) {
        if (st.ok) await reloadAfterTighten();
        setStatus(st.ok ? (st.log ?? "cortado") : "Não deu para cortar");
      }
    }, 600);
    return () => clearInterval(id);
  }, [tightenSt?.done, slug]);

  // janela antes do render: nome do arquivo e quanto do PC ele pode usar (lembra a última escolha deste vídeo)
  const [ropt, setRopt] = useState<{ name: string; mode: "alta" | "baixa"; res: "1080" | "4k" } | null>(null);
  const openRender = () => {
    if (!data) return;
    const comp = (data.doc as EditDoc & { comp?: string }).comp;
    if (!comp) return setStatus("edit.json sem o campo comp (composição do Remotion)");
    let saved: { name?: string; mode?: "alta" | "baixa"; res?: "1080" | "4k" } = {};
    try {
      saved = JSON.parse(localStorage.getItem(`ropt:${slug}`) || "{}");
    } catch {
      /* sem preferência guardada */
    }
    setRopt({ name: saved.name || `${slug}-${comp.toLowerCase()}`, mode: saved.mode === "alta" ? "alta" : "baixa", res: saved.res === "4k" ? "4k" : "1080" });
  };
  const startRender = async () => {
    if (!data || !ropt) return;
    const comp = (data.doc as EditDoc & { comp?: string }).comp;
    if (!comp) return;
    const name = ropt.name.replace(/[<>:"/\\|?*]/g, "").replace(/\.mp4$/i, "").trim() || `${slug}-${comp.toLowerCase()}`;
    try {
      localStorage.setItem(`ropt:${slug}`, JSON.stringify({ name, mode: ropt.mode, res: ropt.res }));
    } catch {
      /* sem armazenamento */
    }
    setRopt(null);
    if (dirty) await save();
    const r = await fetch(`/api/render/${slug}`, { method: "POST", body: JSON.stringify({ comp, name, mode: ropt.mode, res: ropt.res }) });
    if (!r.ok) return setStatus((await r.json()).error);
    setRender({ done: false, phase: "renderizando", pct: 0 });
  };
  // um clique cancela: o confirm() do navegador é bloqueado no painel do app (respondia "não" sozinho e o
  // botão não fazia nada). Cancelar não perde nada: é só renderizar de novo.
  // pausar congela o render no quadro em que está (o PC fica livre); continuar segue dali sem perder nada
  const pauseRender = async (pause: boolean) => {
    const r = await fetch(`/api/render/${slug}`, { method: "PATCH", body: JSON.stringify({ pause }) });
    const j = await r.json();
    if (!r.ok) return setStatus(j.error);
    setRender((x) => (x ? { ...x, paused: j.paused, phase: j.paused ? "pausado" : "renderizando" } : x));
    setStatus(j.paused ? "render pausado: o PC está livre; clique em continuar quando quiser" : "render retomado");
  };
  const cancelRender = async () => {
    await fetch(`/api/render/${slug}`, { method: "DELETE" });
    setRender((r) => (r ? { ...r, done: true, ok: false, cancelled: true } : r));
    setStatus("render cancelado");
  };
  // depois de salvar, confere de novo se o último render ficou velho
  useEffect(() => {
    if (!slug || dirty) return;
    fetch(`/api/render/${slug}`)
      .then((r) => r.json())
      .then((st: RenderSt) => setLast(st.last ?? null))
      .catch(() => {});
  }, [slug, dirty]);
  // ao abrir o vídeo, retoma um render que já estava rodando
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/render/${slug}`)
      .then((r) => r.json())
      .then((st: RenderSt) => {
        setLast(st.last ?? null);
        setRender(st.idle ? null : st);
      });
  }, [slug]);
  useEffect(() => {
    // depois de um erro continua olhando (devagar): se o render for retomado por fora (Claude/terminal),
    // a tela troca o "Deu erro" pelo progresso e depois pelo Pronto (08/11: ficou mostrando o erro antigo)
    if (!render || (render.done && render.ok)) return;
    const id = setInterval(async () => {
      try {
        const st = await (await fetch(`/api/render/${slug}`)).json();
        setLast(st.last ?? null);
        if (!st.idle) setRender(st);
      } catch {
        /* Estúdio reiniciando */
      }
    }, render.done ? 5000 : 1000);
    return () => clearInterval(id);
  }, [render?.done, render?.ok, slug]);
  const fmtSecs = (s?: number) => (s === undefined ? "" : s >= 60 ? `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, "0")}s` : `${s}s`);
  const etaPt = (e?: string) => (e ? e.replace(/(\d+)m/, "$1min").replace(/(\d+)s/, "$1s") : "");

  const seek = (t: number) => player.current?.seekTo(Math.max(0, Math.round(t * fps)));
  // gravador de diagnóstico da prévia (Ctrl+Shift+D salva os últimos 40 s em out/<slug>/diag-*.json)
  const slugRef = useRef(slug);
  slugRef.current = slug;
  useEffect(() => installDiag(() => slugRef.current), []);
  const now = frame / fps;

  const addSound = (src: string, at?: number, track?: string) => {
    const it = lib.find((l) => l.src === src);
    const id = `u${Date.now().toString(36)}`;
    const cur = sel?.kind === "sound" ? doc?.sounds.find((x) => x.id === sel.id)?.track : undefined;
    commit((d) => {
      const st = r3(at ?? now);
      const du = it ? Math.min(it.dur, 6) : 1;
      // sem trilha escolhida (+ da biblioteca): vai para uma trilha de efeitos onde não encavala com outro som
      d.sounds.push({ id, src, start: st, vol: 0.4, dur: du, label: it?.name ?? src, track: track ?? pickFxTrack(d, src, st, st + du, cur) });
      d.sounds.sort((a, b) => a.start - b.start);
    });
    setSel({ kind: "sound", id });
  };

  // música da biblioteca: o servidor copia para public/music já normalizada; entra na trilha "Música"
  // (criada se não existir) em vol 0.25, até o fim do vídeo, com fade no fim
  const addMusic = async (m: MusicItem) => {
    const r = await fetch("/api/musicadd", { method: "POST", body: JSON.stringify({ id: m.id }) }).then((x) => x.json());
    if (!r.src) return;
    const id = `m${Date.now().toString(36)}`;
    commit((d) => {
      let tr = d.soundTracks?.find((t) => /^m[uú]sica/i.test(t.name) && !t.muted);
      if (!tr) {
        tr = { id: `mt${Date.now().toString(36)}`, name: "Música" };
        d.soundTracks = [...(d.soundTracks ?? []), tr];
      }
      const start = r3(now);
      const dur = r3(Math.max(0.5, Math.min(m.dur || d.duration, d.duration - start)));
      d.sounds.push({ id, src: r.src, start, vol: 0.25, dur, fadeIn: 0.4, fadeOut: 1.5, label: `Música · ${m.title}`, track: tr.id });
      d.sounds.sort((a, b) => a.start - b.start);
    });
    setSel({ kind: "sound", id });
  };

  // copiar / recortar / colar (Ctrl+C, Ctrl+X, Ctrl+V): cola no cursor, na mesma trilha
  const clip = useRef<{ kind: "sound"; item: SoundClip } | { kind: "scene"; item: SceneClip } | null>(null);
  const copySel = () => {
    if (!doc || !sel) return false;
    if (sel.kind === "sound") {
      const s0 = doc.sounds.find((x) => x.id === sel.id);
      if (s0) clip.current = { kind: "sound", item: clone(s0) };
    } else if (sel.kind === "scene") {
      const s0 = doc.scenes.find((x) => x.id === sel.id);
      if (s0) clip.current = { kind: "scene", item: clone(s0) };
    } else return false;
    setStatus("copiado");
    return true;
  };
  const paste = () => {
    const c = clip.current;
    if (!c) return;
    const tag = Date.now().toString(36).slice(-4);
    if (c.kind === "sound") {
      const id = `u${tag}`;
      commit((d) => {
        const st = r3(now);
        d.sounds.push({ ...clone(c.item), id, start: st, track: pickFxTrack(d, c.item.src, st, st + (c.item.dur ?? 1), c.item.track) });
        d.sounds.sort((a, b) => a.start - b.start);
      });
      setSel({ kind: "sound", id });
    } else {
      const id = `${c.item.id}-c${tag}`;
      const len = c.item.end - c.item.start;
      commit((d) => d.scenes.push({ ...clone(c.item), id, start: r3(now), end: r3(now + len) }));
      setSel({ kind: "scene", id });
    }
  };

  const idOf = (k: string) => k.slice(k.indexOf(":") + 1);
  const removeSel = () => {
    if (multi.length > 1) {
      const sc = new Set(multi.filter((k) => k.startsWith("scene:")).map(idOf));
      const so = new Set(multi.filter((k) => k.startsWith("sound:")).map(idOf));
      commit((d) => {
        d.scenes = d.scenes.filter((z) => !sc.has(z.id));
        d.sounds = d.sounds.filter((z) => !so.has(z.id));
      });
      setMulti([]);
      setSel(null);
      return;
    }
    if (!sel) return;
    if (sel.kind === "clip" && data) {
      let t0 = 0;
      for (let k = 0; k < data.spec.segments.length; k++) {
        const g = data.spec.segments[k];
        const du = (g.frames ?? Math.round((g.b - g.a) * fps)) / fps;
        if (k === sel.i) {
          setSel(null);
          void cutRange(r3(t0), r3(t0 + du));
          return;
        }
        t0 += du;
      }
      return;
    }
    commit((d) => {
      if (sel.kind === "sound") d.sounds = d.sounds.filter((s) => s.id !== sel.id);
      if (sel.kind === "scene") d.scenes = d.scenes.filter((s) => s.id !== sel.id);
      if (sel.kind === "word") d.captions.words.splice(sel.i, 1);
      if (sel.kind === "snap") d.zoom.snaps.splice(sel.i, 1);
      if (sel.kind === "push") d.zoom.pushes.splice(sel.i, 1);
      if (sel.kind === "marker") d.markers = (d.markers ?? []).filter((m) => m.id !== sel.id);
    });
    setSel(null);
  };

  const duplicateSel = () => {
    if (!sel || !doc) return;
    if (sel.kind === "sound") {
      const s = doc.sounds.find((x) => x.id === sel.id);
      if (!s) return;
      const id = `u${Date.now().toString(36)}`;
      commit((d) => {
        const st = r3(now);
        d.sounds.push({ ...clone(s), id, start: st, track: pickFxTrack(d, s.src, st, st + (s.dur ?? 1), s.track) });
      });
      setSel({ kind: "sound", id });
    }
    if (sel.kind === "scene") {
      const s = doc.scenes.find((x) => x.id === sel.id);
      if (!s) return;
      const id = `${s.id}-c${Date.now().toString(36).slice(-3)}`;
      const len = s.end - s.start;
      commit((d) => d.scenes.push({ ...clone(s), id, start: r3(now), end: r3(now + len) }));
      setSel({ kind: "scene", id });
    }
  };

  const nudge = (df: number) => {
    const dt = df / fps;
    if (multi.length > 1) {
      commit((d) => {
        const mv = multi.map((k) => (k.startsWith("scene:") ? d.scenes.find((z) => z.id === idOf(k)) : d.sounds.find((z) => z.id === idOf(k)))).filter(Boolean);
        const min0 = Math.min(...mv.map((z) => z!.start));
        const dd = Math.max(dt, -min0);
        for (const z of mv) {
          z!.start = r3(z!.start + dd);
          if ("end" in z!) z!.end = r3(z!.end + dd);
        }
      });
      return;
    }
    if (!sel) return;
    commit((d) => {
      if (sel.kind === "sound") {
        const s = d.sounds.find((x) => x.id === sel.id);
        if (s) s.start = r3(Math.max(0, s.start + dt));
      }
      if (sel.kind === "scene") {
        const s = d.scenes.find((x) => x.id === sel.id);
        if (s) {
          s.start = r3(Math.max(0, s.start + dt));
          s.end = r3(s.end + dt);
        }
      }
      if (sel.kind === "word") {
        const w = d.captions.words[sel.i];
        w.start = r3(w.start + dt);
        w.end = r3(w.end + dt);
      }
      if (sel.kind === "snap") d.zoom.snaps[sel.i].t = r3(d.zoom.snaps[sel.i].t + dt);
      if (sel.kind === "push") {
        const p = d.zoom.pushes[sel.i];
        p.t = r3(p.t + dt);
        if (p.until !== "end") p.until = r3(p.until + dt);
      }
    });
  };

  // recarrega o documento depois de uma mudança feita no servidor (corte de trecho, versão)
  const reloadDoc = async () => {
    const d = await (await fetch(`/api/doc/${slug}`)).json();
    const before = docRef.current;
    mtime.current = d.mtime;
    baseDoc.current = clone(d.doc);
    // Operações do servidor (cortar trecho, ajustar take e "Desfazer corte") não podem
    // apagar mudanças locais que ainda estavam disponíveis no Ctrl+Z. Reaplica o
    // histórico sobre o documento recarregado, como já fazemos para edições externas.
    if (before) rebaseHistory(before, d.doc);
    setData({ doc: d.doc, spec: d.spec });
    fetch(`/api/peaks/${slug}`).then((x) => x.json()).then(setPeaks);
    setPauses([]); // recalculado sob demanda (painel de respiros), não a cada corte
  };

  // FERRAMENTA DO MOUSE: seta (V) ou lâmina (C). A lâmina divide clipe, cena ou som no ponto clicado.
  const [tool, setTool] = useState<"select" | "blade">("select");
  const splitClip = async (t: number) => {
    if (lockedRef.current) return lockMsg();
    if (!data) return;
    if (dirty) await save();
    const r = await fetch(`/api/splitclip/${slug}`, { method: "POST", body: JSON.stringify({ t: r3(t) }) });
    const j = await r.json();
    if (!r.ok) return setStatus(`Não deu para dividir: ${j.error ?? ""}`);
    await reloadDoc();
    setStatus("Clipe dividido. Volte para a seta (V), escolha o pedaço e aperte Delete para tirar do vídeo.");
  };
  const onBlade = (target: { kind: "clip" } | { kind: "scene" | "sound"; id: string }, t: number) => {
    if (lockedRef.current) return lockMsg();
    if (target.kind === "clip") return void splitClip(t);
    splitAtCursor(t, { kind: target.kind, id: target.id });
  };

  // CORTAR TRECHO DO VÍDEO (ripple): o que vem depois anda para trás. Vem do I/O ou do painel de texto.
  const cutRange = async (a: number, b: number) => {
    if (lockedRef.current) return lockMsg();
    if (!data || b - a < 1 / fps) return;
    if (dirty) await save();
    player.current?.pause();
    const r = await fetch(`/api/cutrange/${slug}`, { method: "POST", body: JSON.stringify({ a, b }) });
    const j = await r.json();
    if (!r.ok) return setStatus(`Não deu para cortar: ${j.error ?? ""}`);
    setUndoCuts(j.undo ?? 0);
    setRedoCuts(j.redo ?? 0);
    setInOut({});
    setTextSel(null);
    await reloadDoc();
    setPast([]);
    setFuture([]);
    setStatus(j.log ?? "cortado");
    setTimeout(() => player.current?.seekTo(Math.max(0, Math.round(a * fps) - fps)), 300);
  };
  // PUXAR A BORDA DE UM CLIPE (trilha Vídeo): estica/encolhe o take e empurra o que vem depois (com o ímã)
  const trimClip = async (i: number, side: "a" | "b", delta: number, at: number) => {
    if (lockedRef.current) return lockMsg();
    if (!data || Math.abs(delta) < 1 / fps / 2) return;
    if (dirty) await save();
    player.current?.pause();
    const r = await fetch(`/api/trimclip/${slug}`, { method: "POST", body: JSON.stringify({ i, side, delta, solo: !magnet }) });
    const j = await r.json();
    if (!r.ok) return setStatus(`Não deu para ajustar o clipe: ${j.error ?? ""}`);
    setUndoCuts(j.undo ?? 0);
    setRedoCuts(j.redo ?? 0);
    await reloadDoc();
    // 12/10: o Ctrl+Z seguinte desfaz ESTA operação (voz + cenas juntas), não um passo local remontado
    setPast([]);
    setFuture([]);
    setStatus(j.log ?? "clipe ajustado");
    // volta um pouco antes da emenda para ouvir o resultado
    setTimeout(() => player.current?.seekTo(Math.max(0, Math.round((at - 1.5) * fps))), 300);
  };
  const undoCut = async () => {
    if (lockedRef.current) return lockMsg();
    if (dirty) await save();
    const r = await fetch(`/api/uncut/${slug}`, { method: "POST", body: "{}" });
    const j = await r.json();
    if (!r.ok) return setStatus(j.error ?? "nada para desfazer");
    setUndoCuts(j.undo ?? 0);
    setRedoCuts(j.redo ?? 0);
    await reloadDoc();
    // 12/10: o Ctrl+Z seguinte desfaz ESTA operação (voz + cenas juntas), não um passo local remontado
    setPast([]);
    setFuture([]);
    setStatus(j.log ?? "corte desfeito");
  };
  const redoCut = async () => {
    if (lockedRef.current) return lockMsg();
    if (dirty) await save();
    player.current?.pause();
    const r = await fetch(`/api/recut/${slug}`, { method: "POST", body: "{}" });
    const j = await r.json();
    if (!r.ok) return setStatus(j.error ?? "nada para refazer");
    setUndoCuts(j.undo ?? 0);
    setRedoCuts(j.redo ?? 0);
    await reloadDoc();
    setPast([]);
    setFuture([]);
    setStatus(j.log ?? "corte refeito");
  };

  // LÂMINA (S): divide a cena ou o som escolhido no cursor; sem nada escolhido, a cena principal sob o cursor
  const splitAtCursor = (tAt?: number, tg?: Sel) => {
    if (lockedRef.current) return lockMsg();
    if (!doc) return;
    const t = r3(tAt ?? now);
    let target = tg ?? sel;
    // seleção que não existe mais (ex.: depois de um Ctrl+Z) vale como nada escolhido
    const tid = target && (target.kind === "scene" || target.kind === "sound") ? target.id : "";
    const alive = !!tid && (doc.scenes.some((x) => x.id === tid) || doc.sounds.some((x) => x.id === tid));
    if (!alive) target = null;
    if (!target || (target.kind !== "scene" && target.kind !== "sound")) {
      const sc = doc.scenes.find((s) => (s.lane ?? 0) === 0 && s.start < t && s.end > t);
      target = sc ? { kind: "scene", id: sc.id } : null;
    }
    if (!target) return setStatus("Escolha uma cena ou um som embaixo do cursor para dividir (S)");
    if (target.kind === "scene") {
      const id = target.id;
      const s = doc.scenes.find((x) => x.id === id);
      if (!s || t <= s.start + 1 / fps || t >= s.end - 1 / fps) return setStatus("O cursor precisa estar dentro da cena para dividir");
      const id2 = `${s.id}-b${Date.now().toString(36).slice(-3)}`;
      commit((d) => {
        const c = d.scenes.find((x) => x.id === id)!;
        d.scenes.splice(d.scenes.indexOf(c) + 1, 0, { ...clone(c), id: id2, start: t, label: `${c.label ?? c.id} (2)`, props: shiftInner(c.props, c.start - t) as Record<string, unknown>, enter: undefined });
        c.end = t;
      });
      setSel({ kind: "scene", id: id2 });
    } else if (target.kind === "sound") {
      const id = target.id;
      const s = doc.sounds.find((x) => x.id === id);
      const dur = s?.dur ?? 1;
      if (!s || t <= s.start + 1 / fps || t >= s.start + dur - 1 / fps) return setStatus("O cursor precisa estar dentro do som para dividir");
      const cut = r3(t - s.start);
      const id2 = `u${Date.now().toString(36)}`;
      commit((d) => {
        const c = d.sounds.find((x) => x.id === id)!;
        d.sounds.push({ ...clone(c), id: id2, start: t, trim: r3((c.trim ?? 0) + cut), dur: r3(dur - cut), fadeIn: 0 });
        c.dur = cut;
        c.fadeOut = 0;
        d.sounds.sort((a, b) => a.start - b.start);
      });
      setSel({ kind: "sound", id: id2 });
    }
  };

  // MARCADOR (M): ponto com nota no cursor
  const addMarker = () => {
    if (!doc) return;
    const id = `m${Date.now().toString(36)}`;
    commit((d) => {
      d.markers = [...(d.markers ?? []), { id, t: r3(now), note: "" }].sort((a, b) => a.t - b.t);
    });
    setSel({ kind: "marker", id });
  };

  // J / K / L: volta, pausa, avança (apertar de novo dobra a velocidade, até 4x)
  const shuttle = (dir: -1 | 0 | 1) => {
    const p = player.current;
    if (!p) return;
    if (dir === 0) {
      p.pause();
      setRate(1);
      return;
    }
    const nr = p.isPlaying() && Math.sign(rate) === dir ? Math.max(-4, Math.min(4, rate * 2)) : dir;
    setRate(nr);
    if (!p.isPlaying()) p.play();
    if (Math.abs(nr) !== 1 || nr < 0) setStatus(`${nr < 0 ? "voltando" : "avançando"} a ${Math.abs(nr)}x`);
  };

  const openVersions = async () => {
    if (versions) return setVersions(null);
    if (dirty) await save();
    setVersions(await (await fetch(`/api/versions/${slug}`)).json());
  };
  const restoreVersion = async (name: string, t: number) => {
    if (lockedRef.current) return lockMsg();
    // sem confirm() (bloqueado no painel do app): a versão atual fica guardada na lista, dá para voltar
    const r = await fetch(`/api/versions/${slug}`, { method: "POST", body: JSON.stringify({ name }) });
    if (!r.ok) return setStatus((await r.json()).error);
    setVersions(null);
    await reloadDoc();
    setStatus("versão restaurada");
  };

  // atalhos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key.toLowerCase();
      if (e.ctrlKey && k === "s") {
        e.preventDefault();
        save();
      } else if (e.ctrlKey && k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && (k === "y" || (k === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && k === "c") {
        if (copySel()) e.preventDefault();
      } else if (e.ctrlKey && k === "x") {
        if (copySel()) {
          e.preventDefault();
          removeSel();
        }
      } else if (e.ctrlKey && k === "a" && doc) {
        // Ctrl+A: seleciona todas as cenas, carimbos e sons (para mover tudo junto)
        e.preventDefault();
        setMulti([...doc.scenes.map((z) => `scene:${z.id}`), ...doc.sounds.map((z) => `sound:${z.id}`)]);
      } else if (e.ctrlKey && k === "v") {
        e.preventDefault();
        paste();
      } else if (e.ctrlKey && k === "d") {
        e.preventDefault();
        duplicateSel();
      } else if (k === " ") {
        e.preventDefault();
        if (rate !== 1) setRate(1);
        player.current?.toggle();
      } else if ((k === "delete" || k === "backspace") && e.shiftKey && inOut.a !== undefined && inOut.b !== undefined) {
        e.preventDefault();
        cutRange(inOut.a, inOut.b);
      } else if ((k === "delete" || k === "backspace") && textOpen && textSel && doc) {
        e.preventDefault();
        const r = rangeOf(doc.captions.words, textSel);
        cutRange(r.a, r.b);
      } else if (k === "delete" || k === "backspace") {
        removeSel();
      } else if (!e.ctrlKey && !e.altKey && !e.metaKey && (k === "j" || k === "k" || k === "l")) {
        e.preventDefault();
        shuttle(k === "j" ? -1 : k === "k" ? 0 : 1);
      } else if (k === "home") {
        e.preventDefault();
        player.current?.seekTo(0);
      } else if (k === "end") {
        e.preventDefault();
        player.current?.seekTo(Math.max(0, (tl?.DURATION ?? 1) - 1));
      } else if (!e.ctrlKey && !e.altKey && k === "i") {
        setInOut((io) => ({ a: r3(now), b: io.b !== undefined && io.b > now ? io.b : undefined }));
      } else if (!e.ctrlKey && !e.altKey && k === "o") {
        setInOut((io) => ({ a: io.a !== undefined && io.a < now ? io.a : undefined, b: r3(now) }));
      } else if (!e.ctrlKey && !e.altKey && k === "m") {
        e.preventDefault(); // sem isso a letra entra na nota, que abre já com o foco
        addMarker();
      } else if (!e.ctrlKey && !e.altKey && k === "s") {
        splitAtCursor();
      } else if (!e.ctrlKey && !e.altKey && k === "c") {
        setTool((x) => (x === "blade" ? "select" : "blade"));
      } else if (!e.ctrlKey && !e.altKey && k === "v") {
        setTool("select");
      } else if (k === "\\") {
        setFitSig((n) => n + 1);
      } else if (!e.ctrlKey && !e.altKey && k === "g") {
        setSafe((v) => !v);
      } else if (!e.ctrlKey && !e.altKey && k === "t") {
        setTextOpen((v) => !v);

      } else if (k === "arrowleft" || k === "arrowright") {
        e.preventDefault();
        const df = (k === "arrowleft" ? -1 : 1) * (e.shiftKey ? 10 : 1);
        if ((sel || multi.length > 1) && e.altKey) nudge(df);
        else player.current?.seekTo(Math.max(0, frame + df));
      } else if (k === "escape") {
        if (tool === "blade") setTool("select");
        else if (big) setBig(false);
        else if (versions) setVersions(null);
        else if (inOut.a !== undefined || inOut.b !== undefined) setInOut({});
        else if (textSel) setTextSel(null);
        else {
          setSel(null);
          setMulti([]);
        }
      } else if (k === "f") toggleBig();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // no editor o vídeo toca a versão leve (o render usa o original)
  // para testes automáticos (medir se a prévia toca sem voltar)
  useEffect(() => {
    (window as unknown as { __player?: PlayerRef | null }).__player = player.current;
  });

  // prévia contínua (um arquivo só com os cortes e a voz): refeita quando os cortes ou a voz mudam;
  // a anterior segue tocando até a nova ficar pronta
  const [preview, setPreview] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [voiceWav, setVoiceWav] = useState("");
  // versão (mtime) da cópia WAV: a gravação ganha trecho novo no fim com o MESMO nome; sem isso o motor guardava o
  // cabeçalho velho (duração antiga) e o trecho novo tocava mudo (10/11, prólogo do Frank)
  const [voiceWavV, setVoiceWavV] = useState(0);
  // voz contínua (formato só voz): um arquivo já cortado na ordem da timeline; enquanto não fica pronto (ou logo
  // depois de um corte), a prévia toca take a take como antes
  const [voiceCont, setVoiceCont] = useState("");
  const [voiceRetry, setVoiceRetry] = useState(0);
  const [voiceJob, setVoiceJob] = useState<{ pct: number; step: string } | null>(null); // voz tratada sendo refeita
  // só refaz o texto de comparação quando a lista de takes muda (eram ~450 KB a cada atualização da tela)
  const segs0 = data?.spec.segments;
  const segKey = useMemo(() => (segs0 ? JSON.stringify(segs0) : ""), [segs0]);
  const voiceSrc = data?.doc.voice?.src ?? "";
  useEffect(() => {
    if (!slug || !proxy || !segKey) return;
    // formato só voz (HL3): a prévia toca a voz take a take, instantânea; não precisa do arquivo contínuo
    if (data?.doc.format === "wide") {
      setPreviewBusy(false);
      setPreview("");
      let ok2 = true;
      let tm: ReturnType<typeof setTimeout> | undefined;
      // se a voz tratada está sendo refeita (take novo emendado na fonte), toca a anterior e pergunta de novo a cada
      // 8 s; quando fica pronta, troca sozinha (o "?v=" força o navegador a buscar o arquivo novo)
      const ask = () =>
        // na taxa do fone (ver RATES em voiceEngine.ts): sem conversão de taxa dentro do navegador
        fetch(`/api/voicewav/${slug}?src=${encodeURIComponent(voiceSrc || `videos/${slug}/ig1080.mp4`)}&rate=${engine.current?.deviceRate() ?? 48000}`)
          .then((r) => r.json())
          .then((j) => {
            if (!ok2 || !j.src) return;
            // (sem "?v=": o staticFile codifica a interrogação e o arquivo não carrega; a voz contínua já muda de nome)
            setVoiceWav(j.src);
            if (j.v) setVoiceWavV(j.v);
            if (j.rebuilding) {
              // progresso do tratamento (etapa + %) na tela, para saber que está andando
              const h = /voice-([0-9a-f]+)\.m4a/.exec(voiceSrc)?.[1];
              if (h)
                fetch(`/api/voicejob/${slug}-${h}`)
                  .then((r) => r.json())
                  .then((st) => ok2 && setVoiceJob({ pct: st.pct ?? 0, step: st.step ?? "" }))
                  .catch(() => {});
              tm = setTimeout(ask, 2500);
            } else setVoiceJob((vj) => (vj ? null : vj));
          })
          .catch(() => {});
      ask();
      return () => {
        ok2 = false;
        if (tm) clearTimeout(tm);
      };
    }
    let ok = true;
    setPreviewBusy(true);
    fetch(`/api/editproxy/${slug}?voice=${encodeURIComponent(voiceSrc)}`)
      .then((r) => r.json())
      .then((j) => ok && j.src && setPreview(j.src))
      .finally(() => ok && setPreviewBusy(false));
    return () => {
      ok = false;
    };
  }, [slug, proxy, segKey, voiceSrc, data?.doc.format]);
  // MOTOR DE VOZ (formato só voz): a voz toca recortando a gravação na hora; ajustar clipe = só reagendar.
  // Se o motor falhar (navegador sem Web Audio), volta para a voz contínua montada no servidor.
  const engine = useRef<VoiceEngine | null>(null);
  if (!engine.current) engine.current = new VoiceEngine();
  // MOTOR DE EFEITOS (mesmo esquema da voz): na prévia os efeitos saem do <Audio> do Remotion (atrasava até ~0,45 s)
  const sfxEng = useRef<SfxEngine | null>(null);
  if (!sfxEng.current) sfxEng.current = new SfxEngine();
  (window as unknown as { __sfx?: SfxEngine }).__sfx = sfxEng.current; // diagnóstico
  (window as unknown as { __voz?: VoiceEngine }).__voz = engine.current; // diagnóstico
  const [engineOff, setEngineOff] = useState(false);
  const useEngine = data?.doc.format === "wide" && !!voiceWav && !engineOff;
  useEffect(() => {
    const e = engine.current!;
    e.onError = (err) => {
      console.warn("motor de voz falhou, voltando para a voz contínua", err);
      e.stop();
      setEngineOff(true);
    };
    const un = () => {
      e.unlock();
      sfxEng.current!.unlock();
    };
    window.addEventListener("pointerdown", un, true);
    window.addEventListener("keydown", un, true);
    return () => {
      window.removeEventListener("pointerdown", un, true);
      window.removeEventListener("keydown", un, true);
      e.stop();
      sfxEng.current!.stop();
    };
  }, []);
  useEffect(() => {
    engine.current!.setSource(useEngine ? `/${voiceWav}?v=${voiceWavV}` : "");
  }, [useEngine, voiceWav, voiceWavV]);
  useEffect(() => {
    if (!useEngine || !data) return;
    engine.current!.setSegments(
      data.spec.segments.map((g) => ({ a: g.a, frames: g.frames ?? Math.round((g.b - g.a) * (data.spec.fps ?? 30)) })),
      data.spec.fps ?? 30,
    );
  }, [useEngine, segKey]);
  useEffect(() => {
    setVoiceCont("");
    if (!slug || !voiceWav || data?.doc.format !== "wide" || useEngine) return;
    let ok = true;
    const segs = data.spec.segments.map((g) => ({ a: g.a, frames: g.frames }));
    // espera os cortes "assentarem" (vários cliques seguidos = um pedido só)
    const id = setTimeout(() => {
      fetch(`/api/voicecont/${slug}?src=${encodeURIComponent(voiceWav.split("?")[0])}`, { method: "POST", body: JSON.stringify({ segments: segs, fps: data.spec.fps ?? 30 }) })
        .then((r) => r.json())
        .then((j) => ok && j.src && setVoiceCont(j.src))
        .catch(() => {});
    }, 400);
    return () => {
      ok = false;
      clearTimeout(id);
    };
  }, [slug, voiceWav, segKey, data?.doc.format, voiceRetry, useEngine]);
  // se o arquivo da voz contínua falhar no player (sumiu, erro), volta na hora para take a take e pede outro
  useEffect(() => {
    if (!voiceCont) return;
    const onErr = (e: Event) => {
      const a = e.target as HTMLMediaElement;
      if (a instanceof HTMLMediaElement && (a.currentSrc || a.src || "").includes(voiceCont.split("/").pop()!)) {
        setVoiceCont("");
        setVoiceRetry((n) => n + 1);
      }
    };
    document.addEventListener("error", onErr, true);
    return () => document.removeEventListener("error", onErr, true);
  }, [voiceCont]);
  useEffect(() => {
    if (!slug) return;
    let alive = true;
    const key = `estudio.focus.${slug}`;
    const check = async () => {
      const j = await fetch(`/api/focus/${slug}`).then((r) => r.json()).catch(() => null);
      if (!alive || !j || typeof j.ts !== "number") return;
      setFocus((cur) => (cur && cur.ts === j.ts ? cur : j)); // só redesenha se houver edição nova
      let seen = 0;
      try {
        seen = +(localStorage.getItem(key) ?? 0);
      } catch {
        /* sem armazenamento */
      }
      if (j.ts > seen && !player.current?.isPlaying()) {
        try {
          localStorage.setItem(key, String(j.ts));
        } catch {
          /* sem armazenamento */
        }
        goFocus(j);
        setStatus(`Claude editou: ${j.label} · o botão ⌖ da timeline volta aqui`);
      }
    };
    check();
    const id = setInterval(check, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug]);
  // SOLO (só na prévia, não é salvo): com trilhas em solo tocam só os sons delas (mesmo que a trilha esteja muda)
  // e a voz fica em silêncio. Sem solo, tudo como sempre.
  const [solo, setSolo] = useState<string[]>([]);
  // voz: "__voz" no solo = ouvir a voz junto das trilhas em solo; voiceMute = calar a voz na prévia (nada disso é salvo)
  const [voiceMute, setVoiceMute] = useState(false);
  useEffect(() => {
    setSolo([]);
    setVoiceMute(false);
  }, [slug]);
  useEffect(() => {
    if (!data) return;
    const vozOn = !voiceMute && (!solo.length || solo.includes("__voz"));
    engine.current!.setGain(vozOn ? Math.pow(10, (data.doc.voice?.gain ?? 0) / 20) : 0);
  }, [data?.doc.voice?.gain, voiceMute, solo]);
  const fullDoc = useMemo(() => {
    let base = data && proxy ? { ...data.doc, video: { ...data.doc.video, src: proxy, preview: preview || undefined } } : data?.doc;
    // formato só voz: a prévia toca a voz take a take a partir da cópia WAV (troca de take sem engasgo)
    if (base && base.format === "wide" && voiceWav)
      base = useEngine ? { ...base, voice: { ...(base.voice ?? {}), engine: true } } : { ...base, voice: { ...(base.voice ?? {}), src: voiceCont || voiceWav, cont: !!voiceCont } };
    if (base && voiceMute) base = { ...base, voice: { ...(base.voice ?? {}), gain: -90 } };
    if (!base || !solo.length) return base;
    const first = base.soundTracks?.[0]?.id;
    const tracksSolo = solo.filter((x) => x !== "__voz");
    const vozSolo = solo.includes("__voz");
    return {
      ...base,
      soundTracks: (base.soundTracks ?? []).map((t) => ({ ...t, muted: !tracksSolo.includes(t.id) })),
      sounds: base.sounds.filter((x) => tracksSolo.includes(x.track ?? first ?? "")),
      voice: vozSolo && !voiceMute ? base.voice : { ...(base.voice ?? {}), gain: -90 },
    };
  }, [data, proxy, preview, solo, voiceWav, voiceCont, voiceMute, useEngine]);
  const playDoc = useMemo(() => (fullDoc && useEngine ? { ...fullDoc, sounds: [] } : fullDoc), [fullDoc, useEngine]);
  const sfxClips = useMemo<SfxClip[]>(() => {
    if (!fullDoc || !useEngine) return [];
    const total = fullDoc.duration ?? 1e9;
    return fullDoc.sounds
      .filter((x) => !x.muted && !fullDoc.soundTracks?.find((t) => t.id === x.track)?.muted)
      .map((x) => {
        const tv = fullDoc.soundTracks?.find((t) => t.id === x.track)?.vol ?? 1;
        return { id: x.id, src: `/${x.fxSrc ?? x.src}`, start: x.start, dur: Math.max(0.05, Math.min(x.dur ?? 6, total - x.start)), trim: x.trim ?? 0, vol: x.vol * tv, fadeIn: x.fadeIn ?? 0, fadeOut: x.fadeOut ?? 0 };
      });
  }, [fullDoc, useEngine]);
  useEffect(() => {
    sfxEng.current!.setClips(sfxClips);
  }, [sfxClips]);
  const inputProps = useMemo(() => ({ doc: playDoc!, spec: data?.spec! }), [playDoc, data?.spec]);

  // VIGIA DO VÍDEO: se o vídeo da prévia travar, der erro ou o navegador "desligar" ele
  // (acontece depois de muitos saltos ou com o vídeo parado muito tempo), recarrega sozinho
  // no mesmo ponto. Se o elemento sumir, remonta o player.
  const [playerKey, setPlayerKey] = useState(0);
  useHourLabel(pwrapRef, playerKey);
  // o motor de voz segue o player: play/pausa/pulo/espera reiniciam o agendamento; se escorregar > 0,2 s, realinha
  useEffect(() => {
    const p = player.current;
    const e = engine.current!;
    const sx = sfxEng.current!;
    if (!p || !useEngine) return;
    const t = () => p.getCurrentFrame() / fps;
    const onPlay = () => {
      e.play(t());
      sx.play(t());
    };
    const onStop = () => {
      e.stop();
      sx.stop();
      sx.prefetch(t());
    };
    const onSeek = () => {
      if (p.isPlaying()) onPlay();
      else sx.prefetch(t());
    };
    const evs: [string, () => void][] = [["play", onPlay], ["pause", onStop], ["ended", onStop], ["seeked", onSeek], ["waiting", onStop], ["resume", onPlay]];
    for (const [n, f] of evs) p.addEventListener(n as "play", f);
    const iv = setInterval(() => {
      if (p.isPlaying()) {
        if (!e.isPlaying() || Math.abs(e.now() - t()) > 0.2) e.play(t());
        if (!sx.isPlaying() || Math.abs(sx.now() - t()) > 0.2) sx.play(t());
      } else {
        if (e.isPlaying()) e.stop();
        if (sx.isPlaying()) sx.stop();
      }
    }, 500);
    if (p.isPlaying()) onPlay();
    else sx.prefetch(t());
    return () => {
      for (const [n, f] of evs) p.removeEventListener(n as "play", f);
      clearInterval(iv);
      e.stop();
      sx.stop();
    };
  }, [data?.doc.format, proxy, useEngine, playerKey]);
  const probe = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let bad = 0;
    const id = setInterval(() => {
      const v = document.querySelector(".pwrap video") as HTMLVideoElement | null;
      const p = player.current;
      if (!p || !preview) return;
      if (document.querySelector(".pwrap.wide")) return; // formato só voz (HL3): não há <video> na prévia
      // carregando (networkState 2) não conta como travado; só age depois de 3 s seguidos de problema.
      // Também confere a IMAGEM: vídeo "carregado" mas pintando preto (o navegador às vezes para de
      // desenhar o vídeo) é detectado numa amostra de 8x8 do quadro.
      let black = false;
      if (v && v.readyState >= 2 && !v.seeking && v.videoWidth > 0) {
        try {
          const c = probe.current ?? (probe.current = document.createElement("canvas"));
          c.width = 8;
          c.height = 8;
          const g = c.getContext("2d", { willReadFrequently: true })!;
          g.drawImage(v, 0, 0, 8, 8);
          const px = g.getImageData(0, 0, 8, 8).data;
          let mx = 0;
          for (let i = 0; i < px.length; i += 4) mx = Math.max(mx, px[i], px[i + 1], px[i + 2]);
          black = mx < 10;
        } catch {
          /* ignora */
        }
      }
      const broken = !v || !!v.error || v.networkState === 3 || (v.readyState < 2 && !v.seeking && v.networkState !== 2) || (v.readyState >= 2 && v.videoWidth === 0) || black;
      bad = broken ? bad + 1 : 0;
      if (bad < 3) return;
      bad = 0;
      // recria o player (volta com o arquivo certo) e retoma no mesmo quadro
      const f = p.getCurrentFrame();
      setPlayerKey((k) => k + 1);
      setTimeout(() => player.current?.seekTo(f), 700);
    }, 1000);
    return () => clearInterval(id);
  }, [preview]);


  const selectedSound: SoundClip | undefined = sel?.kind === "sound" ? doc?.sounds.find((s) => s.id === sel.id) : undefined;
  const selectedScene: SceneClip | undefined = sel?.kind === "scene" ? doc?.scenes.find((s) => s.id === sel.id) : undefined;

  return (
    <div className="app">
      {status && status !== "salvo" ? <div className="toast">{status}</div> : null}
      <div className="top">
        <button className="icon ghost" title="Projetos" onClick={() => (location.href = "/")}>
          <LayoutGrid size={16} />
        </button>
        <div className="brand">
          <span className="mark">
            <Clapperboard size={14} />
          </span>
          <span className="brandtxt">
            Estúdio <b>{ESTUDIO}</b>
          </span>
        </div>
        <select value={slug} onChange={async (e) => {
            const v = e.target.value;
            if (dirty) await save(); // sem confirm() (bloqueado no painel): salva e troca
            setSlug(v);
          }}>
          {videos.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.slug.replace(/^\d{4}-\d{2}-\d{2}_/, "")}
            </option>
          ))}
        </select>
        <div className="sep" />
        <button className="icon ghost" onClick={undo} disabled={!past.length && !undoCuts} title="Desfazer (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button className="icon ghost" onClick={redo} disabled={!future.length && !redoCuts} title="Refazer (Ctrl+Y)">
          <Redo2 size={16} />
        </button>
        <button className={`savebtn ${dirty ? "dirty" : ""}`} onClick={save} disabled={!dirty} title={dirty ? "Salvar (Ctrl+S)" : "Tudo salvo"}>
          {dirty ? <Save size={14} /> : <Check size={14} />}
          {dirty ? "Salvar" : "Salvo"}
        </button>
        <div className="spacer" />
        {render && !render.done ? (
          <div className="rprog" title={render.frames ? `quadros ${render.frames}` : undefined}>
            <div className="rring" style={{ ["--p" as string]: `${render.pct ?? 0}` } as React.CSSProperties}>
              <b>{render.pct ?? 0}</b>
              <i>%</i>
            </div>
            <div className="rinfo">
              <div className="rtxt">
                <span className="rphase">{render.phase ?? "renderizando"}</span>
                <span className="rsub">{render.eta ? `faltam ${etaPt(render.eta)}` : fmtSecs(render.elapsed)}</span>
              </div>
              <div className="rbar">
                <div style={{ width: `${Math.max(2, render.pct ?? 0)}%` }} />
              </div>
            </div>
          </div>
        ) : null}
        {render && !render.done ? (
          <button className="icon ghost" onClick={() => pauseRender(!render.paused)} title={render.paused ? "Continuar o render de onde parou" : "Pausar o render (libera o PC; continua depois de onde parou)"}>
            {render.paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          </button>
        ) : null}
        {render && !render.done ? (
          <button className="icon ghost" onClick={cancelRender} title="Cancelar o render (os blocos prontos ficam guardados: Renderizar de novo continua deles)">
            <X size={16} />
          </button>
        ) : null}
        {(() => {
          const file = render?.done && render.ok && render.file ? render.file : !render || render.done ? last?.file : undefined;
          if (!file) return null;
          const when = last ? new Date(last.mtime).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", " ·") : "";
          // desatualizado: você editou depois deste render (ou tem mudança ainda não salva)
          const stale = !!last?.stale || (dirty && !!last);
          return (
            <div className={`export ${stale ? "stale" : ""}`} title={stale ? "Este vídeo é de ANTES da sua última edição. Renderize de novo para baixar a versão atual." : file}>
              <span className="exp-info">
                <span className="okdot" />
                <span className="exp-lbl">{stale ? "Desatualizado" : "Pronto"}</span>
                <span className="exp-when">{when}</span>
              </span>
              <a className="exp-btn dl" href={`/api/file?p=${encodeURIComponent(file)}&download=1&v=${Math.round(last?.mtime ?? Date.now())}`} title={stale ? "Baixar a versão ANTIGA (renderize de novo para a atual)" : "Baixar o vídeo"}>
                <Download size={14} /> Baixar
              </a>
              <button className="exp-btn" onClick={() => reveal(file)} title="Mostrar na pasta (abre o Explorer com o vídeo selecionado)">
                <FolderOpen size={15} />
              </button>
            </div>
          );
        })()}
        {render?.done && !render.ok ? (
          <span className="renderfail" title={render.error ?? ""}>
            {render.cancelled ? "Render cancelado" : "Deu erro no render"}
          </span>
        ) : null}
        <div className="tools">
          <PendButton open={pendOpen} n={pend.items.filter((x) => x.status === "pendente").length} onClick={() => setPendOpen((v) => !v)} />
          <button className={`icon ghost ${capOpen ? "on" : ""}`} onClick={() => setCapOpen((v) => !v)} title="Legenda do Instagram: gerar, editar e copiar">
            <MessageSquareText size={16} />
          </button>
          <button className={`icon ghost ${textOpen ? "on" : ""}`} onClick={() => setTextOpen((v) => !v)} title="Editar pelo texto: apague palavras e o vídeo corta junto (T)">
            <Type size={16} />
          </button>
          <button className={`icon ghost ${safe ? "on" : ""}`} onClick={() => setSafe((v) => !v)} title="Mostrar onde a interface do Instagram cobre o vídeo (G)">
            <Smartphone size={16} />
          </button>
          <button className={`icon ghost ${versions ? "on" : ""}`} onClick={openVersions} title="Versões salvas: voltar para um momento anterior">
            <History size={16} />
          </button>
          <button className="icon ghost" onClick={() => setHelp((h) => !h)} title="Atalhos">
            <Keyboard size={16} />
          </button>
        </div>
        {versions ? (
          <div className="vpop">
            <div className="vhead">Versões salvas</div>
            {!versions.length ? <div className="vnone">Ainda não há versões (o Estúdio guarda uma por minuto enquanto você edita).</div> : null}
            {versions.map((v) => (
              <button key={v.name} className="vrow" onClick={() => restoreVersion(v.name, v.t)} title="Voltar para esta versão">
                <span className="vwhen">{new Date(v.t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="vmeta">
                  {v.scenes} cenas · {v.duration >= 3600 ? `${Math.floor(v.duration / 3600)}:${String(Math.floor((v.duration % 3600) / 60)).padStart(2, "0")}` : Math.floor(v.duration / 60)}:{String(Math.round(v.duration % 60)).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <button className="primary" onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); if (e.detail === 0) return; if (ropt) setRopt(null); else openRender(); }} onKeyDown={(e) => e.preventDefault()} disabled={!data || (render ? !render.done : false)}>
          <Film size={15} /> {render && !render.done ? "Renderizando..." : "Renderizar"}
        </button>
      </div>

      {ropt ? (
        <div className="ropt">
          <div className="ropt-h">Renderizar</div>
          <label className="ropt-l">
            Nome do arquivo
            <span className="ropt-name">
              <input
                type="text"
                autoFocus
                value={ropt.name}
                onChange={(e) => setRopt({ ...ropt, name: e.target.value })}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") startRender();
                  if (e.key === "Escape") setRopt(null);
                }}
              />
              <i>.mp4</i>
            </span>
          </label>
          {last && last.file.split("/").pop() === `${ropt.name.trim()}.mp4` ? <div className="ropt-warn">Já existe um vídeo com esse nome: ele vai ser substituído.</div> : null}
          <div className="ropt-l">Resolução</div>
          <div className="ropt-modes ropt-res">
            <button className={`ropt-m ${ropt.res === "1080" ? "on" : ""}`} onClick={() => setRopt({ ...ropt, res: "1080" })}>
              <b>1080p</b>
              <span>Full HD. Mais rápido; bom para Reels e testes.</span>
            </button>
            <button className={`ropt-m ${ropt.res === "4k" ? "on" : ""}`} onClick={() => setRopt({ ...ropt, res: "4k" })}>
              <b>4K</b>
              <span>3840x2160 desenhado em 4K: textos e ícones nítidos. Leva umas 3 a 4 vezes mais.</span>
            </button>
          </div>
          <div className="ropt-l">Enquanto renderiza</div>
          <div className="ropt-modes">
            <button className={`ropt-m ${ropt.mode === "alta" ? "on" : ""}`} onClick={() => setRopt({ ...ropt, mode: "alta" })}>
              <b>Não vou usar o PC</b>
              <span>Prioridade alta. Usa quase tudo da máquina e termina mais rápido.</span>
            </button>
            <button className={`ropt-m ${ropt.mode === "baixa" ? "on" : ""}`} onClick={() => setRopt({ ...ropt, mode: "baixa" })}>
              <b>Vou usar o PC</b>
              <span>Prioridade baixa. O que você abrir tem preferência; demora mais.</span>
            </button>
          </div>
          <div className="ropt-f">
            <button className="ghost" onClick={() => setRopt(null)}>
              Cancelar
            </button>
            <button className="primary" onClick={startRender}>
              <Film size={15} /> Renderizar
            </button>
          </div>
        </div>
      ) : null}

      <div className={`mid ${sel ? "with-panel" : ""}`}>
        <div className="stage">
          {data && tl && playDoc && proxy ? (
            <div ref={pwrapRef} className={`pwrap ${big ? "big" : ""} ${playDoc.format === "wide" ? "wide" : ""} ${playDoc.orient === "vertical" ? "vert" : ""}`}>
              <button
                className="icon bigbtn"
                style={{ right: 50 }}
                title="Recarregar o vídeo (se a imagem sumir)"
                onClick={() => {
                  const f = player.current?.getCurrentFrame() ?? 0;
                  setPlayerKey((k) => k + 1);
                  setTimeout(() => player.current?.seekTo(f), 600);
                }}
              >
                <RotateCw size={15} />
              </button>
              <button className="icon bigbtn" title={big ? "Sair da tela cheia (Esc)" : "Tela cheia (F)"} onClick={toggleBig}>
                {big ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <Player
                key={playerKey}
                ref={player}
                component={Comp}
                inputProps={inputProps}
                durationInFrames={tl.DURATION}
                fps={fps}
                compositionWidth={playDoc.format === "wide" && playDoc.orient !== "vertical" ? 1920 : 1080}
                compositionHeight={playDoc.format === "wide" && playDoc.orient !== "vertical" ? 1080 : 1920}
                playbackRate={rate}
                // sem canais de áudio compartilhados (0): cada som cria o próprio <audio>. Com 5/16 o player congelava na
                // cena com muitos sons (34 s do botox); com 64 ele esperava ~0,5 s a cada salto enquanto o vídeo seguia
                // sozinho, e o trecho repetia/voltava (medido 2026-09-28). Com 0: nenhum travamento em 10 saltos.
                numberOfSharedAudioTags={0}
                style={{ width: "100%", height: "100%" }}
                controls
                allowFullscreen={false}
                clickToPlay={false}
                acknowledgeRemotionLicense
              />
              {safe ? <SafeZones seam={980} /> : null}
            </div>
          ) : (
            <span className="status">carregando o vídeo...</span>
          )}
          {previewBusy ? <div className="pbusy">preparando a prévia...</div> : null}
          {voiceJob ? (
            <div className="vjob" title="O trecho novo fica mudo na prévia até acabar; o resto toca normal">
              <div className="vjob-t">
                refazendo a voz com o áudio novo · {voiceJob.step || "começando"} · {voiceJob.pct}%
              </div>
              <div className="vjob-bar">
                <div style={{ width: `${Math.max(2, voiceJob.pct)}%` }} />
              </div>
            </div>
          ) : null}
          {textOpen && doc ? (
            <Transcript
              words={doc.captions.words}
              now={now}
              sel={textSel}
              setSel={setTextSel}
              seek={seek}
              onCut={() => {
                if (!textSel) return;
                const r = rangeOf(doc.captions.words, textSel);
                cutRange(r.a, r.b);
              }}
              onClose={() => setTextOpen(false)}
            />
          ) : null}
          {libOpen ? (
            <div className="drawer" ref={libRef}>
              <div className="drawer-head">
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Music size={16} /> Biblioteca de sons e músicas
                </span>
                <button className="icon ghost" onClick={() => setLibOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <Library items={lib} sel={libSel} onSel={setLibSel} onAdd={(src) => addSound(src)} onAddMusic={addMusic} />
            </div>
          ) : null}
          {pendOpen ? <PendDrawer pend={pend} onGo={(it) => goFocus({ a: it.a, b: it.b ?? it.a + 5, label: it.text })} onClose={() => setPendOpen(false)} /> : null}
          {capOpen ? (
            <div className="capdrawer">
              <div className="drawer-head">
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquareText size={16} /> Legenda do Instagram
                </span>
                <button className="icon ghost" onClick={() => setCapOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="caprow capmeta">
                {cap ? (
                  <>
                    {cap.source === "claude" ? `gerada pelo Claude${cap.model ? ` (${cap.model})` : ""}` : cap.source === "claude-code" ? "gerada pelo Claude Code" : "gerada sem IA (modelo do roteiro)"}
                    {cap.edited ? " · editada" : ""}
                  </>
                ) : (
                  "Ainda sem legenda. Gere a partir do roteiro e da fala do vídeo."
                )}
              </div>
              <textarea value={capText} onChange={(e) => setCapText(e.target.value)} onBlur={() => cap && capText !== cap.text && saveCaptionText(capText)} placeholder="A legenda aparece aqui. Pode editar à vontade: salva sozinha." />
              <div className="caprow capmeta">
                <span className={capText.length > 2200 ? "bad" : ""}>{capText.length}/2200 caracteres</span>·
                <span className={(capText.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0) > 5 ? "bad" : ""}>{capText.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0}/5 hashtags</span>
              </div>
              <div className="caprow">
                <button onClick={genCaption} disabled={capBusy} title="Gera de novo a partir do roteiro e da fala (palavra-chave na 1ª linha, até 5 hashtags do tema, CTA do vídeo)">
                  {capBusy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} {capBusy ? "Gerando..." : cap ? "Gerar de novo" : "Gerar legenda"}
                </button>
                <div className="spacer" />
                <button className="primary" onClick={copyCaption} disabled={!capText}>
                  {capCopied ? <Check size={14} /> : <Copy size={14} />} {capCopied ? "Copiada" : "Copiar"}
                </button>
              </div>
            </div>
          ) : null}
          {help ? (
            <div className="help" onClick={() => setHelp(false)}>
              <b>Atalhos</b>
              <div><span className="kbd">Espaço</span> toca / pausa</div>
              <div><span className="kbd">←</span> <span className="kbd">→</span> anda 1 frame · com <span className="kbd">Shift</span>, 10</div>
              <div><span className="kbd">Alt</span> + setas move o item escolhido</div>
              <div>arrastar move · bordas cortam · <span className="kbd">Alt</span> ao arrastar desliga o ímã</div>
              <div><span className="kbd">Ctrl+C</span> copia · <span className="kbd">Ctrl+X</span> recorta · <span className="kbd">Ctrl+V</span> cola no cursor</div>
              <div><span className="kbd">Del</span> apaga · <span className="kbd">Ctrl+D</span> duplica no cursor</div>
              <div>arraste um som para cima/baixo para trocar de trilha · duplo clique no nome renomeia</div>
              <div><span className="kbd">Ctrl+Z</span> desfaz · <span className="kbd">Ctrl+S</span> salva</div>
              <div><span className="kbd">Ctrl</span> + rodinha: zoom da timeline · <span className="kbd">{"\\"}</span> cabe o vídeo inteiro</div>
              <div><span className="kbd">J</span> <span className="kbd">K</span> <span className="kbd">L</span> volta · pausa · avança (de novo = mais rápido) · <span className="kbd">Home</span> <span className="kbd">End</span> início e fim</div>
              <div><span className="kbd">I</span> <span className="kbd">O</span> marca um trecho · <span className="kbd">Shift+Del</span> tira o trecho do vídeo</div>
              <div><span className="kbd">S</span> divide a cena/som no cursor · <span className="kbd">M</span> marcador com nota</div>
              <div><span className="kbd">T</span> editar pelo texto · <span className="kbd">G</span> zonas do Instagram</div>
            </div>
          ) : null}
        </div>
        {multi.length > 1 && doc ? (
          <GroupPanel doc={doc} multi={multi} commit={commit} live={live} checkpoint={checkpoint} onDelete={removeSel} />
        ) : sel?.kind === "marker" && doc ? (
          <div className="side right">
            <MarkerPanel
              doc={doc}
              id={sel.id}
              commit={commit}
              live={live}
              seek={seek}
              onSel={(id) => setSel({ kind: "marker", id })}
              onDelete={removeSel}
            />
          </div>
        ) : sel && doc ? (
          <div className="side right">
            <Inspector doc={doc} sel={sel} sound={selectedSound} scene={selectedScene} lib={lib} commit={commit} onDelete={removeSel} onDuplicate={duplicateSel} seek={seek} slug={slug} pauses={livePauses} onTighten={tighten} tightenSt={tightenSt} onReloadDoc={async (m) => { await reloadAfterTighten(); setStatus(m); }} ignoredN={pauses.length - livePauses.length} onIgnore={ignorePauses} onReanalyze={reanalyzePauses} />
          </div>
        ) : null}
      </div>

      {doc && tl ? (
        <Timeline
          doc={doc}
          fps={fps}
          total={tl.DURATION / fps}
          now={now}
          peaks={peaks}
          sel={sel}
          setSel={setSel}
          multi={multi}
          setMulti={setMulti}
          actions={{ remove: removeSel, duplicate: duplicateSel, copy: copySel, cut: () => copySel() && removeSel(), paste }}
          seek={seek}
          live={live}
          checkpoint={checkpoint}
          onDropSound={(src, t, track) => addSound(src, t, track)}
          libSel={libSel}
          onOpenLib={() => setLibOpen(true)}
          pauses={livePauses.filter((p) => p.cut !== false)}
          onIgnorePause={(p) => ignorePauses([p])}
          onCutBreaths={() => {
            setSel({ kind: "voice" });
            if (!pauses.length) fetch(`/api/pauses/${slug}`).then((r) => r.json()).then((p) => Array.isArray(p) && setPauses(p)).catch(() => {});
          }}
          player={player}
          commit={commit}
          inOut={inOut}
          fitSig={fitSig}
          reveal={tlReveal}
          lastEdit={focus}
          onLastEdit={() => focus && goFocus(focus)}
          onAddMarker={addMarker}
          onCutRange={() => inOut.a !== undefined && inOut.b !== undefined && cutRange(inOut.a, inOut.b)}
          spec={data!.spec}
          srcPeaks={srcPeaks}
          onTrimClip={trimClip}
          magnet={magnet}
          setMagnet={setMagnet}
          solo={solo}
          setSolo={setSolo}
          voiceMute={voiceMute}
          setVoiceMute={setVoiceMute}
          tool={tool}
          setTool={setTool}
          onBlade={onBlade}
          locked={locked}
        />
      ) : (
        <div />
      )}
    </div>
  );
};

// Painel do marcador: nota, feito, ir para, apagar, e a lista de todos (o Claude lê essa lista no edit.json).
const MarkerPanel: React.FC<{
  doc: EditDoc;
  id: string;
  commit: (fn: (d: EditDoc) => void) => void;
  live: (fn: (d: EditDoc) => void) => void;
  seek: (t: number) => void;
  onSel: (id: string) => void;
  onDelete: () => void;
}> = ({ doc, id, commit, live, seek, onSel, onDelete }) => {
  const ms = doc.markers ?? [];
  const m = ms.find((x) => x.id === id);
  if (!m) return null;
  const mmss = (t: number) => (t >= 3600 ? `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}:${(t % 60).toFixed(1).padStart(4, "0")}` : `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`);
  return (
    <div className="mpanel">
      <div className="mp-head">
        <Bookmark size={16} /> Marcador em {mmss(m.t)}
      </div>
      <textarea
        autoFocus
        placeholder="O que fazer aqui? (ex.: tirar o vá, trocar a foto...)"
        value={m.note}
        onChange={(e) => live((d) => ((d.markers ?? []).find((x) => x.id === id)!.note = e.target.value))}
        rows={4}
      />
      <label className="mp-done">
        <input type="checkbox" checked={!!m.done} onChange={(e) => commit((d) => ((d.markers ?? []).find((x) => x.id === id)!.done = e.target.checked))} /> Resolvido
      </label>
      <div className="mp-actions">
        <button className="ghost" onClick={() => seek(m.t)}>
          Ir para
        </button>
        <button className="ghost danger" onClick={onDelete}>
          <Trash2 size={14} /> Apagar
        </button>
      </div>
      <div className="mp-list">
        <div className="mp-lh">Todos os marcadores ({ms.length})</div>
        {ms.map((x) => (
          <button key={x.id} className={`mp-row ${x.id === id ? "on" : ""} ${x.done ? "done" : ""}`} onClick={() => (onSel(x.id), seek(x.t))}>
            <span className="mp-t">{mmss(x.t)}</span>
            <span className="mp-n">{x.note || "sem nota"}</span>
          </button>
        ))}
      </div>
    </div>
  );
};


