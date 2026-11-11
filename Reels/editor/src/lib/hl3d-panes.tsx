import React from "react";
import { AbsoluteFill, Easing, Sequence, useCurrentFrame } from "remotion";
import { FONT } from "./overlays";
import { C, Clip, HL, OUT, lerp } from "./hl3";

// 3 quadros de vidro com vídeo, entrando em sequência (`at` em quadros), cada um com rótulo.
// `expand`: o quadro `i` cresce até ocupar a tela inteira a partir de `at` (14 quadros) e vira o plano
// seguinte sem corte (a cena seguinte continua o mesmo vídeo do ponto em que ele está).
export const HLPanes: React.FC<{ life: number; panes: { src: string; from: number; label: string; at: number }[]; expand?: { i: number; at: number } }> = ({ life, panes, expand }) => {
  const f = useCurrentFrame();
  const ex = expand ? lerp(f, expand.at, expand.at + 14, 0, 1, { ...C, easing: Easing.inOut(Easing.cubic) }) : 0;
  const o = expand ? lerp(f, 0, 10, 0, 1, OUT) : Math.min(lerp(f, 0, 10, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const W = 520;
  const H = W * (9 / 16);
  const cx = (i: number) => 960 + (i - (panes.length - 1) / 2) * 590;
  const bob = (i: number) => Math.sin((f + i * 30) / 40) * 8;
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1500 }}>
      {panes.map((p, i) => {
        const e = lerp(f, p.at, p.at + 18, 0, 1, { ...C, easing: Easing.out(Easing.back(1.4)) });
        if (f < p.at - 30) return null;
        const other = expand && expand.i !== i ? 1 - ex : 1;
        const hide = expand && expand.i === i ? 1 - ex : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx(i) - W / 2,
              top: 540 - H / 2 - 40,
              width: W,
              opacity: Math.min(1, e) * other * hide,
              transform: `translate3d(0, ${(1 - Math.min(1, e)) * 80 + bob(i)}px, ${(1 - Math.min(1, e)) * -600}px) rotateY(${(i - 1) * -8}deg)`,
            }}
          >
            <div style={{ padding: 8, borderRadius: 26, background: "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 50%, rgba(107,63,212,0.14))", border: "1px solid rgba(255,255,255,0.22)", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
              <div style={{ width: W - 16, height: H - 16, borderRadius: 18, overflow: "hidden", position: "relative", background: "#000" }}>
                <Sequence from={Math.max(0, p.at - 30)} premountFor={30}>
                  <Clip src={p.src} from={p.from} />
                </Sequence>
              </div>
            </div>
            <div style={{ marginTop: 20, textAlign: "center", fontFamily: FONT, fontWeight: 750, fontSize: 44, color: HL.text }}>{p.label}</div>
          </div>
        );
      })}
      {expand && f >= panes[expand.i].at - 30
        ? (() => {
            const p = panes[expand.i];
            const x0 = cx(expand.i) - W / 2 + 8;
            const y0 = 540 - H / 2 - 40 + 8 + bob(expand.i);
            const w0 = W - 16;
            const h0 = H - 16;
            const L = x0 * (1 - ex);
            const T = y0 * (1 - ex);
            const R = (1920 - x0 - w0) * (1 - ex);
            const B = (1080 - y0 - h0) * (1 - ex);
            return (
              <AbsoluteFill style={{ opacity: ex > 0 ? 1 : 0, clipPath: `inset(${T}px ${R}px ${B}px ${L}px round ${18 * (1 - ex)}px)` }}>
                <Sequence from={Math.max(0, p.at - 30)} premountFor={30}>
                  <Clip src={p.src} from={p.from} />
                </Sequence>
              </AbsoluteFill>
            );
          })()
        : null}
    </AbsoluteFill>
  );
};
