// HL3 · 1:50:28 o mundo dos Vortigaunts — motion graphic (12/10)
// Pedido dele: o 3D do planeta e os Vortigaunts (silhueta, modelo do jogo) foram reprovados; arte conceitual também.
// Proposta: o que o Gordon vê é o que o HEV lê ao acordar. Um holograma de relevo (linhas de varredura, no estilo das
// curvas de nível aprovadas da larva) com a câmera deslizando sobre ele; os Vortigaunts são marcadores que ANDAM livres
// pelo relevo, revelados pela varredura (nada surge do nada); a roça e a roda de conversa marcadas no chão; um vem até o
// Gordon e o HEV registra o alimento; o velho na crista; a névoa no horizonte apaga as linhas (sem dados além dali); os
// dois finais como dois globos de linhas; o HEV desliga.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { Kin } from "./hl3r9";
import * as THREE from "three";
import { useHla, HlaActor } from "./strider3d";
import { drawGL } from "./xgl";

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const TEAL = "#5ff3d0";
const AMB = "#ffb22e";
const GREEN = "#8dffa8";
const RED = "#ff5d4d";

// o relevo: colinas suaves, um vale na frente, a crista do velho lá na frente (z ≈ 72)
const H = (x: number, z: number) =>
  1.6 * Math.sin(x * 0.11 + 0.7) * Math.cos(z * 0.07) +
  0.9 * Math.sin(x * 0.27 + z * 0.13) +
  0.45 * Math.sin(x * 0.61 - z * 0.37) +
  5.5 * Math.exp(-((x - 2) ** 2) / 260 - ((z - 74) ** 2) / 90) + // a crista do velho
  Math.max(0, (Math.abs(x) - 30) * 0.22); // as bordas sobem

// os Vortigaunts: cada um anda num laço próprio (devagar), alguns parados trabalhando
type Ag = { cx: number; cz: number; rx: number; rz: number; sp: number; ph: number; tag?: string; still?: boolean };
const AG: Ag[] = [
  { cx: -11, cz: 34, rx: 0.8, rz: 1.2, sp: 0.004, ph: 0, tag: "CULTIVANDO", still: true },
  { cx: -8, cz: 39, rx: 0.9, rz: 1.0, sp: 0.005, ph: 2 },
  { cx: -13.5, cz: 41, rx: 0.6, rz: 0.7, sp: 0.004, ph: 4 },
  { cx: 9.4, cz: 44, rx: 0.15, rz: 0.15, sp: 0.01, ph: 1, tag: "CONVERSANDO", still: true },
  { cx: 11.2, cz: 44.6, rx: 0.15, rz: 0.15, sp: 0.01, ph: 3, still: true },
  { cx: -2, cz: 52, rx: 7, rz: 3, sp: 0.0035, ph: 0.5 },
  { cx: 16, cz: 58, rx: 6, rz: 5, sp: 0.003, ph: 2.2 },
  { cx: -18, cz: 60, rx: 5, rz: 6, sp: 0.0032, ph: 4.1 },
  { cx: 6, cz: 30, rx: 9, rz: 4, sp: 0.004, ph: 5.3 },
  { cx: -24, cz: 48, rx: 4, rz: 7, sp: 0.003, ph: 1.7 },
  { cx: 22, cz: 36, rx: 3, rz: 5, sp: 0.0045, ph: 3.3 },
];
const agPos = (a: Ag, f: number): [number, number] => {
  const t = f * a.sp * Math.PI * 2 + a.ph;
  return [a.cx + Math.cos(t) * a.rx, a.cz + Math.sin(t * (a.still ? 1 : 0.8)) * a.rz];
};
const OLD: [number, number] = [2.2, 73];

