// =================================================================================================
// HL3 · 1:08:39 o procedimento e 1:09:12 a invasão — 3D (11/10/2026).
// CCTV do navio: o MESMO convés de comando 3D (hl3r10d) visto por várias câmeras de segurança ao mesmo tempo (um canvas
// só, cada câmera desenhada no seu quadro), com hora, REC e o nome da câmera. Lá fora: o MESMO Borealis e o mesmo gelo do
// ataque (hl3r9s), a brecha aberta no casco, os sinalizadores da rota e os crachás 3D de quem está no gelo.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { Eye, Hud, proj } from "./hl3rf";
import { fadeIO, XView, XL, AdvisorArt } from "./hl3rx";
import { LiteCtx, SfxCtx } from "./sfx-ctx";
import { useAdvScene } from "./advgl";
import { V, kv, kk, World, Sky, shipW, halfAt, projector, SX, SZ, DOOR } from "./hl3r9s";
import { Cam, setCam, makeTag, useTagImages } from "./hl3r10k";
import { buildGlassRoom, HoloCore, ConsoleScreens, Pin, FlagAt, CONSOLE_QUADS } from "./hl3r9";
import { calmState } from "./hl3r10";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const VIO = "#c79bff";
const CYC = "#7ef0ff";
const ORANGE = HL.orange;
const TXT = HL.text;
const IOx = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => (p[k] as number | undefined) ?? 1e9;
const ats = (p: PR, ks: string[]) => ks.map((k) => at(p, k));
void FONT;
void TXT;

