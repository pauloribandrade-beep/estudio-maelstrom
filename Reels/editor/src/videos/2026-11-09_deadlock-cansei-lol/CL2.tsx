import React from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Freeze, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";

// "Cansei do LoL" v2 (10/11). A v1 foi reprovada: emoji, card com foto, efeito genérico "sem vida", som de IA.
// Linguagem nova: o LoL é contado DENTRO do próprio cliente do LoL. O cliente é recriado em código com as cores Hextech
// e a fonte Beaufort (a do jogo, tirada do CommunityDragon), com câmera viva em perspectiva e cursor operando.
// O material é real: ícones dos campeões (Data Dragon), splash do Shaco, banner "DERROTA" pt-BR do jogo e gameplay.
// Os sons também são do cliente: fila, partida encontrada, travar campeão e PdL.
// Nada de emoji. Zona segura do TikTok: conteúdo entre y 180 e 1290, legenda em 1370.
// Props *At chegam em QUADROS relativos à cena.

const R = (n: string) => staticFile(`videos/2026-11-09_deadlock-cansei-lol_R/${n}`);
const clip = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/clips/${n}.mp4`);

// ---------- fonte do LoL (Beaufort for LoL) ----------
const BF = "BeaufortLoL";
const W_ = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
if (W_ && !W_.__clBeaufort) {
  W_.__clBeaufort = true;
  const h = delayRender("Beaufort for LoL");
  Promise.all(
    ([["medium", "500"], ["bold", "700"], ["heavy", "900"]] as const).map(([n, w]) =>
      new FontFace(BF, `url(${R(`fonts/beaufortforlol-${n}.otf`)}) format("opentype")`, { weight: w }).load().then((ff) => {
        document.fonts.add(ff);
      }),
    ),
  )
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
}

// ---------- paleta Hextech ----------
const C = {
  bg: "#010a13",
  navy: "#0a1428",
  navy2: "#091428",
  line: "#463714",
  gold: "#c8aa6e",
  gold2: "#785a28",
  goldL: "#f0e6d2",
  grey: "#a09b8c",
  grey2: "#5b5a56",
  teal: "#0ac8b9",
  cyan: "#cdfafa",
  blue: "#005a82",
  red: "#e84057",
};

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const io = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const shake = (f: number, at: number, amp = 14, n = 10, seed = "s") => {
  const k = f - at;
  if (k < 0 || k > n) return { x: 0, y: 0 };
  const d = amp * (1 - k / n) ** 2;
  return { x: (random(`${seed}x${k}`) - 0.5) * 2 * d, y: (random(`${seed}y${k}`) - 0.5) * 2 * d };
};
const punch = (f: number, ts: number[], amp = 0.08, n = 10) => ts.reduce((z, t) => (f >= t && f < t + n ? z + amp * (1 - (f - t) / n) ** 2 : z), 0);
// caminho por quadros-chave [quadro, x, y], suave entre eles
const path = (f: number, keys: [number, number, number][]) => {
  if (f <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
  for (let i = 1; i < keys.length; i++) {
    const [fa, xa, ya] = keys[i - 1];
    const [fb, xb, yb] = keys[i];
    if (f <= fb) {
      const t = interpolate(f, [fa, fb], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      return { x: xa + (xb - xa) * t, y: ya + (yb - ya) * t };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l[1], y: l[2] };
};

// ---------- base ----------
const Grain: React.FC<{ o?: number }> = ({ o = 0.06 }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 9;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay", pointerEvents: "none", zIndex: 80 }}>
      <filter id={`cl2g${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#cl2g${seed})`} />
    </svg>
  );
};
// fundo do cliente: azul-noite quase liso, um brilho só
const Room: React.FC<{ children?: React.ReactNode; glow?: string; gray?: number }> = ({ children, glow = "#0a3a52", gray = 0 }) => (
  <AbsoluteFill style={{ background: C.bg, overflow: "hidden", filter: gray ? `grayscale(${gray})` : undefined }}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 45% at 50% 38%, ${glow}aa 0%, rgba(0,0,0,0) 70%)` }} />
    {children}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none", zIndex: 70 }} />
    <Grain />
  </AbsoluteFill>
);
// câmera: perspectiva + deriva contínua (nunca parada)
const Cam: React.FC<{ f: number; rx?: number; ry?: number; rz?: number; z?: number; x?: number; y?: number; blur?: number; origin?: string; children: React.ReactNode }> = ({ f, rx = 0, ry = 0, rz = 0, z = 1, x = 0, y = 0, blur = 0, origin = "50% 40%", children }) => (
  <AbsoluteFill style={{ perspective: 1900, perspectiveOrigin: "50% 40%" }}>
    <AbsoluteFill
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: origin,
        transform: `translate(${x + Math.sin(f / 37) * 8}px, ${y + Math.cos(f / 43) * 7}px) rotateX(${rx + Math.sin(f / 51) * 0.8}deg) rotateY(${ry + Math.cos(f / 47) * 1.1}deg) rotateZ(${rz}deg) scale(${z})`,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);
// texto dourado do LoL (Beaufort), entra com máscara e faixa de luz passando
const Gold: React.FC<{ f: number; at: number; size: number; children: React.ReactNode; w?: number; n?: number; style?: React.CSSProperties; light?: boolean }> = ({ f, at, size, children, w = 700, n = 9, style, light = false }) => {
  if (f < at) return null;
  const p = ease(f, at, n);
  const sw = ((f - at) % 75) / 75;
  const s0 = sw * 160 - 30;
  const metal = light
    ? `linear-gradient(180deg, #ffffff 0%, ${C.cyan} 55%, #7fd6d0 100%)`
    : "linear-gradient(180deg, #fbf4e2 0%, #e6cd92 38%, #a07a39 60%, #d6b878 82%, #f0e0b5 100%)";
  return (
    <div
      style={{
        fontFamily: BF,
        fontWeight: w,
        fontSize: size,
        lineHeight: 1,
        whiteSpace: "nowrap",
        letterSpacing: interpolate(p, [0, 1], [size * 0.22, size * 0.03]),
        backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${s0}%, rgba(255,255,255,0.9) ${s0 + 8}%, rgba(255,255,255,0) ${s0 + 16}%), ${metal}`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        filter: `drop-shadow(0 6px 22px rgba(0,0,0,0.95))${p < 1 ? ` blur(${(1 - p) * 10}px)` : ""}`,
        clipPath: `inset(-20% ${(1 - p) * 100}% -20% 0)`,
        transform: `translateY(${(1 - p) * 26}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
const Center: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", ...style }}>{children}</div>
);
// cursor do cliente (seta escura com fio dourado) + onda do clique
const Cursor: React.FC<{ x: number; y: number; f: number; clicks?: number[] }> = ({ x, y, f, clicks = [] }) => {
  const down = clicks.some((c) => f >= c && f < c + 4);
  return (
    <>
      {clicks.map((c) =>
        f >= c && f < c + 16 ? (
          <div key={c} style={{ position: "absolute", left: x - 70 * ease(f, c, 14), top: y - 70 * ease(f, c, 14), width: 140 * ease(f, c, 14), height: 140 * ease(f, c, 14), borderRadius: "50%", border: `4px solid ${C.gold}`, opacity: 1 - ease(f, c + 4, 12), zIndex: 59 }} />
        ) : null,
      )}
      <svg width={64} height={80} viewBox="0 0 64 80" style={{ position: "absolute", left: x - 6, top: y - 4, transform: `scale(${down ? 0.86 : 1})`, transformOrigin: "6px 4px", zIndex: 60, filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.8))" }}>
        <defs>
          <linearGradient id="clcur" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e7c0" />
            <stop offset="1" stopColor="#8a6a30" />
          </linearGradient>
        </defs>
        <path d="M6 4 L6 62 L20 49 L31 74 L42 69 L31 45 L52 45 Z" fill="#0b1a24" stroke="url(#clcur)" strokeWidth={4.5} strokeLinejoin="round" />
      </svg>
    </>
  );
};
// botão hextech (o JOGAR / ACEITAR / BLOQUEAR do cliente)
const HexButton: React.FC<{ w: number; h: number; label: string; f: number; hot?: number; pressed?: boolean; size?: number; done?: boolean }> = ({ w, h, label, f, hot = 0, pressed = false, size = 40, done = false }) => {
  const cut = h * 0.32;
  const clip = `polygon(${cut}px 0, ${w - cut}px 0, ${w}px 50%, ${w - cut}px 100%, ${cut}px 100%, 0 50%)`;
  const glow = 0.35 + hot * 0.65 + Math.sin(f / 6) * 0.08 * hot;
  return (
    <div style={{ position: "relative", width: w, height: h, transform: `scale(${pressed ? 0.95 : 1})` }}>
      <div style={{ position: "absolute", inset: -3, clipPath: clip, background: `linear-gradient(180deg, #f0e6d2, ${C.gold} 40%, ${C.gold2})`, filter: `drop-shadow(0 0 ${18 * glow}px ${C.teal})` }} />
      <div
        style={{
          position: "absolute",
          inset: 3,
          clipPath: clip,
          background: done ? `linear-gradient(180deg, ${C.gold}, ${C.gold2})` : `linear-gradient(180deg, #1e2d3a ${0}%, #0b3341 ${60}%, ${hot > 0.5 ? "#0f5c66" : "#0a2a33"} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: BF,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: size * 0.08,
          color: done ? C.navy : C.cyan,
          textShadow: done ? "none" : `0 0 ${14 * glow}px ${C.teal}`,
        }}
      >
        {label}
      </div>
    </div>
  );
};
// a placa de fim de jogo do LoL (base vermelha do DERROTA, do próprio jogo)
const Plate: React.FC<{ f: number; at: number; w: number; banner?: boolean; children?: React.ReactNode }> = ({ f, at, w, banner = false, children }) => {
  if (f < at) return null;
  const s = interpolate(f, [at, at + 6], [1.6, 1], { ...clamp, easing: Easing.in(Easing.quad) }) + interpolate(f, [at + 6, at + 90], [0, 0.04], clamp);
  const sh = shake(f, at + 6, 16, 10, `pl${at}`);
  const h = w / 2;
  return (
    <div style={{ position: "relative", width: w, height: h, transform: `translate(${sh.x}px, ${sh.y}px) scale(${s})`, opacity: interpolate(f, [at, at + 2], [0, 1], clamp), filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.9)) drop-shadow(0 0 ${40 * (1 - ease(f, at + 4, 20))}px #ff6a3d)` }}>
      <Img src={R("cl/eog_defeat_base.png")} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      {banner ? <Img src={R("cl/defeat_ptbr.png")} style={{ position: "absolute", inset: 0, width: w, height: h }} /> : null}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: h * 0.1 }}>{children}</div>
    </div>
  );
};
const Flash: React.FC<{ f: number; ts: number[]; pk?: number; c?: string }> = ({ f, ts, pk = 0.4, c = "#fff" }) => (
  <AbsoluteFill style={{ background: c, opacity: ts.reduce((a, t) => a + (f < t ? 0 : interpolate(f, [t, t + 6], [pk, 0], clamp)), 0), pointerEvents: "none", zIndex: 75, mixBlendMode: "screen" }} />
);
// chicote da câmera entre momentos (desfoque de movimento vertical)
const whip = (f: number, at: number, n = 8) => {
  const k = f - at;
  if (k < -n || k > n) return { y: 0, blur: 0 };
  const t = k / n;
  return { y: k < 0 ? -t * t * 600 : (1 - t) * (1 - t) * 600, blur: (1 - Math.abs(t)) * 22 };
};

// ========== 1) o cliente do LoL: JOGAR · TEMPORADA 2026 · CHATO DEMAIS · só louco ==========
export const CLClient: React.FC<{ life: number; jogarAt?: number; yearAt?: number; chatoAt?: number; demaisAt?: number; loucoAt?: number }> = ({ life, jogarAt = 40, yearAt = 75, chatoAt = 95, demaisAt = 112, loucoAt = 140 }) => {
  const f = useCurrentFrame();
  const enter = ease(f, 0, 16);
  const sad = io(f, chatoAt, 22);
  const qs = Math.max(0, Math.floor((f - jogarAt) / 30));
  const cur = path(f, [
    [0, 880, 1180],
    [Math.max(1, jogarAt - 4), 196, 316],
    [jogarAt + 12, 250, 380],
    [chatoAt, 520, 760],
  ]);
  const NAV = ["INÍCIO", "TFT", "COLEÇÃO", "LOJA"];
  const z = 1.25 - 0.25 * enter + punch(f, [jogarAt, yearAt], 0.03) - sad * 0.06 ;
  return (
    <Room glow={f >= chatoAt ? "#3a1410" : "#0a3a52"}>
      <Cam f={f} rx={14 - 8 * enter + sad * 16} ry={-9 + 5 * enter} z={z + 0.08} y={70 + sad * 70} blur={(1 - enter) * 12}>
        {/* a janela do cliente */}
        <div style={{ position: "absolute", left: 40, top: 230, width: 1000, height: 960, borderRadius: 6, overflow: "hidden", border: `2px solid ${C.line}`, background: C.navy, boxShadow: `0 40px 90px rgba(0,0,0,0.85), 0 0 60px ${C.blue}55`, filter: `grayscale(${sad}) brightness(${1 - sad * 0.72})` }}>
          {/* banner do início: gameplay de verdade, escurecido */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, bottom: 0, overflow: "hidden" }}>
            <OffthreadVideo src={clip("lol_a")} muted startFrom={8 * 30} style={{ position: "absolute", height: "100%", left: -246, filter: "saturate(1.15) brightness(0.62)", transform: `scale(${1.08 + f * 0.0006})` }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(1,10,19,0.2) 0%, rgba(1,10,19,0.1) 45%, rgba(1,10,19,0.95) 100%)" }} />
            <div style={{ position: "absolute", left: 44, bottom: 230, fontFamily: BF, fontWeight: 700, fontSize: 30, letterSpacing: 10, color: C.grey, opacity: ease(f, 6, 10) * (1 - sad) }}>LEAGUE OF LEGENDS</div>
            <div style={{ position: "absolute", left: 40, bottom: 110, opacity: 1 - sad }}>
              <Gold f={f} at={yearAt} size={90}>
                TEMPORADA 2026
              </Gold>
            </div>
          </div>
          {/* barra de cima */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120, background: `linear-gradient(180deg, ${C.bg}, #04121e)`, borderBottom: `2px solid ${C.line}` }}>
            <div style={{ position: "absolute", left: 30, top: 26 }}>
              <HexButton w={250} h={70} label={f >= jogarAt ? "EM FILA" : "JOGAR"} f={f} size={34} hot={f >= jogarAt - 8 ? 1 : ease(f, 10, 20) * 0.4} pressed={f >= jogarAt && f < jogarAt + 4} />
            </div>
            {f >= jogarAt ? (
              <div style={{ position: "absolute", left: 300, top: 42, fontFamily: BF, fontWeight: 700, fontSize: 32, color: C.cyan, letterSpacing: 2 }}>
                0:{String(qs).padStart(2, "0")}
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 420, top: 44, display: "flex", gap: 40, fontFamily: BF, fontWeight: 700, fontSize: 30, letterSpacing: 3 }}>
              {NAV.map((n, i) => (
                <div key={n} style={{ color: i === 0 ? C.goldL : C.grey, position: "relative" }}>
                  {n}
                  {i === 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: 44, height: 3, background: C.gold }} /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
        <Cursor x={cur.x} y={cur.y} f={f} clicks={[jogarAt]} />
      </Cam>
      {/* CHATO DEMAIS na placa de fim de jogo do próprio LoL */}
      <Center top={420}>
        <Plate f={f} at={chatoAt} w={940}>
          <Gold f={f} at={chatoAt + 2} size={150} w={900} n={6}>
            CHATO
          </Gold>
        </Plate>
      </Center>
      <Center top={930} style={{ transform: `translate(${shake(f, loucoAt, 12, 10, "lc").x}px, 0)` }}>
        <Gold f={f} at={demaisAt} size={132} w={900} n={6}>
          DEMAIS
        </Gold>
      </Center>
      <Center top={1092}>
        {f >= loucoAt ? (
          <div style={{ fontFamily: BF, fontWeight: 700, fontSize: 54, letterSpacing: 8, color: C.grey, opacity: ease(f, loucoAt, 6), transform: `scale(${1.3 - 0.3 * ease(f, loucoAt, 6)})` }}>SÓ LOUCO, MANO</div>
        ) : null}
      </Center>
      <Flash f={f} ts={[jogarAt]} pk={0.18} c={C.teal} />
      <Flash f={f} ts={[chatoAt]} pk={0.3} c="#ff7a4a" />
    </Room>
  );
};

// ========== 2) +10 anos (a coleção inteira) · abro uma partida: PARTIDA ENCONTRADA → ACEITAR · maluco (Nazaré) ==========
const ICONS = ["Aatrox", "Ahri", "Akali", "Ashe", "Briar", "Darius", "Draven", "Ezreal", "Garen", "Jhin", "Jinx", "Katarina", "Kayn", "LeeSin", "Lucian", "Lux", "MasterYi", "Pyke", "Samira", "Sett", "Teemo", "Thresh", "Vayne", "Viego", "Yasuo", "Yone", "Zed", "Shaco"];
export const CLReady: React.FC<{ life: number; tenAt?: number; openAt?: number; madAt?: number }> = ({ life, tenAt = 75, openAt = 117, madAt = 186 }) => {
  const f = useCurrentFrame();
  const w = whip(f, openAt, 7);
  const n = Math.min(10, Math.round(interpolate(f, [tenAt - 14, tenAt], [0, 10], { ...clamp, easing: Easing.out(Easing.quad) })));
  const click = openAt + 26;
  const cur = path(f, [
    [openAt, 900, 1250],
    [click - 2, 560, 1040],
    [click + 30, 600, 1080],
  ]);
  const ring = interpolate(f, [openAt, openAt + 300], [1, 0], clamp);
  return (
    <Room glow={f < openAt ? "#2a2110" : "#06404a"}>
      {f < openAt ? (
        <Cam f={f} rx={34} rz={-10} z={1.05 + f * 0.0012 + punch(f, [tenAt], 0.05)} y={w.y - 40} blur={w.blur} origin="50% 50%">
          {/* a coleção: todos os campeões, em onda */}
          <div style={{ position: "absolute", left: -120, top: 120 - f * 1.6, width: 1320, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 22 }}>
            {Array.from({ length: 49 }).map((_, i) => {
              const c = ICONS[i % ICONS.length];
              const a = (i % 7) + Math.floor(i / 7) * 2;
              const on = ease(f, a * 1.6, 8);
              const lit = Math.max(0, 1 - Math.abs(f * 0.9 - a * 3) / 10);
              return (
                <div key={i} style={{ position: "relative", width: "100%", aspectRatio: "1", border: `3px solid ${lit > 0.2 ? C.goldL : C.gold2}`, boxShadow: `0 0 ${30 * lit}px ${C.gold}`, opacity: on, transform: `translateY(${(1 - on) * 60}px)` }}>
                  <Img src={R(`cl/icons/${c}.png`)} style={{ width: "100%", height: "100%", filter: `brightness(${0.75 + lit * 0.5})` }} />
                </div>
              );
            })}
          </div>
        </Cam>
      ) : null}
      {f < openAt ? (
        <>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 30% at 50% 44%, rgba(1,10,19,0.92) 0%, rgba(1,10,19,0.5) 60%, rgba(1,10,19,0) 100%)", zIndex: 20 }} />
          <Center top={480} style={{ zIndex: 30, transform: `translateY(${w.y}px)` }}>
            {f >= tenAt - 14 ? (
              <div style={{ fontFamily: BF, fontWeight: 900, fontSize: 330, lineHeight: 1, color: C.goldL, textShadow: `0 0 60px ${C.gold}99, 0 12px 40px #000`, transform: `scale(${1 + punch(f, [tenAt], 0.12)})` }}>+{n}</div>
            ) : null}
          </Center>
          <Center top={830} style={{ zIndex: 30, transform: `translateY(${w.y}px)` }}>
            <Gold f={f} at={tenAt} size={96} w={900}>
              ANOS DE LOL
            </Gold>
          </Center>
        </>
      ) : null}
      {/* PARTIDA ENCONTRADA */}
      {f >= openAt ? (
        <Cam f={f} rx={6 - 6 * ease(f, openAt, 14)} z={1.12 - 0.12 * ease(f, openAt, 12) + punch(f, [click], 0.04)} y={w.y} blur={w.blur}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.32 }}>
            <OffthreadVideo src={clip("lol_b")} muted startFrom={30 * 30} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(10px) saturate(0.7)" }} />
          </div>
          {/* o portal */}
          <div style={{ position: "absolute", left: 540 - 300, top: 330, width: 600, height: 600 }}>
            <svg width={600} height={600} viewBox="0 0 600 600" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <radialGradient id="clportal" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#0d6b78" stopOpacity={0.9} />
                  <stop offset="0.6" stopColor="#06303a" stopOpacity={0.95} />
                  <stop offset="1" stopColor={C.bg} />
                </radialGradient>
              </defs>
              <circle cx={300} cy={300} r={262} fill="url(#clportal)" stroke={C.line} strokeWidth={6} />
              <circle cx={300} cy={300} r={282} fill="none" stroke={C.gold2} strokeWidth={3} />
              {/* anel do tempo para aceitar */}
              <circle cx={300} cy={300} r={282} fill="none" stroke={C.gold} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-90 300 300)" style={{ filter: `drop-shadow(0 0 10px ${C.gold})` }} />
              {/* runas girando dentro */}
              {Array.from({ length: 3 }).map((_, k) => (
                <circle key={k} cx={300} cy={300} r={210 - k * 46} fill="none" stroke={C.teal} strokeOpacity={0.35 - k * 0.08} strokeWidth={3} strokeDasharray={`${40 + k * 20} ${26 + k * 10}`} transform={`rotate(${(k % 2 ? -1 : 1) * f * (2.2 - k * 0.5)} 300 300)`} />
              ))}
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <Gold f={f} at={openAt + 4} size={58} w={700} n={7}>
                PARTIDA
              </Gold>
              <Gold f={f} at={openAt + 7} size={58} w={700} n={7}>
                ENCONTRADA!
              </Gold>
              <div style={{ fontFamily: BF, fontWeight: 500, fontSize: 30, letterSpacing: 4, color: C.grey, opacity: ease(f, openAt + 12, 8) }}>RANQUEADA SOLO/DUO</div>
            </div>
          </div>
          <Center top={980}>
            <div style={{ opacity: ease(f, openAt + 8, 8), transform: `translateY(${(1 - ease(f, openAt + 8, 10)) * 40}px)` }}>
              <HexButton w={470} h={112} label={f >= click ? "ACEITO" : "ACEITAR!"} f={f} size={54} hot={ease(f, click - 12, 10)} pressed={f >= click && f < click + 4} done={f >= click} />
            </div>
          </Center>
          {/* os 10 jogadores aceitando */}
          <Center top={1130}>
            <div style={{ display: "flex", gap: 14, opacity: ease(f, click, 6) }}>
              {Array.from({ length: 10 }).map((_, i) => {
                const on = f >= click + 3 + i * 3 + Math.floor(random(`pip${i}`) * 4);
                return <div key={i} style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${on ? C.teal : C.grey2}`, background: on ? C.teal : "transparent", boxShadow: on ? `0 0 16px ${C.teal}` : "none" }} />;
              })}
            </div>
          </Center>
          <Center top={1190}>
            <div style={{ fontFamily: BF, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.grey, opacity: f < click ? ease(f, openAt + 14, 8) : 0 }}>RECUSAR</div>
          </Center>
          <Cursor x={cur.x} y={cur.y} f={f} clicks={[click]} />
        </Cam>
      ) : null}
      <Flash f={f} ts={[openAt]} pk={0.25} c={C.teal} />
      {/* maluco: o Coringa puxando o cabelo (A Piada Mortal), pedido dele 10/11 no lugar do Faustão */}
      {f >= madAt ? (
        <AbsoluteFill style={{ background: "#000", zIndex: 90, overflow: "hidden" }}>
          <Img
            src={R("memes/coringa.jpg")}
            style={{
              position: "absolute",
              height: 1920,
              left: (1080 - 1920 * (2560 / 1440)) / 2,
              top: 0,
              transformOrigin: "50% 38%",
              transform: `translate(${shake(f, madAt, 18, 10, "cg").x}px, ${shake(f, madAt, 18, 10, "cg").y}px) scale(${interpolate(f, [madAt, madAt + 5], [1.25, 1.05], { ...clamp, easing: Easing.out(Easing.cubic) }) + interpolate(f, [madAt + 5, madAt + 60], [0, 0.12], clamp)})`,
            }}
          />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)" }} />
        </AbsoluteFill>
      ) : null}
    </Room>
  );
};

// ========== 3) "já não basta o meu main ser o Shaco": seleção de campeão, trava o Shaco ==========
const GRID = ["Ahri", "Darius", "Jinx", "LeeSin", "Yasuo", "Thresh", "Zed", "Shaco", "Lux", "Garen", "Viego", "Pyke", "Vayne", "Teemo", "Sett"];
export const CLPick: React.FC<{ life: number; mainAt?: number; shacoAt?: number }> = ({ life, mainAt = 10, shacoAt = 36 }) => {
  const f = useCurrentFrame();
  const sel = Math.max(4, Math.min(mainAt + 4, shacoAt - 16));
  const sp = io(f, sel, 10);
  const lock = shacoAt;
  const SI = GRID.indexOf("Shaco");
  const cx = 150 + (SI % 5) * 170 + 75;
  const cy = 330 + Math.floor(SI / 5) * 170 + 75;
  const cur = path(f, [
    [0, 940, 1200],
    [sel, cx + 10, cy + 10],
    [lock - 6, 560, 1130],
    [lock + 20, 600, 1160],
  ]);
  return (
    <Room glow="#2b0c12">
      {/* splash do Shaco, como a seleção mostra o campeão escolhido */}
      <AbsoluteFill style={{ opacity: sp, transform: `translateX(${(1 - sp) * 220}px) scale(${1.12 + punch(f, [lock], 0.05) + f * 0.0015})`, filter: `blur(${(1 - sp) * 14}px)` }}>
        <Img src={R("cl/shaco_hd.jpg")} style={{ position: "absolute", height: 1300, top: 60, left: -1046 }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(1,10,19,0.75) 0%, rgba(1,10,19,0) 18%, rgba(1,10,19,0.1) 45%, rgba(1,10,19,0.92) 66%, #010a13 74%)" }} />
      </AbsoluteFill>
      <Cam f={f} rx={10 - 10 * ease(f, 0, 10)} z={1 + punch(f, [0], 0.1, 8)}>
        {/* grade de campeões */}
        <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - sp * 0.9, transform: `translateY(${sp * 120}px) scale(${1 - sp * 0.1})` }}>
          <div style={{ position: "absolute", left: 150, top: 250, fontFamily: BF, fontWeight: 700, fontSize: 36, letterSpacing: 8, color: C.goldL, whiteSpace: "nowrap" }}>ESCOLHA SEU CAMPEÃO!</div>
          {GRID.map((c, i) => {
            const hov = i === SI && f >= sel - 3;
            return (
              <div key={c} style={{ position: "absolute", left: 150 + (i % 5) * 170, top: 330 + Math.floor(i / 5) * 170, width: 150, height: 150, border: `3px solid ${hov ? C.goldL : C.gold2}`, boxShadow: hov ? `0 0 34px ${C.gold}` : "none", opacity: ease(f, i * 0.6, 6), transform: `scale(${hov ? 1.08 : 1})` }}>
                <Img src={R(`cl/icons/${c}.png`)} style={{ width: "100%", height: "100%", filter: hov ? "none" : "brightness(0.8)" }} />
              </div>
            );
          })}
        </div>
        {/* nome e BLOQUEAR */}
        <Center top={790}>
          <Gold f={f} at={sel + 4} size={196} w={900} n={8}>
            SHACO
          </Gold>
        </Center>
        <Center top={1000}>
          <div style={{ fontFamily: BF, fontWeight: 500, fontSize: 40, letterSpacing: 10, color: C.grey, opacity: ease(f, sel + 10, 8), whiteSpace: "nowrap" }}>O BUFÃO DEMONÍACO</div>
        </Center>
        <Center top={1090}>
          <div style={{ opacity: ease(f, sel + 6, 8) }}>
            <HexButton w={420} h={100} label={f >= lock ? "BLOQUEADO" : "BLOQUEAR"} f={f} size={44} hot={ease(f, lock - 10, 8)} pressed={f >= lock && f < lock + 4} done={f >= lock} />
          </div>
        </Center>
        <Cursor x={cur.x} y={cur.y} f={f} clicks={[sel, lock]} />
      </Cam>
      <Flash f={f} ts={[lock]} pk={0.35} c="#ff3b5c" />
    </Room>
  );
};

// ========== 4) aos 15 minutos: o tempo bate 15:00, o time vota pra se render → DERROTA (a placa do jogo) ==========
const Check: React.FC<{ c: string }> = ({ c }) => (
  <svg width={40} height={40} viewBox="0 0 40 40">
    <path d="M8 21 L17 30 L33 11" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const CLSurrender: React.FC<{ life: number; minAt?: number; nadaAt?: number; overAt?: number }> = ({ life, minAt = 22, nadaAt = 69, overAt = 105 }) => {
  const f = useCurrentFrame();
  const sec = Math.round(interpolate(f, [0, minAt], [14 * 60 + 47, 15 * 60], { ...clamp, easing: Easing.in(Easing.quad) }));
  const mm = Math.floor(sec / 60);
  const ss = String(sec % 60).padStart(2, "0");
  const over = f >= overAt;
  const gray = ease(f, nadaAt, 30) * 0.6 + (over ? 0.4 : 0);
  const votes = [0, 5, 10, 15].map((d) => nadaAt + 8 + d);
  const game = (
    <OffthreadVideo src={clip("lol_a")} muted startFrom={22 * 30} style={{ position: "absolute", height: 1920, left: -1170, top: 0 }} />
  );
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.04 + f * 0.0009 + punch(f, [minAt], 0.05) + (over ? ease(f, overAt, 30) * 0.08 : 0)})`, filter: `grayscale(${gray}) brightness(${1 - gray * 0.45}) blur(${over ? ease(f, overAt, 10) * 6 : 0}px)` }}>
        {over ? <Freeze frame={overAt}>{game}</Freeze> : game}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)" }} />
      {/* o relógio da partida, no estilo do placar do jogo */}
      {!over ? (
        <Center top={210}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 40px", background: "linear-gradient(180deg, rgba(1,10,19,0.92), rgba(9,20,40,0.92))", border: `2px solid ${f >= minAt ? C.gold : C.line}`, boxShadow: f >= minAt ? `0 0 ${30 * (1 - ease(f, minAt, 20)) + 8}px ${C.gold}` : "none", transform: `scale(${1 + punch(f, [minAt], 0.14)})` }}>
            <svg width={44} height={44} viewBox="0 0 44 44">
              <circle cx={22} cy={24} r={16} fill="none" stroke={C.gold} strokeWidth={4} />
              <path d="M22 24 L22 14" stroke={C.goldL} strokeWidth={4} strokeLinecap="round" transform={`rotate(${f * 24} 22 24)`} />
              <rect x={17} y={2} width={10} height={5} fill={C.gold} />
            </svg>
            <div style={{ fontFamily: BF, fontWeight: 700, fontSize: 92, color: f >= minAt ? C.goldL : "#e8e2d0", letterSpacing: 4, fontVariantNumeric: "tabular-nums" }}>
              {mm}:{ss}
            </div>
          </div>
        </Center>
      ) : null}
      {/* votação de rendição */}
      {f >= nadaAt && !over ? (
        <Center top={470}>
          <div style={{ width: 760, padding: "28px 34px 34px", background: "linear-gradient(180deg, rgba(1,10,19,0.95), rgba(10,20,40,0.95))", border: `2px solid ${C.gold2}`, boxShadow: "0 30px 80px rgba(0,0,0,0.8)", opacity: ease(f, nadaAt, 6), transform: `translateY(${(1 - ease(f, nadaAt, 9)) * 60}px)` }}>
            <div style={{ fontFamily: BF, fontWeight: 700, fontSize: 52, letterSpacing: 6, color: C.goldL, textAlign: "center" }}>RENDER-SE?</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 26 }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const on = i < 4 && f >= votes[i];
                return (
                  <div key={i} style={{ width: 104, height: 104, border: `3px solid ${on ? "#2fd36b" : C.grey2}`, background: on ? "rgba(47,211,107,0.18)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${on ? 1 + punch(f, [votes[i]], 0.18, 8) : 1})` }}>
                    {on ? <Check c="#2fd36b" /> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </Center>
      ) : null}
      {/* ACABOU: a placa de DERROTA do próprio jogo */}
      <Center top={560}>
        <Plate f={f} at={overAt} w={1000} banner />
      </Center>
      <Flash f={f} ts={[minAt]} pk={0.15} c={C.gold} />
      <Flash f={f} ts={[overAt]} pk={0.45} c="#ff6a3d" />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />
      <Grain />
    </AbsoluteFill>
  );
};

// peças compartilhadas com o CL3.tsx (resto do vídeo, de 0:25 ao fim)
export { C, BF, R, clip, clamp, ease, io, shake, punch, path, Grain, Room, Cam, Gold, Center, Cursor, HexButton, Plate, Flash, whip, ICONS };
