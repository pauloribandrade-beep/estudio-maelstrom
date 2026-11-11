import React from "react";
import { createRoot } from "react-dom/client";
import { Thumbnail } from "@remotion/player";
import { HL14VargaFlat, HL14GlitchFlat } from "../src/lib/hl3r28";
import { HL14SnowFlat } from "../src/lib/hl3r29";
import { HL14VortWorldFlat } from "../src/lib/hl3r30";
import { HLRWaitFlat, HLRArriveFlat } from "../src/lib/hl3r31";
const q = new URLSearchParams(location.search);
const f = Number(q.get("f") ?? 0), s = q.get("s") ?? "v";
const fr = (o: Record<string, number>, life: number) => ({ ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === "mode" ? v : Math.round(v * 30)])), life: Math.round(life * 30) });
const S: Record<string, [React.FC<any>, any]> = {
  v: [HL14VargaFlat, fr({ filesAt: 4.279, skyAt: 7.719, seeAt: 9.653, closeAt: 9.653, loseAt: 10.84, goAt: 16.799 }, 18.6)],
  g: [HL14GlitchFlat, fr({ stopAt: 5.517, gmanAt: 6.598, l0At: 13.437, l1At: 15.597, cutAt: 19.351, glitchAt: 21.478, l2At: 27.571, goneAt: 31.094, lostAt: 45.977 }, 50.3)],
  r: [HL14SnowFlat, fr({ magAt: 4.48, kleinerAt: 11.201, barneyAt: 18.453, laughAt: 24.647, muteAt: 25.979, mode: 0 }, 27.2)],
  u: [HL14SnowFlat, fr({ portalAt: 0, lastAt: 5.607, throughAt: 8.014, dogAt: 9.493, talkAt: 10.659, knowsAt: 21.614, hugAt: 27.047, aloneAt: 30.134, foldAt: 33.473, greenAt: 42.593, lightAt: 48.086, vanishAt: 51.044, mode: 1 }, 52.8)],
  w: [HL14VortWorldFlat, fr({ wakeAt: 0, noAt: 3.506, workAt: 7.333, nobodyAt: 12.066, foodAt: 15.466, playAt: 19.266, oldAt: 23.006, sitAt: 29.114, mistAt: 30.719, nobodySawAt: 35.286, vortAt: 38.108, diffAt: 46.679, f1At: 49.246, f2At: 53.586, darkAt: 58.552, notGmanAt: 61.346, noStasisAt: 63.299, futureAt: 66.165 }, 69.6)],
  e: [HLRWaitFlat, fr({ senseAt: 1.441, minAt: 3.158, nothingAt: 4.504, nowAt: 6.024, lightAt: 7.898, portalAt: 8.758, airAt: 10.118 }, 11.5)],
  c: [HLRArriveFlat, fr({ emptyAt: 0.879, shipAt: 3.735, hugeAt: 5.026, stuckAt: 5.463, yearsAt: 8.249, notAt: 10.669, calcAt: 12.639, enoughAt: 15.859, goAt: 18.111, enterAt: 18.812 }, 23.17)],
};
const [Comp, props] = S[s];
createRoot(document.getElementById("r")!).render(
  <Thumbnail component={Comp} inputProps={props} compositionWidth={1920} compositionHeight={1080} durationInFrames={3000} fps={30} frameToDisplay={f} style={{ width: Number(q.get("w") ?? 780), height: Number(q.get("w") ?? 780) * 0.5625 }} />,
);
