import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import SFX_COUNT from "../../lib/sfx-manifest.json";
import { FONT } from "../../lib/overlays";
import { ZALE } from "../../lib/theme";

// AUDIÇÃO da biblioteca de sons: cada versão toca com o nome na tela, para o
// usuário dizer quais cortar. Volume de cada um = o do vídeo (SFX_VOL), ×2
// para dar para ouvir sem a voz por cima.
const USO: Record<string, string> = {
  pop: "item ou card entrando",
  tick: "item de lista ou grade",
  tap: "troca de enquadramento",
  click: "clique de botão ou cursor",
  ding: "confirmação, algo certo",
  error: "algo errado, riscado",
  thud: "carimbo (impacto aprovado)",
  glass: "brilho, destaque",
  switch: "alternar estado",
  paper: "ficha ou papel entrando",
  riser: "subida antes da virada",
  drop: "batida da virada",
  whoosh: "transição (não usar por padrão)",
  type: "digitação (trecho)",
  write: "escrita à mão (trecho)",
};
const LONG = new Set(["type", "write", "riser"]);
const ITEMS = Object.entries(SFX_COUNT as Record<string, number>).flatMap(([fam, n]) =>
  Array.from({ length: n }, (_, i) => ({ fam, i, n, dur: LONG.has(fam) ? 90 : fam === "drop" || fam === "thud" ? 75 : 45 })),
);
let acc = 0;
const TIMED = ITEMS.map((it) => {
  const from = acc;
  acc += it.dur;
  return { ...it, from };
});
export const AUDICAO_DURATION = acc + 15;

export const Audicao: React.FC = () => (
  <AbsoluteFill style={{ background: ZALE.ink, fontFamily: FONT, color: ZALE.white, alignItems: "center", justifyContent: "center" }}>
    {TIMED.map((it) => (
      <Sequence key={`${it.fam}_${it.i}`} from={it.from} durationInFrames={it.dur} layout="none">
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ fontSize: 44, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{USO[it.fam] ?? ""}</div>
          <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -4 }}>
            {it.fam} <span style={{ color: ZALE.redBright }}>{it.i + 1}</span>
          </div>
          <div style={{ fontSize: 40, color: "rgba(255,255,255,0.45)" }}>de {it.n}</div>
        </AbsoluteFill>
        <Sequence from={8} layout="none">
          <Audio src={staticFile(`sfx/${it.fam}_${it.i}.wav`)} volume={0.8} endAt={it.dur - 8} />
        </Sequence>
      </Sequence>
    ))}
  </AbsoluteFill>
);
