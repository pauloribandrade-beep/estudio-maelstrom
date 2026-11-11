// =================================================================================================
// HL3 · 1:11:29 a luta e 1:12:02 a mão — no MESMO convés de comando 3D da sala do vidro (hl3r10d). O Gordon entra pela
// porta lateral, atravessa a sala até a Alyx (suspensa ao lado do console dela) e sai com ela pela porta do fundo.
// =================================================================================================
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { Eye, Hud } from "./hl3rf";
import { fadeIO } from "./hl3rx";
import { LiteCtx, SfxCtx } from "./sfx-ctx";
import { V, kv } from "./hl3r9s";
import { Stage, Cam, projectorC } from "./hl3r10k";
import { buildDeck, Deck, IMGS, ALYX_C } from "./hl3r10d";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const VIO = "#c79bff";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => (p[k] as number | undefined) ?? 1e9;
const ats = (p: PR, ks: string[]) => ks.map((k) => at(p, k));
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const hudEye = (c: Cam): Eye => ({ x: c.pos[0], y: -c.pos[2], z: c.pos[1], yaw: Math.atan2(c.tgt[0] - c.pos[0], -(c.tgt[2] - c.pos[2])), pitch: 0, F: 1000 });

const placeGun = (W: Deck, camera: THREE.Camera, on: boolean, kick = 0) => {
  W.gg.visible = on;
  if (!on) return;
  const off = new THREE.Vector3(0.21, -0.19 + kick * 0.02, -0.42 + kick * 0.04).applyQuaternion(camera.quaternion);
  W.gg.position.copy(camera.position).add(off);
  W.gg.quaternion.copy(camera.quaternion);
  // garras abrem no disparo; leve balanço
  const cl = W.gg.getObjectByName("claws")!;
  cl.scale.setScalar(1 + kick * 0.25);
  W.gg.rotateX(-0.04 - kick * 0.12);
  W.gg.rotateY(0.06);
};
const beamTo = (W: Deck, a: THREE.Vector3, b: THREE.Vector3, o: number, f: number) => {
  W.beam.visible = o > 0.01;
  if (!W.beam.visible) return;
  W.beam.position.copy(a.clone().add(b).multiplyScalar(0.5));
  W.beam.scale.set(1 + 0.5 * rnd(f), a.distanceTo(b), 1);
  W.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  W.beamM.opacity = o;
};
const gunTip = (camera: THREE.Camera) => camera.position.clone().add(new THREE.Vector3(0.21, -0.18, -0.8).applyQuaternion(camera.quaternion));
const ALYX_F: V = [ALYX_C[0] + 1.1, 0, ALYX_C[2] + 0.7]; // onde ela fica suspensa (ao lado do console)
const ADV_F: V = [1.6, 3.2, -7.6]; // o Advisor que a segura (na luta/mão)
const ADV2_F: V = [0.6, 3.4, -11.2];
const SPOTS: V[] = [[-5.5, 0, -12.8], [5.0, 0, -12.9], [-2.0, 0, -14.4]];

