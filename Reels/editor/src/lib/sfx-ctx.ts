import React from "react";

// Controle dos sons embutidos nas cenas (Snd / SndSpan).
// - "play": comportamento de sempre (o som toca).
// - "mute": vídeo montado a partir do edit.json; os sons das cenas ficam mudos
//   porque TODOS os sons vêm da trilha de sons do edit.json (editável).
// - "collect": extração; cada som vira uma linha no console (prefixo __SFX__)
//   com o frame absoluto, para o script montar a trilha de sons.
// `offset` = frame absoluto em que a cena começa (o `at` dos sons é relativo a ela).
export type SfxMode = "play" | "mute" | "collect";
export const SfxCtx = React.createContext<{ mode: SfxMode; offset: number; scene?: string }>({ mode: "play", offset: 0 });

// Prévia do Estúdio (lite): as cenas pesadas (3D, grão, vidro desfocado) se aliviam para o Player manter 30 q/s.
// Quando o Player atrasa, ele "corrige" o vídeo voltando quadros e o Paulo vê/ouve a fala repetir. Render: false.
export const LiteCtx = React.createContext(false);

export type CollectedSfx = { scene?: string; frame: number; src: string; vol: number; dur?: number; fadeIn?: number; fadeOut?: number };
export const emitSfx = (s: CollectedSfx) => {
  // eslint-disable-next-line no-console
  console.log("__SFX__" + JSON.stringify(s));
};
