import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { LucideIcon } from "lucide-react";
import { FONT, MONO, Word } from "./overlays";
import { ZALE, cap } from "./theme";
import SFX_COUNT from "./sfx-manifest.json";
import SFX_PEAK from "./sfx-peaks.json";
import { SfxCtx, emitSfx } from "./sfx-ctx";
import BRAND from "./brand.json";

// MODO PALCO (padrão da ZALE). Tela dividida o tempo todo: em cima um palco
// escuro onde aparece UM elemento visual por vez ilustrando a frase; embaixo
// o apresentador, sempre visível; a legenda fica na emenda entre os dois.
// Nunca texto em cima de texto: o palco tem os visuais, a emenda tem a fala.

export const SEAM = 980; // y da emenda palco/apresentador
export const STAGE = { x0: 60, x1: 1020, y0: 170, y1: SEAM - 90 }; // área útil do palco
const STAGE_CX = 540;
const STAGE_CY = (STAGE.y0 + STAGE.y1) / 2;

// ---------- som ----------
// Volumes baixos de propósito: o efeito pontua, não compete com a voz.
// Sons: public/sfx/<família>_<n>.wav, montados por scripts/build_sfx.py.
// REGRA DO USUÁRIO: o MESMO elemento usa SEMPRE o mesmo som (os itens de uma
// lista, os balões de uma conversa, os cards de uma órbita). A versão é escolhida
// pelo tipo de elemento (`k`), não por instância: tipos diferentes podem soar
// diferente entre si, mas nada muda dentro do mesmo tipo.
// error = algo errado/negado, glass = brilho, switch = alternar, riser = subida
// antes de uma virada, drop = batida da virada.
// Arquivos já comprimidos e limitados (-22 LUFS, pico -9 dBFS): estes volumes
// deixam cada efeito uns 10 a 12 LU abaixo da voz, perceptível e sem pico.
export const SFX_VOL = {
  pop: 0.42, tick: 0.4, tap: 0.3, whoosh: 0.42, thud: 0.176, ding: 0.45, click: 0.45, error: 0.42, glass: 0.4, switch: 0.4, riser: 0.4, drop: 0.36, paper: 0.4, step: 0.4, fly: 0.22, yuck: 0.3, page: 0.35, flap: 0.35, news: 0.35, confirm: 0.3, ui: 0.3, flip: 0.3, crack: 0.32,
};
type SfxName = keyof typeof SFX_VOL;
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
};
const variant = (name: string, key: string) => {
  const n = (SFX_COUNT as Record<string, number>)[name] || 1;
  return `sfx/${name}_${hash(key + name) % n}.wav`;
};
// `file`: força um arquivo específico de public/sfx (ex.: "tick.wav", o tick da
// primeira versão, que o usuário aprovou para os itens de grade).
// `hit`: o PICO do arquivo cai exatamente em `at` (a subida toca antes). Use em
// drop/impacto com build-up, para a batida bater na palavra, não depois dela.
export const Snd: React.FC<{ at?: number; name: SfxName; vol?: number; v?: number; file?: string; k?: string; hit?: boolean }> = ({ at = 0, name, vol, v, file, k = "", hit }) => {
  const { fps } = useVideoConfig();
  const src = file ? `sfx/${file}` : v !== undefined ? `sfx/${name}_${v}.wav` : variant(name, k);
  const key = src.replace(/^sfx\//, "").replace(/\.wav$/, "");
  const lead = hit ? Math.round(((SFX_PEAK as Record<string, number>)[key] ?? 0) * fps) : 0;
  at = at - lead;
  const ctx = React.useContext(SfxCtx);
  if (ctx.mode === "collect") emitSfx({ scene: ctx.scene, frame: ctx.offset + Math.max(0, at), src, vol: vol ?? SFX_VOL[name] });
  if (ctx.mode !== "play") return null;
  return (
    <Sequence from={Math.max(0, at)} durationInFrames={180} layout="none">
      <Audio src={staticFile(src)} volume={vol ?? SFX_VOL[name]} />
    </Sequence>
  );
};

// Som CONTÍNUO com a duração exata de um texto aparecendo. Padrão aprovado pelo
// usuário: digitação "type" versão 1 (Mixkit "Slow typing on a keyboard", o
// "type 2" da audição) para TODA escrita, inclusive a ficha. Fade 4/6 frames.
export const TYPE_V = 1;
export const SndSpan: React.FC<{ at: number; dur: number; name: "type" | "write" | "typew"; vol?: number; v?: number }> = ({ at, dur, name, vol, v }) => {
  const d = Math.max(4, Math.round(dur));
  const src = `sfx/${name}_${v ?? (name === "type" ? TYPE_V : 0)}.wav`;
  const ctx = React.useContext(SfxCtx);
  if (ctx.mode === "collect") emitSfx({ scene: ctx.scene, frame: ctx.offset + Math.max(0, at), src, vol: vol ?? (name === "type" ? 0.3 : 0.32), dur: d, fadeIn: 4, fadeOut: 6 });
  if (ctx.mode !== "play") return null;
  return (
    <Sequence from={Math.max(0, at)} durationInFrames={d} layout="none">
      <Audio
        src={staticFile(src)}
        endAt={d}
        volume={(f) => (vol ?? (name === "type" ? 0.3 : 0.32)) * interpolate(f, [0, 4, d - 6, d], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </Sequence>
  );
};

// ---------- layout ----------
// Fundo vivo: a luz vermelha "respira" e desliza devagar, para o palco nunca ficar morto
// mesmo com o texto parado.
// `h`: altura do fundo (padrão = a emenda). O layout vivo estica até a tela toda no modo bolha.
export const StageBg: React.FC<{ h?: number }> = ({ h = SEAM }) => {
  const f = useCurrentFrame();
  const breath = 0.18 + 0.08 * (0.5 + 0.5 * Math.sin(f / 45));
  const gx = 50 + 10 * Math.sin(f / 110);
  const gy = 100 - 4 * (0.5 + 0.5 * Math.sin(f / 70));
  return (
  <AbsoluteFill style={{ height: h }}>
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 0%, #232323 0%, #121212 55%, #0b0b0b 100%)" }} />
    <AbsoluteFill
      style={{
        opacity: 0.06,
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "54px 54px",
      }}
    />
    <AbsoluteFill style={{ background: `radial-gradient(70% 45% at ${gx}% ${gy}%, rgba(${ZALE.redRgb},${breath}) 0%, rgba(${ZALE.redRgb},0) 70%)` }} />
    <AbsoluteFill style={{ background: `radial-gradient(40% 30% at ${100 - gx}% 8%, rgba(255,255,255,${0.025 + 0.02 * Math.sin(f / 60)}) 0%, rgba(255,255,255,0) 70%)` }} />
  </AbsoluteFill>
  );
};

// AVATAR do perfil. Imagem quadrada: no círculo com cover ela fica inteira e centrada. flex: none = nunca achata.
// ÚNICO lugar da foto de perfil: trocar aqui troca o selo do topo, o card de seguir e os CTAs de todos os vídeos.
// perfil de quem posta: src/lib/brand.json (cada pessoa que usa o Estúdio troca o @ e a foto lá)
export const AVATAR = BRAND.avatar;
export const HANDLE = BRAND.handle;
export const Avatar: React.FC<{ size: number; ring?: string }> = ({ size, ring }) => (
  <div style={{ width: size, height: size, flex: "none", borderRadius: "50%", overflow: "hidden", background: ZALE.red, boxShadow: ring ? `0 0 0 ${Math.max(2, Math.round(size / 30))}px ${ring}` : undefined }}>
    <Img src={staticFile(AVATAR)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  </div>
);

export const Handle: React.FC<{ handle: string; logo?: string }> = ({ handle }) => (
  <div style={{ position: "absolute", left: 48, top: 64, display: "flex", alignItems: "center", gap: 14, fontFamily: FONT }}>
    <Avatar size={52} />
    <span style={{ color: ZALE.white, fontSize: 30, fontWeight: 700 }}>{handle}</span>
  </div>
);

// O palco + o apresentador + a emenda. `me` é o vídeo (TakesVideo); `zoom`
// aplica os snaps/pushes só no apresentador.
// `fit` (recomendado): encaixa a cabeça inteira na metade de baixo. O vídeo
// 1080x1920 é reduzido por `scale` e posicionado para que o pixel `top` da
// gravação (um pouco acima do cabelo) fique logo abaixo da emenda. As laterais
// que sobram mostram `meBg` (uma cópia MUDA do vídeo) desfocada e escurecida.
// Sem `fit`, o vídeo cobre a área inteira e corta cabelo/queixo quando a
// pessoa grava perto do celular.
export const PalcoLayout: React.FC<{
  me: React.ReactNode;
  meBg?: React.ReactNode;
  fit?: { scale: number; top: number };
  zoom?: number;
  handle?: string;
  children?: React.ReactNode;
}> = ({ me, meBg, fit, zoom = 1, handle, children }) => (
  <AbsoluteFill style={{ background: ZALE.ink, fontFamily: FONT }}>
    <div style={{ position: "absolute", left: 0, top: SEAM, width: 1080, height: 1920 - SEAM, overflow: "hidden" }}>
      {fit ? (
        <>
          {/* fundo desfocado só quando aparece (vídeo mais estreito que a tela). Com scale >= 1 ele
              ficava 100% escondido e ainda assim custava decodificar e desfocar um vídeo por quadro */}
          {meBg && fit.scale < 1 ? <div style={{ position: "absolute", inset: -60, filter: "blur(38px) brightness(0.45)", transform: "scale(1.1)" }}>{meBg}</div> : null}
          <div
            style={{
              position: "absolute",
              left: (1080 - 1080 * fit.scale) / 2,
              top: -fit.top * fit.scale,
              width: 1080 * fit.scale,
              height: 1920 * fit.scale,
              transform: `scale(${zoom})`,
              transformOrigin: `50% ${((fit.top + 420) / 1920) * 100}%`,
              boxShadow: "0 0 60px rgba(0,0,0,0.6)",
            }}
          >
            {me}
          </div>
        </>
      ) : (
        <div style={{ width: "100%", height: "100%", transform: `scale(${zoom})`, transformOrigin: "50% 30%" }}>{me}</div>
      )}
    </div>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, overflow: "hidden" }}>
      <StageBg />
      {handle ? <Handle handle={handle} /> : null}
      {children}
    </div>
  </AbsoluteFill>
);

// ---------- legenda na emenda ----------
// Até 3 palavras (ou até a pontuação). Já faladas em branco, próximas em
// cinza. `hot`: palavras que ganham o vermelho ZALE quando faladas.
export const SeamCaptions: React.FC<{ words: Word[]; groupSize?: number; size?: number; hot?: string[]; y?: number }> = ({
  words,
  groupSize = 3,
  size = 56,
  hot = [],
  y = SEAM,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= groupSize || /[.?!,:]$/.test(w.word.trim())) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  // Janela de cada grupo: fica até 0,35 s depois da última palavra, mas nunca por cima do começo do próximo
  // (frase colada depois de um corte). Grupo com corretivo (`said`) segura até 1,1 s depois da palavra
  // corrigida, para dar tempo de ler; o grupo seguinte espera.
  const HOLD = 1.1;
  const win: [number, number][] = [];
  for (let k = 0; k < groups.length; k++) {
    const gr = groups[k];
    const s0 = Math.max(gr[0].start - 0.05, k ? win[k - 1][1] : -Infinity);
    const fix = gr.find((w) => w.said);
    const next = k + 1 < groups.length ? groups[k + 1][0].start - 0.05 : Infinity;
    const e0 = fix ? Math.max(gr[gr.length - 1].end + 0.35, fix.start + HOLD) : Math.min(gr[gr.length - 1].end + 0.35, next);
    win.push([s0, Math.max(s0, e0)]);
  }
  const gi = win.findIndex(([s0, e0]) => t >= s0 && t < e0);
  const g = gi >= 0 ? groups[gi] : undefined;
  if (!g) return null;
  const a = interpolate(t, [win[gi][0], win[gi][0] + 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // correspondência exata (maiúsculas contam): "PENSAR" não pinta "pensar"
  const hotSet = new Set(hot);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - size * 0.85, display: "flex", justifyContent: "center", opacity: a, fontFamily: FONT }}>
      <div
        style={{
          background: "rgba(16,16,16,0.92)",
          borderRadius: 16,
          padding: `${size * 0.16}px ${size * 0.36}px`,
          fontSize: size,
          fontWeight: 800,
          letterSpacing: -0.5,
          lineHeight: 1.18,
          display: "flex",
          gap: size * 0.28,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          transform: `scale(${0.97 + 0.03 * a})`,
        }}
      >
        {g.map((w, i) => {
          const on = t >= w.start - 0.02;
          const isHot = hotSet.has(w.word.replace(/[.,!?;:"“”]/g, ""));
          if (w.said) {
            // corretivo: a palavra falada aparece, um risco vermelho passa por cima e a certa entra do lado
            const st = interpolate(t, [w.start + 0.08, w.start + 0.26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
            const fx = interpolate(t, [w.start + 0.2, w.start + 0.34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const pop = fx > 0 && fx < 1 ? 1 + 0.25 * Math.sin(fx * Math.PI) : 1;
            return (
              <span key={i} style={{ display: "inline-flex", gap: size * 0.22, whiteSpace: "nowrap" }}>
                <span style={{ position: "relative", color: on ? `rgba(255,255,255,${1 - 0.5 * st})` : "rgba(255,255,255,0.38)" }}>
                  {w.said}
                  <span style={{ position: "absolute", left: -4, top: "52%", height: size * 0.12, width: `calc(${(st * 100).toFixed(1)}% + 8px)`, marginTop: -size * 0.06, borderRadius: size * 0.06, background: ZALE.red, opacity: st > 0 ? 1 : 0 }} />
                </span>
                {fx > 0 ? (
                  <span style={{ color: ZALE.redBright, opacity: fx, display: "inline-block", transform: `scale(${pop.toFixed(3)})` }}>{w.word.trim()}</span>
                ) : null}
              </span>
            );
          }
          return (
            <span key={i} style={{ color: on ? (isHot ? ZALE.redBright : ZALE.white) : "rgba(255,255,255,0.38)", whiteSpace: "nowrap" }}>
              {w.word.trim()}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- base dos elementos do palco ----------
const useIn = (delay = 0) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  return { f, p: f < 0 ? 0 : spring({ frame: f, fps, config: { damping: 15, stiffness: 190, mass: 0.7 } }) };
};
const useOut = (life: number, dur = 6) => {
  const f = useCurrentFrame();
  return interpolate(f, [life - dur, life], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
};

// MOVIMENTO OCIOSO (pedido do usuário: nada parado depois de entrar).
// `i` desloca a fase, para itens de uma lista não se moverem juntos.
// Só SOBE E DESCE (o usuário não gostou de inclinar para os lados nem de zoom).
export const useIdle = (life: number, i = 0, amp = 1) => {
  const f = useCurrentFrame();
  void life;
  // O card inteiro sobe e desce. translate3d + willChange (no StageItem) fazem o navegador
  // desenhar o card UMA vez e mover a imagem: sem isso cada linha de texto era arredondada
  // para um pixel diferente e as linhas pareciam andar sozinhas (reclamação do usuário).
  const y = Math.sin((f + i * 17) / 24) * 7 * amp;
  return { y, css: `translate3d(0, ${y.toFixed(3)}px, 0)` };
};
// Balanço pequeno por item (listas, grades, balões): só vertical, fase própria.
// Pedido do usuário (2026-09-27): nada flutua sozinho DENTRO de um elemento (o texto
// saía do balão). Só o elemento inteiro sobe e desce, tudo junto e em sincronia.
const bob = (_f: number, _i: number) => "";

// Tudo que entra no palco passa por aqui: centraliza, entra com mola, sai rápido.
export const StageItem: React.FC<{ life: number; children: React.ReactNode; sfx?: SfxName | null; y?: number; w?: number }> = ({
  life,
  children,
  sfx = "pop",
  y = STAGE_CY,
  w = 900,
}) => {
  const { p } = useIn();
  const out = useOut(life);
  const idle = useIdle(life);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: STAGE_CX - w / 2,
          width: w,
          top: y,
          transform: `translateY(-50%) scale(${p > 0.997 ? 1 : 0.9 + 0.1 * p}) ${idle.css}`,
          opacity: Math.min(p, out),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </div>
      {sfx ? <Snd k="stage" name={sfx} /> : null}
    </>
  );
};

// Palavra grande + subtítulo cinza ("3 a 5" / "perguntas antes de gerar").
// `icon` (lucide): ícone num círculo vermelho acima do título, para o título
// não ficar "só texto". `iconOff`: risca o ícone (proibido / pare de...).
export const BigType: React.FC<{ life: number; title: string; sub?: string; size?: number; accent?: boolean; sfx?: SfxName | null; icon?: LucideIcon; iconOff?: boolean }> = ({
  life,
  title,
  sub,
  size = 150,
  accent,
  sfx = null, // sem whoosh (usuário): palavra grande entra em silêncio
  icon: Icon,
  iconOff,
}) => (
  <StageItem life={life} sfx={sfx}>
    {Icon ? <BigTypeIcon icon={Icon} off={iconOff} /> : null}
    <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 800, letterSpacing: -size * 0.035, lineHeight: 1, color: accent ? ZALE.redBright : ZALE.white, textAlign: "center" }}>
      {cap(title)}
    </div>
    {sub ? <div style={{ fontFamily: FONT, fontSize: Math.max(34, size * 0.24), fontWeight: 600, color: "rgba(255,255,255,0.55)", marginTop: 18, textAlign: "center" }}>{cap(sub)}</div> : null}
  </StageItem>
);

// Ícone grande num círculo + rótulo. `icon` é um componente do lucide-react.
export const IconBadge: React.FC<{ life: number; icon: LucideIcon; label?: string; tone?: "red" | "white"; sfx?: SfxName | null }> = ({
  life,
  icon: Icon,
  label,
  tone = "red",
  sfx = "pop",
}) => (
  <StageItem life={life} sfx={sfx}>
    <div
      style={{
        width: 300,
        height: 300,
        borderRadius: 150,
        background: tone === "red" ? ZALE.red : ZALE.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: tone === "red" ? `0 0 90px rgba(${ZALE.redRgb},0.55)` : "0 20px 60px rgba(0,0,0,0.4)",
      }}
    >
      <Icon size={160} color={tone === "red" ? ZALE.white : ZALE.ink} strokeWidth={2.2} />
    </div>
    {label ? <div style={{ fontFamily: FONT, fontSize: 52, fontWeight: 800, color: ZALE.white, marginTop: 34 }}>{cap(label)}</div> : null}
  </StageItem>
);

// Lista numerada que empilha item por item (cada um com seu `at` em frames relativos).
export const ListStack: React.FC<{ life: number; title?: string; items: { text: string; at: number }[] }> = ({ life, title, items }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(life);
  const idle = useIdle(life, 0, 0.7);
  return (
    <div style={{ position: "absolute", left: 90, width: 900, top: STAGE.y0 + 40, opacity: out, fontFamily: FONT, transform: idle.css }}>
      {title ? <div style={{ fontSize: 50, fontWeight: 800, color: ZALE.white, textAlign: "center", marginBottom: 26 }}>{cap(title)}</div> : null}
      {items.map((it, i) => {
        const p = f < it.at ? 0 : spring({ frame: f - it.at, fps, config: { damping: 14, stiffness: 200, mass: 0.6 } });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              background: ZALE.white,
              borderRadius: 18,
              padding: "20px 26px",
              marginBottom: 18,
              opacity: p,
              transform: `translateY(${(1 - p) * 26}px) ${bob(f, i)}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ width: 54, height: 54, borderRadius: 27, background: ZALE.red, color: ZALE.white, fontWeight: 800, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: ZALE.ink, lineHeight: 1.15 }}>{cap(it.text)}</div>
            <Snd k="list" at={it.at} name="pop" />
          </div>
        );
      })}
    </div>
  );
};

// Conversa de direct/WhatsApp genérica (sem marca). Balões entram no `at`.
export const ChatMock: React.FC<{ life: number; title?: string; messages: { from: "paciente" | "clinica"; text: string; at: number; seen?: boolean }[] }> = ({
  life,
  title = "Direct",
  messages,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { p } = useIn();
  const out = useOut(life);
  const idle = useIdle(life, 0, 0.8);
  return (
    <div
      style={{
        position: "absolute",
        left: 150,
        width: 780,
        top: STAGE.y0 + 10,
        opacity: Math.min(p, out),
        transform: `scale(${0.92 + 0.08 * p}) ${idle.css}`,
        background: "#1b1b1b",
        borderRadius: 34,
        padding: "22px 26px 30px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
        <div style={{ width: 46, height: 46, borderRadius: 23, background: "#3a3a3a" }} />
        <div style={{ color: ZALE.white, fontSize: 30, fontWeight: 700 }}>{cap(title)}</div>
      </div>
      {messages.map((m, i) => {
        const q = f < m.at ? 0 : spring({ frame: f - m.at, fps, config: { damping: 14, stiffness: 220, mass: 0.5 } });
        const mine = m.from === "clinica";
        return (
          <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 14, opacity: q, transform: `translateY(${(1 - q) * 18}px) scale(${0.9 + 0.1 * q}) ${bob(f, i + 1)}` }}>
            <div
              style={{
                maxWidth: 560,
                background: mine ? ZALE.red : "#2e2e2e",
                color: ZALE.white,
                fontSize: 36,
                fontWeight: 600,
                lineHeight: 1.22,
                padding: "16px 22px",
                borderRadius: 26,
                borderBottomRightRadius: mine ? 8 : 26,
                borderBottomLeftRadius: mine ? 26 : 8,
              }}
            >
              {m.text}
              {m.seen ? <div style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 6, textAlign: "right" }}>visualizado</div> : null}
            </div>
            <Snd k="chat" at={m.at} name="tick" />
          </div>
        );
      })}
    </div>
  );
};

// Grade de etiquetas ("5 frases que espantam paciente"), mono ou normal.
export const ChipGrid: React.FC<{ life: number; title?: string; chips: { text: string; at: number }[]; cols?: number; mono?: boolean }> = ({
  life,
  title,
  chips,
  cols = 2,
  mono,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(life);
  const idle = useIdle(life, 0, 0.7);
  return (
    <div style={{ position: "absolute", left: 90, width: 900, top: STAGE.y0 + 60, opacity: out, fontFamily: FONT, transform: idle.css }}>
      {title ? <div style={{ fontSize: 50, fontWeight: 800, color: ZALE.white, textAlign: "center", marginBottom: 28 }}>{cap(title)}</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>
        {chips.map((c, i) => {
          const p = f < c.at ? 0 : spring({ frame: f - c.at, fps, config: { damping: 13, stiffness: 210, mass: 0.6 } });
          return (
            <div key={i} style={{ background: ZALE.white, borderRadius: 14, padding: "18px 22px", fontFamily: mono ? MONO : FONT, fontSize: 34, fontWeight: 700, color: ZALE.ink, opacity: p, transform: `scale(${0.8 + 0.2 * p}) ${bob(f, i)}` }}>
              {mono ? c.text : cap(c.text)}
              {/* som aprovado na primeira versão: tick da Kenney, volume 0.2 */}
              <Snd at={c.at} name="tick" file="tick.wav" vol={0.2} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Janela de app com texto sendo digitado (prompt, mensagem, anotação).
export const TypeWindow: React.FC<{ life: number; title?: string; text: string; startAt?: number; cps?: number; after?: string }> = ({
  life,
  title = "",
  text,
  startAt = 6,
  cps = 26,
  after,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { p } = useIn();
  const out = useOut(life);
  const idleT = useIdle(life, 0, 0.8);
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - startAt) / fps) * cps)));
  const done = n >= text.length;
  const doneAt = startAt + Math.ceil((text.length / cps) * fps);
  return (
    <div style={{ position: "absolute", left: 110, width: 860, top: STAGE_CY - 170, opacity: Math.min(p, out), transform: `scale(${0.92 + 0.08 * p}) ${idleT.css}`, fontFamily: FONT }}>
      <div style={{ background: "#161616", borderRadius: 26, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
          ))}
          <div style={{ marginLeft: 12, color: "rgba(255,255,255,0.45)", fontSize: 24 }}>{title}</div>
        </div>
        <div style={{ padding: "30px 32px", minHeight: 150, fontFamily: MONO, fontSize: 38, lineHeight: 1.35, color: ZALE.white }}>
          <span style={{ color: ZALE.redBright }}>&gt; </span>
          {text.slice(0, n)}
          <span style={{ opacity: Math.floor(f / 15) % 2 === 0 || !done ? 1 : 0 }}>▍</span>
          {after && done ? <div style={{ color: "#7ee787", marginTop: 16, fontSize: 32 }}>{after}</div> : null}
        </div>
      </div>
      <SndSpan at={startAt} dur={(text.length / cps) * fps} name="type" />
      {after ? <Snd at={doneAt} name="ding" /> : null}
    </div>
  );
};

// Carimbo vermelho girado, batido por cima do elemento que está no palco.
// y padrão: abaixo do centro, para não cobrir a palavra principal do palco.
export const Stamp: React.FC<{ life: number; text: string; at?: number; y?: number; size?: number }> = ({ life, text, at = 0, y = STAGE_CY + 215, size = 76 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(life);
  const p = f < at ? 0 : spring({ frame: f - at, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: Math.min(p, out) }}>
        <div
          style={{
            transform: `translateY(-50%) rotate(-8deg) scale(${2.2 - 1.2 * p})`,
            border: `8px solid ${ZALE.red}`,
            color: ZALE.red,
            background: "rgba(255,255,255,0.92)",
            fontFamily: FONT,
            fontSize: size,
            fontWeight: 900,
            whiteSpace: "nowrap",
            letterSpacing: 4,
            textTransform: "uppercase",
            padding: "8px 30px",
            borderRadius: 14,
          }}
        >
          {text}
        </div>
      </div>
      <Snd at={at} name="thud" />
    </>
  );
};

// Comparação lado a lado ("avulso" x "protocolo"). O lado `win` ganha o vermelho.
export const Versus: React.FC<{ life: number; left: { title: string; lines: string[] }; right: { title: string; lines: string[] }; rightAt?: number; win?: "left" | "right" }> = ({
  life,
  left,
  right,
  rightAt = 18,
  win = "right",
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(life);
  const idleV = useIdle(life, 0, 0.7);
  const col = (side: { title: string; lines: string[] }, at: number, good: boolean) => {
    const p = f < at ? 0 : spring({ frame: f - at, fps, config: { damping: 14, stiffness: 190 } });
    return (
      <div style={{ flex: 1, background: good ? ZALE.white : "#1f1f1f", border: good ? `4px solid ${ZALE.red}` : "1px solid rgba(255,255,255,0.1)", borderRadius: 30, padding: "36px 30px", minHeight: 320, opacity: p, transform: `translateY(${(1 - p) * 30}px) ${bob(f, good ? 1 : 0)}` }}>
        <div style={{ fontSize: 60, fontWeight: 900, color: good ? ZALE.red : "rgba(255,255,255,0.7)", marginBottom: 18 }}>{cap(side.title)}</div>
        {side.lines.map((l, i) => (
          <div key={i} style={{ fontSize: 40, fontWeight: 700, color: good ? ZALE.ink : "rgba(255,255,255,0.55)", marginTop: 14, lineHeight: 1.2 }}>
            {good ? "✓ " : "✗ "}
            {cap(l)}
          </div>
        ))}
        <Snd k="versus" at={at} name="pop" />
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: 50, width: 980, top: STAGE_CY - 200, display: "flex", gap: 24, opacity: out, fontFamily: FONT, transform: idleV.css }}>
      {col(left, 0, win === "left")}
      {col(right, rightAt, win === "right")}
    </div>
  );
};

// Anel de progresso com número contando ("3 de 10 voltam").
export const Ring: React.FC<{ life: number; value: number; max: number; label: string; suffix?: string }> = ({ life, value, max, label, suffix = "" }) => {
  const f = useCurrentFrame();
  const r = 150;
  const c = 2 * Math.PI * r;
  const p = interpolate(f, [4, 34], [0, value / max], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <StageItem life={life} sfx="pop">
      <svg width={360} height={360} viewBox="0 0 360 360">
        <circle cx={180} cy={180} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={26} fill="none" />
        <circle cx={180} cy={180} r={r} stroke={ZALE.red} strokeWidth={26} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 180 180)" />
        <text x={180} y={205} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={96} fill={ZALE.white}>
          {Math.round(p * max)}
          {suffix}
        </text>
      </svg>
      <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginTop: 18 }}>{label}</div>
    </StageItem>
  );
};

// CTA: pílula "comenta “PENSAR”" e, se quiser, o card de seguir depois.
export const KeywordPill: React.FC<{ life: number; keyword: string; sub?: string }> = ({ life, keyword, sub }) => (
  <StageItem life={life} sfx="pop">
    <div style={{ background: ZALE.white, borderRadius: 22, padding: "24px 40px", fontFamily: FONT, fontSize: 64, fontWeight: 800, color: ZALE.ink, boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>
      comenta <span style={{ color: ZALE.red }}>“{keyword}”</span>
    </div>
    {sub ? <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 22 }}>{cap(sub)}</div> : null}
  </StageItem>
);

export const FollowCard: React.FC<{ life: number; handle: string; clickAt?: number; logo?: string }> = ({ life, handle, clickAt = 20, logo = BRAND.logo }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const on = f >= clickAt;
  const press = f >= clickAt && f < clickAt + 4 ? 0.92 : 1;
  const hearts = f < clickAt ? 0 : interpolate(f, [clickAt, clickAt + 24], [0, 1], { extrapolateRight: "clamp" });
  return (
    <StageItem life={life} sfx="pop">
      <div style={{ position: "relative", background: ZALE.white, borderRadius: 30, padding: "34px 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", fontFamily: FONT }}>
        <Avatar size={120} />
        <div style={{ fontSize: 42, fontWeight: 800, color: ZALE.ink }}>{handle}</div>
        <div style={{ background: on ? "#e9e9e9" : ZALE.red, color: on ? ZALE.ink : ZALE.white, fontSize: 36, fontWeight: 800, borderRadius: 14, padding: "12px 52px", transform: `scale(${press})` }}>
          {on ? "Seguindo ✓" : "Seguir"}
        </div>
        {[-160, -60, 70, 170].map((dx, i) => (
          <div key={i} style={{ position: "absolute", left: "50%", top: 40, fontSize: 44, color: ZALE.red, opacity: hearts * (1 - hearts) * 3, transform: `translate(${dx}px, ${-hearts * (110 + i * 25)}px)` }}>
            ♥
          </div>
        ))}
      </div>
      <Snd at={clickAt} name="click" />
      <Snd at={clickAt + 3} name="ding" />
    </StageItem>
  );
};

// Diagrama radial: um conceito no centro e itens em volta aparecendo um a um.
export const Radial: React.FC<{ life: number; center: string; nodes: { label: string; at: number }[] }> = ({ life, center, nodes }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { p } = useIn();
  const out = useOut(life);
  const R = 300;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, opacity: out, fontFamily: FONT }}>
      <div style={{ position: "absolute", left: STAGE_CX - 110, top: STAGE_CY - 110, width: 220, height: 220, borderRadius: 110, background: "#101010", border: `4px solid ${ZALE.red}`, boxShadow: `0 0 80px rgba(${ZALE.redRgb},0.5)`, display: "flex", alignItems: "center", justifyContent: "center", color: ZALE.white, fontSize: 48, fontWeight: 800, textAlign: "center", transform: `scale(${p})` }}>
        {center}
      </div>
      {nodes.map((n, i) => {
        const ang = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const q = f < n.at ? 0 : spring({ frame: f - n.at, fps, config: { damping: 13, stiffness: 200 } });
        const x = STAGE_CX + Math.cos(ang) * R * (0.6 + 0.4 * q);
        const y = STAGE_CY + Math.sin(ang) * R * 0.78 * (0.6 + 0.4 * q);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", opacity: q, background: ZALE.white, color: ZALE.ink, borderRadius: 16, padding: "12px 22px", fontSize: 32, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
            {n.label}
            <Snd k="radial" at={n.at} name="tick" />
          </div>
        );
      })}
    </div>
  );
};

const BigTypeIcon: React.FC<{ icon: LucideIcon; off?: boolean }> = ({ icon: Icon, off }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p0 = spring({ frame: f - 2, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const p = f > 40 ? 1 : p0; // mola assentada: trava em 1 para o ícone andar junto com o card
  const slash = interpolate(f, [10, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "relative", width: 190, height: 190, borderRadius: 95, background: ZALE.red, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 34, transform: `scale(${p})`, boxShadow: `0 0 80px rgba(${ZALE.redRgb},0.5)` }}>
      <Icon size={104} color="#fff" strokeWidth={2.2} />
      {off ? (
        <>
          <div style={{ position: "absolute", width: 170 * slash, height: 14, borderRadius: 7, background: "#fff", transform: "rotate(45deg)", boxShadow: "0 0 0 5px " + ZALE.red }} />
          <Snd at={10} name="error" />
        </>
      ) : null}
    </div>
  );
};