// ------------------------------------------------------------------------------------------------ 1:11:29 a luta
export const HL10Fight3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [cmdAt, enemAt, advAt, notScrAt, fightAt, ripAt, pinAt, throwAt, coverAt, ggAt, backAt, ctrlAt] = ats(p, ["cmdAt", "enemAt", "advAt", "notScrAt", "fightAt", "ripAt", "pinAt", "throwAt", "coverAt", "ggAt", "backAt", "ctrlAt"]);
  const pinned = f >= pinAt && f < throwAt + 20;
  const sh = pinned ? 0.03 : f >= fightAt ? 0.008 : 0;
  const j = (i: number) => (sh ? (rnd(f * 3 + i) - 0.5) * sh : 0);
  const base = kv(f, [[0, [11.2, 1.65, -7.8]], [cmdAt, [10.4, 1.65, -7.8]], [fightAt, [7.8, 1.65, -8.0]], [pinAt - 4, [7.9, 1.65, -9.2]], [pinAt + 6, [8.45, 1.75, -9.6]], [throwAt + 20, [8.45, 1.75, -9.6]], [ggAt, [7.4, 1.65, -8.4]], [life, [5.6, 1.65, -7.2]]]);
  const look = kv(f, [[0, [4, 1.6, -8]], [enemAt, [0, 1.6, -11]], [advAt, [ADV2_F[0], 2.8, ADV2_F[2]]], [ripAt, [8.6, 2.4, -12.4]], [pinAt, [2, 2.6, -10]], [coverAt, [6.3, 1.0, -5.6]], [ggAt + 6, [5, 1.4, -9]], [backAt, [ADV2_F[0], 3, ADV2_F[2]]], [ctrlAt, [ADV2_F[0], 3, ADV2_F[2]]], [life, [ALYX_F[0], 1.6, ALYX_F[2]]]]);
  const cam: Cam = { pos: [base[0] + j(1), base[1] + j(2), base[2] + j(3)], tgt: look, fov: 60, roll: pinned ? -0.08 : 0 };
  const lifted = P(f, ripAt, 24);
  const thrown = P(f, throwAt, 16);
  const coverGone = P(f, coverAt, 22);
  const grab = P(f, ggAt + 6, 12);
  const back = P(f, backAt, 18);
  const lose = f >= ctrlAt;
  const update = (W: Deck, camera: THREE.Camera) => {
    W.screens.forEach((s, i) => s.draw(f + i * 7, f >= fightAt));
    W.holo.rotation.y = f / 50;
    W.alarm.intensity = f >= cmdAt ? 70 + 50 * Math.sin(f / 4) : 0;
    (W.ff.material as THREE.MeshBasicMaterial).opacity = 0.22 * (1 - P(f, cmdAt - 10, 10));
    // a Alyx suspensa ao fundo, presa pelo Advisor
    W.alyx.g.position.set(ALYX_F[0], 1.0, ALYX_F[2]);
    W.alyx.setSub("SUSPENSA NO AR");
    W.alyx.face(camera, 1);
    W.tk.position.set(ALYX_F[0], 2.0, ALYX_F[2]);
    W.tk.children.forEach((r, i) => (r.position.y = -0.8 + ((f / 20 + i / 3) % 1) * 1.6));
    W.tkM.opacity = 0.75;
    W.adv.g.position.set(ADV_F[0], ADV_F[1] + 0.08 * Math.sin(f / 20), ADV_F[2]);
    W.adv.g.rotation.set(0.15, Math.atan2(ALYX_F[0] - ADV_F[0], ALYX_F[2] - ADV_F[2]), 0);
    W.adv.glow.intensity = 14;
    // o segundo Advisor: chega e luta; perde o controle no fim
    W.adv2.g.visible = f >= advAt;
    const fl = lose ? Math.sin(f * 1.7) * 0.15 : 0;
    W.adv2.g.position.set(ADV2_F[0] + fl, ADV2_F[1] + 0.12 * Math.sin(f / 15) - (lose ? 0.6 * P(f, ctrlAt, 20) : 0), ADV2_F[2]);
    W.adv2.g.rotation.set(0.2 + fl, Math.atan2(camera.position.x - ADV2_F[0], camera.position.z - ADV2_F[2]), lose ? 0.3 * P(f, ctrlAt, 20) : 0);
    W.adv2.glow.intensity = f >= fightAt ? (lose && Math.floor(f / 3) % 2 ? 2 : 20) : 6;
    W.adv2.arms.forEach((a, i) => (a.rotation.x = (f >= fightAt ? 0.5 : 0.15) * Math.sin(f / 9 + i)));
    // soldados e o hunter atrás das barreiras
    W.sold.forEach((t, i) => {
      t.g.visible = f >= enemAt + i * 4;
      t.g.position.set(...SPOTS[i]);
      t.setSub(f >= fightAt ? "ATIRANDO" : "OTA · 0" + (i + 4));
      t.face(camera, P(f, enemAt + i * 4, 8));
    });
    W.extra.forEach((t, i) => {
      t.g.visible = i === 2 && f >= enemAt + 14;
      t.g.position.set(-3.6, 0, -9.6);
      t.face(camera, P(f, enemAt + 14, 8));
    });
    // o painel arrancado da parede → voa → bate perto do Gordon (prende contra a parede)
    const hit = P(f, pinAt - 6, 8);
    W.panel.position.set(8.75 - lifted * 2.4 + hit * 1.6, 2.4 + lifted * 1.0 - hit * 0.8, -12.4 + hit * 2.4);
    W.panel.rotation.set(lifted * 0.6, Math.PI / 2 + lifted * 1.2, lifted * 0.4);
    // os caixotes: um é atirado no Gordon; a cobertura da frente é arrancada; o último volta pela Gravity Gun
    const c0 = W.crates[0], c1 = W.crates[1], c3 = W.crates[3];
    c0.position.set(6.3 - coverGone * 3.0, coverGone * 3.4, -5.6 - coverGone * 3);
    c0.rotation.set(coverGone * 2, coverGone * 1.4, 0);
    c1.position.set(5.2 + thrown * 2.2, Math.sin(thrown * Math.PI) * 1.6 + thrown * 0.6, -10.6 + thrown * 1.0);
    c1.rotation.set(thrown * 3, thrown * 2, 0);
    const held = new THREE.Vector3(3.6, 0, -12.4).lerp(gunTip(camera), grab * (1 - back) * 0.55);
    const outV = new THREE.Vector3(ADV2_F[0], ADV2_F[1] - 0.4, ADV2_F[2]);
    const cpos = back > 0 ? held.clone().lerp(outV, back) : held;
    c3.position.copy(cpos);
    c3.rotation.set(grab * 0.4 + back * 3, back * 2, 0);
    placeGun(W, camera, f >= ggAt, f >= backAt && f < backAt + 6 ? 1 : 0);
    beamTo(W, gunTip(camera), cpos.clone().add(new THREE.Vector3(0, 0.45, 0)), f >= ggAt && f < backAt + 8 ? 0.55 + 0.2 * Math.sin(f) : 0, f);
    W.gman.visible = false;
  };
  const pr = projectorC(cam);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} gl={{ antialias: true }} camera={{ fov: 60, position: [0, 2, 2], near: 0.05, far: 600 }}>
          <Stage build={buildDeck} update={update} cam={cam} imgs={IMGS} />
        </ThreeCanvas>
      )}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* tiros dos soldados: traçantes curtos vindo na direção do Gordon */}
        {f >= fightAt
          ? SPOTS.map((s, i) => {
              if ((f + i * 5) % 14 > 3) return null;
              const a = pr([s[0], 1.35, s[2]]);
              const b = pr([cam.pos[0] - 0.6 + i * 0.5, 1.5, cam.pos[2] - 1.2]);
              return a && b ? <line key={i} x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * 0.35} y2={a.y + (b.y - a.y) * 0.35} stroke="rgba(120,220,255,0.9)" strokeWidth={3} /> : null;
            })
          : null}
      </svg>
      {f >= cmdAt ? (
        <div style={{ position: "absolute", left: 90, top: 110, width: 560, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, cmdAt, 8) * (1 - P(f, fightAt + 30, 12)) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>H.E.V. · OBJETIVO</div>
          <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 6 }}>ABRIR CAMINHO ATÉ A ALYX</div>
          {f >= notScrAt ? (
            <div style={{ position: "relative", fontSize: 18, letterSpacing: 3, color: "rgba(242,240,247,0.6)", marginTop: 10, opacity: P(f, notScrAt, 8) }}>
              SEQUÊNCIA ROTEIRIZADA
              <div style={{ position: "absolute", left: -4, right: 200, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, notScrAt + 6, 8)})`, transformOrigin: "left" }} />
            </div>
          ) : null}
          {f >= notScrAt + 14 ? <div style={{ fontSize: 18, letterSpacing: 3, color: VIO, marginTop: 6, opacity: P(f, notScrAt + 14, 8) }}>OS ADVISORS LUTAM DE VERDADE</div> : null}
        </div>
      ) : null}
      {pinned ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(120,60,200,0.45) 100%)", pointerEvents: "none" }} /> : null}
      <Hud f={f} yaw={hudEye(cam).yaw} eye={hudEye(cam)} blips={[{ x: ADV2_F[0], y: -ADV2_F[2], hot: true }, { x: ALYX_F[0], y: -ALYX_F[2] }]} msg={f < cmdAt ? "UMA DAS PARTES JOGÁVEIS MAIS IMPORTANTES" : pinned ? "PRESO CONTRA A PAREDE" : f >= ripAt && f < pinAt ? "ARRANCAM PARTE DO CENÁRIO" : f >= coverAt && f < ggAt ? "DESMONTAM A COBERTURA" : f >= ggAt && f < backAt + 20 ? "GRAVITY GUN · DEVOLVER OS DESTROÇOS" : lose ? "PERDE O CONTROLE · O MOMENTO DE ATACAR" : undefined} msgCol={pinned ? VIO : AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ 1:12:02 a mão
export const HL10Hand3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [downAt, fallAt, handAt, lookAt, acceptAt, noSorryAt, minAt, knowAt, endAt, gunAt, runAt, sideAt] = ats(p, ["downAt", "fallAt", "handAt", "lookAt", "acceptAt", "noSorryAt", "minAt", "knowAt", "endAt", "gunAt", "runAt", "sideAt"]);
  const run = P(f, runAt, 14);
  const lifted = 1 - IO((f - fallAt) / 12);
  const advDown = IO((f - downAt) / 26);
  // câmera: perto dela; olha para baixo na mão; depois corre para a porta do fundo (à esquerda) com ela ao lado
  const runPos = kv(f, [[runAt, [4.6, 1.65, -6.0]], [runAt + 45, [-3.6, 1.65, -12.6]], [runAt + 80, [-6.0, 1.65, -15.4]], [life, [-6.0, 1.65, -21.5]]]);
  const bob = run > 0 ? Math.abs(Math.sin(f / 4)) * 0.05 : 0;
  const pos: V = f < runAt ? kv(f, [[0, [5.6, 1.65, -7.2]], [handAt, [4.7, 1.65, -5.6]]]) : [runPos[0], runPos[1] + bob, runPos[2]];
  const tgt: V =
    f < runAt
      ? kv(f, [[0, [ADV_F[0], 2.6, ADV_F[2]]], [downAt + 10, [ADV_F[0], 1.4, ADV_F[2]]], [fallAt, [ALYX_F[0], 1.1, ALYX_F[2]]], [acceptAt + 10, [ALYX_F[0], 1.4, ALYX_F[2]]]])
      : kv(f, [[runAt, [ALYX_F[0] - 2, 1.5, ALYX_F[2] - 3]], [runAt + 30, [-6, 1.5, -16]], [runAt + 80, [-6, 1.5, -30]], [life, [-6, 1.5, -32]]]);
  const cam: Cam = { pos, tgt, fov: 60 };
  const alyxPos: V =
    f < runAt
      ? [ALYX_F[0], 1.0 * lifted, ALYX_F[2]]
      : (() => {
          const fw = new THREE.Vector3(tgt[0] - pos[0], 0, tgt[2] - pos[2]).normalize();
          const left = new THREE.Vector3(fw.z, 0, -fw.x);
          return [pos[0] + fw.x * 3.2 + left.x * 0.6, 0, pos[2] + fw.z * 3.2 + left.z * 0.6] as V;
        })();
  const update = (W: Deck, camera: THREE.Camera) => {
    W.screens.forEach((s, i) => s.draw(f + i * 7, true));
    W.holo.rotation.y = f / 50;
    W.alarm.intensity = 60 + 40 * Math.sin(f / 4);
    (W.ff.material as THREE.MeshBasicMaterial).opacity = 0;
    W.adv2.g.visible = false;
    // o Advisor que a segura cai com o golpe da Gravity Gun
    W.adv.g.position.set(ADV_F[0] - advDown * 1.4, ADV_F[1] - advDown * 2.6 + 0.08 * Math.sin(f / 20) * (1 - advDown), ADV_F[2] - advDown * 1.8);
    W.adv.g.rotation.set(0.15 + advDown * 1.1, Math.atan2(ALYX_F[0] - ADV_F[0], ALYX_F[2] - ADV_F[2]) + advDown * 0.8, advDown * 0.9);
    W.adv.glow.intensity = 14 * (1 - advDown);
    const sk = W.shock.material as THREE.MeshBasicMaterial;
    const g2 = f - downAt;
    sk.opacity = g2 >= 0 && g2 < 18 ? 1 - g2 / 18 : 0;
    W.shock.position.set(...ADV_F);
    W.shock.scale.setScalar(0.5 + Math.max(0, g2) * 0.2);
    W.shock.lookAt(camera.position);
    W.alyx.g.position.set(...alyxPos);
    W.alyx.setSub(f >= sideAt ? "LADO A LADO" : f >= gunAt ? "ARMADA" : f >= acceptAt ? "ACEITA A MÃO" : f >= lookAt ? "OLHA PARA A MÃO" : lifted > 0.5 ? "SUSPENSA NO AR" : "CAIU");
    W.alyx.face(camera, 1);
    W.tk.position.set(ALYX_F[0], 2.0 * lifted, ALYX_F[2]);
    W.tkM.opacity = 0.75 * lifted;
    W.sold.forEach((t) => (t.g.visible = false));
    W.extra.forEach((t) => (t.g.visible = false));
    placeGun(W, camera, true, f >= downAt && f < downAt + 6 ? 1 : 0);
    beamTo(W, gunTip(camera), new THREE.Vector3(...ADV_F), f >= downAt - 2 && f < downAt + 4 ? 1 : 0, f);
    W.gman.visible = false;
  };
  const secs = Math.max(0, 300 - Math.floor((f - minAt) / 30));
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} gl={{ antialias: true }} camera={{ fov: 60, position: [0, 2, 2], near: 0.05, far: 600 }}>
          <Stage build={buildDeck} update={update} cam={cam} imgs={IMGS} />
        </ThreeCanvas>
      )}
      {f >= handAt && f < noSorryAt + 10 ? (
        <div style={{ position: "absolute", left: "50%", top: 700, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 14, padding: "12px 22px", background: "rgba(10,8,2,0.8)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, opacity: P(f, handAt, 8) * (1 - P(f, noSorryAt, 10)) }}>
          <span style={{ padding: "2px 10px", border: `1.5px solid ${AMB}`, borderRadius: 6, fontSize: 24, background: f >= acceptAt ? AMB : "transparent", color: f >= acceptAt ? "#0a0806" : AMB }}>E</span>
          <span style={{ fontSize: 24, letterSpacing: 3 }}>{f >= acceptAt ? "ELA ACEITA A MÃO" : "ESTENDER A MÃO"}</span>
        </div>
      ) : null}
      {f >= noSorryAt && f < runAt + 30 ? (
        <div style={{ position: "absolute", left: 110, top: 150, width: 520, fontFamily: MONO, opacity: P(f, noSorryAt, 8) * (1 - P(f, runAt + 10, 12)) }}>
          {["PEDIR DESCULPAS", "EXPLICAR TUDO"].map((t2, i) => (
            <div key={t2} style={{ position: "relative", marginTop: i ? 10 : 0, padding: "10px 14px", background: "rgba(8,8,10,0.8)", borderLeft: `3px solid ${RED}`, fontSize: 22, letterSpacing: 3, color: "rgba(242,240,247,0.7)" }}>
              {t2}
              <span style={{ position: "absolute", left: 10, right: 10, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, noSorryAt + 6 + i * 6, 8)})`, transformOrigin: "left" }} />
            </div>
          ))}
        </div>
      ) : null}
      {f >= minAt ? (
        <div style={{ position: "absolute", right: 110, top: 140, width: 520, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,4,0.86)", border: `1.5px solid ${RED}`, fontFamily: MONO, opacity: P(f, minAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: RED }}>POUCOS MINUTOS</div>
          <div style={{ fontSize: 48, letterSpacing: 4, color: TXT, marginTop: 4 }}>{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</div>
          {f >= knowAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: VIO, marginTop: 8, opacity: P(f, knowAt, 8) }}>OS ADVISORS SABEM</div> : null}
          {f >= endAt ? <div style={{ fontSize: 18, letterSpacing: 2, color: CREAM, marginTop: 6, opacity: P(f, endAt, 8) }}>SE TERMINAREM SOZINHOS · TUDO ACABA ANTES DO NÚCLEO</div> : null}
        </div>
      ) : null}
      {f >= sideAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: CREAM, opacity: P(f, sideAt, 10) }}>PELA PRIMEIRA VEZ DESDE O GRANDE SALTO · LADO A LADO</div> : null}
      <Hud f={f} yaw={hudEye(cam).yaw} eye={hudEye(cam)} blips={[{ x: alyxPos[0], y: -alyxPos[2] }]} msg={f >= runAt && f < sideAt ? "PARA O NÚCLEO" : f >= downAt && f < fallAt + 10 ? "GORDON DERRUBA O ADVISOR" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
