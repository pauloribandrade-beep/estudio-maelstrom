// =================================================================================================
// HL3 · Final 2, a neve em ILUSTRAÇÃO CHAPADA (31/10/2026), no mesmo mundo do Ártico 2D (hl3r27/hl3r28):
//  · mode 0 (1:49:02) as despedidas pelo rádio: Magnusson, Kleiner, Barney → o rádio fica mudo
//  · mode 1 (1:49:30) o portal até o Eli, o abraço, o Dog, o Gordon sozinho, o céu se dobra, a luz verde
// O Gordon sempre de costas.
// =================================================================================================
import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C, HLFootage } from "./hl3";
import { FilmLook } from "./hl3r";
import { rnd, cl, eo, P, pts, Fissure, camAt, Label, K, Pt, VIO, XEN_G, SHIP_X, SHIP_Y } from "./hl3r27";
import { GordonBack, Stage, Defs, Snowfall, makeRips } from "./hl3r28";
import { AlyxSide, EliSide, DogBot } from "./hl3chars";
export { AlyxSide, EliSide, DogBot };

type PR = Record<string, number> & { life: number };
// `shots` (planos 3D do Blender): substituem o mundo 2D inteiro; do 2D só ficam o cartão do rádio e os letreiros
type Shots = React.ComponentProps<typeof HLFootage>["shots"];
const shotsOf = (p: PR) => (p as unknown as { shots?: Shots }).shots;
const World3D: React.FC<{ life: number; shots: Shots }> = ({ life, shots }) => <HLFootage life={life} shots={shots} still full revealDur={0} />;
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);