export const HL14VortScan: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [noAt, workAt, nobodyAt, foodAt, playAt, oldAt, sitAt, mistAt, nobodySawAt, vortAt, diffAt, f1At, f2At, darkAt, notGmanAt, futureAt] = [
    "noAt", "workAt", "nobodyAt", "foodAt", "playAt", "oldAt", "sitAt", "mistAt", "nobodySawAt", "vortAt", "diffAt", "f1At", "f2At", "darkAt", "notGmanAt", "futureAt",
  ].map((k) => at(p, k));
  // a câmera (o Gordon): acorda baixo e sobe, anda devagar pelo vale, sobe a crista até o velho e senta
  const camZ = interpolate(f, [0, playAt, oldAt, sitAt, life], [0, 6, 14, 60, 62], { ...C, easing: Easing.inOut(Easing.sin) });
  const camX = interpolate(f, [0, workAt, nobodyAt, foodAt, sitAt], [0, -3, 3, 0, 1.0], { ...C, easing: Easing.inOut(Easing.sin) });
  const camY = H(camX, camZ) + interpolate(f, [0, 40, sitAt, sitAt + 40], [0.6, 2.4, 2.4, 1.4], C);
  const yaw = interpolate(f, [0, workAt, nobodyAt, foodAt, oldAt, sitAt], [0, -0.32, 0.3, 0.05, 0, 0], { ...C, easing: Easing.inOut(Easing.sin) });
  const pitch = interpolate(f, [0, 40, sitAt, mistAt + 40], [0.18, 0.05, 0.05, -0.02], C);
  const F = 980;
  const HY = 470;
  const pr = (x: number, y: number, z: number) => {
    const dx = x - camX, dz = z - camZ;
    const rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    const rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    if (rz < 0.6) return null;
    return { x: 960 + (rx * F) / rz, y: HY + pitch * F - ((y - camY) * F) / rz, d: rz };
  };
  // 13/10 (pedido dele: setinhas genéricas → Vortigaunts em wireframe): o Vortigaunt do jogo desenhado em linhas de luz
  // na mesma malha, cada um com o gesto dele
  const VV = useHla("vort_hla.glb", 14, 1.95, { g: "vort_substation_2019_vort_catwalk" });
  const wireM = React.useMemo(() => new THREE.MeshBasicMaterial({ color: "#8dffa8", wireframe: true, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const amberM = React.useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffb22e", wireframe: true, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const creamM = React.useMemo(() => new THREE.MeshBasicMaterial({ color: "#f2e6c8", wireframe: true, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  React.useMemo(() => VV.forEach((A, i) => A.root.traverse((o2) => { const m = o2 as THREE.Mesh; if (m.isMesh) m.material = i === 12 ? amberM : i === 13 ? creamM : wireM; })), [VV, wireM, amberM, creamM]);
  const vRef = React.useRef<HTMLCanvasElement>(null);
  const wake = P(f, 0, 30);
  const mist = P(f, mistAt, 150);
  const dark = P(f, darkAt, 30);
  const scanR = interpolate(f, [workAt - 30, workAt + 120], [0, 90], C); // a varredura que revela
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    g.clearRect(0, 0, 1920, 1080);
    // as linhas do relevo, do fundo para a frente (cada uma tapa o que está atrás)
    const z0 = Math.floor(camZ) + 140;
    for (let zz = z0; zz > camZ + 1; zz -= zz - camZ > 40 ? 2 : 1) {
      const pts: { x: number; y: number }[] = [];
      for (let x = camX - 70; x <= camX + 70; x += 1.2) {
        let h = H(x, zz);
        const far = zz - camZ;
        // a névoa: as linhas longe viram ruído e somem
        const mz = far > 70 - mist * 25 ? Math.min(1, (far - (70 - mist * 25)) / 20) * P(f, mistAt - 20, 40) : 0;
        if (mz > 0) h += (rnd(Math.floor(x * 3) + zz * 7 + Math.floor(f / 2)) - 0.5) * mz * 1.5;
        const q = pr(x, h, zz);
        if (q) pts.push(q);
      }
      if (pts.length < 2) continue;
      const far = zz - camZ;
      const fade = Math.max(0, 1 - far / 140);
      const mz = far > 70 - mist * 25 ? Math.min(1, (far - (70 - mist * 25)) / 20) * mist : 0;
      g.beginPath();
      g.moveTo(pts[0].x, 1080);
      pts.forEach((q) => g.lineTo(q.x, q.y));
      g.lineTo(pts[pts.length - 1].x, 1080);
      g.closePath();
      g.fillStyle = "#020807";
      g.fill();
      g.beginPath();
      pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
      const a = (0.15 + 0.75 * fade * fade) * (1 - mz) * wake;
      g.strokeStyle = `rgba(95,243,208,${a})`;
      g.lineWidth = far < 12 ? 1.6 : 1.1;
      g.stroke();
    }
    // a roça: canteiros de luz sobre o relevo (âmbar e verde), na esquerda do vale
    for (let r = 0; r < 6; r++)
      for (let k = 0; k < 9; k++) {
        const x = -14 + r * 1.3, z = 32 + k * 1.2;
        const q = pr(x, H(x, z) + 0.05, z);
        if (!q) continue;
        const grow = P(f, workAt + r * 4 + k * 2, 30);
        g.fillStyle = `rgba(${(r + k) % 2 ? "141,255,168" : "255,210,120"},${0.85 * grow * wake})`;
        const s = Math.max(1.5, 260 / q.d) * (0.6 + 0.4 * grow);
        g.beginPath();
        g.arc(q.x, q.y - s * 0.5, s * 0.5, 0, Math.PI * 2);
        g.fill();
      }
    // os Vortigaunts: rastro curto (andam de verdade) e o ponto no chão
    AG.forEach((a, i) => {
      const [x, z] = agPos(a, f);
      const d = Math.hypot(x - camX, z - camZ);
      const seen = Math.min(1, Math.max(0, (scanR - d) / 6));
      if (seen <= 0) return;
      g.beginPath();
      for (let k = 0; k < 40; k += 2) {
        const [tx, tz] = agPos(a, f - k * 3);
        const q = pr(tx, H(tx, tz) + 0.05, tz);
        if (!q) continue;
        k ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y);
      }
      g.strokeStyle = `rgba(141,255,168,${0.35 * seen})`;
      g.lineWidth = 1.5;
      g.stroke();
      void i;
    });
    // o horizonte que se abre: luz sem linhas (ninguém viu o que vem depois)
    if (mist > 0) {
      // atrás da crista, na linha do horizonte
      const q = pr(OLD[0], H(OLD[0], OLD[1]) + 4, OLD[1] + 90);
      const y = q ? q.y : HY - 120;
      const gr = g.createRadialGradient(960, y, 10, 960, y, 760);
      gr.addColorStop(0, `rgba(240,255,248,${0.7 * mist})`);
      gr.addColorStop(0.4, `rgba(180,255,230,${0.25 * mist})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 1920, 1080);
    }
  });
  const foodK0 = P(f, foodAt - 20, 60) * (1 - P(f, foodAt + 110, 70));
  const foodPos0: [number, number] = [camX + 1.4 + (1 - foodK0) * 8 + P(f, foodAt + 110, 70) * 9, camZ + 4.5 + (1 - foodK0) * 14];
  React.useLayoutEffect(() => {
    const cv = vRef.current;
    if (!cv || VV.length < 14) return;
    const roots: THREE.Object3D[] = [];
    const place = (A: HlaActor, x: number, z: number, face: number, t: number, show: number) => {
      if (show <= 0.02) return;
      A.root.position.set(x, H(x, z), -z);
      A.root.rotation.y = face;
      A.set("g", t);
      A.root.updateMatrixWorld(true);
      roots.push(A.root);
    };
    AG.forEach((a, i) => {
      if (i >= 12) return;
      const [x, z] = agPos(a, f);
      const [x2, z2] = agPos(a, f + 6);
      const seen = Math.min(1, Math.max(0, (scanR - Math.hypot(x - camX, z - camZ)) / 6)) * (1 - dark);
      const face = a.still ? Math.atan2(camX - x, -(camZ - z)) + (i % 2 ? 0.6 : -0.6) : Math.atan2(x2 - x, -(z2 - z));
      place(VV[i], x, z, face, 4 + i * 4.3 + f / 30, seen);
    });
    if (foodK0 > 0) place(VV[12], foodPos0[0], foodPos0[1], Math.atan2(camX - foodPos0[0], -(camZ - foodPos0[1])), 20 + f / 30, foodK0);
    if (f >= oldAt - 10) place(VV[13], OLD[0], OLD[1], Math.atan2(camX - OLD[0], -(camZ - OLD[1])) + 0.4, 2.2, 1 - dark);
    drawGL(cv, { x: camX, y: camZ, z: camY, yaw, pitch: 0, F }, [], null, roots, []);
  });
  // marcadores (SVG por cima): Vortigaunts, o que traz comida, o velho
  const marker = (x: number, z: number, label: string | null, sub: string | null, o: number, col = GREEN, key = "") => {
    const b = pr(x, H(x, z), z), t = pr(x, H(x, z) + 2.15, z);
    if (!b || !t || o <= 0) return null;
    const s = Math.max(0.5, Math.min(1.6, 14 / b.d));
    return (
      <g key={key || label || `${x}`} opacity={o}>
        <ellipse cx={b.x} cy={b.y} rx={14 * s} ry={4 * s} fill="none" stroke={col} strokeWidth={1.4} />
        {label ? <line x1={t.x} y1={t.y - 4} x2={t.x + 10 * s} y2={t.y - 4} stroke={col} strokeWidth={1.2} /> : null}
        {label ? (
          <text x={t.x + 12 * s} y={t.y - 2} fill={col} fontFamily={MONO} fontSize={Math.max(11, 15 * s)} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>
            {label}
          </text>
        ) : null}
        {sub ? (
          <text x={t.x + 12 * s} y={t.y + 16 * s} fill="#e8fff4" fontFamily={MONO} fontSize={Math.max(10, 12 * s)} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>
            {sub}
          </text>
        ) : null}
      </g>
    );
  };
  const foodK = P(f, foodAt - 20, 60) * (1 - P(f, foodAt + 110, 70));
  const foodPos: [number, number] = [camX + 1.4 + (1 - foodK) * 8 + P(f, foodAt + 110, 70) * 9, camZ + 4.5 + (1 - foodK) * 14];
  const oldO = P(f, oldAt - 10, 20) * (1 - dark);
  const globe = (cx: number, cy: number, R: number, col: string, k: number, dust: number, key: string) => {
    const lines: React.ReactNode[] = [];
    const rot = f / 90;
    for (let i = 1; i < 6; i++) {
      const la = (i / 6) * Math.PI - Math.PI / 2;
      lines.push(<ellipse key={`la${i}`} cx={cx} cy={cy + Math.sin(la) * R} rx={Math.cos(la) * R} ry={Math.cos(la) * R * 0.18} fill="none" stroke={col} strokeWidth={1.2} opacity={0.7 * (1 - dust)} />);
    }
    for (let i = 0; i < 6; i++) {
      const lo = rot + (i / 6) * Math.PI;
      lines.push(<ellipse key={`lo${i}`} cx={cx} cy={cy} rx={Math.abs(Math.cos(lo)) * R} ry={R} fill="none" stroke={col} strokeWidth={1.2} opacity={0.7 * (1 - dust)} />);
    }
    const pts = dust > 0 ? Array.from({ length: 90 }).map((_, i) => {
      const a = rnd(i) * Math.PI * 2, r = R * Math.sqrt(rnd(i + 7));
      const out = dust * (40 + 160 * rnd(i * 3));
      return <circle key={`d${i}`} cx={cx + Math.cos(a) * (r + out)} cy={cy + Math.sin(a) * (r + out)} r={1.6} fill={col} opacity={(1 - dust) * 0.9 + 0.1} />;
    }) : null;
    return (
      <g key={key} opacity={k}>
        <circle cx={cx} cy={cy} r={R} fill="rgba(4,14,12,0.6)" stroke={col} strokeWidth={2} opacity={1 - dust * 0.8} />
        {lines}
        {pts}
      </g>
    );
  };
  const fin = P(f, diffAt, 20) * (1 - P(f, darkAt, 20));
  const wrong = P(f, f1At + 60, 30);
  const lost = P(f, f2At + 10, 80);
  const crt = interpolate(f, [darkAt, darkAt + 14], [1, 0.004], C);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scaleY(${f >= darkAt ? crt : 1})`, opacity: f >= darkAt + 14 ? 1 - P(f, darkAt + 14, 10) : 1 }}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #06231d 0%, #020807 70%)" }} />
        <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0 }} />
        <canvas ref={vRef} width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateY(${HY + pitch * F - 540}px)`, filter: "drop-shadow(0 0 3px rgba(141,255,168,0.6))" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* a varredura que revela o vale */}
          {f >= workAt - 30 && f < workAt + 140 ? (() => {
            const q = pr(camX, H(camX, camZ + 2), camZ + 2);
            return q ? <ellipse cx={960} cy={q.y + 40} rx={scanR * 24} ry={scanR * 5} fill="none" stroke={TEAL} strokeWidth={2} opacity={0.5 * (1 - P(f, workAt + 110, 30))} /> : null;
          })() : null}
          {AG.map((a, i) => {
            const [x, z] = agPos(a, f);
            const seen = Math.min(1, Math.max(0, (scanR - Math.hypot(x - camX, z - camZ)) / 6));
            const tagOn = a.tag && ((a.tag === "CULTIVANDO" && f >= workAt + 20 && f < oldAt) || (a.tag === "CONVERSANDO" && f >= nobodyAt && f < oldAt));
            return marker(x, z, tagOn ? "VORTIGAUNT" : null, tagOn ? a.tag! : null, seen * (1 - dark), GREEN, `ag${i}`);
          })}
          {/* a conversa: ondas que vão de um para o outro */}
          {f >= nobodyAt && f < oldAt ? [0, 1, 2].map((k) => {
            const [x1, z1] = agPos(AG[3], f), [x2, z2] = agPos(AG[4], f);
            const t = ((f / 24 + k / 3) % 1);
            const q = pr(x1 + (x2 - x1) * t, H(x1, z1) + 1.6, z1 + (z2 - z1) * t);
            return q ? <circle key={`cw${k}`} cx={q.x} cy={q.y} r={4 + 8 * Math.sin(t * Math.PI)} fill="none" stroke={GREEN} strokeWidth={1.4} opacity={Math.sin(t * Math.PI) * 0.8} /> : null;
          }) : null}
          {/* o que traz comida */}
          {foodK > 0 ? marker(foodPos[0], foodPos[1], "VORTIGAUNT", f >= foodAt + 60 ? "E CONTINUA ANDANDO" : "OFERECE COMIDA", foodK, AMB, "food") : null}
          {/* o velho na crista */}
          {marker(OLD[0], OLD[1], "O VORTIGAUNT VELHO", f >= vortAt ? "NÃO SABE SE FOI UMA VITÓRIA" : f >= sitAt ? "OLHANDO O CÉU" : null, oldO, "#f2e6c8", "old")}
          {/* o Gordon senta ao lado */}
          {f >= sitAt ? marker(OLD[0] - 1.6, OLD[1] - 0.6, "GORDON", null, P(f, sitAt, 20) * (1 - dark), AMB, "gordon") : null}
          {/* os dois finais no céu */}
          {fin > 0 ? (
            <>
              {globe(640, 300, 120, wrong > 0.5 ? RED : TEAL, fin * P(f, f1At - 10, 16), 0, "g1")}
              {globe(1280, 300, 120, GREEN, fin * P(f, f2At - 10, 16), lost, "g2")}
              {f >= f1At ? (
                <g opacity={P(f, f1At, 12) * fin} fontFamily={MONO}>
                  <text x={640} y={470} textAnchor="middle" fill={TEAL} fontSize={16} letterSpacing={8}>FINAL 1</text>
                  <text x={640} y={510} textAnchor="middle" fill="#f6f2ea" fontSize={34} fontWeight={700}>Salva a Terra</text>
                  {f >= f1At + 60 ? <text x={640} y={548} textAnchor="middle" fill={RED} fontSize={17} letterSpacing={3} opacity={P(f, f1At + 60, 12)}>E A CERTEZA DE QUE ESCOLHEU ERRADO</text> : null}
                </g>
              ) : null}
              {f >= f2At ? (
                <g opacity={P(f, f2At, 12) * fin} fontFamily={MONO}>
                  <text x={1280} y={470} textAnchor="middle" fill={GREEN} fontSize={16} letterSpacing={8}>FINAL 2</text>
                  <text x={1280} y={510} textAnchor="middle" fill="#f6f2ea" fontSize={34} fontWeight={700}>Perde a Terra</text>
                  {f >= f2At + 60 ? <text x={1280} y={548} textAnchor="middle" fill="#ffe2b0" fontSize={17} letterSpacing={3} opacity={P(f, f2At + 60, 12)}>E NUNCA A CONFIRMAÇÃO DE QUE ESCOLHEU CERTO</text> : null}
                </g>
              ) : null}
            </>
          ) : null}
        </svg>
        {/* o HEV acordando e lendo o lugar */}
        <div style={{ position: "absolute", left: 70, top: 70, fontFamily: MONO, color: TEAL, opacity: wake * (1 - P(f, mistAt, 20)) }}>
          <div style={{ fontSize: 14, letterSpacing: 6, opacity: 0.8 }}>H.E.V. · {f < noAt ? "REINICIANDO" : "LEITURA DO AMBIENTE"}</div>
          {([[noAt, "RUÍNAS", "0"], [noAt + 12, "COMBINE", "0"], [noAt + 24, "BOREALIS", "SEM SINAL"], [workAt + 30, "VORTIGAUNTS", String(Math.min(AG.length + 30, Math.round(P(f, workAt + 30, 90) * (AG.length + 30))))], [workAt + 40, "HOSTIS", "0"]] as [number, string, string][]).map(([t0, k, v]) =>
            f >= t0 ? (
              <div key={k} style={{ display: "flex", gap: 18, marginTop: 8, fontSize: 18, letterSpacing: 3, opacity: P(f, t0, 8) }}>
                <span style={{ width: 170, color: "rgba(220,255,245,0.7)" }}>{k}</span>
                <span style={{ color: v === "0" || v === "SEM SINAL" ? "#e8fff4" : GREEN }}>{v}</span>
              </div>
            ) : null,
          )}
        </div>
        {/* o alimento recebido (o HEV registra) */}
        {f >= foodAt + 40 && f < foodAt + 130 ? (
          <div style={{ position: "absolute", right: 90, bottom: 160, padding: "12px 18px", borderRadius: 10, background: "rgba(10,8,2,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: AMB, opacity: P(f, foodAt + 40, 8) * (1 - P(f, foodAt + 120, 10)) }}>
            + ITEM RECEBIDO · ALIMENTO
          </div>
        ) : null}
        {/* o final jogável: o HEV sem objetivo */}
        {f >= playAt && f < mistAt ? (
          <div style={{ position: "absolute", right: 90, top: 70, padding: "12px 18px", borderRadius: 10, background: "rgba(4,14,12,0.78)", border: `1.5px solid ${TEAL}`, fontFamily: MONO, color: TEAL, opacity: P(f, playAt, 10) * (1 - P(f, mistAt - 10, 10)) }}>
            <div style={{ fontSize: 13, letterSpacing: 5, opacity: 0.8 }}>H.E.V. · OBJETIVO</div>
            <div style={{ fontSize: 22, letterSpacing: 4, color: "#e8fff4", marginTop: 4 }}>—</div>
            <div style={{ fontSize: 13, letterSpacing: 3, marginTop: 4, color: GREEN }}>O FINAL AINDA É JOGÁVEL</div>
          </div>
        ) : null}
        {/* sem dados além da névoa */}
        {mist > 0.3 && f < diffAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 10, color: "#e8fff4", opacity: P(f, mistAt + 60, 20) * (1 - P(f, diffAt - 10, 10)) }}>SEM DADOS ALÉM DAQUI</div> : null}
        {f >= nobodySawAt && f < vortAt ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 300, fontSize: 40, letterSpacing: 6, color: "#eafff6" }}>
            {"PELA PRIMEIRA VEZ, NINGUÉM VIU O QUE VEM DEPOIS".split("").map((ch, k) => {
              const t = nobodySawAt + k * 0.8;
              const glow = 1 - P(f, t + 4, 22);
              return <span key={k} style={{ opacity: P(f, t, 8) * (1 - P(f, vortAt - 10, 10)), textShadow: `0 0 ${6 + 20 * glow}px rgba(140,255,210,${0.3 + 0.5 * glow}), 0 3px 14px rgba(0,0,0,0.9)` }}>{ch}</span>;
            })}
          </div>
        ) : null}
        {/* a moldura do visor */}
        <AbsoluteFill style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.85)", pointerEvents: "none" }} />
        <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, rgba(0,0,0,0) 2px 4px)", pointerEvents: "none", opacity: 0.6 }} />
      </AbsoluteFill>
      {f >= darkAt + 10 ? (
        <AbsoluteFill>
          <Kin kind="glitch" t0={notGmanAt} until={futureAt} top={430} size={46} text="não é o G-Man que vem buscar o Gordon" />
          <Kin kind="rise" t0={futureAt} top={480} size={54} col={GREEN} text="um futuro que ninguém conseguiu prever" />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
