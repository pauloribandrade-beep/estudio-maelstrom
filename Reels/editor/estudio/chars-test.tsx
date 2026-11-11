import React from "react";
import { createRoot } from "react-dom/client";
import { VargaSide, VargaBand, KleinerSide, MagnussonSide, BarneySide, CombineSide, GManFront, VortSide, Headcrab, Antlion } from "../src/lib/hl3cast";
import { InkFilter, GordonBack, GordonSitBack, AlyxSide, EliSide, DogBot } from "../src/lib/hl3chars";
// folha de modelo: ?c=gordon&f=0 (f = quadro do ciclo), w = largura
const q = new URLSearchParams(location.search);
const c = q.get("c") ?? "gordon", f = Number(q.get("f") ?? 0), W = Number(q.get("w") ?? 780);
const poses = [0, 1, 2, 3].map((i) => f + i * 8);
const one = (k: number, x: number) => {
  const ph = (poses[k] ?? 0) * 0.2;
  if (c === "gordon") return <GordonBack x={x} y={520} s={1.8} ph={ph} amp={k === 0 ? 0 : 1} />;
  if (c === "gsit") return <GordonSitBack x={x} y={520} s={1.8} k={1} />;
  if (c === "alyx") return <AlyxSide x={x} y={520} s={1.8} ph={ph} amp={k === 0 ? 0 : 1} arm={k === 3 ? 1 : 0} dev={1} f={f} />;
  if (c === "eli") return <EliSide x={x} y={520} s={1.6} hug={k === 3 ? 1 : 0} f={f} />;
  const wk = k === 0 ? 0 : 1, pp = ph;
  if (c === "varga") return <g><VargaSide x={x} y={520} s={1.7} ph={pp} amp={wk} folder={k === 3 ? 0 : 1} f={f} />{k !== 3 ? <VargaBand x={x} y={520 - Math.abs(Math.sin(pp)) * 4 * wk * 1.7} s={1.7} /> : null}</g>;
  if (c === "kleiner") return <KleinerSide x={x} y={520} s={1.7} ph={pp} amp={k === 1 || k === 2 ? 1 : 0} talk={k === 3 ? 1 : 0} f={f} />;
  if (c === "mag") return <MagnussonSide x={x} y={520} s={1.7} ph={pp} amp={k === 1 || k === 2 ? 1 : 0} f={f} />;
  if (c === "barney") return <BarneySide x={x} y={520} s={1.6} ph={pp} amp={k === 1 || k === 2 ? 1 : 0} wave={k === 3 ? 1 : 0} f={f} />;
  if (c === "combine") return <CombineSide x={x} y={520} s={1.6} ph={pp} amp={k === 1 || k === 2 ? 1 : 0} aim={k === 3 ? 1 : 0} f={f} />;
  if (c === "gman") return <GManFront x={x} y={520} s={1.7} tie={k === 3 ? 1 : k * 0.3} />;
  if (c === "vort") return <VortSide x={x} y={520} s={1.6} pose={(["stand", "walk", "talk", "offer"] as const)[k]} ph={pp} f={f} />;
  if (c === "crab") return <Headcrab x={x} y={480} s={2.4} jump={k === 3 ? 1 : 0} f={f + k * 7} />;
  if (c === "ant") return <Antlion x={x - 20} y={520} s={1.5} ph={pp} amp={k === 1 || k === 2 ? 1 : 0} wing={k === 3 ? 1 : 0} f={f} />;
  if (c === "head") return <g transform="translate(-1500 -1700) scale(4)"><AlyxSide x={x} y={520} s={1.8} f={f} /></g>;
  return <DogBot x={x} y={520} s={1.1} lie={k === 3 ? 1 : 0} f={f} />;
};
createRoot(document.getElementById("r")!).render(
  <svg width={W} height={q.get("vb") ? W : q.get("k") ? W * 1.125 : W * 0.375} viewBox={q.get("vb") ? q.get("vb")!.replace(/_/g, " ") : q.get("k") ? `${Number(q.get("k")) * 400} 90 400 450` : "0 0 1600 600"}>
    <defs>
      {q.get("p") ? (
        <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={4} xChannelSelector="R" yChannelSelector="G" result="brush" />
          <feGaussianBlur in="SourceAlpha" stdDeviation={6} result="b" />
          <feOffset in="b" dx={5} dy={7} result="bo" />
          <feComposite in="SourceAlpha" in2="bo" operator="out" result="litA" />
          <feFlood floodColor="#fff3dc" floodOpacity={0.5} />
          <feComposite in2="litA" operator="in" result="lit" />
          <feComposite in="brush" in2="SourceAlpha" operator="in" result="body" />
          <feMerge><feMergeNode in="body" /><feMergeNode in="lit" /></feMerge>
        </filter>
      ) : null}
      <InkFilter />
    </defs>
    <rect width={1600} height={600} fill="#dfeaf2" />
    {c === "row1" ? (
      <g>
        <GordonBack x={200} y={540} s={1.75} ph={0} amp={0} />
        <AlyxSide x={470} y={540} s={1.75} f={f} />
        <EliSide x={720} y={540} s={1.6} f={f} />
        <VargaSide x={980} y={540} s={1.7} f={f} />
        <VargaBand x={980} y={540} s={1.7} />
        <BarneySide x={1240} y={540} s={1.6} f={f} />
        <GManFront x={1460} y={540} s={1.7} tie={0} />
      </g>
    ) : c === "row2" ? (
      <g>
        <KleinerSide x={170} y={540} s={1.7} f={f} />
        <MagnussonSide x={400} y={540} s={1.7} f={f} />
        <CombineSide x={640} y={540} s={1.6} f={f} />
        <VortSide x={900} y={540} s={1.7} f={f} />
        <DogBot x={1230} y={540} s={1.2} f={f} />
        <Headcrab x={1470} y={540} s={1.6} f={f} />
      </g>
    ) : c === "row3" ? (
      <g>
        <Antlion x={330} y={540} s={1.9} f={f} />
        <Headcrab x={760} y={540} s={2.6} f={f} />
        <Headcrab x={1100} y={500} s={2.6} jump={1} f={f} />
        <VortSide x={1400} y={540} s={1.7} pose="offer" f={f} />
      </g>
    ) : c === "all" ? (
      <g>
        <GordonBack x={230} y={540} s={1.75} ph={0} amp={0} />
        <AlyxSide x={560} y={540} s={1.75} f={f} />
        <EliSide x={860} y={540} s={1.6} f={f} />
        <DogBot x={1240} y={540} s={1.25} f={f} />
      </g>
    ) : [0, 1, 2, 3].map((k) => <g key={k}>{one(k, 200 + k * 400)}</g>)}
  </svg>,
);