// ---------------------------------------------------------------------------------------------- personagens
// ---------------------------------------------------------------------------------------------- o rádio (cartão do HEV)
type Who = "mag" | "kle" | "bar";
// retratos 3D pintados (modelos do Ep2/HL2 no Blender, tools/hla_scene.py)
const FACE_IMG: Record<Who, string> = { mag: "magnusson", kle: "kleiner", bar: "barney" };
const RadioCard: React.FC<{ f: number; who: Who | null; amp: number; mute: number; o: number }> = ({ f, who, amp, mute, o }) => {
  if (o <= 0) return null;
  const name = who === "mag" ? "MAGNUSSON" : who === "kle" ? "DR. KLEINER" : who === "bar" ? "BARNEY" : "";
  const X = 60, Y = 760;
  return (
    <g opacity={o}>
      <rect x={X} y={Y} width={620} height={250} rx={22} fill="#0b121b" opacity={0.86} />
      <rect x={X} y={Y} width={620} height={250} rx={22} fill="none" stroke="#e07a2c" strokeWidth={5} />
      <rect x={X + 24} y={Y + 24} width={10} height={202} rx={4} fill="#e07a2c" />
      <defs>
        <clipPath id="radFace">
          <circle cx={X + 150} cy={Y + 125} r={92} />
        </clipPath>
      </defs>
      <g clipPath="url(#radFace)">
        {who && mute < 1 ? (
          <image href={staticFile(`videos/hl3_M01_3D/img/${FACE_IMG[who]}.png`)} x={X + 58} y={Y + 33} width={184} height={184} preserveAspectRatio="xMidYMid slice" />
        ) : null}
        {/* chiado: na troca de canal e quando o rádio morre */}
        {Array.from({ length: 26 }).map((_, i) => (
          <rect key={i} x={X + 58} y={Y + 33 + i * 7} width={184} height={7} fill={rnd(i + Math.floor(f / 2) * 31) > 0.5 ? "#c8d0d8" : "#2a323c"} opacity={mute * (0.5 + 0.5 * rnd(i * 3 + f))} />
        ))}
      </g>
      <circle cx={X + 150} cy={Y + 125} r={92} fill="none" stroke="#3c4148" strokeWidth={8} />
      <text x={X + 270} y={Y + 70} fontFamily={MONO} fontSize={28} letterSpacing={6} fill={mute >= 1 ? "#8a949e" : "#ffd9b0"}>
        {mute >= 1 ? "SEM SINAL" : name}
      </text>
      <text x={X + 270} y={Y + 100} fontFamily={MONO} fontSize={16} letterSpacing={4} fill="#8a949e">
        {mute >= 1 ? "CANAL MUDO" : "RÁDIO · CANAL ABERTO"}
      </text>
      {Array.from({ length: 16 }).map((_, i) => {
        const h = mute >= 1 ? 4 : 6 + amp * (14 + 60 * Math.abs(Math.sin(f / 2.6 + i * 0.8)) * rnd(Math.floor(f / 3) * 7 + i));
        return <rect key={i} x={X + 270 + i * 20} y={Y + 180 - h / 2} width={12} height={h} rx={3} fill={mute >= 1 ? "#55606a" : "#e07a2c"} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- o portal (tecnologia do Borealis)
// mostra o outro lugar lá dentro: o Eli e o Dog na neve
const Portal: React.FC<{ x: number; y: number; k: number; f: number; inside?: boolean }> = ({ x, y, k, f, inside = true }) => {
  if (k <= 0) return null;
  const rx = 92 * k, ry = 150 * k, w = 1 + 0.04 * Math.sin(f / 4);
  return (
    <g transform={`translate(${x} ${y - ry})`}>
      <ellipse cx={0} cy={0} rx={rx * 1.5} ry={ry * 1.25} fill="#bfe8ff" opacity={0.18} />
      <defs>
        <clipPath id={"ptl" + x}>
          <ellipse cx={0} cy={0} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <g clipPath={`url(#ptl${x})`}>
        <rect x={-rx} y={-ry} width={rx * 2} height={ry * 2} fill="#1b2e46" />
        <rect x={-rx} y={20} width={rx * 2} height={ry} fill="#dfeaf2" />
        <rect x={-rx} y={14} width={rx * 2} height={10} fill="#9fb9cc" />
        {inside ? (
          <>
            <DogBot x={34} y={120} s={0.32} d={-1} f={f} />
            <EliSide x={-16} y={124} s={0.36} d={1} f={f} />
          </>
        ) : null}
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#e8f7ff" opacity={0.25 + 0.1 * Math.sin(f / 5)} />
      </g>
      <ellipse cx={0} cy={0} rx={rx * w} ry={ry * w} fill="none" stroke="#e8f7ff" strokeWidth={12} />
      <ellipse cx={0} cy={0} rx={rx * w + 12} ry={ry * w + 12} fill="none" stroke="#7ad8ff" strokeWidth={6} opacity={0.6} />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 + f / 20;
        return <circle key={i} cx={Math.cos(a) * (rx + 22)} cy={Math.sin(a) * (ry + 22)} r={4} fill="#e8f7ff" />;
      })}
    </g>
  );
};

// o céu se dobrando: faixas escuras que descem curvas do alto, bordas violeta
const SkyFold: React.FC<{ k: number; f: number }> = ({ k, f }) =>
  k <= 0 ? null : (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const kk = cl(k * 1.4 - i * 0.18);
        if (kk <= 0) return null;
        const yb = 40 + kk * (300 + i * 60), sag = 160 + i * 50;
        const d = `M -60 -40 L 1980 -40 L 1980 ${yb - sag * 0.4} Q 960 ${yb + sag} -60 ${yb - sag * 0.4} Z`;
        return (
          <g key={i}>
            <path d={d} fill={["#05030c", "#0d0820", "#1a1033", "#271a4a"][i]} opacity={0.9 - i * 0.12} />
            <path d={`M -60 ${yb - sag * 0.4} Q 960 ${yb + sag} 1980 ${yb - sag * 0.4}`} fill="none" stroke={VIO} strokeWidth={6 - i} opacity={0.75 + 0.25 * Math.sin(f / 5 + i)} />
          </g>
        );
      })}
    </g>
  );

// ---------------------------------------------------------------------------------------------- a cena
export const HL14SnowFlat: React.FC<PR> = (p) => (p.mode === 1 ? <Reunion {...p} /> : <Radio {...p} />);

