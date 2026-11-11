import React from "react";
import { Easing, Freeze, OffthreadVideo, Sequence, getInputProps, interpolate, staticFile, useCurrentFrame } from "remotion";

// render.py renderiza um áudio só com os efeitos (--props {"muteVoice": true})
// para medir se algum efeito está alto demais em relação à voz.
// No editor (Player no navegador) getInputProps() não existe: aí a voz toca normal.
export const MUTE_VOICE = (() => {
  try {
    return Boolean((getInputProps() as { muteVoice?: boolean }).muteVoice);
  } catch {
    return false;
  }
})();
import { FPS } from "./theme";

// A linha do tempo de um vídeo: os takes escolhidos (em segundos da
// GRAVAÇÃO ORIGINAL) colados em sequência. E(t) converte um segundo original
// em frame da edição e dá erro se aquele segundo foi cortado, então nenhum
// efeito aponta para material que não está no vídeo.
// Base: talking-head-reel (MIT), ver LICENSE-talking-head-reel.txt.

export type Seg = { a: number; b: number; frames: number; note?: string };
export type SegSpec = { fps?: number; outro: number; segments: Seg[] };

export const makeTimeline = (spec: SegSpec) => {
  const SEGS = spec.segments;
  const segStart = (i: number) => SEGS.slice(0, i).reduce((n, s) => n + s.frames, 0);
  const SPEECH_FRAMES = SEGS.reduce((n, s) => n + s.frames, 0);
  const OUTRO_FRAMES = Math.round(spec.outro * FPS);
  const DURATION = SPEECH_FRAMES + OUTRO_FRAMES;
  const E = (t: number): number => {
    for (let i = 0; i < SEGS.length; i++) {
      const s = SEGS[i];
      if (t >= s.a - 1e-6 && t <= s.b + 1e-6) return segStart(i) + Math.round((t - s.a) * FPS);
    }
    throw new Error(`E(${t}): esse segundo não está em nenhum take de segments.json`);
  };
  const rel = (t: number, from: number) => E(t) - E(from);
  const life = (from: number, to: number) => E(to) - E(from);
  return { SEGS, segStart, SPEECH_FRAMES, OUTRO_FRAMES, DURATION, E, rel, life };
};
export type Timeline = ReturnType<typeof makeTimeline>;

// Um elemento que vive do segundo original `from` ao `to`. A Sequence dura
// `tail` frames a mais (padrão 60 = 2 s) só para o SOM do elemento terminar
// com a cauda natural (reverb do carimbo, impacto); o visual já saiu em `to`,
// porque todo componente some sozinho ao fim do seu `life`.
export const makeAt =
  (tl: Timeline, tail = 60) =>
  ({ from, to, children, name }: { from: number; to: number; children: React.ReactNode; name?: string }) => {
    const start = tl.E(from);
    const life = tl.E(to) - start;
    return (
      <Sequence from={start} durationInFrames={Math.max(1, Math.min(life + tail, tl.DURATION - start))} name={name} layout="none">
        {children}
      </Sequence>
    );
  };

// Zoom em duas camadas: SNAPS (troca de enquadramento 1.0/1.04 em alguns
// cortes) e PUSHES (aproximação lenta na frase de impacto). Tudo desliza com
// easing (nada muda de um frame para o outro): SNAP_EASE frames na troca,
// e o push volta em `down` frames (padrão 14) em vez de sumir.
export type Push = { at: number; z: number; up?: number; until: number | "end"; down?: number };
export const SNAP_EASE = 9;
export const useZoom = (tl: Timeline, snaps: [number, number][], pushes: Push[]) => {
  const f = useCurrentFrame();
  const snapFrames = snaps.map(([t, z]) => [tl.E(t), z] as [number, number]).sort((p, q) => p[0] - q[0]);
  let base = 1;
  let prev = 1;
  for (const [fr, z] of snapFrames) {
    if (f < fr) break;
    const p = interpolate(f, [fr, fr + SNAP_EASE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    base = prev + (z - prev) * p;
    prev = z;
  }
  let push = 1;
  for (const p of pushes) {
    const a = tl.E(p.at);
    const b = p.until === "end" ? tl.DURATION : tl.E(p.until);
    const up = p.up ?? 14;
    const down = p.until === "end" ? 0 : p.down ?? 14;
    if (f < a || f >= b + down) continue;
    const rise = interpolate(f, [a, a + up], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    const fall = down > 0 ? interpolate(f, [b, b + down], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }) : 1;
    push *= 1 + (p.z - 1) * rise * fall;
  }
  return base * push;
};

// Os takes em sequência com TRANSIÇÃO SUAVE: cada take segue rodando `xfade`
// frames além do seu fim (mudo nessa sobra) e o take seguinte entra por cima
// com opacidade 0 -> 1 (fusão curta, padrão 6 frames = 0,2 s). O áudio faz
// fade de 4 frames na entrada e 5 na saída, dentro das folgas de silêncio do
// próprio take, então não vaza fala cortada. xfade = 0 volta ao corte seco.
// `muted`: use na cópia de baixo da tela dividida (o áudio vem da cópia em tela cheia).
export const TakesVideo: React.FC<{ tl: Timeline; src: string; style?: React.CSSProperties; muted?: boolean; xfade?: number }> = ({
  tl,
  src,
  style,
  muted,
  xfade = 6,
}) => {
  const last = tl.SEGS[tl.SEGS.length - 1];
  const st: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", ...style };
  const n = tl.SEGS.length;
  // premountFor: no editor (Player) o take seguinte já carrega e se posiciona 1 s antes
  // do corte; sem isso a tela piscava/engasgava em cada corte. No render não muda nada.
  // (premount exige o layout padrão da Sequence, que ocupa a caixa inteira como antes.)
  return (
    <>
      {tl.SEGS.map((s, i) => {
        const from = Math.round(s.a * FPS);
        const tail = i < n - 1 ? xfade : 0;
        const dur = s.frames + tail;
        const inA = i > 0 ? 2 : 1; // fades curtos (2 quadros): corte justo deixa só ~0,05 s de folga
        return (
          <Sequence key={i} from={tl.segStart(i)} durationInFrames={dur} name={`take ${i + 1}`} premountFor={30}>
            <TakeLayer fade={i > 0 ? xfade : 0}>
              <OffthreadVideo
                src={staticFile(src)}
                startFrom={from}
                endAt={from + dur}
                muted={muted || MUTE_VOICE}
                volume={(f) =>
                  f >= s.frames
                    ? 0
                    : interpolate(f, [0, inA, Math.max(inA + 1, s.frames - 3), Math.max(inA + 2, s.frames - 1)], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
                }
                style={st}
              />
            </TakeLayer>
          </Sequence>
        );
      })}
      {tl.OUTRO_FRAMES > 0 ? (
        <Sequence from={tl.SPEECH_FRAMES} durationInFrames={tl.OUTRO_FRAMES} layout="none" name="outro congelado">
          <Freeze frame={last.frames - 1}>
            <OffthreadVideo src={staticFile(src)} startFrom={Math.round(last.a * FPS)} muted style={st} />
          </Freeze>
        </Sequence>
      ) : null}
    </>
  );
};

const TakeLayer: React.FC<{ fade: number; children: React.ReactNode }> = ({ fade, children }) => {
  const f = useCurrentFrame();
  const o = fade > 0 ? interpolate(f, [0, fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }) : 1;
  return <div style={{ position: "absolute", inset: 0, opacity: o }}>{children}</div>;
};