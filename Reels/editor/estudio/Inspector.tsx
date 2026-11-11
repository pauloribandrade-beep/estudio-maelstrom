import React, { useEffect, useRef, useState } from "react";
import { AudioLines, Captions, Clapperboard, Copy, Crosshair, Mic, Music, Play, Scissors, Trash2, Undo2, ZoomIn } from "lucide-react";
import { EditDoc, SceneClip, SoundClip, SoundFx, VoiceFx } from "../src/lib/edit/types";
import type { Sel } from "./Timeline";
import { shiftInner } from "./util";
import { SfxItem } from "./Library";

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const db = (v: number) => (v > 0 ? `${(20 * Math.log10(v)).toFixed(1)} dB` : "mudo");

// Campo numérico que só aplica ao sair do campo ou apertar Enter (uma entrada no desfazer).
const Num: React.FC<{ label: string; value: number; step?: number; onChange: (v: number) => void }> = ({ label, value, step = 0.01, onChange }) => {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const apply = () => {
    const n = parseFloat(v.replace(",", "."));
    if (!Number.isNaN(n) && n !== value) onChange(r3(n));
    else setV(String(value));
  };
  return (
    <div>
      <label>{label}</label>
      <input type="number" step={step} value={v} onChange={(e) => setV(e.target.value)} onBlur={apply} onKeyDown={(e) => e.key === "Enter" && apply()} />
    </div>
  );
};

const Txt: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <label>{label}</label>
      <input style={{ width: "100%" }} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onChange(v)} onKeyDown={(e) => e.key === "Enter" && v !== value && onChange(v)} />
    </div>
  );
};

const Switch: React.FC<{ on: boolean; busy?: boolean; title: string; sub?: string; onChange: (v: boolean) => void }> = ({ on, busy, title, sub, onChange }) => (
  <div className={`switch ${on ? "on" : ""} ${busy ? "busy" : ""}`} onClick={() => !busy && onChange(!on)}>
    <span className="track" />
    <span>
      <span className="t">{title}</span>
      {sub ? <small>{sub}</small> : null}
    </span>
  </div>
);

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }> = ({ label, value, min, max, step, show, onChange }) => (
  <>
    <div className="valline">
      <span>{label}</span>
      <b>{show}</b>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
  </>
);

// Velocidade dos trechos de vídeo de uma cena (HLFootage `shots`, HLDuo `panes[].shots`): `rate` por trecho.
const SceneVideoSpeed: React.FC<{ scene: SceneClip; upd: (fn: (s: SceneClip) => void) => void }> = ({ scene, upd }) => {
  type Sh = { src: string; rate?: number };
  const p = scene.props as { shots?: Sh[]; panes?: { title?: string; shots: Sh[] }[] };
  const list: { label: string; get: (s: SceneClip) => Sh }[] = [];
  (p.shots ?? []).forEach((sh, i) => list.push({ label: `Trecho ${i + 1} · ${sh.src.split("/").pop()}`, get: (s) => (s.props as typeof p).shots![i] }));
  (p.panes ?? []).forEach((pn, j) =>
    pn.shots.forEach((sh, i) => list.push({ label: `${pn.title ?? `Quadro ${j + 1}`} · ${sh.src.split("/").pop()}`, get: (s) => (s.props as typeof p).panes![j].shots[i] })),
  );
  if (!list.length) return null;
  return (
    <div className="card">
      <h4>Velocidade dos vídeos</h4>
      {list.map((it, k) => {
        const r = it.get(scene).rate ?? 1;
        return <Slider key={k} label={it.label} value={r} min={0.25} max={3} step={0.05} show={`${r.toFixed(2)}x`} onChange={(x) => upd((s) => (it.get(s).rate = Math.round(x * 100) / 100))} />;
      })}
      <div className="hint">Mais lento que 1x deixa o plano em câmera lenta; mais rápido pode acabar o trecho antes do fim da cena.</div>
    </div>
  );
};

// Reverb da voz: o slider mexe na hora, o processamento só roda 0,7 s depois de soltar.
// De-esser: tira o chiado do S (só a faixa aguda dos "s" é comprimida). Aplica 0,7 s depois de soltar o controle.
const VoiceDeess: React.FC<{ fx: VoiceFx; busy: boolean; onApply: (p: Partial<VoiceFx>) => void }> = ({ fx, busy, onApply }) => {
  const [v, setV] = useState(fx.deess ?? 0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => setV(fx.deess ?? 0), [fx.deess]);
  return (
    <div style={{ marginTop: 10, opacity: busy ? 0.6 : 1 }}>
      <Slider
        label="De-esser (chiado do S)"
        value={v}
        min={0}
        max={100}
        step={5}
        show={v ? `${v}%` : "desligado"}
        onChange={(x) => {
          setV(x);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => onApply({ deess: x }), 1200);
        }}
      />
    </div>
  );
};