const RIPS_R = makeRips(7, 30, 820, [700, 2700, 760, 1380], [900, 1075, 1250, 1425, 1600, 1775].map((x) => [x, 1110, 190] as [number, number, number]));
const Radio: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [magAt, kleinerAt, barneyAt, laughAt, muteAt] = ["magAt", "kleinerAt", "barneyAt", "laughAt", "muteAt"].map((k) => at(p, k));
  // o Gordon andando sozinho na neve, a câmera acompanha de lado
  const gx = 900 + f * 0.85, gy = 1110;
  const cam = camAt(f, [
    [0, 1000, 820, 0.8],
    [magAt, gx + 120, 900, 1.05],
    [muteAt, 900 + muteAt * 0.85 + 200, 880, 1.15],
    [life, 900 + life * 0.85 + 120, 820, 0.85],
  ] as K[]);
  const [, , cy, z] = cam;
  const cx = Math.max(cam[1], gx + 60);
  const who: Who | null = f < magAt ? null : f < kleinerAt ? "mag" : f < barneyAt ? "kle" : "bar";
  const sw = [magAt, kleinerAt, barneyAt].reduce((m, a) => Math.max(m, 1 - Math.abs(f - a) / 5), 0);
  const mute = f >= muteAt ? cl((f - muteAt) / 6) : cl(sw);
  const talk = (a: number, b: number) => (f >= a + 8 && f < b - 6 ? 1 : 0);
  const laugh = f >= laughAt && f < muteAt ? 1.4 * (0.5 + 0.5 * Math.sin((f - laughAt) / 1.6)) : 0;
  const amp = Math.max(talk(magAt, kleinerAt), talk(kleinerAt, barneyAt), talk(barneyAt, laughAt)) * 0.8 + laugh;
  const lab = (a: number, b: number) => P(f, a + 30, 12) * (1 - P(f, b - 10, 8));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0d1b2e" }}>
      {shotsOf(p) ? <World3D life={life} shots={shotsOf(p)!} /> : null}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {shotsOf(p) ? null : (
          <>
            <Defs />
            <Stage f={f} t={f + 2400} cx={cx} cy={cy} z={z} tear={0.85} ship={1} rips={RIPS_R} rt={f}>
              <GordonBack x={gx} y={gy} s={1.2} ph={f * 0.2} amp={0.9} />
            </Stage>
            <Snowfall t={f} cx={cx} z={z} n={220} />
          </>
        )}
        <RadioCard f={f} who={who} amp={amp} mute={mute} o={P(f, magAt - 12, 10) * (1 - P(f, life - 12, 10))} />
      </svg>
      <Label x={960} y={130} text="“DESSA VEZ, O FOGUETE NÃO VAI SALVAR NINGUÉM.”" col="#ffd9b0" o={lab(magAt, kleinerAt)} align="center" />
      <Label x={960} y={130} text="“OBRIGADO, GORDON.”" sub="UM PROFESSOR VELHO SE DESPEDINDO DO ALUNO" col="#cfe3ff" o={lab(kleinerAt, barneyAt)} align="center" />
      <Label x={960} y={130} text="“A CERVEJA VAI FICAR PRA OUTRA VIDA.”" col="#bfe0ff" o={lab(barneyAt, muteAt + 4)} align="center" />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