// ------------------------------------------------------------------------------------------------ CCTV no motor POV de sempre
// 11/10 (o 3D three.js nos interiores foi reprovado): cada câmera é a MESMA sala de controle da cena do vidro (buildGlassRoom)
// desenhada pelo motor POV, encaixada no quadro do monitor (escala única, corte em cima/embaixo).
export type Rect = [number, number, number, number];
// 12/10: a Alyx de pé diante do console da direita (antes ficava em cima do holograma)
const ALYX_PT: [number, number] = [2.5, 10.3];
const ADV_PT: V = [-1.2, 9.2, 2.3];
const XFeed: React.FC<{ r: Rect; e: Eye; f: number; G: ReturnType<typeof buildGlassRoom>; lights: XL[]; alert?: boolean; children?: React.ReactNode; extras?: THREE.Object3D[]; glLights?: THREE.Light[] }> = ({ r, e, f, G, lights, alert, children, extras, glLights }) => {
  const s = r[2] / 1920;
  const oy = (r[3] - 1080 * s) / 2;
  return (
    <div style={{ position: "absolute", left: r[0], top: r[1], width: r[2], height: r[3], overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", left: 0, top: oy, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <XView e={e} faces={G} lights={lights} flash={0.3} amb={0.16} extras={extras} glLights={glLights} />
        <HoloCore e={e} f={f} c={[0, 10, 1.9]} r={0.75} col={alert ? "#ff6a50" : "#7ef0ff"} />
        <ConsoleScreens e={e} f={f} quads={CONSOLE_QUADS} alert={alert} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {children}
        </svg>
      </div>
    </div>
  );
};
const roomLights = (alert: boolean): XL[] => [
  { x: 0, y: 10, z: 2.6, col: alert ? [255, 60, 40] : [90, 220, 240], k: 0.7, r: 9 },
  { x: 0, y: 6, z: 3.2, col: [200, 210, 225], k: 0.35, r: 9 },
  { x: 0, y: 19, z: 2.4, col: [170, 240, 255], k: 0.9, r: 9 },
];
// as câmeras de segurança (no alto dos cantos, grande-angulares, olhando para baixo)
// 11/10: câmeras afastadas das nervuras da parede e abaixo das vigas (de perto elas cortavam o quadro em diagonal)
const CAM_DECK: Eye = { x: 4.0, y: 4.6, z: 2.85, yaw: -0.5, pitch: -0.24, F: 700 };
const CAM_ALYX: Eye = { x: 4.0, y: 5.2, z: 2.7, yaw: -0.8, pitch: -0.34, F: 820 };
const CAM_ENG: Eye = { x: 4.2, y: 16.8, z: 3.4, yaw: -0.7, pitch: -0.22, F: 680 };
const CAM_B: Eye = { x: -4.2, y: 14.6, z: 2.85, yaw: 2.6, pitch: -0.24, F: 700 };
const CAM_DOOR: Eye = { x: -0.6, y: 8.6, z: 2.85, yaw: -2.45, pitch: -0.22, F: 700 };
// 12/10 (ele: o Advisor preto nas câmeras): a luz do Advisor era de um lado só; as câmeras de outros ângulos viam o lado
// escuro. Uma luz ambiente fria + uma de cima, iguais para todas as câmeras
const ADV_AMB = [new THREE.HemisphereLight("#cfe0ff", "#2a3038", 2.2), new THREE.AmbientLight("#9aa8b8", 1.2)];
const advAll = (L: THREE.Light[]) => (L.length ? [...L, ...ADV_AMB] : L);
const advIn = (e: Eye, f: number, k: number) => {
  const q = proj(e, [ADV_PT[0], ADV_PT[1], ADV_PT[2] + 0.08 * Math.sin(f / 20)]);
  return q ? <AdvisorArt x={q.x} y={q.y} w={Math.min(420, 1300 / q.d)} f={f} lit={0.75} id={`cc${k}`} /> : null;
};
void useMemo;
void THREE;
void rnd;
// moldura de monitor de CCTV por cima de cada quadro
const Feed: React.FC<{ r: [number, number, number, number]; id: string; where: string; f: number; t0?: number; hot?: string; clock: string; noise?: number }> = ({ r, id, where, f, hot, clock, noise = 0 }) => (
  <div style={{ position: "absolute", left: r[0], top: r[1], width: r[2], height: r[3], boxShadow: `inset 0 0 0 ${hot ? 3 : 2}px ${hot ?? "rgba(160,200,210,0.35)"}, inset 0 0 60px rgba(0,0,0,0.55)`, fontFamily: MONO, pointerEvents: "none", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 4px)", mixBlendMode: "multiply" }} />
    <div style={{ position: "absolute", inset: 0, background: "rgba(40,90,80,0.12)", mixBlendMode: "color" }} />
    {noise > 0 ? <div style={{ position: "absolute", inset: 0, opacity: noise, background: `repeating-linear-gradient(${(f * 37) % 180}deg, rgba(255,255,255,0.5) 0 1px, rgba(0,0,0,0.6) 1px 3px)` }} /> : null}
    <div style={{ position: "absolute", left: 12, top: 10, fontSize: 14, letterSpacing: 3, color: "#e8f4f2", textShadow: "0 1px 3px #000" }}>
      {id} · {where}
    </div>
    <div style={{ position: "absolute", right: 12, top: 10, fontSize: 14, letterSpacing: 2, color: "#e8f4f2", display: "flex", gap: 8, alignItems: "center", textShadow: "0 1px 3px #000" }}>
      <span style={{ width: 9, height: 9, borderRadius: 5, background: Math.floor(f / 15) % 2 ? "#ff3a2a" : "rgba(255,58,42,0.3)" }} />
      REC
    </div>
    <div style={{ position: "absolute", left: 12, bottom: 10, fontSize: 13, letterSpacing: 2, color: "rgba(232,244,242,0.85)", textShadow: "0 1px 3px #000" }}>{clock}</div>
  </div>
);
const clockAt = (base: number, f: number) => {
  const s = Math.floor(base + f / 30);
  return `BOREALIS · ${String(Math.floor(s / 3600) % 24).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
// a tela do console da Alyx com as instruções sendo digitadas
const drawInstr = (lines: string[], f: number, t0: number, alert = false) => (c: CanvasRenderingContext2D, w: number, h: number) => {
  c.fillStyle = alert ? "#2a0806" : "#061c26";
  c.fillRect(0, 0, w, h);
  c.fillStyle = alert ? "#ff7a60" : "#ffb066";
  c.font = `bold ${Math.round(h / 12)}px monospace`;
  c.fillText("A. VANCE → ADVISORS", w * 0.05, h * 0.14);
  c.font = `${Math.round(h / 13)}px monospace`;
  let n = Math.max(0, Math.floor((f - t0) * 1.3));
  lines.forEach((l, i) => {
    const s = l.slice(0, Math.max(0, n));
    n -= l.length;
    c.fillStyle = i === lines.length - 1 && alert ? "#ff7a60" : "#9ff0ff";
    c.fillText(s, w * 0.05, h * (0.32 + i * 0.15));
  });
};

// ------------------------------------------------------------------------------------------------ 1:08:39 o procedimento (CCTV)
// a parede de câmeras do navio: a Alyx no console com o Advisor, as instruções saindo dela, os Advisors executando, a
// falha e o procedimento avançando assim mesmo — devagar, rumo a um destino que ninguém sabe; no fim a imagem cai e entra
// o novo objetivo do HEV.
export const HL9SlowRoute3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  // 12/10 (pendência dele: o CCTV ainda tinha o Advisor 2D): o Advisor 3D na sala, visto por todas as câmeras
  const AS = useAdvScene([{ pos: ADV_PT, look: [ALYX_PT[0], ALYX_PT[1], 1.5], reach: 0.3 }], f, 2.0);
  const life = p.life;
  const ctx = React.useContext(SfxCtx);
  const [workAt, instrAt, advAt, leadAt, slowAt, backAt, destAt] = ats(p, ["workAt", "instrAt", "advAt", "leadAt", "slowAt", "backAt", "destAt"]);
  const zoom = P(f, leadAt - 8, 22); // o quadro do convés cresce e ocupa a tela
  const fail = f >= advAt && f < advAt + 26;
  const small: [number, number, number, number][] = [[60, 120, 880, 400], [980, 120, 880, 400], [60, 560, 880, 400], [980, 560, 880, 400]];
  const big: [number, number, number, number] = [0, 0, 1920, 1080];
  const lerpR = (a: [number, number, number, number], b: [number, number, number, number], k: number) => a.map((v, i) => v + (b[i] - v) * k) as [number, number, number, number];
  const rA = lerpR(small[0], big, zoom);
  const G = useMemo(() => buildGlassRoom(), []);
  const lines = ["ETAPA 31 · ALINHAR FASE +0,3%", "ETAPA 32 · ISOLAR SETOR B", "ETAPA 33 · SINCRONIZAR NÚCLEO"];
  const team: [number, number, string][] = [[2.2, 19.4, "EQUIPE · MOTORES"], [-3.3, 8.6, "EQUIPE · CONVÉS"]];
  const people = (e: Eye) => (
    <>
      {AS.ready ? null : advIn(e, f, 0)}
      {/* 12/10 (pedido dele): sem o pontilhado da Alyx até o Advisor */}
      <FlagAt e={e} pt={[ALYX_PT[0], ALYX_PT[1], 0]} label="ALYX" col={ORANGE} f={f} sub={f >= instrAt ? "ENVIA AS INSTRUÇÕES" : "NO CONSOLE"} />
      {team.map(([x, y, sub], k) => (f >= workAt + k * 6 ? <Pin key={k} e={e} x={x + 0.5 * Math.sin(f / 60 + k)} y={y} col={RED} f={f} who="combine" text="COMBINE" sub={fail ? "FALHA" : sub} o={P(f, workAt + k * 6, 8)} h={1.9 + (k % 2) * 0.4} /> : null))}
    </>
  );
  const stage = 31 + Math.floor(P(f, instrAt, Math.max(30, life - instrAt)) * 3.4);
  const prog = Math.min(0.86, 0.62 + 0.2 * P(f, workAt, Math.max(30, leadAt - workAt)) + 0.04 * P(f, slowAt, 200));
  const off = P(f, backAt, 6);
  return (
    <AbsoluteFill style={{ background: "#030405", overflow: "hidden" }}>
      {ctx.mode === "collect" ? null : (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - off }}>
          <XFeed r={rA} e={{ ...CAM_DECK, x: CAM_DECK.x - zoom * 1.4, y: CAM_DECK.y + zoom * 0.8, F: CAM_DECK.F + zoom * 200 }} f={f} G={G} lights={roomLights(fail)} alert={fail} extras={AS.extras} glLights={advAll(AS.lights)}>
            {people({ ...CAM_DECK, x: CAM_DECK.x - zoom * 1.4, y: CAM_DECK.y + zoom * 0.8, F: CAM_DECK.F + zoom * 200 })}
          </XFeed>
          {zoom < 0.98 ? (
            <div style={{ opacity: 1 - zoom }}>
              <XFeed r={small[1]} e={CAM_ALYX} f={f} G={G} lights={roomLights(fail)} alert={fail} extras={AS.extras} glLights={advAll(AS.lights)}>
                {people(CAM_ALYX)}
              </XFeed>
              <XFeed r={small[2]} e={CAM_ENG} f={f} G={G} lights={roomLights(fail)} alert={fail} extras={AS.extras} glLights={advAll(AS.lights)}>
                {people(CAM_ENG)}
              </XFeed>
              <XFeed r={small[3]} e={CAM_B} f={f} G={G} lights={roomLights(fail)} alert={fail} extras={AS.extras} glLights={advAll(AS.lights)}>
                {people(CAM_B)}
              </XFeed>
            </div>
          ) : null}
        </div>
      )}
      <div style={{ opacity: 1 - off }}>
        <Feed r={rA} id="CAM 03" where="CONVÉS DE COMANDO" f={f} clock={clockAt(3 * 3600 + 41 * 60, f)} hot={fail ? RED : f >= instrAt && zoom < 0.5 ? CYC : undefined} />
        {zoom < 0.98 ? (
          <div style={{ opacity: 1 - zoom }}>
            <Feed r={small[1]} id="CAM 07" where="CONSOLE · A. VANCE" f={f} clock={clockAt(3 * 3600 + 41 * 60, f)} hot={f >= instrAt ? ORANGE : undefined} />
            <Feed r={small[2]} id="CAM 11" where="SALA DOS MOTORES" f={f} clock={clockAt(3 * 3600 + 41 * 60, f)} hot={fail ? RED : undefined} />
            <Feed r={small[3]} id="CAM 02" where="CONVÉS · LADO B" f={f} clock={clockAt(3 * 3600 + 41 * 60, f)} />
          </div>
        ) : null}
      </div>
      {/* o título da parede e o procedimento */}
      <div style={{ position: "absolute", left: 60, top: 60, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: CREAM, opacity: (1 - zoom) * (1 - off) }}>BOREALIS · SEGURANÇA INTERNA · AO VIVO</div>
      {f >= workAt ? (
        <div style={{ position: "absolute", right: 60, top: zoom > 0.5 ? 120 : 56, width: 520, padding: "12px 16px", background: "rgba(6,10,12,0.85)", border: `1.5px solid ${fail ? RED : CYC}`, borderRadius: 8, fontFamily: MONO, opacity: P(f, workAt, 8) * (1 - off) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 4, color: fail ? RED : CYC }}>
            <span>PROCEDIMENTO · ETAPA {stage}</span>
            <span>{Math.round(prog * 100)}%</span>
          </div>
          <div style={{ position: "relative", height: 10, marginTop: 8, background: "rgba(126,240,255,0.15)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: fail ? RED : CYC }} />
            {[0.66, 0.74].map((x, i) => (f >= advAt + i * 8 ? <div key={i} style={{ position: "absolute", left: `${x * 100}%`, top: -4, width: 3, height: 18, background: RED }} /> : null))}
            <div style={{ position: "absolute", right: 0, top: -14, fontSize: 12, color: "#ffd27a" }}>?</div>
          </div>
          {f >= advAt ? <div style={{ fontSize: 15, letterSpacing: 2, color: "#dff8ff", marginTop: 8 }}>{fail ? "FALHA · POUCO ANTES DA CONCLUSÃO" : "MESMO DEPOIS DAS FALHAS · CONTINUA AVANÇANDO"}</div> : null}
          {f >= leadAt ? <div style={{ fontSize: 15, letterSpacing: 2, color: ORANGE, marginTop: 6, opacity: P(f, leadAt, 8) }}>ELA ESTÁ LEVANDO ELES PARA ALGUM LUGAR{f >= slowAt ? " · DEVAGAR" : ""}</div> : null}
        </div>
      ) : null}
      {/* a imagem cai: o novo objetivo */}
      {off > 0 ? <AbsoluteFill style={{ opacity: off * (1 - P(f, backAt + 8, 10)) * 0.9, background: `repeating-linear-gradient(${(f * 41) % 180}deg, rgba(255,255,255,0.35) 0 1px, rgba(0,0,0,0.8) 1px 3px)` }} /> : null}
      {f >= backAt ? (
        <div style={{ position: "absolute", left: "50%", top: 430, transform: "translateX(-50%)", padding: "18px 28px", background: "rgba(10,8,2,0.86)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, textAlign: "center", opacity: P(f, backAt + 6, 10) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, opacity: 0.8 }}>H.E.V. · NOVO OBJETIVO</div>
          <div style={{ fontSize: 34, letterSpacing: 3, marginTop: 8 }}>VOLTAR PARA DENTRO DO BOREALIS</div>
          {f >= destAt ? <div style={{ fontSize: 17, letterSpacing: 3, marginTop: 8, color: CREAM, opacity: P(f, destAt, 8) }}>ANTES DE DESCOBRIR TARDE DEMAIS QUAL É O DESTINO</div> : null}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ 1:09:12 a invasão
// 1) lá fora, da crista: "o plano muda" — o Borealis inteiro no gelo, a Resistência reunida.
// 2) CCTV do arquivo do navio: a Alyx saindo com a escolta pela porta lateral (dias atrás); as equipes que ficaram
//    trabalhando no convés e nos motores; as instruções dela chegando; a etapa travada sem ela.
// 3) lá fora: a Resistência atravessa o gelo até a brecha aberta no casco; a Alyx volta pela prancha da popa; o Gordon
//    entra pela brecha; olhando para trás, a rota pelo gelo marcada por sinalizadores — Barney, Varga e Eli segurando.
// a porta de costado é do próprio navio (hl3r9s DOOR); BREACH = 1,4 m acima da soleira, rente ao casco
const BREACH: V = shipW([DOOR.x, DOOR.y0 + 1.4, halfAt(DOOR.x, DOOR.y1) + 0.2]);
const GANG: V = shipW([-50, 0, halfAt(-50, 2) + 4.2]);
const GANGDOOR = (() => {
  let zH = 0;
  for (let y = 2.4; y <= 4.9; y += 0.25) for (let x = -51.3; x <= -48.7; x += 0.65) zH = Math.max(zH, halfAt(x, y));
  return { x: SX - 50, y0: 4.6, z: SZ + zH };
})();
const FLARES: V[] = [[-6, 0.15, -92], [-9, 0.15, -70], [-12, 0.15, -48], [-14, 0.15, -26]];
const ROUTE_TAGS: [string, string, V][] = [["BARNEY", "hl3silh/barney_badge.jpg", [-4.5, 0, -88]], ["VARGA", "hl3silh/varga_retrato.png", [-10.5, 0, -64]], ["ELI", "hl3silh/eli_retrato.png", [-12.8, 0, -42]]];
const EXT_IMGS = ["hl3silh/alyx_badge.jpg", "hl3silh/combine_badge.jpg", "hl3silh/barney_badge.jpg", "hl3silh/varga_retrato.png", "hl3silh/eli_retrato.png", "hl3silh/rebelde2_badge.jpg", "hl3silh/rebelde3_badge.jpg", "hl3silh/rebelde7_badge.jpg", "hl3silh/rebelde8_badge.jpg"];
type ExtW = ReturnType<typeof buildExt>;
const buildExt = (im: Record<string, HTMLImageElement>) => {
  const root = new THREE.Group();
  // 12/10 (pedido dele: a porta não encaixava no casco): o vão, o túnel e a folha da porta agora são do próprio navio
  // (hl3r9s). Aqui só o que a Resistência trouxe: a rampa de chapas do gelo até a soleira, com corrimão
  const W2 = DOOR.hw, H2 = DOOR.y1 - DOOR.y0;
  const sill = BREACH[1] - 1.4;
  const zH = BREACH[2] - 0.2;
  const dark = new THREE.MeshStandardMaterial({ color: "#30353a", roughness: 0.6, metalness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: "#6a7076", roughness: 0.5, metalness: 0.7 });
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, rx = 0) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    b.rotation.x = rx;
    root.add(b);
    return b;
  };
  const RUN = 6.5;
  const rampLen = Math.hypot(sill, RUN);
  const ang = Math.atan2(sill, RUN);
  box(2 * W2 - 0.4, 0.12, rampLen, metal, BREACH[0], sill / 2 - 0.02, zH + RUN / 2, ang);
  // longarinas, travessas antiderrapantes e o corrimão
  for (const sx of [-1, 1]) box(0.14, 0.32, rampLen, dark, BREACH[0] + sx * (W2 - 0.25), sill / 2 - 0.16, zH + RUN / 2, ang);
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    box(2 * W2 - 0.6, 0.05, 0.08, dark, BREACH[0], sill * (1 - t) + 0.05, zH + RUN * t, ang);
  }
  for (const sx of [-1, 1]) {
    for (let i = 0; i <= 3; i++) {
      const t = i / 3;
      box(0.06, 1.0, 0.06, dark, BREACH[0] + sx * (W2 - 0.25), sill * (1 - t) + 0.5, zH + 0.2 + (RUN - 0.4) * t);
    }
    box(0.06, 0.06, rampLen - 0.3, metal, BREACH[0] + sx * (W2 - 0.25), sill / 2 + 1.0, zH + RUN / 2, ang);
  }
  // os calços no gelo, no pé da rampa
  box(2 * W2, 0.25, 0.5, dark, BREACH[0], 0.12, zH + RUN + 0.1);
  void H2;
  // a luz de emergência girando em cima (o "rim" que o quadro anima)
  const rim = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: "#ff8a3a", toneMapped: false }));
  rim.position.set(BREACH[0], sill + (DOOR.y1 - DOOR.y0) + 0.5, zH + 0.3);
  root.add(rim);
  const rimL = new THREE.PointLight("#ff8a3a", 30, 10, 1.6);
  rimL.position.set(BREACH[0], sill + (DOOR.y1 - DOOR.y0) + 0.8, zH + 1.5);
  root.add(rimL);
  // 13/10 (pedido dele: a prancha descia sem ligar na abertura; a porta ficava escondida): a porta da popa assentada NA
  // superfície do casco (a borda mais saliente na altura dela) e a prancha montada pelos dois pontos — do pé no gelo até a
  // soleira da porta —, com degraus, corrimãos e postes; a Alyx sobe por ela e entra
  const steel = new THREE.MeshStandardMaterial({ color: "#5c6064", roughness: 0.55, metalness: 0.65 });
  const dark2 = new THREE.MeshStandardMaterial({ color: "#2e3236", roughness: 0.6, metalness: 0.6 });
  const gd = GANGDOOR;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.0, 0.35), dark2);
  frame.position.set(gd.x, gd.y0 + 1.25, gd.z + 0.05);
  root.add(frame);
  const gdoor = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.3), new THREE.MeshBasicMaterial({ color: "#ffe6b8", toneMapped: false }));
  gdoor.position.set(gd.x, gd.y0 + 1.15, gd.z + 0.24);
  root.add(gdoor);
  const sill2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.2), steel);
  sill2.position.set(gd.x, gd.y0 - 0.06, gd.z + 0.75);
  root.add(sill2);
  const T = new THREE.Vector3(gd.x, gd.y0, gd.z + 1.3), B = new THREE.Vector3(gd.x, 0.05, gd.z + 9);
  const L = T.distanceTo(B);
  const mid = T.clone().add(B).multiplyScalar(0.5);
  const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, L), steel);
  plank.position.copy(mid);
  plank.lookAt(T);
  root.add(plank);
  for (let k = 1; k < 14; k++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.07), dark2);
    st.position.copy(B.clone().lerp(T, k / 14)).add(new THREE.Vector3(0, 0.09, 0));
    st.quaternion.copy(plank.quaternion);
    root.add(st);
  }
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, L), steel);
    rail.position.copy(mid).add(new THREE.Vector3(s * 0.88, 0.95, 0));
    rail.quaternion.copy(plank.quaternion);
    root.add(rail);
    for (let k = 0; k <= 4; k++) {
      const q = B.clone().lerp(T, k / 4);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), steel);
      post.position.set(q.x + s * 0.88, q.y + 0.48, q.z);
      root.add(post);
    }
  }
  const gl2 = new THREE.PointLight("#ffd9a0", 45, 14, 1.6);
  gl2.position.set(gd.x, gd.y0 + 1.4, gd.z + 2.2);
  root.add(gl2);
  // sinalizadores vermelhos na rota pelo gelo (luz + chama)
  const flares = FLARES.map((p, i) => {
    const g = new THREE.Group();
    g.position.set(...p);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), new THREE.MeshStandardMaterial({ color: "#7a1a14" })));
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: "#ff6a4a", toneMapped: false }));
    fl.position.y = 0.3;
    g.add(fl);
    if (i < 3) {
      const l = new THREE.PointLight("#ff4a2a", 40, 16, 1.5);
      l.position.y = 0.8;
      g.add(l);
    }
    root.add(g);
    return g;
  });
  // os crachás no gelo
  const alyx = makeTag(im["hl3silh/alyx_badge.jpg"], { label: "ALYX", col: ORANGE }, 2.4);
  const esc = [0, 1].map(() => makeTag(im["hl3silh/combine_badge.jpg"], { label: "COMBINE", col: RED, kind: "combine" }, 2.0));
  const rebels = ["rebelde2", "rebelde3", "rebelde7", "rebelde8"].map((n) => makeTag(im[`hl3silh/${n}_badge.jpg`], { label: "REBELDE", col: AMB }, 2.0));
  const route = ROUTE_TAGS.map(([n, img]) => makeTag(im[img], { label: n, col: AMB }, 2.4));
  [alyx, ...esc, ...rebels, ...route].forEach((t) => root.add(t.g));
  return { root, flares, alyx, esc, rebels, route, rim };
};
function ExtLayer({ cam, update }: { cam: Cam; update: (W: ExtW, camera: THREE.Camera) => void }) {
  const { camera, invalidate } = useThree();
  const im = useTagImages(EXT_IMGS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const W = useMemo(() => buildExt(im), []);
  setCam(camera, cam);
  update(W, camera);
  invalidate();
  return <primitive object={W.root} />;
}
export const HL10Invasion3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  // 12/10 (pendência dele: o CCTV ainda tinha o Advisor 2D): o Advisor 3D na sala, visto por todas as câmeras
  const AS = useAdvScene([{ pos: ADV_PT, look: [ALYX_PT[0], ALYX_PT[1], 1.5], reach: 0.3 }], f, 2.0);
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [teamsAt, instrAt, stuckAt, invAt, backAt, advAt, alyxAt, gordAt, routeAt] = ats(p, ["teamsAt", "instrAt", "stuckAt", "invAt", "backAt", "advAt", "alyxAt", "gordAt", "routeAt"]);
  const cctv = f >= teamsAt && f < invAt;
  // ---- lá fora
  const ext: Cam = (() => {
    if (f < teamsAt) return { pos: kv(f, [[0, [-20, 5.5, -40]], [teamsAt, [-17, 5.2, -46]]]), tgt: [SX - 6, 7, SZ], fov: 50 };
    // 13/10 (pedido dele: nem aparece ela entrando): de perto da prancha da popa, a Alyx e a escolta sobem e entram
    if (f >= backAt - 20 && f < gordAt - 10) return { pos: kv(f, [[backAt - 20, [GANGDOOR.x + 16, 3.2, GANGDOOR.z + 20]], [gordAt - 10, [GANGDOOR.x + 12, 4.4, GANGDOOR.z + 11]]]), tgt: kv(f, [[backAt - 20, [GANGDOOR.x, 1.4, GANGDOOR.z + 12]], [alyxAt, [GANGDOOR.x, 2.6, GANGDOOR.z + 5]], [gordAt - 10, [GANGDOOR.x, 4.6, GANGDOOR.z + 1]]]), fov: 46 };
    if (f < gordAt) return { pos: kv(f, [[invAt, [-2, 3.2, -66]], [gordAt, [-6, 2.6, -100]]]), tgt: kv(f, [[invAt, [BREACH[0], 3, BREACH[2]]], [backAt + 10, [GANG[0] + 4, 2.6, GANG[2] + 6]], [alyxAt + 20, [GANG[0] + 4, 2.6, GANG[2] + 4]], [gordAt, [BREACH[0], 2.6, BREACH[2]]]]), fov: 52 };
    if (f < routeAt) {
      const u = P(f, gordAt, Math.max(20, routeAt - gordAt));
      // anda pelo gelo até a rampa, sobe por ela e entra pela escotilha
      const sillY = BREACH[1] - 1.4;
      const zE = BREACH[2];
      const u2 = IOx(u);
      // 12/10: sobe a rampa e entra no túnel até perto da antepara (a porta estanque aberta, o corredor aceso)
      const zz = -100 + (zE - 2.6 - -100) * u2;
      const zR = zE - 0.2;
      const yy = (zz > zR + 6.5 ? 0 : zz > zR ? sillY * (1 - (zz - zR) / 6.5) : sillY) + 1.65 + 0.04 * Math.abs(Math.sin(f / 4));
      return { pos: [-6 + (BREACH[0] - -6) * Math.min(1, u2 * 1.3), Math.min(yy, sillY + 1.75), zz], tgt: [BREACH[0] + 0.3, sillY + 1.4, zE - 9], fov: 58 };
    }
    // olhando para trás, da boca da brecha: a rota pelo gelo
    // de dentro da escotilha, no topo da rampa, olhando para trás: a rota pelo gelo
    return { pos: [BREACH[0], BREACH[1] - 1.4 + 1.65, BREACH[2] - 0.9], tgt: kv(f, [[routeAt, [BREACH[0] - 2, 1.0, -80]], [life, [BREACH[0] - 4, 0.8, -40]]]), fov: 54 };
  })();
  const st = calmState(f, lite, ext);
  st.ridge = f < teamsAt;
  // a Resistência abre a porta de costado quando a invasão começa
  st.door = IOx(P(f, invAt - 10, 40));
  const updExt = (W: ExtW, camera: THREE.Camera) => {
    W.flares.forEach((g, i) => (g.visible = f >= invAt + i * 6));
    // rebeldes: reunidos na crista → atravessando o gelo até a brecha
    W.rebels.forEach((t, i) => {
      const a: V = [-24 + i * 3.2, 1.2, -18 - (i % 2) * 2];
      // em fila no pé da rampa (no gelo limpo, nunca em cima de bloco)
      const b: V = [BREACH[0] + (i % 2 ? 0.7 : -0.7), 0, BREACH[2] + 7.6 + i * 1.3];
      const u = P(f, invAt + i * 5, 150);
      const pos: V = f < invAt ? a : [a[0] + (b[0] - a[0]) * u, 0, a[2] + (b[2] - a[2]) * u];
      t.g.position.set(...pos);
      // eles entram com o Gordon: na vista da rota (de dentro, olhando para trás) já não estão no gelo
      t.g.visible = f < routeAt;
      t.face(camera, 1);
    });
    // a Alyx voltando com a escolta pela prancha da popa
    const ua = interpolate(f, [backAt - 10, alyxAt + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const up = Math.min(1, Math.max(0, (ua - 0.5) / 0.35));
    // pelo gelo até o pé da prancha da popa, sobe e passa pela porta acesa
    const gd = GANGDOOR;
    const ap: V = ua < 0.5
      ? [gd.x + 6 * (1 - ua * 2), 0, gd.z + 24 - ua * 2 * 15]
      : ua < 0.88
        ? (() => { const k = (ua - 0.5) / 0.38; return [gd.x, gd.y0 * k, gd.z + 9 - k * 7.7] as V; })()
        : [gd.x, gd.y0, gd.z + 1.3 - (ua - 0.88) * 12];
    W.alyx.g.position.set(...ap);
    // some ao passar pela porta (o fim da prancha)
    W.alyx.g.visible = f >= backAt - 10 && f < gordAt && ap[2] > GANGDOOR.z + 0.1;
    W.alyx.setSub(f >= alyxAt ? "A OPORTUNIDADE QUE ELA ESPERAVA" : f >= advAt ? "A ÚNICA CAPAZ DE CONDUZIR AS PRÓXIMAS ETAPAS" : "VOLTA PARA DENTRO");
    W.alyx.face(camera, P(f, backAt - 10, 10));
    W.esc.forEach((t, i) => {
      // a escolta atrás dela, pelo mesmo caminho
      const ub = Math.max(0, ua - 0.08 - i * 0.05);
      const gd2 = GANGDOOR;
      const q: V = ub < 0.5 ? [gd2.x + 6 * (1 - ub * 2), 0, gd2.z + 24 - ub * 2 * 15] : ub < 0.88 ? (() => { const k = (ub - 0.5) / 0.38; return [gd2.x, gd2.y0 * k, gd2.z + 9 - k * 7.7] as V; })() : [gd2.x, gd2.y0, gd2.z + 1.3 - (ub - 0.88) * 12];
      t.g.position.set(q[0] + (i ? 0.45 : -0.45), q[1], q[2]);
      t.g.visible = f >= backAt - 10 && f < gordAt && t.g.position.z > GANGDOOR.z + 0.1;
      t.face(camera, P(f, backAt - 6, 10));
    });
    W.route.forEach((t, i) => {
      t.g.position.set(...ROUTE_TAGS[i][2]);
      t.g.visible = f >= routeAt;
      t.setSub(i === 0 ? "MANTÊM A ROTA ABERTA" : undefined);
      t.face(camera, P(f, routeAt + 14 + i * 8, 10));
    });
    (W.rim.material as THREE.MeshBasicMaterial).color.setHSL(0.07, 1, Math.floor(f / 6) % 2 ? 0.6 : 0.25);
  };
  // ---- CCTV (arquivo do navio): a MESMA sala de controle no motor POV
  const sm: Rect[] = [[60, 120, 880, 400], [980, 120, 880, 400], [60, 560, 880, 400], [980, 560, 880, 400]];
  const G = useMemo(() => buildGlassRoom(), []);
  const leave = P(f, teamsAt, 200); // a Alyx e a escolta saindo pela porta da galeria
  const stuck = f >= stuckAt;
  const team: [number, number][] = [[2.2, 19.4], [-1.6, 6.8], [4.8, 9.4]];
  const people = (e: Eye, archive = false) => (
    <>
      {AS.ready ? null : advIn(e, f, 1)}
      {archive && leave < 0.99 ? (
        <g opacity={1 - P(f, teamsAt + 190, 12)}>
          <FlagAt e={e} pt={[2 - leave * 7, 7.4 - leave * 3.6, 0]} label="ALYX" col={ORANGE} f={f} sub="SAINDO · COORDENAR A GUERRA" />
          {[0, 1].map((k) => <Pin key={k} e={e} x={2.6 - leave * 7 + k * 0.9} y={8.6 - leave * 3.6 + k * 0.8} col={RED} f={f} who="combine" text="COMBINE" sub="ESCOLTA" h={1.7 + k * 0.4} />)}
        </g>
      ) : null}
      {team.map(([x, y], k) => <Pin key={"t" + k} e={e} x={x + (stuck ? 0 : 0.5 * Math.sin(f / 50 + k))} y={y} col={RED} f={f} who="combine" text="COMBINE" sub={stuck ? "AGUARDANDO" : f >= instrAt ? "EXECUTANDO AS INSTRUÇÕES" : "FICOU NO NAVIO"} h={1.9 + (k % 2) * 0.4} />)}
    </>
  );
  const prE = projector({ pos: ext.pos, tgt: ext.tgt, fov: ext.fov });
  const hz = prE([ext.pos[0], 0, ext.pos[2] - 3000]);
  const yaw = Math.atan2(ext.tgt[0] - ext.pos[0], -(ext.tgt[2] - ext.pos[2]));
  const eye: Eye = { x: ext.pos[0], y: -ext.pos[2], z: ext.pos[1], yaw, pitch: 0, F: 1000 };
  void 0;
  return (
    <AbsoluteFill style={{ background: "#050a10", overflow: "hidden" }}>
      {!cctv ? (
        <>
          <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
          {ctx.mode === "collect" ? null : (
            <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 52, position: [0, 3, 0], near: 0.3, far: 4000 }}>
              <World st={st} />
              <ExtLayer cam={ext} update={updExt} />
            </ThreeCanvas>
          )}
          {f >= advAt && f < gordAt ? (
            <div style={{ position: "absolute", left: 90, top: 130, width: 600, padding: "12px 16px", background: "rgba(10,6,14,0.86)", border: `1.5px solid ${VIO}`, borderRadius: 8, fontFamily: MONO, opacity: P(f, advAt, 8) * (1 - P(f, gordAt - 10, 10)) }}>
              <div style={{ fontSize: 13, letterSpacing: 4, color: VIO }}>CANAL DOS ADVISORS · INTERCEPTADO</div>
              <div style={{ fontSize: 20, letterSpacing: 1, color: "#efe6ff", marginTop: 6 }}>{"“A. Vance retorna. Única capaz de conduzir as próximas etapas.”".slice(0, Math.max(0, Math.floor((f - advAt) * 1.8)))}</div>
            </div>
          ) : null}
          <Hud f={f} yaw={yaw} eye={eye} blips={[]} msg={f < teamsAt ? "O PLANO MUDA · DESSA VEZ ELES VÃO ENTRAR" : f >= invAt && f < backAt ? "A INVASÃO · A BRECHA NO CASCO" : f >= gordAt && f < routeAt ? "GORDON ENTRA COM A RESISTÊNCIA" : f >= routeAt + 10 ? "A ROTA PELO GELO" : undefined} msgCol={AMB} />
        </>
      ) : (
        <>
          <XFeed r={sm[0]} e={CAM_DOOR} f={f} G={G} lights={roomLights(stuck)} alert={stuck} extras={AS.extras} glLights={advAll(AS.lights)}>
            {people(CAM_DOOR, true)}
          </XFeed>
          <XFeed r={sm[1]} e={CAM_DECK} f={f} G={G} lights={roomLights(stuck)} alert={stuck} extras={AS.extras} glLights={advAll(AS.lights)}>
            {people(CAM_DECK)}
          </XFeed>
          <XFeed r={sm[2]} e={CAM_ENG} f={f} G={G} lights={roomLights(stuck)} alert={stuck} extras={AS.extras} glLights={advAll(AS.lights)}>
            {people(CAM_ENG)}
          </XFeed>
          <XFeed r={sm[3]} e={CAM_ALYX} f={f} G={G} lights={roomLights(stuck)} alert={stuck} extras={AS.extras} glLights={advAll(AS.lights)}>
            {people(CAM_ALYX)}
          </XFeed>
          <Feed r={sm[0]} id="CAM 05" where="PORTA DA GALERIA" f={f} clock={`ARQUIVO · 12 DIAS ATRÁS · ${clockAt(22 * 3600 + 7 * 60, f).slice(11)}`} hot={leave < 0.99 ? ORANGE : undefined} />
          <Feed r={sm[1]} id="CAM 03" where="CONVÉS DE COMANDO" f={f} clock={clockAt(3 * 3600 + 12 * 60, f)} hot={stuck ? RED : undefined} />
          <Feed r={sm[2]} id="CAM 11" where="SALA DOS MOTORES" f={f} clock={clockAt(3 * 3600 + 12 * 60, f)} />
          <Feed r={sm[3]} id="CAM 07" where="CONSOLE · MENSAGENS" f={f} clock={clockAt(3 * 3600 + 12 * 60, f)} hot={f >= instrAt ? CYC : undefined} />
          <div style={{ position: "absolute", left: 60, top: 60, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: CREAM }}>BOREALIS · SEGURANÇA INTERNA · OS COMBINE NUNCA SAÍRAM DO NAVIO</div>
          {stuck ? (
            <div style={{ position: "absolute", left: "50%", top: 500, transform: "translateX(-50%)", padding: "10px 18px", background: "rgba(30,6,4,0.9)", border: `1.5px solid ${RED}`, borderRadius: 8, fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: RED, opacity: P(f, stuckAt, 8) }}>
              ETAPA 34 · AS EQUIPES NÃO AVANÇAM SOZINHAS
            </div>
          ) : null}
        </>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
void CYC;
void SZ;
