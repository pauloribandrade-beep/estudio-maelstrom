import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Hourglass, Syringe } from "lucide-react";
import { FONT } from "../overlays";
import { ZALE } from "../theme";
import { SEAM, Snd, SndSpan, STAGE } from "../palco";

import { CX, CY, Float, Pill, SERIF, Stage, Vial, ease, lock, sp } from "../cenas-botox";

// Cenas do nicho clínica que estavam em src/lib/cenas-botox.tsx (separadas em 28/10/2026 para o pacote público
// levar só o núcleo). Registradas em edit/registry-clinica.tsx.

// ============ 1. salsicha estragada -> nasce o frasco ============
export const RottenSausage: React.FC<{ life: number; vialAt?: number; yuckAt?: number }> = ({ life, vialAt = 30, yuckAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const v = sp(f, fps, vialAt, { damping: 13, stiffness: 120, mass: 0.9 });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 330, top: CY + 30, width: 660, height: 260, opacity: on, transform: `scale(${0.85 + 0.15 * lock(on)})` }}>
            <svg width={660} height={260} viewBox="0 0 660 260">
              <ellipse cx={330} cy={225} rx={300} ry={26} fill="rgba(0,0,0,0.45)" />
              <path d="M70 150 C70 70 150 60 330 70 C510 60 590 70 590 150 C590 210 520 215 330 210 C140 215 70 210 70 150 Z" fill="#8a5a3c" />
              <path d="M90 145 C95 90 160 85 330 92 C500 85 565 90 570 145" stroke="rgba(255,255,255,0.25)" strokeWidth={10} fill="none" strokeLinecap="round" />
              {[140, 250, 380, 480].map((x, i) => (
                <ellipse key={i} cx={x} cy={150 + (i % 2) * 20} rx={34} ry={20} fill="rgba(110,160,60,0.55)" />
              ))}
              <path d="M60 150 L30 135 M60 150 L30 165 M600 150 L630 135 M600 150 L630 165" stroke="#6b4428" strokeWidth={10} strokeLinecap="round" />
            </svg>
            {/* fumaça esverdeada */}
            {[0, 1, 2].map((k) => {
              const t = ((f / 40 + k / 3) % 1);
              return (
                <svg key={k} width={80} height={160} viewBox="0 0 80 160" style={{ position: "absolute", left: 180 + k * 130, top: -130 - t * 60, opacity: (1 - t) * 0.8 }}>
                  <path d={`M40 160 C ${10 + t * 10} 120, ${70 - t * 10} 90, 40 60 C 15 35, 60 15, 40 0`} stroke="#9bd35a" strokeWidth={9} fill="none" strokeLinecap="round" />
                </svg>
              );
            })}
            {/* moscas */}
            {[0, 1].map((k) => {
              const a = f / (12 + k * 5) + k * 2;
              return <div key={k} style={{ position: "absolute", left: 330 + Math.cos(a) * (230 - k * 60) - 9, top: 30 + Math.sin(a * 1.3) * 60 - 6, width: 18, height: 12, borderRadius: 6, background: "#111", boxShadow: "0 0 0 3px rgba(255,255,255,0.25)" }} />;
            })}
          </div>
          {/* o frasco sai de dentro da salsicha */}
          <div style={{ position: "absolute", left: CX - 70, top: CY - 260 + (1 - v) * 220, opacity: Math.min(1, v * 2), transform: `scale(${0.6 + 0.4 * lock(v)})` }}>
            <Vial w={140} liquid="#b7e59a" glow={v} />
          </div>
          <Snd at={3} name="pop" k="sausage" />
          {/* mosca rondando a salsicha (Mixkit, fades no arquivo) e um "eca" discreto */}
          <Snd at={0} name="fly" v={0} />
          {yuckAt !== undefined ? <Snd at={yuckAt} name="yuck" v={0} /> : null}
          <Snd at={vialAt} name="glass" k="vial-born" />
        </Float>
      );
    }}
  </Stage>
);
// ============ 9. tabela de exame de vista + placa ============
export const EyeChart: React.FC<{ life: number; name: string; sub?: string; nameAt?: number }> = ({ life, name, sub, nameAt = 20 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 13, stiffness: 120, mass: 0.9 });
      const nm = sp(f, fps, nameAt);
      const rows = ["E", "F P", "T O Z", "L P E D", "P E C F D", "E D F C Z P"];
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 280, top: 180, width: 560, height: 580, background: "#fafafa", borderRadius: 14, boxShadow: "0 36px 90px rgba(0,0,0,0.6)", opacity: Math.min(1, on * 2), transform: `scale(${0.85 + 0.15 * lock(on)})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: SERIF, color: "#111" }}>
            {rows.map((r, i) => (
              <div key={i} style={{ fontSize: 120 - i * 18, fontWeight: 700, letterSpacing: 10 - i, lineHeight: 1, opacity: f >= 6 + i * 3 ? 1 : 0 }}>{r}</div>
            ))}
          </div>
          <div style={{ position: "absolute", left: CX - 280, top: 790, width: 560, textAlign: "center", background: "#1c1c20", border: `3px solid ${ZALE.red}`, borderRadius: 14, padding: "12px 10px", color: "#fff", opacity: nm, transform: `translateY(${(1 - nm) * 20}px)` }}>
            <div style={{ fontSize: 44, fontWeight: 900 }}>{name}</div>
            {sub ? <div style={{ fontSize: 26, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{sub}</div> : null}
          </div>
          <Snd at={2} name="pop" k="chart-in" />
          <Snd at={nameAt} name="ding" k="name-plate" vol={0.3} />
        </Float>
      );
    }}
  </Stage>
);
// ============ 10. olhos com estrabismo que se alinham ============
const Eye: React.FC<{ look: number }> = ({ look }) => (
  <svg width={300} height={180} viewBox="0 0 300 180">
    <path d="M10 90 Q150 -20 290 90 Q150 200 10 90 Z" fill="#fff" stroke="#e5e5e5" strokeWidth={4} />
    <circle cx={150 + look * 70} cy={90} r={56} fill="#6b4f2f" />
    <circle cx={150 + look * 70} cy={90} r={26} fill="#111" />
    <circle cx={165 + look * 70} cy={74} r={10} fill="#fff" />
  </svg>
);
export const EyesAlign: React.FC<{ life: number; year?: string; yearAt?: number; syringeAt: number; alignAt: number; caption?: string }> = ({ life, year, yearAt = 4, syringeAt, alignAt, caption }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const al = sp(f, fps, alignAt, { damping: 12, stiffness: 120, mass: 0.9 });
      const sy = sp(f, fps, syringeAt);
      const cap = caption ? sp(f, fps, alignAt + 8) : 0;
      return (
        <Float f={f}>
          {year ? <Pill text={year} top={190} on={sp(f, fps, yearAt)} size={58} /> : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: CY - 100, display: "flex", justifyContent: "center", gap: 40, opacity: on }}>
            <Eye look={0} />
            <Eye look={-0.85 * (1 - al)} />
          </div>
          <div style={{ position: "absolute", left: CX + 250, top: CY - 230 + (1 - sy) * -100, opacity: sy * (1 - al * 0.8), transform: "rotate(135deg)" }}>
            <Syringe size={140} color="#e5e7eb" strokeWidth={1.6} />
          </div>
          {caption ? <Pill text={caption} top={CY + 150} on={cap} /> : null}
          {year ? <Snd at={yearAt} name="pop" k="year-pill" /> : null}
          <Snd at={syringeAt} name="click" k="syringe" />
          <Snd at={alignAt} name="ding" k="aligned" vol={0.35} />
        </Float>
      );
    }}
  </Stage>
);
// ============ 11 e 13. frasco com rótulo (Oculinum -> Botox) ============
export const VialLabel: React.FC<{ life: number; label: string; labelAt?: number; label2?: string; peelAt?: number; newAt?: number }> = ({ life, label, labelAt = 0, label2, peelAt, newAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 13, stiffness: 130, mass: 0.9 });
      const lb = sp(f, fps, labelAt);
      const peel = peelAt !== undefined ? ease(f, peelAt, peelAt + 18) : 0;
      const nw = newAt !== undefined ? sp(f, fps, newAt, { damping: 10, stiffness: 200, mass: 0.6 }) : 0;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 150, top: 190, opacity: on, transform: `scale(${0.85 + 0.15 * lock(on)})` }}>
            <div style={{ opacity: lb > 0.02 ? 1 : 1 }}>
              <Vial w={300} label={lb > 0.02 ? label : undefined} label2={label2} peel={peel} glow={nw} />
            </div>
          </div>
          {label2 && newAt !== undefined ? <Pill text={label2} top={850} on={nw} size={52} /> : null}
          <Snd at={2} name="pop" k="vial-in" />
          <Snd at={labelAt} name="tick" k="label-on" />
          {peelAt !== undefined ? <SndSpan at={peelAt} dur={18} name="write" vol={0.2} /> : null}
          {newAt !== undefined ? <Snd at={newAt} name="ding" k="botox" vol={0.4} /> : null}
        </Float>
      );
    }}
  </Stage>
);
// ============ 15. três frascos iguais ============
export const ThreeVials: React.FC<{ life: number; labels: { top: string; sub: string }[]; eqAt: number }> = ({ life, labels, eqAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const eq = sp(f, fps, eqAt, { damping: 11, stiffness: 200, mass: 0.7 });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
            {labels.map((l, i) => {
              const on = sp(f, fps, i * 8);
              return (
                <React.Fragment key={i}>
                  <div style={{ textAlign: "center", opacity: on, transform: `translateY(${(1 - on) * 60}px)` }}>
                    <Vial w={170} label={l.top} liquid={i === 0 ? "#b7e59a" : "#b9e3ff"} />
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 30, fontWeight: 800, marginTop: 14 }}>{l.sub}</div>
                  </div>
                  {i < labels.length - 1 ? <div style={{ color: ZALE.redBright, fontSize: 110, fontWeight: 900, opacity: eq, transform: `scale(${eq > 0.997 ? 1 : 1.6 - 0.6 * eq})`, marginTop: -60 }}>=</div> : null}
                </React.Fragment>
              );
            })}
          </div>
          {labels.map((_, i) => (
            <Snd key={i} at={i * 8} name="pop" k="vial-in" />
          ))}
          <Snd at={eqAt} name="ding" k="equal" vol={0.4} />
        </Float>
      );
    }}
  </Stage>
);