const RIPS_A = makeRips(9, 18, 260, [900, 2300, 780, 1380], [[1700, 1010, 280], [1550, 1150, 220], [1800, 1010, 160]]);
const RIPS_B = makeRips(11, 26, 1600, [200, 2400, 760, 1380], [[900, 1010, 300], [1150, 1000, 220], [700, 1150, 200], [1200, 1005, 180], [1450, 930, 170], [1700, 860, 200]]);
const Reunion: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [portalAt, lastAt, throughAt, dogAt, talkAt, knowsAt, hugAt, aloneAt, foldAt, greenAt, lightAt, vanishAt] = ["portalAt", "lastAt", "throughAt", "dogAt", "talkAt", "knowsAt", "hugAt", "aloneAt", "foldAt", "greenAt", "lightAt", "vanishAt"].map((k) => at(p, k));
  const A = f < throughAt;
  // ---- lugar A: perto do navio, a Alyx abre o portal
  const PAx = 1640, PAy = 1010;
  // ---- lugar B: a neve onde está o Eli
  const PBx = 760, PBy = 1010, EX = 1030, EY = 1012;
  const cam = A
    ? camAt(f, [
        [portalAt, 1800, 900, 0.95],
        [lastAt - 20, 1780, 920, 1.0],
        [lastAt + 20, 1900, 860, 0.85],
        [throughAt - 40, 1700, 940, 1.2],
        [throughAt, PAx, PAy - 150, 4.2],
      ] as K[])
    : camAt(f, [
        [throughAt, PBx, PBy - 150, 3.4],
        [throughAt + 34, 900, 930, 1.25],
        [dogAt - 4, 920, 930, 1.25],
        [dogAt + 26, 1060, 900, 1.55],
        [talkAt + 50, 980, 900, 1.5],
        [hugAt - 30, 990, 900, 1.55],
        [hugAt + 16, 990, 880, 2.0],
        [aloneAt - 4, 995, 880, 1.95],
        [aloneAt + 70, 1080, 860, 0.95],
        [foldAt + 60, 1450, 760, 0.72],
        [greenAt - 10, 1620, 790, 0.9],
        [greenAt + 50, 1700, 790, 1.6],
        [lightAt, 1700, 785, 1.9],
        [life, 1700, 780, 2.2],
      ] as K[]);
  const [, cx, cy, z] = cam;
  // ---- Alyx e Gordon no lugar A
  const openK = eo(cl((f - portalAt) / 50));
  const shipLast = A ? (f < lastAt ? 1 : f < lastAt + 30 ? 1 + 0.6 * Math.sin((f - lastAt) * 1.2) : Math.max(0.15, 1 - (f - lastAt - 30) / 40)) : 0.15;
  const walkA = cl((f - lastAt - 10) / (throughAt - lastAt - 10));
  const ax = A ? 1800 - walkA * 160 : PBx + 40 + eo(cl((f - throughAt - 6) / (talkAt - throughAt - 6))) * 140 + P(f, hugAt - 24, 24) * 36;
  const ay = A ? 1010 : 1012;
  const gA = { x: 1520 + walkA * 100, y: 1200 - walkA * 180, s: 1.35 - walkA * 0.4 };
  // ---- Gordon no lugar B: sai do portal, fica olhando; depois segue sozinho e para
  const goK = eo(cl((f - aloneAt) / (foldAt + 40 - aloneAt)));
  const gB = { x: 700 + goK * 1000, y: 1150 - goK * 290, s: 1.15 - goK * 0.55 };
  const gWalk = !A && f > aloneAt && f < foldAt + 40 ? 1 : A && walkA > 0 && walkA < 1 ? 1 : 0;
  const hug = P(f, hugAt - 6, 20);
  const lie = P(f, hugAt + 30, 40);
  const vanished = f >= vanishAt;
  const fold = cl((f - foldAt) / 220);
  const green = cl((f - greenAt) / 90);
  const light = cl((f - lightAt) / (vanishAt - lightAt));
  const gC = (x: number, y: number) => [960 + (x - cx) * z, 540 + (y - cy) * z] as const;
  const gScr = gC(gB.x, gB.y - 120 * gB.s);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0d1b2e" }}>
      {shotsOf(p) ? <World3D life={life} shots={shotsOf(p)!} /> : null}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, display: shotsOf(p) ? "none" : undefined }}>
        <Defs />
        <Stage f={f} t={f + 3300} cx={cx} cy={cy} z={z} tear={A ? 0.85 : 0.85 + fold * 0.15} ship={A ? cl(shipLast) : 0} rips={A ? RIPS_A : RIPS_B} rt={f}>
          {A ? (
            <>
              {/* o navio dá o último fôlego: um brilho que vai até o aparelho dela */}
              {f >= portalAt && f < lastAt + 40 ? (
                <g opacity={(f < lastAt ? 0.5 : 1) * (1 - P(f, lastAt + 28, 12))}>
                  <circle cx={SHIP_X + 140} cy={SHIP_Y - 60} r={150 + 20 * Math.sin(f / 4)} fill="#bfe8ff" opacity={0.22} />
                  <polygon points={pts([[SHIP_X + 120, SHIP_Y - 40], [SHIP_X + 160, SHIP_Y - 40], [ax + 50, ay - 132], [ax + 40, ay - 146]])} fill="#cfefff" opacity={0.35 + 0.15 * Math.sin(f / 3)} />
                </g>
              ) : null}
              <Portal x={PAx} y={PAy} k={openK} f={f} />
              <AlyxSide x={ax} y={ay} s={1.05} d={-1} ph={f * 0.22} amp={walkA > 0 && walkA < 1 ? 1 : 0} arm={walkA > 0.05 ? 0 : 1} dev={f < lastAt + 40 ? 1 : 0} f={f} />
              <GordonBack x={gA.x} y={gA.y} s={gA.s} ph={f * 0.2} amp={gWalk} />
            </>
          ) : (
            <>
              <Portal x={PBx} y={PBy} k={1 - P(f, throughAt + 40, 30)} f={f} inside={false} />
              {/* o chão se abre em luz em volta do Gordon */}
              {fold > 0
                ? Array.from({ length: 10 }).map((_, i) => {
                    const a = (i / 10) * Math.PI * 2 + 0.3, L = 260 + rnd(i * 7) * 380;
                    const o: Pt = [gB.x + Math.cos(a) * 40, gB.y + Math.sin(a) * 12];
                    return <Fissure key={i} a={o} b={[o[0] + Math.cos(a) * L, o[1] + Math.sin(a) * L * 0.3]} w={22} seed={500 + i} k={cl(fold * 1.6 - i * 0.05)} core="#fff1b8" f={f} />;
                  })
                : null}
              {fold > 0 ? <ellipse cx={gB.x} cy={gB.y} rx={300 * fold} ry={70 * fold} fill="#fff1b8" opacity={0.18 * fold} /> : null}
              <DogBot x={EX + 150 - lie * 40} y={EY - 4} s={0.95} d={-1} lie={lie} f={f} />
              <EliSide x={EX} y={EY} s={1.05} d={-1} hug={hug} f={f} />
              <AlyxSide x={ax} y={ay} s={1.0} d={1} ph={f * 0.22} amp={f > throughAt + 6 && f < talkAt ? 1 : 0} arm={hug > 0.3 ? 2 : 0} f={f} />
              {/* os braços do Eli por cima das costas dela */}
              {hug > 0 ? (
                <g opacity={hug}>
                  <polyline points={pts([[EX - 12, EY - 186], [ax - 4, EY - 170], [ax - 14, EY - 140]])} fill="none" stroke="#6b5a40" strokeWidth={17} strokeLinejoin="round" strokeLinecap="round" />
                  <circle cx={ax - 14} cy={EY - 138} r={8} fill="#6e4a34" />
                </g>
              ) : null}
              {/* a energia verde dos Vortigaunts em volta dele */}
              {green > 0 && !vanished
                ? Array.from({ length: 7 }).map((_, i) => {
                    const ph = Math.floor(f / 2) * 3 + i * 17;
                    const r0 = 60 + 50 * gB.s * 2, a0 = rnd(ph) * Math.PI * 2;
                    const ps: Pt[] = Array.from({ length: 6 }).map((_, q) => {
                      const a = a0 + q * 0.42, r = r0 * (0.7 + 0.6 * rnd(ph + q));
                      return [gB.x + Math.cos(a) * r * 0.9, gB.y - 110 * gB.s * 1.6 + Math.sin(a) * r];
                    });
                    return (
                      <g key={i} opacity={green * (0.6 + 0.4 * rnd(ph + 1))}>
                        <polyline points={pts(ps)} fill="none" stroke={XEN_G} strokeWidth={12} strokeLinejoin="round" opacity={0.3} />
                        <polyline points={pts(ps)} fill="none" stroke="#c9ffd9" strokeWidth={4} strokeLinejoin="round" />
                      </g>
                    );
                  })
                : null}
              {green > 0 && !vanished ? <ellipse cx={gB.x} cy={gB.y - 110 * gB.s} rx={110 * gB.s * 1.4} ry={170 * gB.s * 1.3} fill={XEN_G} opacity={0.22 * green + 0.4 * light} /> : null}
              {!vanished ? <GordonBack x={gB.x} y={gB.y} s={gB.s} ph={f * 0.2} amp={gWalk} /> : null}
            </>
          )}
        </Stage>
        {!A ? <SkyFold k={fold} f={f} /> : null}
        <Snowfall t={f} cx={cx} z={z} n={A ? 180 : 180 - Math.round(green * 120)} />
        {/* a luz toma tudo e ele desaparece */}
        {light > 0 || vanished ? (
          <>
            <defs>
              <radialGradient id="reunGlow">
                <stop offset="0" stopColor="#ffffff" stopOpacity={1} />
                <stop offset="0.35" stopColor="#d9ffe6" stopOpacity={0.95} />
                <stop offset="1" stopColor="#7dffb4" stopOpacity={0} />
              </radialGradient>
            </defs>
            <circle cx={gScr[0]} cy={gScr[1]} r={160 + light * 1900} fill="url(#reunGlow)" opacity={vanished ? Math.max(0, 1 - (f - vanishAt) / 30) : light} />
          </>
        ) : null}
        {/* entrando no portal: o branco */}
        {f >= throughAt - 12 && f < throughAt + 20 ? <rect x={0} y={0} width={1920} height={1080} fill="#eaf8ff" opacity={f < throughAt ? (f - throughAt + 12) / 12 : 1 - (f - throughAt) / 20} /> : null}
      </svg>
      <Label x={960} y={130} text="UMA PASSAGEM ATÉ O ELI" sub="A ÚLTIMA COISA QUE O BOREALIS CONSEGUE FAZER" col="#cfefff" o={P(f, portalAt + 30, 12) * (1 - P(f, throughAt - 24, 8))} align="center" />
      <Label x={960} y={130} text="O DOG ESTÁ COM ELE" col="#ffd9a0" o={P(f, dogAt + 20, 10) * (1 - P(f, talkAt + 40, 8))} align="center" />
      <Label x={960} y={130} text="SEM GRANDE CONVERSA" sub="ELA NÃO PERGUNTA SE VALEU A PENA" col="#e6dcff" o={P(f, talkAt + 50, 12) * (1 - P(f, knowsAt - 8, 8))} align="center" />
      <Label x={960} y={130} text="ELA SÓ SABE QUE O CATALISADOR NÃO ACONTECEU" sub="NEM ELA SABE O QUE VEM DEPOIS" col="#e6dcff" o={P(f, knowsAt, 12) * (1 - P(f, hugAt - 8, 8))} align="center" />
      <Label x={960} y={130} text="O GORDON SEGUE SOZINHO" sub="ATÉ NÃO TER MAIS PRA ONDE CORRER" col="#bfe8ff" o={P(f, aloneAt + 30, 12) * (1 - P(f, foldAt + 30, 10))} align="center" />
      <Label x={960} y={940} text="O CÉU SE DOBRA · O CHÃO ABRE EM LUZ" col="#fff1b8" o={P(f, foldAt + 60, 12) * (1 - P(f, greenAt - 10, 10))} align="center" />
      <Label x={960} y={940} text="A MESMA ENERGIA QUE O TIROU DO G-MAN" col="#c9ffd9" o={P(f, greenAt + 40, 12) * (1 - P(f, lightAt, 10))} align="center" />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