const VoiceReverb: React.FC<{ fx: VoiceFx; busy: boolean; onApply: (p: Partial<VoiceFx>) => void }> = ({ fx, busy, onApply }) => {
  const [rev, setRev] = useState(fx.reverb ?? 0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => setRev(fx.reverb ?? 0), [fx.reverb]);
  const room = fx.room ?? 1;
  const later = (p: Partial<VoiceFx>) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onApply(p), 700);
  };
  return (
    <div style={{ marginTop: 10, opacity: busy ? 0.6 : 1 }}>
      <Slider label="Reverb na voz" value={rev} min={0} max={60} step={1} show={rev ? `${rev}%` : "sem"} onChange={(x) => (setRev(x), later({ reverb: x, room }))} />
      <div className="presets" style={{ marginTop: 6 }}>
        {[1, 2, 4].map((r) => (
          <button key={r} className={`chip ${room === r ? "on" : ""}`} onClick={() => onApply({ room: r, reverb: rev || 12 })}>
            {r === 1 ? "Sala" : r === 2 ? "Salão" : "Catedral"} · {r}s
          </button>
        ))}
      </div>
    </div>
  );
};

// Efeitos de um som: grave, agudo, reverb (quantidade + sala) e normalizar. O servidor gera o arquivo
// processado (sfx/_fx) 0,5 s depois da última mudança; o original não é tocado.
const SoundFxCard: React.FC<{ sound: SoundClip; upd: (fn: (s: SoundClip) => void) => void }> = ({ sound, upd }) => {
  const [fx, setFx] = useState<SoundFx>(sound.fx ?? {});
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => setFx(sound.fx ?? {}), [sound.id]);
  const apply = (next: SoundFx) => {
    setFx(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/sfxfx`, { method: "POST", body: JSON.stringify({ src: sound.src, fx: next }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        upd((s) => {
          const oldLen = s.dur;
          if (j.fxSrc) s.fxSrc = j.fxSrc;
          else delete s.fxSrc;
          // com reverb o arquivo fica mais longo: estica a duração para a cauda não ser cortada
          const k0 = s.fx?.speed ?? 1;
          const k1 = next.speed ?? 1;
          if (j.dur && k0 !== k1) {
            // velocidade mudou: o trecho usado escala junto (trim e duração)
            s.trim = (s.trim ?? 0) * (k0 / k1);
            s.dur = Math.max(0.05, Math.min(j.dur - s.trim, (oldLen ?? j.dur) * (k0 / k1)));
          } else if (oldLen !== undefined && j.dur) s.dur = Math.max(0.05, Math.min(j.dur - (s.trim ?? 0), oldLen + (next.reverb ? (next.room ?? 2) : 0)));
          s.fx = next;
        });
      } catch (e) {
        alert("Não deu para aplicar o efeito: " + String(e));
      }
      setBusy(false);
    }, 500);
  };
  const rev = fx.reverb ?? 0;
  const room = fx.room ?? 2;
  return (
    <div className="card">
      <h4>
        <AudioLines size={13} /> Efeitos {busy ? <span className="tag">aplicando...</span> : null}
      </h4>
      <Slider label="Reverb" value={rev} min={0} max={100} step={1} show={rev ? `${rev}%` : "sem"} onChange={(x) => apply({ ...fx, reverb: x, room })} />
      <div className="presets" style={{ marginTop: 6 }}>
        {[1, 2, 4, 8].map((r) => (
          <button key={r} className={`chip ${room === r ? "on" : ""}`} onClick={() => apply({ ...fx, room: r, reverb: rev || 30 })}>
            {r === 1 ? "Sala" : r === 2 ? "Salão" : r === 4 ? "Catedral" : "Espaço"} · {r}s
          </button>
        ))}
      </div>
      <Slider label="Velocidade" value={fx.speed ?? 1} min={0.25} max={4} step={0.05} show={`${(fx.speed ?? 1).toFixed(2)}x`} onChange={(x) => apply({ ...fx, speed: Math.round(x * 100) / 100 })} />
      <div className="presets" style={{ marginTop: 6 }}>
        {[0.5, 0.75, 1, 1.5, 2].map((v) => (
          <button key={v} className={`chip ${(fx.speed ?? 1) === v ? "on" : ""}`} onClick={() => apply({ ...fx, speed: v })}>
            {v}x
          </button>
        ))}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 0" }}>
        <input type="checkbox" checked={fx.keepPitch !== false} onChange={(e) => apply({ ...fx, keepPitch: e.target.checked })} /> Manter o tom (desmarcado: muda o tom, como fita)
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 4px" }}>
        <input type="checkbox" checked={!!fx.reverse} onChange={(e) => apply({ ...fx, reverse: e.target.checked })} /> Reverter (tocar ao contrário)
      </label>
      <div className="hint" style={{ marginTop: 0 }}>Equalizador</div>
      {(
        [
          ["Grave", "eqLow", "120 Hz"],
          ["Médio", "eqMid", "1 kHz"],
          ["Agudo", "eqHigh", "8 kHz"],
        ] as [string, "eqLow" | "eqMid" | "eqHigh", string][]
      ).map(([n, k, hz]) => (
        <Slider key={k} label={`${n} · ${hz}`} value={fx[k] ?? 0} min={-12} max={12} step={0.5} show={fx[k] ? `${fx[k]! > 0 ? "+" : ""}${fx[k]!.toFixed(1)} dB` : "0 dB"} onChange={(x) => apply({ ...fx, [k]: x })} />
      ))}
      <Slider label="Cortar grave" value={fx.lowcut ?? 0} min={0} max={600} step={10} show={fx.lowcut ? `abaixo de ${fx.lowcut} Hz` : "desligado"} onChange={(x) => apply({ ...fx, lowcut: x })} />
      <Slider label="Cortar agudo" value={fx.highcut ?? 0} min={0} max={16000} step={250} show={fx.highcut && fx.highcut > 500 ? `acima de ${(fx.highcut / 1000).toFixed(1)} kHz` : "desligado"} onChange={(x) => apply({ ...fx, highcut: x })} />
      <Switch on={!!fx.normalize} busy={busy} title="Normalizar" sub="deixa o som no padrão dos efeitos (-20 LUFS)" onChange={(x) => apply({ ...fx, normalize: x })} />
      <div className="hint">O arquivo original fica intacto; zere tudo para voltar a ele.</div>
    </div>
  );
};

const TEXT_KEYS = ["title", "sub", "label", "text", "caption", "name", "keyword"];
const TEXT_NAMES: Record<string, string> = { title: "Título", sub: "Subtítulo", label: "Rótulo", text: "Texto", caption: "Legenda da cena", name: "Nome", keyword: "Palavra-chave" };

export type TightenOpts = { keep: number; keepMid: number; between: boolean; mid: boolean; respiro: boolean; silencio: boolean };
type Groups = { between: boolean; mid: boolean; respiro: boolean; silencio: boolean };
const ALL_GROUPS: Groups = { between: true, mid: true, respiro: true, silencio: true };
// mesma regra do tools/tighten.py: o corte deixa uma sobra depois da palavra e antes da próxima (nunca come o
// fim da fala) e só corta se tirar pelo menos 0,06 s; no meio da frase só mexe em pausa a partir de 0,35 s
const keptFor = (k: number) => Math.max(0.16, k * 0.4) + Math.max(0.06, k * 0.6);
const cuttable = (p: Pause, keep: number, keepMid: number) => {
  const k = p.where === "meio" ? keepMid : keep;
  // em milissegundos inteiros: no limite (sobra de 0,06 s exata) o tighten.py, em float, não corta
  const ca = Math.round(r3(p.a + Math.max(0.16, k * 0.4)) * 1000);
  const cb = Math.round(r3(p.b - Math.max(0.06, k * 0.6)) * 1000);
  return cb - ca > 60 && (p.where !== "meio" || p.dur >= 0.35);
};
export type TightenSt = { idle?: boolean; done: boolean; ok?: boolean; step: number; steps: number; phase: string; log?: string; error?: string; started: number; ended?: number };
export type Pause = { a: number; b: number; dur: number; kind: string; where?: "entre" | "meio"; cut?: boolean; src?: [number, number] };

export const Inspector: React.FC<{
  doc: EditDoc;
  sel: Sel;
  sound?: SoundClip;
  scene?: SceneClip;
  lib: SfxItem[];
  commit: (fn: (d: EditDoc) => void) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  seek: (t: number) => void;
  slug: string;
  pauses: Pause[];
  onTighten: (o: TightenOpts) => Promise<void>;
  tightenSt: TightenSt | null;
  onReloadDoc: (msg: string) => Promise<void>;
  ignoredN?: number;
  onIgnore?: (ps: Pause[]) => void;
  onReanalyze?: () => Promise<void>;
}> = ({ doc, sel, sound, scene, lib, commit, onDelete, onDuplicate, seek, slug, pauses, onTighten, tightenSt, onReloadDoc, ignoredN = 0, onIgnore, onReanalyze }) => {
  const [json, setJson] = useState("");
  const [jsonErr, setJsonErr] = useState("");
  const [job, setJob] = useState<{ pct: number; step: string; fx: VoiceFx } | null>(null);
  // só o ÚLTIMO pedido de efeito na voz vale: ao arrastar um controle saíam vários (25%, 30%, 50%...) e o que
  // terminava por último sobrescrevia o escolhido
  const voiceReq = useRef(0);
  const [keep, setKeep] = useState(0.1);
  const [keepMid, setKeepMid] = useState(0.25);
  const [sending, setSending] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  // grupos marcados para cortar, lembrados por vídeo (desmarcar e cortar devolve as pausas do grupo)
  const gKey = `estudio.respiros.${slug}`;
  const [groups, setGroupsSt] = useState<Groups>(ALL_GROUPS);
  useEffect(() => {
    try {
      setGroupsSt({ ...ALL_GROUPS, ...JSON.parse(localStorage.getItem(gKey) ?? "{}") });
    } catch {
      setGroupsSt(ALL_GROUPS);
    }
  }, [gKey]);
  const setGroup = (k: keyof Groups, v: boolean) =>
    setGroupsSt((g) => {
      const n = { ...g, [k]: v };
      try {
        localStorage.setItem(gKey, JSON.stringify(n));
      } catch {
        /* sem armazenamento: vale só nesta sessão */
      }
      return n;
    });
  // "Desfazer último corte": quantos cortes de respiro dá para desfazer
  const [undoDepth, setUndoDepth] = useState(0);
  const [undoing, setUndoing] = useState(false);
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/untighten/${slug}`)
      .then((r) => r.json())
      .then((j) => setUndoDepth(j.depth ?? 0))
      .catch(() => {});
  }, [slug, tightenSt?.done]);
  const cutting = sending || (!!tightenSt && !tightenSt.done);
  // relógio da etapa (o servidor só manda a etapa; os segundos correm aqui)
  const [, tick] = useState(0);
  useEffect(() => {
    if (!cutting) return;
    const id = setInterval(() => tick((x) => x + 1), 500);
    return () => clearInterval(id);
  }, [cutting]);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => void (alive.current = false);
  }, []);
  useEffect(() => {
    setJson(scene ? JSON.stringify(scene.props, null, 1) : "");
    setJsonErr("");
  }, [scene?.id, scene?.props]);

  if (!sel) return null;

  const actions = (
    <div className="actions">
      <button onClick={onDuplicate}>
        <Copy size={14} /> Duplicar
      </button>
      <button onClick={onDelete}>
        <Trash2 size={14} /> Apagar
      </button>
    </div>
  );

  // ---------- voz ----------
  if (sel.kind === "clip") {
    return (
      <div>
        <div className="phead">
          <Scissors size={16} /> Clipe {sel.i + 1}
        </div>
        <div className="card">
          <div className="hint" style={{ marginTop: 0 }}>
            Aperte <b>Delete</b> para tirar este pedaço do vídeo: a voz, as cenas, os sons e a legenda que vêm depois andam juntos. O botão de desfazer corte volta atrás.
          </div>
          <div className="hint">Para tirar só um respiro no meio do clipe: ligue a lâmina (C), clique antes e depois do respiro, volte para a seta (V), escolha o pedacinho e aperte Delete.</div>
        </div>
      </div>
    );
  }
  if (sel.kind === "voice") {
    const v = doc.voice ?? {};
    const fx: VoiceFx = job?.fx ?? v.fx ?? {};
    // processa em segundo plano; a voz atual continua tocando até a nova ficar pronta
    const setFx = async (patch: Partial<VoiceFx>) => {
      const next = { ...(v.fx ?? {}), ...patch };
      const me = ++voiceReq.current;
      setJob({ pct: 0, step: "começando", fx: next });
      const r = await fetch(`/api/voice/${slug}`, { method: "POST", body: JSON.stringify(next) });
      if (r.status === 423) return setJob(null); // timeline trancada durante o render
      const { job: id } = await r.json();
      for (;;) {
        await new Promise((ok) => setTimeout(ok, 400));
        if (me !== voiceReq.current) return; // veio outro pedido depois: este não aplica mais nada
        const st = await (await fetch(`/api/voicejob/${id}`)).json();
        if (!alive.current || me !== voiceReq.current) return;
        setJob({ pct: st.pct ?? 0, step: st.step ?? "", fx: next });
        if (st.done) {
          if (st.ok) commit((d) => (d.voice = { ...(d.voice ?? {}), fx: next, src: st.src }));
          else alert("Não deu para processar a voz: " + (st.error ?? ""));
          setJob(null);
          return;
        }
      }
    };
    const total = pauses.reduce((n, p) => n + p.dur, 0);
    return (
      <div>
        <div className="phead">
          <Mic size={16} /> Voz
        </div>
        <div className="card">
          <h4>
            <AudioLines size={13} /> Efeitos
          </h4>
          <Switch on={!!fx.normalize} busy={!!job} title="Normalizar voz" sub="mede a voz inteira e deixa no padrão de Reels (-16 LUFS)" onChange={(x) => setFx({ normalize: x })} />
          <Switch on={!!fx.compress} busy={!!job} title="Compressor" sub="segura os picos e encorpa a voz" onChange={(x) => setFx({ compress: x })} />
          <Switch on={!!fx.highpass} busy={!!job} title="Tirar grave de fundo" sub="corta ronco e barulho abaixo de 80 Hz" onChange={(x) => setFx({ highpass: x })} />
          <Switch on={!!fx.denoise} busy={!!job} title="Reduzir ruído" sub="tira chiado constante (ar-condicionado, ventilador)" onChange={(x) => setFx({ denoise: x })} />
          <Switch on={!!fx.breaths} busy={!!job} title="Suprimir respiros" sub="abaixa o volume de cada respiro que sobrou (sem cortar nada)" onChange={(x) => setFx({ breaths: x ? 18 : 0 })} />
          <VoiceDeess fx={fx} busy={!!job} onApply={(p) => setFx(p)} />
          <VoiceReverb fx={fx} busy={!!job} onApply={(p) => setFx(p)} />
          {job ? (
            <div style={{ marginTop: 10 }}>
              <div className="valline" style={{ margin: "0 0 6px" }}>
                <span>{job.step}</span>
                <b>{job.pct}%</b>
              </div>
              <div className="bar">
                <div style={{ width: `${job.pct}%` }} />
              </div>
              <div className="hint">A prévia segue com a voz atual até terminar.</div>
            </div>
          ) : null}
        </div>
        <div className="card">
          <h4>Volume e fade</h4>
          <Slider
            label="Volume da voz"
            value={v.gain ?? 0}
            min={-12}
            max={12}
            step={0.5}
            show={`${(v.gain ?? 0) > 0 ? "+" : ""}${(v.gain ?? 0).toFixed(1)} dB`}
            onChange={(x) => commit((d) => (d.voice = { ...(d.voice ?? {}), gain: x }))}
          />
          <div className="row">
            <Num label="Fade no início (s)" value={v.fadeIn ?? 0} onChange={(x) => commit((d) => (d.voice = { ...(d.voice ?? {}), fadeIn: Math.max(0, x) }))} />
            <Num label="Fade no fim (s)" value={v.fadeOut ?? 0} onChange={(x) => commit((d) => (d.voice = { ...(d.voice ?? {}), fadeOut: Math.max(0, x) }))} />
          </div>
        </div>
        <div className="card">
          <h4>
            <Scissors size={13} /> Respiros e pausas
          </h4>
          <div className="hint" style={{ marginTop: 0 }}>
            {(() => {
              const can = pauses.filter((p) => cuttable(p, keep, keepMid)).length;
              return (
                <>
                  Dá para cortar: <b style={{ color: can ? "var(--pause)" : undefined }}>{can}</b> {can ? "(em laranja na trilha Voz)" : "· nada sobrando"}.
                  {pauses.length - can > 0 ? ` Ficam ${pauses.length - can} pausas curtas (${total.toFixed(1)} s no total), já no tamanho do ritmo da fala.` : ""} Marque o que cortar:
                </>
              );
            })()}
          </div>
          {(() => {
            const row = (k: keyof Groups, label: string, f: (p: Pause) => boolean) => {
              const all = pauses.filter(f);
              const can = all.filter((p) => cuttable(p, keep, keepMid)).length;
              const secs = all.reduce((n, p) => n + p.dur, 0);
              return (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                  <input type="checkbox" checked={groups[k]} disabled={cutting} onChange={(e) => setGroup(k, e.target.checked)} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <span className="hint" style={{ margin: 0 }}>
                    {all.length} ({secs.toFixed(1)} s) · <b style={{ color: can ? "var(--pause)" : undefined }}>{can}</b> dá para cortar
                  </span>
                </label>
              );
            };
            return (
              <div style={{ margin: "8px 0 4px" }}>
                <div className="hint" style={{ margin: "6px 0 0" }}>Tipo</div>
                {row("respiro", "Respiros (som de ar)", (p) => p.kind === "respiro")}
                {row("silencio", "Silêncios", (p) => p.kind !== "respiro")}
                <div className="hint" style={{ margin: "8px 0 0" }}>Onde</div>
                {row("between", "Entre frases", (p) => p.where !== "meio")}
                {row("mid", "No meio da frase", (p) => p.where === "meio")}
              </div>
            );
          })()}
          {(() => {
            // lista do que ainda dá para cortar: cada pausa pode ser desconsiderada (some da trilha, não é cortada e
            // sai da contagem); "Analisar de novo" traz de volta as desconsideradas para reconsiderar
            const can = pauses.filter((p) => cuttable(p, keep, keepMid));
            const mmss = (t: number) => (t >= 3600 ? `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}:${(t % 60).toFixed(1).padStart(4, "0")}` : `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`);
            return (
              <div style={{ margin: "10px 0 4px" }}>
                {can.length ? (
                  <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--line, #2a2a33)", borderRadius: 8, padding: "2px 6px" }}>
                    {can.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 12 }}>
                        <button className="ghost" style={{ padding: "1px 6px" }} title="ir para esta pausa" onClick={() => seek(Math.max(0, p.a - 0.4))}>
                          {mmss(p.a)}
                        </button>
                        <span style={{ flex: 1, opacity: 0.8 }}>
                          {p.kind} · {p.dur.toFixed(2)} s · {p.where === "meio" ? "meio da frase" : "entre frases"}
                        </span>
                        <button className="ghost" style={{ padding: "1px 6px" }} disabled={cutting || !p.src} title="Desconsiderar: não marca, não conta e o corte não mexe nesta pausa" onClick={() => onIgnore?.([p])}>
                          desconsiderar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button style={{ flex: 1, justifyContent: "center" }} disabled={cutting || !can.length} title="Desconsidera todos os respiros e pausas que estão na lista: o marcador zera e o corte não mexe neles" onClick={() => onIgnore?.(can)}>
                    Desconsiderar todos{can.length ? ` (${can.length})` : ""}
                  </button>
                  <button
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={cutting || reanalyzing}
                    title={ignoredN ? `Traz de volta as ${ignoredN} pausas desconsideradas e analisa de novo` : "Analisa os respiros e pausas de novo"}
                    onClick={async () => {
                      setReanalyzing(true);
                      try {
                        await onReanalyze?.();
                      } finally {
                        if (alive.current) setReanalyzing(false);
                      }
                    }}
                  >
                    {reanalyzing ? "Analisando..." : `Analisar de novo${ignoredN ? ` (${ignoredN} desconsideradas)` : ""}`}
                  </button>
                </div>
              </div>
            );
          })()}
          <div className="hint">
            Botão direito numa marca laranja da trilha Voz também desconsidera aquela pausa.
            Só é cortado o que estiver marcado nos dois (tipo e onde). Desmarcar um grupo e cortar devolve as pausas dele. Quando "não dá para cortar", a pausa já está quase do tamanho que sobra ({keptFor(keep).toFixed(2)} s): cortar mais comeria o fim das palavras. Para respiro curto, use "Suprimir respiros".
          </div>
          <Slider label="Respiro entre frases" value={keep} min={0.04} max={0.3} step={0.01} show={`${keep.toFixed(2)} s`} onChange={setKeep} />
          <Slider label="Respiro no meio da frase" value={keepMid} min={0.12} max={0.5} step={0.01} show={`${keepMid.toFixed(2)} s`} onChange={setKeepMid} />
          <button
            className="primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
            disabled={cutting}
            onClick={async () => {
              setSending(true);
              try {
                await onTighten({ keep, keepMid, ...groups });
              } finally {
                if (alive.current) setSending(false);
              }
            }}
          >
            <Scissors size={14} /> {cutting ? "Cortando..." : "Cortar marcados"}
          </button>
          <button
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            disabled={cutting || undoing || !undoDepth}
            title={undoDepth ? "Volta os takes de antes do último corte; o que você mexeu depois continua, só acompanha a fala" : "Nenhum corte de respiros para desfazer"}
            onClick={async () => {
              setUndoing(true);
              try {
                const r = await fetch(`/api/untighten/${slug}`, { method: "POST" });
                const j = await r.json();
                if (!r.ok) return alert("Não deu para desfazer: " + (j.error ?? ""));
                setUndoDepth(j.depth ?? 0);
                await onReloadDoc(j.log ?? "corte desfeito");
              } finally {
                if (alive.current) setUndoing(false);
              }
            }}
          >
            <Undo2 size={14} /> {undoing ? "Desfazendo..." : `Desfazer último corte${undoDepth ? ` (${undoDepth})` : ""}`}
          </button>
          {tightenSt && !tightenSt.done ? (
            <div style={{ marginTop: 10 }}>
              <div className="hint" style={{ marginTop: 0, marginBottom: 6 }}>
                Etapa {tightenSt.step} de {tightenSt.steps} · {tightenSt.phase} · {Math.round((Date.now() - tightenSt.started) / 1000)} s
              </div>
              <div className="bar">
                <div style={{ width: `${((tightenSt.step - 0.5) / tightenSt.steps) * 100}%` }} />
              </div>
            </div>
          ) : tightenSt?.done ? (
            <div className="hint" style={{ color: tightenSt.ok ? "var(--voice)" : "#f87171" }}>
              {tightenSt.ok ? `✓ ${tightenSt.log}` : `Não deu para cortar: ${tightenSt.error ?? ""}`}
              {tightenSt.ended ? ` (${((tightenSt.ended - tightenSt.started) / 1000).toFixed(1)} s)` : ""}
            </div>
          ) : null}
          <div className="hint">Recalcula todos os cortes a partir da gravação e reposiciona cenas, sons, legenda e zoom. O estado anterior fica guardado no histórico.</div>
        </div>
      </div>
    );
  }

  // ---------- som ----------
  if (sel.kind === "sound" && sound) {
    const upd = (fn: (s: SoundClip) => void) => commit((d) => fn(d.sounds.find((x) => x.id === sound.id)!));
    return (
      <div>
        <div className="phead">
          <Music size={16} /> Som
          <span className="tag">{sound.scene ? `da cena ${sound.scene}` : "som solto"}</span>
        </div>
        <div className="card">
          <h4>Arquivo</h4>
          <div className="row" style={{ alignItems: "center" }}>
            <select value={sound.src} onChange={(e) => upd((s) => ((s.src = e.target.value), (s.label = e.target.value.replace(/^sfx\//, "").replace(/\.wav$/, ""))))}>
              {/* 12/10: o som que não está na biblioteca aparecia como o 1º da lista ("click") — agora mostra o arquivo dele */}
              {lib.some((l) => l.src === sound.src) ? null : <option value={sound.src}>{sound.src.split("/").pop()?.replace(/\.wav$/, "")}</option>}
              {lib.map((l) => (
                <option key={l.src} value={l.src}>
                  {l.name}
                </option>
              ))}
            </select>
            <button className="icon" style={{ flex: "0 0 32px" }} onClick={() => new Audio(`/${sound.src}`).play()} title="Ouvir">
              <Play size={14} />
            </button>
          </div>
          <Slider label="Volume" value={sound.vol} min={0} max={4} step={0.01} show={db(sound.vol)} onChange={(x) => upd((s) => (s.vol = x))} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input type="checkbox" checked={!!sound.muted} onChange={(e) => upd((s) => (s.muted = e.target.checked))} /> Mudo (fica na trilha, não toca)
          </label>
        </div>
        <div className="card">
          <h4>Tempo</h4>
          <div className="row">
            <Num label="Início (s)" value={sound.start} onChange={(v) => upd((s) => (s.start = Math.max(0, v)))} />
            <Num label="Duração (s)" value={sound.dur ?? 1} onChange={(v) => upd((s) => (s.dur = Math.max(0.033, v)))} />
          </div>
          <Num label="Cortar do começo do arquivo (s)" value={sound.trim ?? 0} onChange={(v) => upd((s) => (s.trim = Math.max(0, v)))} />
        </div>
        <SoundFxCard sound={sound} upd={upd} />
        <div className="card">
          <h4>Fade</h4>
          <div className="presets">
            {(
              [
                ["Sem fade", 0, 0],
                ["Suave", 0.05, 0.25],
                ["Entra devagar", 0.4, 0.2],
                ["Sai devagar", 0.03, 0.8],
                ["Longo", 0.5, 1],
              ] as [string, number, number][]
            ).map(([n, a, b]) => (
              <button key={n} className="chip" onClick={() => upd((s) => ((s.fadeIn = Math.min(a, s.dur ?? 1)), (s.fadeOut = Math.min(b, s.dur ?? 1))))}>
                {n}
              </button>
            ))}
          </div>
          <div className="row">
            <Num label="Entrada (s)" value={sound.fadeIn ?? 0} onChange={(v) => upd((s) => (s.fadeIn = Math.max(0, v)))} />
            <Num label="Saída (s)" value={sound.fadeOut ?? 0} onChange={(v) => upd((s) => (s.fadeOut = Math.max(0, v)))} />
          </div>
          <div className="hint">Ou puxe as bolinhas brancas nos cantos do som na timeline.</div>
        </div>
        <button className="ghost" style={{ marginBottom: 8 }} onClick={() => seek(sound.start)}>
          <Crosshair size={14} /> Ir para o som
        </button>
        {actions}
      </div>
    );
  }

  // ---------- cena ----------
  if (sel.kind === "scene" && scene) {
    const upd = (fn: (s: SceneClip) => void) => commit((d) => fn(d.scenes.find((x) => x.id === scene.id)!));
    const textKeys = TEXT_KEYS.filter((k) => typeof scene.props[k] === "string");
    return (
      <div>
        <div className="phead">
          <Clapperboard size={16} /> Cena
          <span className="tag">{scene.type}</span>
        </div>
        <div className="card">
          <Txt label="Nome na timeline" value={scene.label ?? scene.id} onChange={(v) => upd((s) => (s.label = v))} />
          <div className="row">
            <Num
              label="Início (s)"
              value={scene.start}
              onChange={(v) =>
                upd((s) => {
                  s.props = shiftInner(s.props, s.start - v) as Record<string, unknown>;
                  s.start = Math.max(0, v);
                })
              }
            />
            <Num label="Fim (s)" value={scene.end} onChange={(v) => upd((s) => (s.end = Math.max(s.start + 0.033, v)))} />
          </div>
          <label>Trilha</label>
          <select value={scene.lane ?? 0} onChange={(e) => upd((s) => (s.lane = +e.target.value))} style={{ width: "100%" }}>
            <option value={0}>Cenas</option>
            <option value={1}>Carimbos (por cima)</option>
          </select>
        </div>
        <SceneVideoSpeed scene={scene} upd={upd} />
        {textKeys.length ? (
          <div className="card">
            <h4>Textos</h4>
            {textKeys.map((k) => (
              <Txt key={k} label={TEXT_NAMES[k] ?? k} value={scene.props[k] as string} onChange={(v) => upd((s) => (s.props[k] = v))} />
            ))}
          </div>
        ) : null}
        <div className="card">
          <h4>Avançado</h4>
          <div className="hint" style={{ marginTop: 0 }}>
            Tudo da cena. Tempos em segundos a partir do início da cena.
          </div>
          <textarea
            rows={10}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            onBlur={() => {
              try {
                const p = JSON.parse(json);
                setJsonErr("");
                if (JSON.stringify(p) !== JSON.stringify(scene.props)) upd((s) => (s.props = p));
              } catch (e) {
                setJsonErr(String(e));
              }
            }}
            style={{ marginTop: 8 }}
          />
          {jsonErr ? <div style={{ color: "#ff7a5e" }}>{jsonErr}</div> : null}
        </div>
        <button className="ghost" style={{ marginBottom: 8 }} onClick={() => seek(scene.start)}>
          <Crosshair size={14} /> Ir para a cena
        </button>
        {actions}
      </div>
    );
  }

  // ---------- palavra ----------
  if (sel.kind === "word") {
    const w = doc.captions.words[sel.i];
    if (!w) return null;
    const isHot = doc.captions.hot.includes(w.word);
    return (
      <div>
        <div className="phead">
          <Captions size={16} /> Legenda
        </div>
        <div className="card">
          <h4>Palavra</h4>
          <Txt label="Texto" value={w.word} onChange={(v) => commit((d) => (d.captions.words[sel.i].word = v))} />
          <div className="row">
            <Num label="Início (s)" value={w.start} onChange={(v) => commit((d) => (d.captions.words[sel.i].start = v))} />
            <Num label="Fim (s)" value={w.end} onChange={(v) => commit((d) => (d.captions.words[sel.i].end = v))} />
          </div>
          <Switch
            on={isHot}
            title="Destaque em vermelho"
            onChange={(on) =>
              commit((d) => {
                d.captions.hot = on ? [...new Set([...d.captions.hot, w.word])] : d.captions.hot.filter((h) => h !== w.word);
              })
            }
          />
          <div className="hint">Pontuação no fim da palavra (vírgula, ponto) fecha o grupo da legenda.</div>
        </div>
        <div className="card">
          <h4>Legenda inteira</h4>
          <Slider label="Tamanho" value={doc.captions.size} min={36} max={80} step={1} show={String(doc.captions.size)} onChange={(x) => commit((d) => (d.captions.size = x))} />
          <Slider label="Altura na tela" value={doc.captions.y} min={600} max={1500} step={2} show={String(doc.captions.y)} onChange={(x) => commit((d) => (d.captions.y = x))} />
        </div>
        {actions}
      </div>
    );
  }

  // ---------- zoom ----------
  if (sel.kind === "snap") {
    const s = doc.zoom.snaps[sel.i];
    if (!s) return null;
    return (
      <div>
        <div className="phead">
          <ZoomIn size={16} /> Enquadramento
        </div>
        <div className="card">
          <div className="row">
            <Num label="Tempo (s)" value={s.t} onChange={(v) => commit((d) => (d.zoom.snaps[sel.i].t = v))} />
            <Num label="Zoom" value={s.z} step={0.01} onChange={(v) => commit((d) => (d.zoom.snaps[sel.i].z = v))} />
          </div>
        </div>
        {actions}
      </div>
    );
  }
  if (sel.kind === "push") {
    const p = doc.zoom.pushes[sel.i];
    if (!p) return null;
    return (
      <div>
        <div className="phead">
          <ZoomIn size={16} /> Aproximação
        </div>
        <div className="card">
          <div className="row">
            <Num label="Começa (s)" value={p.t} onChange={(v) => commit((d) => (d.zoom.pushes[sel.i].t = v))} />
            <Num label="Termina (s)" value={p.until === "end" ? doc.duration : p.until} onChange={(v) => commit((d) => (d.zoom.pushes[sel.i].until = v))} />
          </div>
          <div className="row">
            <Num label="Zoom" value={p.z} onChange={(v) => commit((d) => (d.zoom.pushes[sel.i].z = v))} />
            <Num label="Subida (quadros)" value={p.up ?? 14} step={1} onChange={(v) => commit((d) => (d.zoom.pushes[sel.i].up = Math.round(v)))} />
          </div>
        </div>
        {actions}
      </div>
    );
  }
  return null;
};
