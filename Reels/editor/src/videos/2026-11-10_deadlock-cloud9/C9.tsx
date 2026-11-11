import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Cam, Center, clamp, Cursor, ease, Flash, Grain, path, punch, R, shake } from "../2026-11-09_deadlock-cansei-lol/CL2";
import { D, DlPanel, DlRoom, DlTitle, LinkBar, RD, RV } from "../2026-11-09_deadlock-cansei-lol/CL3";

// "Cloud9 no Deadlock" (10/11). Estilo aprovado do Cansei do LoL: tudo dentro da UI do Deadlock (Reaver/Radiance,
// painéis chanfrados, creme/âmbar/alma), poucos golpes por cena. Trechos do trailer da Cloud9 (@C9DLock no X).
// Jogo citado de passagem = card pequeno com logo. Zona segura do TikTok: y 180–1290, legenda em 1370.
// Props *At em QUADROS da cena (o Estúdio converte os segundos do edit.json).

const C9 = (n: string) => staticFile(`videos/2026-11-10_deadlock-cloud9_R/c9/${n}`);
const MG = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/mg/${n}`);
const BLIES = staticFile("videos/2026-11-06_deadlock-ranked_R/dl/blies.jpg");
const TR = C9("trailer.mp4");
const C9BLUE = "#14a0ff";

// trecho do trailer (sempre mudo aqui: o som do trailer entra como efeito no edit.json)
const Trailer: React.FC<{ ss: number; life: number; style?: React.CSSProperties; pos?: string }> = ({ ss, life, style, pos = "50% 50%" }) => (
  <Sequence from={0} durationInFrames={Math.max(1, life)} layout="none">
    <OffthreadVideo src={TR} muted startFrom={ss} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, ...style }} />
  </Sequence>
);

// carimbo: placa que bate de cima
const Stamp: React.FC<{ f: number; at: number; text: string; c?: string; size?: number; rot?: number; style?: React.CSSProperties }> = ({ f, at, text, c = D.red, size = 64, rot = -5, style }) => {
  if (f < at) return null;
  const k = interpolate(f, [at, at + 5], [1.9, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <div style={{ padding: `${size * 0.16}px ${size * 0.5}px`, border: `${Math.max(4, size * 0.08)}px solid ${c}`, color: c, fontFamily: RV, fontWeight: 700, fontSize: size, letterSpacing: size * 0.06, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(11,10,8,0.85)", transform: `rotate(${rot}deg) scale(${k})`, opacity: interpolate(f, [at, at + 3], [0, 1], clamp), boxShadow: `0 0 40px ${c}55, 0 20px 40px rgba(0,0,0,0.8)`, ...style }}>
      {text}
    </div>
  );
};

const Label: React.FC<{ f: number; at: number; children: React.ReactNode; c?: string; size?: number }> = ({ f, at, children, c = D.dim, size = 30 }) => (
  <div style={{ fontFamily: RD, fontWeight: 700, fontSize: size, letterSpacing: size * 0.26, color: c, opacity: ease(f, at, 8), whiteSpace: "nowrap" }}>{children}</div>
);

// card pequeno de jogo citado (logo + nome)
const GameCard: React.FC<{ f: number; at: number; logo: string; name: string; out?: number; w?: number; white?: boolean }> = ({ f, at, logo, name, out = 0, w = 260, white = false }) => {
  if (f < at) return null;
  const p = ease(f, at, 10);
  return (
    <div style={{ position: "relative", opacity: p, transform: `translateY(${(1 - p) * 50}px) scale(${0.9 + 0.1 * p})` }}>
      <DlPanel w={w} h={w * 0.78} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, filter: out > 0 ? `grayscale(${out}) brightness(${1 - out * 0.45})` : undefined }}>
        <Img src={logo} style={{ maxWidth: w * 0.62, maxHeight: w * 0.4, objectFit: "contain", filter: white ? "brightness(0) invert(1)" : undefined }} />
        <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: D.cream }}>{name}</div>
      </DlPanel>
      {out > 0 ? (
        <svg width={w} height={w * 0.78} style={{ position: "absolute", inset: 0 }}>
          <line x1={20} y1={w * 0.7} x2={20 + (w - 40) * out} y2={w * 0.7 - (w * 0.62) * out} stroke={D.red} strokeWidth={10} strokeLinecap="round" />
        </svg>
      ) : null}
    </div>
  );
};

const Trophy: React.FC<{ s: number; lit: number; id: string }> = ({ s, lit, id }) => (
  <svg width={s} height={s} viewBox="0 0 220 220" style={{ filter: lit > 0.5 ? `drop-shadow(0 0 ${18 * lit}px ${D.amber})` : undefined }}>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lit > 0.5 ? "#fbe6b0" : "#5a5040"} />
        <stop offset="0.6" stopColor={lit > 0.5 ? "#d08f2c" : "#3a3328"} />
        <stop offset="1" stopColor={lit > 0.5 ? "#6b4512" : "#221d16"} />
      </linearGradient>
    </defs>
    <path d="M60 30 H160 V80 a50 50 0 0 1 -100 0 Z" fill={`url(#${id})`} />
    <path d="M60 44 H30 a30 30 0 0 0 34 46 M160 44 H190 a30 30 0 0 1 -34 46" fill="none" stroke={`url(#${id})`} strokeWidth={10} />
    <rect x={98} y={128} width={24} height={36} fill={`url(#${id})`} />
    <path d="M70 196 L80 164 H140 L150 196 Z" fill={`url(#${id})`} />
  </svg>
);

const Vignette = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none", zIndex: 60 }} />;

// ========== 1) gancho: a Cloud9 entrou no Deadlock · a mesma do LoL e do CS · o competitivo JÁ TÁ PRONTO ==========
export const C9Open: React.FC<{ life: number; dlAt?: number; simAt?: number; aquelaAt?: number; lolAt?: number; csAt?: number; lineAt?: number; exclAt?: number; compLAt?: number; isAt?: number; compAt?: number; prontoAt?: number }> = ({ life, dlAt = 75, simAt = 93, aquelaAt = 153, lolAt = 186, csAt = 207, lineAt = 217, exclAt = 318, compLAt = 363, isAt = 398, compAt = 516, prontoAt = 579 }) => {
  const f = useCurrentFrame();
  const out = ease(f, compAt - 14, 12);
  const sh = shake(f, simAt, 16, 10, "c9s");
  const z = 1 + punch(f, [0, simAt], 0.07, 12);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* o próprio jogo do trailer em tela cheia (cidade do Deadlock), escurecido */}
      <AbsoluteFill style={{ transform: `scale(${1.15 + f * 0.0006})`, filter: `brightness(${0.42 - out * 0.12})` }}>
        <Trailer ss={75} life={life} />
      </AbsoluteFill>
      <Cam f={f} rx={4} z={z} x={sh.x} y={sh.y}>
        <div style={{ position: "absolute", inset: 0, opacity: f < simAt ? 1 : 0 }}>
          <Center top={300}>
            <Img src={C9("c9_logo_w.png")} style={{ width: 820, opacity: ease(f, 0, 6), filter: `drop-shadow(0 0 40px ${C9BLUE}88) drop-shadow(0 10px 30px #000)` }} />
          </Center>
          <Center top={930}>
            <DlTitle f={f} at={dlAt} size={74} ls={0.04}>
              ENTROU NO DEADLOCK
            </DlTitle>
          </Center>
        </div>
        {/* "isso só confirma uma das coisas que eu venho defendendo aqui ultimamente" */}
        {f >= isAt - 2 && f < compAt - 4 ? (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - ease(f, compAt - 12, 8) }}>
            <Center top={430}>
              <DlTitle f={f} at={isAt} size={52} c={D.dim} font={RD} ls={0.24}>
                ISSO SÓ CONFIRMA
              </DlTitle>
            </Center>
            <Center top={540}>
              <DlTitle f={f} at={isAt + 14} size={84} c={D.cream} ls={0.04}>
                O QUE EU VENHO
              </DlTitle>
            </Center>
            <Center top={640}>
              <DlTitle f={f} at={isAt + 24} size={84} c={D.amber} ls={0.04}>
                DEFENDENDO
              </DlTitle>
            </Center>
          </div>
        ) : null}
        {f >= compAt - 6 ? (
          <>
            <Center top={520}>
              <DlTitle f={f} at={compAt - 6} size={64} c={D.dim} font={RD} ls={0.2}>
                O COMPETITIVO DE
              </DlTitle>
            </Center>
            <Center top={620}>
              <Img src={MG("dl_logo.png")} style={{ width: 760, opacity: ease(f, compAt + 4, 10), transform: `scale(${1.2 - 0.2 * ease(f, compAt + 4, 14)})`, filter: "drop-shadow(0 10px 30px #000)" }} />
            </Center>
            <Center top={930}>
              <Stamp f={f} at={prontoAt} text="JÁ TÁ PRONTO" c={D.green} size={96} rot={-4} />
            </Center>
          </>
        ) : null}
      </Cam>
      {/* "Sim, a Cloud9": a tela muda pro azul da Cloud9, nuvem gigante */}
      {f >= simAt && f < aquelaAt ? (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 42%, #0e4f86 0%, #06182b 55%, #02060b 100%)`, zIndex: 20 }}>
          <Center top={250}>
            <DlTitle f={f} at={simAt} size={64} c="#9fd3ff" font={RD} ls={0.3} n={6}>
              SIM, A
            </DlTitle>
          </Center>
          <Center top={400}>
            <Img src={C9("c9_cloud.png")} style={{ width: 700, transform: `scale(${interpolate(f, [simAt, simAt + 6], [1.6, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) + (f - simAt) * 0.002})`, filter: `drop-shadow(0 0 60px ${C9BLUE})` }} />
          </Center>
          <Center top={930}>
            <DlTitle f={f} at={simAt + 8} size={110} c="#fff">
              CLOUD9
            </DlTitle>
          </Center>
        </AbsoluteFill>
      ) : null}
      {/* "aquela mesma do LoL": a Cloud9 comemorando no Worlds 2018 */}
      {f >= aquelaAt && f < csAt ? (
        <AbsoluteFill style={{ zIndex: 20, background: "#000" }}>
          <Sequence from={aquelaAt} layout="none">
            <AbsoluteFill style={{ transform: `scale(${1.08 + (f - aquelaAt) * 0.002})` }}>
              <OffthreadVideo src={C9("lol_c9.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "45% 50%" }} />
            </AbsoluteFill>
          </Sequence>
          <HlChip f={f} at={aquelaAt + 2} logo={MG("lol_logo.png")} top="CLOUD9 NO LOL" sub="WORLDS 2018 · VAGA NA SEMIFINAL" />
        </AbsoluteFill>
      ) : null}
      {/* "e do CS": campeã do Major de Boston 2018 */}
      {/* 10/11: o CS sai no "e isso só confirma" (pedido dele: tempo na tela já basta) */}
      {f >= csAt && f < lineAt + 26 ? (
        <AbsoluteFill style={{ zIndex: 20, background: "#000", opacity: 1 - ease(f, lineAt + 18, 8) }}>
          <Sequence from={csAt} layout="none">
            <AbsoluteFill style={{ transform: `scale(${1.1 + (f - csAt) * 0.0015})` }}>
              <OffthreadVideo src={C9("cs_c9.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%" }} />
            </AbsoluteFill>
          </Sequence>
          <HlChip f={f} at={csAt + 2} logo={MG("cs_logo.png")} white top="CLOUD9 NO CS" sub="CAMPEÃ DO MAJOR · BOSTON 2018" />
        </AbsoluteFill>
      ) : null}
      {/* 10/11 (trecho novo): "é real, gurizada, eles acabaram de anunciar uma line exclusiva pro competitivo de Deadlock" */}
      {f >= lineAt + 18 && f < isAt + 2 ? (
        <AbsoluteFill style={{ zIndex: 19, background: `radial-gradient(ellipse 85% 55% at 50% 35%, #0b3558 0%, #05121f 60%, #020509 100%)`, opacity: ease(f, lineAt + 18, 8) * (1 - ease(f, isAt - 6, 8)) }}>
          {/* 10/11 (pedido dele): mostrar a LINE, não só o perfil. Fundo = quadro WELCOME TO CLOUD9 do trailer; cartas com nick + nome real (Liquipedia), sem foto */}
          <AbsoluteFill style={{ opacity: 0.32, filter: "blur(10px) saturate(1.2)", transform: "scale(1.15)" }}>
            <Trailer ss={1330} life={isAt + 2 - lineAt} />
          </AbsoluteFill>
          <Center top={210}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "16px 30px 16px 18px", borderRadius: 60, background: "rgba(0,0,0,0.75)", border: `1px solid ${C9BLUE}88`, transform: `translateY(${(1 - ease(f, lineAt + 18, 12)) * -60}px)` }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#06182b", border: `3px solid ${C9BLUE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Img src={C9("c9_cloud.png")} style={{ width: 60 }} />
              </div>
              <div>
                <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fontSize: 34, color: "#e7e9ea" }}>Cloud9 Deadlock <span style={{ fontWeight: 400, color: "#71767b" }}>@C9DLock</span></div>
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: "#9fd3ff" }}>ANUNCIOU SUA LINE</div>
              </div>
            </div>
          </Center>
          <div style={{ position: "absolute", left: 60, top: 370, width: 960, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {([["SAIAH", "Isaiah Mendoza", "EUA"], ["JONJON", "Jonathon Gross", "EUA"], ["AVERAGE", "AVG", "EUA"], ["LEAGUE", "Trentin Rowand", "CAN"], ["LOMEIN", "Trivon Pham", "EUA"], ["ZENO", "Alex Isakayev", "EUA"]] as const).map(([nick, real, pais], i) => {
              const at = lineAt + 30 + i * 6;
              const k = ease(f, at, 8);
              return (
                <div key={nick} style={{ height: 112, display: "flex", alignItems: "center", gap: 16, padding: "0 20px", background: "linear-gradient(90deg, rgba(14,48,80,0.96), rgba(6,18,31,0.96))", borderLeft: `6px solid ${C9BLUE}`, boxShadow: `0 14px 30px #000a`, opacity: k, transform: `translateX(${(1 - k) * (i % 2 ? 80 : -80)}px) scale(${1 + punch(f, [exclAt], 0.05, 8)})` }}>
                  <Img src={C9("c9_cloud.png")} style={{ width: 50 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 46, lineHeight: 1, color: "#fff", whiteSpace: "nowrap" }}>{nick}</div>
                    <div style={{ fontFamily: RD, fontSize: 22, letterSpacing: 2, color: "#8fb8d8", whiteSpace: "nowrap" }}>{real.toUpperCase()}</div>
                  </div>
                  <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: "#9fd3ff", border: `1px solid ${C9BLUE}88`, padding: "4px 8px" }}>{pais}</div>
                </div>
              );
            })}
          </div>
          <Center top={810}>
            <Stamp f={f} at={exclAt} text="LINE EXCLUSIVA" c={C9BLUE} size={88} rot={-4} />
          </Center>
          {f >= compLAt - 4 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", alignItems: "center", justifyContent: "center", gap: 22, opacity: ease(f, compLAt - 4, 8) }}>
              <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: D.cream }}>PRO COMPETITIVO DE</div>
              <Img src={MG("dl_logo.png")} style={{ height: 70 }} />
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      <Flash f={f} ts={[simAt, aquelaAt, csAt, exclAt]} pk={0.22} c={C9BLUE} />
      <Flash f={f} ts={[prontoAt]} pk={0.18} c={D.green} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

// selo do highlight (jogo citado): logo + Cloud9 + o feito
const HlChip: React.FC<{ f: number; at: number; logo: string; top: string; sub: string; white?: boolean }> = ({ f, at, logo, top, sub, white }) => {
  const p = ease(f, at, 8);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1020, display: "flex", alignItems: "center", gap: 26, padding: "22px 30px", background: "rgba(6,14,24,0.92)", border: `3px solid ${C9BLUE}`, boxShadow: `0 0 40px ${C9BLUE}66, 0 20px 50px #000`, opacity: p, transform: `translateX(${(1 - p) * -120}px)` }}>
      <Img src={C9("c9_cloud.png")} style={{ width: 96 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 58, color: "#fff", whiteSpace: "nowrap", lineHeight: 1.05 }}>{top}</div>
        <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: "#9fd3ff", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      <Img src={logo} style={{ height: 70, maxWidth: 170, objectFit: "contain", filter: white ? "brightness(0) invert(1)" : undefined }} />
    </div>
  );
};

// ========== 2) "dá uma olhadinha no trailer que eles lançaram lá no X" (post do X → clique no play) ==========
export const C9Post: React.FC<{ life: number; trailerAt?: number; xAt?: number }> = ({ life, trailerAt = 36, xAt = 80 }) => {
  const f = useCurrentFrame();
  const click = xAt;
  const zoom = interpolate(f, [click + 4, life], [1, 1.9], { ...clamp, easing: Easing.in(Easing.cubic) });
  const cur = path(f, [
    [0, 900, 1250],
    [click - 3, 540, 790],
    [click + 20, 560, 810],
  ]);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 41%" }}>
        <Center top={250}>
          <div style={{ width: 960, background: "#000", border: "1px solid #2f3336", borderRadius: 24, padding: "30px 34px", opacity: ease(f, 0, 8), transform: `translateY(${(1 - ease(f, 0, 12)) * 60}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#0b1f33", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Img src={C9("c9_cloud.png")} style={{ width: 66 }} />
              </div>
              <div>
                <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 36, color: "#e7e9ea" }}>Cloud9 Deadlock</div>
                <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 30, color: "#71767b" }}>@C9DLock</div>
              </div>
              <div style={{ marginLeft: "auto", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: 52, color: "#e7e9ea" }}>𝕏</div>
            </div>
            <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 36, lineHeight: 1.35, color: "#e7e9ea", marginTop: 22 }}>
              Greetings from the Cursed Apple
              <br />
              <br />
              The Melee Creeps are on Cloud9.
            </div>
            <div style={{ position: "relative", marginTop: 24, height: 500, borderRadius: 18, overflow: "hidden", border: "1px solid #2f3336" }}>
              <Trailer ss={1230} life={life} />
              <AbsoluteFill style={{ background: `rgba(0,0,0,${0.35 * (1 - ease(f, click, 6))})` }} />
              {f < click + 6 ? (
                <div style={{ position: "absolute", left: "50%", top: "50%", width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: "50%", background: "#1d9bf0", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${(f >= trailerAt ? 1 + 0.08 * Math.sin((f - trailerAt) / 5) : 1) * (f >= click && f < click + 4 ? 0.88 : 1)})`, opacity: 1 - ease(f, click + 2, 4) }}>
                  <svg width={56} height={56} viewBox="0 0 56 56">
                    <path d="M14 8 L50 28 L14 48 Z" fill="#fff" />
                  </svg>
                </div>
              ) : null}
            </div>
          </div>
        </Center>
        <Cursor x={cur.x} y={cur.y} f={f} clicks={[click]} />
      </AbsoluteFill>
      {/* contexto (pedido dele): é o anúncio oficial da line, não um vídeo qualquer */}
      <div style={{ position: "absolute", left: 50, right: 50, top: 1120, display: "flex", alignItems: "center", gap: 22, padding: "18px 26px", background: "rgba(6,14,24,0.94)", border: `3px solid ${C9BLUE}`, boxShadow: `0 0 36px ${C9BLUE}55`, opacity: ease(f, 4, 8) * (1 - ease(f, click + 2, 6)), transform: `translateY(${(1 - ease(f, 4, 12)) * 50}px)` }}>
        <Img src={C9("c9_cloud.png")} style={{ width: 80 }} />
        <div>
          <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: "#9fd3ff" }}>ANÚNCIO OFICIAL · 09/11</div>
          <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 50, color: "#fff", whiteSpace: "nowrap" }}>CLOUD9 ANUNCIA SUA LINE</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ========== 3) o trailer rolando (som do trailer como efeito) ==========
export const C9Trailer: React.FC<{ life: number; ss?: number }> = ({ life, ss = 900 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "blur(34px) brightness(0.45)", transform: "scale(1.25)" }}>
        <Trailer ss={ss} life={life} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: -190, right: -190, top: 470, height: 820, transform: `scale(${1.04 - 0.04 * ease(f, 0, 20)})`, boxShadow: "0 40px 120px #000" }}>
        <Trailer ss={ss} life={life} />
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 220, display: "flex", alignItems: "center", gap: 24, opacity: ease(f, 2, 10), transform: `translateY(${(1 - ease(f, 2, 14)) * -40}px)` }}>
        <Img src={C9("c9_cloud.png")} style={{ width: 120, filter: `drop-shadow(0 0 24px ${C9BLUE})` }} />
        <div>
          <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 6, color: "#9fd3ff" }}>TRAILER DE ANÚNCIO · @C9DLock</div>
          <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 60, lineHeight: 1.02, color: "#fff", textShadow: "0 4px 20px #000" }}>A CLOUD9 ANUNCIOU</div>
          <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 60, lineHeight: 1.02, color: D.amber, textShadow: "0 4px 20px #000" }}>SUA LINE DE DEADLOCK</div>
        </div>
      </div>
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 4) não montaram do zero · contrataram a Melee Creeps · Night Shift, o campeonato independente ==========
export const C9Sign: React.FC<{ life: number; zeroAt?: number; mcAt?: number; nsAt?: number; indAt?: number; gringaAt?: number }> = ({ life, zeroAt = 112, mcAt = 172, nsAt = 280, indAt = 335, gringaAt = 386 }) => {
  const f = useCurrentFrame();
  const swap = ease(f, mcAt - 10, 12);
  return (
    <DlRoom glow="#14304a">
      <Cam f={f} rx={8} z={1 + f * 0.0003}>
        {/* o time do zero (vagas vazias, riscado) */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - swap }}>
          <Center top={260}>
            <Label f={f} at={0} size={34} c={D.dim}>
              MONTAR TIME
            </Label>
          </Center>
          <div style={{ position: "absolute", left: 90, top: 360, width: 900, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 26 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 230, border: `2px dashed ${D.line}`, background: "rgba(20,17,13,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RV, fontSize: 90, color: D.line, opacity: ease(f, 4 + i * 3, 8) }}>
                +
              </div>
            ))}
          </div>
          <Center top={900}>
            <Stamp f={f} at={zeroAt} text="DO ZERO? NÃO" size={80} />
          </Center>
        </div>
        {/* a Melee Creeps (a pasta do trailer com a logo MLC) */}
        {f >= mcAt - 10 ? (
          <div style={{ position: "absolute", inset: 0, opacity: swap }}>
            <Center top={250}>
              <Label f={f} at={mcAt - 6} size={34} c={C9BLUE}>
                CLOUD9 CONTRATOU
              </Label>
            </Center>
            <Center top={320}>
              <DlPanel w={960} h={540} c={D.amber} style={{ overflow: "hidden", transform: `scale(${0.94 + 0.06 * swap})` }}>
                <Sequence from={0} durationInFrames={Math.max(1, life)} layout="none">
                  <OffthreadVideo src={TR} muted startFrom={Math.max(0, Math.round(630 - mcAt * 0.5))} playbackRate={0.5} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Sequence>
              </DlPanel>
            </Center>
            <Center top={890}>
              <DlTitle f={f} at={mcAt} size={110} ls={0.04}>
                MELEE CREEPS
              </DlTitle>
            </Center>
            {f >= nsAt ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: 1040, display: "flex", justifyContent: "center", gap: 22, opacity: ease(f, nsAt, 10), transform: `translateY(${(1 - ease(f, nsAt, 12)) * 40}px)` }}>
                <div style={{ padding: "16px 28px", border: `2px solid ${D.soul}`, background: "rgba(10,30,28,0.9)", fontFamily: RD, fontWeight: 700, fontSize: 40, letterSpacing: 5, color: D.soul }}>NIGHT SHIFT</div>
                {f >= indAt ? <div style={{ padding: "16px 24px", border: `2px solid ${D.line}`, background: D.panel, fontFamily: RD, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: D.cream, opacity: ease(f, indAt, 8), alignSelf: "center" }}>CAMPEONATO INDEPENDENTE</div> : null}
              </div>
            ) : null}
            {f >= gringaAt ? (
              <Center top={1165}>
                <Label f={f} at={gringaAt} size={30} c={D.amber}>
                  ESTADOS UNIDOS · EUROPA
                </Label>
              </Center>
            ) : null}
          </div>
        ) : null}
      </Cam>
      <Flash f={f} ts={[mcAt]} pk={0.12} c={C9BLUE} />
    </DlRoom>
  );
};

// ========== 5) 6 Night Shifts seguidos · desde que a formação fechou, ninguém ganhou deles ==========
export const C9Streak: React.FC<{ life: number; winAt?: number; seqAt?: number; zeroAt?: number; fodaAt?: number }> = ({ life, winAt = 18, seqAt = 70, zeroAt = 147, fodaAt = 211 }) => {
  const f = useCurrentFrame();
  const step = (seqAt - winAt) / 5;
  const z = 1 + punch(f, [fodaAt], 0.06, 12);
  return (
    <DlRoom glow="#3a2a14">
      <Cam f={f} rx={8} z={z}>
        <Center top={240}>
          <DlTitle f={f} at={0} size={60} c={D.dim} font={RD} ls={0.2}>
            NIGHT SHIFT
          </DlTitle>
        </Center>
        <div style={{ position: "absolute", left: 120, top: 340, width: 840, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 10 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const at = winAt + i * step;
            const lit = ease(f, at, 6);
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${1 + punch(f, [at], 0.18, 8)})` }}>
                <Trophy s={210} lit={lit} id={`c9t${i}`} />
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: lit > 0.5 ? D.amber : D.line }}>{lit > 0.5 ? "CAMPEÃO" : "—"}</div>
              </div>
            );
          })}
        </div>
        <Center top={880}>
          <DlTitle f={f} at={seqAt} size={100} c={D.amber}>
            6 SEGUIDOS
          </DlTitle>
        </Center>
        {f >= zeroAt ? (
          <Center top={1030}>
            <DlPanel w={760} c={D.green} style={{ padding: "18px 34px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: ease(f, zeroAt, 8), transform: `translateY(${(1 - ease(f, zeroAt, 12)) * 50}px)` }}>
              <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: D.cream }}>DERROTAS</div>
              <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 96, lineHeight: 1, color: D.green }}>0</div>
            </DlPanel>
          </Center>
        ) : null}
      </Cam>
      <Flash f={f} ts={[fodaAt]} pk={0.14} c={D.amber} />
    </DlRoom>
  );
};

// ========== 6) a line: Saiah, JonJon, AVG, League, Lomein e Zeno (o quadro WELCOME TO CLOUD9 do trailer) ==========
export const C9Roster: React.FC<{ life: number; n1?: number; n2?: number; n3?: number; n4?: number; n5?: number; n6?: number }> = ({ life, n1 = 40, n2 = 63, n3 = 87, n4 = 108, n5 = 126, n6 = 153 }) => {
  const f = useCurrentFrame();
  const names: [string, number][] = [
    ["SAIAH", n1],
    ["JONJON", n2],
    ["AVG", n3],
    ["LEAGUE", n4],
    ["LOMEIN", n5],
    ["ZENO", n6],
  ];
  return (
    <DlRoom glow="#14304a">
      <Cam f={f} rx={6} z={1 + f * 0.0003}>
        <Center top={230}>
          <DlPanel w={1000} h={562} c={C9BLUE} style={{ overflow: "hidden", opacity: ease(f, 0, 8) }}>
            <Trailer ss={1220} life={life} />
          </DlPanel>
        </Center>
        <div style={{ position: "absolute", left: 60, top: 840, width: 960, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {names.map(([n, at], i) => {
            const lit = ease(f, at, 6);
            return (
              <div key={n} style={{ height: 120, background: lit > 0.5 ? "rgba(16,40,64,0.95)" : D.panel, border: `2px solid ${lit > 0.5 ? C9BLUE : D.line}`, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", opacity: 0.35 + 0.65 * Math.max(ease(f, 4 + i * 2, 8) * 0.4, lit), transform: `scale(${1 + punch(f, [at], 0.12, 8)})`, boxShadow: lit > 0.5 ? `0 0 30px ${C9BLUE}66` : undefined }}>
                <Img src={C9("c9_cloud.png")} style={{ width: 54, opacity: lit > 0.5 ? 1 : 0.3 }} />
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 46, color: lit > 0.5 ? "#fff" : D.dim, whiteSpace: "nowrap" }}>{n}</div>
              </div>
            );
          })}
        </div>
      </Cam>
      <Vignette />
    </DlRoom>
  );
};

// ========== 7) o jogo ainda tá em beta · sem campeonato oficial da Valve · mesmo assim a Cloud9 contratou ==========
export const C9Beta: React.FC<{ life: number; betaAt?: number; valveAt?: number; c9At?: number; contAt?: number; proAt?: number }> = ({ life, betaAt = 105, valveAt = 115, c9At = 240, contAt = 264, proAt = 352 }) => {
  const f = useCurrentFrame();
  const sw = ease(f, c9At - 30, 14);
  return (
    <DlRoom glow="#2a1d10">
      <Cam f={f} rx={8} z={1 + f * 0.0003}>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - sw, transform: `translateY(${-sw * 260}px) scale(${1 - sw * 0.25})` }}>
          <Center top={300}>
            <Img src={MG("dl_logo.png")} style={{ width: 700, opacity: ease(f, 0, 10), filter: "drop-shadow(0 10px 30px #000)" }} />
          </Center>
          <Center top={560}>
            <Stamp f={f} at={betaAt} text="AINDA EM BETA" c={D.amber} size={84} rot={-3} />
          </Center>
          {f >= valveAt ? (
            <Center top={760}>
              <DlPanel w={860} style={{ padding: "26px 34px", opacity: ease(f, valveAt, 10) }}>
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: D.dim }}>CAMPEONATO OFICIAL DA VALVE</div>
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 70, color: D.red, marginTop: 6 }}>NENHUM</div>
              </DlPanel>
            </Center>
          ) : null}
        </div>
        {f >= c9At - 30 ? (
          <div style={{ position: "absolute", inset: 0, opacity: sw }}>
            <Center top={380}>
              <Img src={C9("c9_logo_w.png")} style={{ width: 720, transform: `scale(${1.25 - 0.25 * sw})`, filter: `drop-shadow(0 0 40px ${C9BLUE}88)` }} />
            </Center>
            <Center top={900}>
              <Stamp f={f} at={contAt} text="JÁ CONTRATOU" c={C9BLUE} size={84} rot={-4} />
            </Center>
            {f >= proAt ? (
              <Center top={1080}>
                <Label f={f} at={proAt} size={32} c={D.cream}>
                  PRO CENÁRIO PROFISSIONAL
                </Label>
              </Center>
            ) : null}
          </div>
        ) : null}
      </Cam>
    </DlRoom>
  );
};

// ========== 8) lá fora ninguém espera a Valve: a barra "aguardando a Valve" e o botão FAZER NA RAÇA ==========
export const C9Raca: React.FC<{ life: number; espAt?: number; fazAt?: number; racaAt?: number }> = ({ life, espAt = 72, fazAt = 118, racaAt = 168 }) => {
  const f = useCurrentFrame();
  const click = fazAt + 6;
  const fill = f < click ? 0.04 + 0.01 * Math.sin(f / 9) : interpolate(f, [click, click + 18], [0.05, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cur = path(f, [
    [fazAt - 26, 980, 1300],
    [click - 2, 560, 925],
    [click + 30, 600, 970],
  ]);
  return (
    <DlRoom glow="#14304a">
      <Cam f={f} rx={8} z={1 + f * 0.0003}>
        <Center top={260}>
          <DlTitle f={f} at={0} size={62} c={D.dim} font={RD} ls={0.2}>
            LÁ FORA
          </DlTitle>
        </Center>
        <Center top={460}>
          <DlPanel w={900} c={fill > 0.95 ? D.green : D.line} style={{ padding: "34px 40px", opacity: ease(f, espAt - 18, 10) }}>
            <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: fill > 0.95 ? D.green : D.cream }}>{fill > 0.95 ? "CENÁRIO ACONTECENDO" : "AGUARDANDO A VALVE..."}</div>
            <div style={{ marginTop: 22, height: 34, background: "#000", border: `2px solid ${D.line}` }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: fill > 0.95 ? D.green : `linear-gradient(90deg, ${D.amber}, #a8671a)` }} />
            </div>
            <div style={{ marginTop: 14, fontFamily: RD, fontWeight: 600, fontSize: 28, color: D.dim }}>{Math.round(fill * 100)}%</div>
          </DlPanel>
        </Center>
        {f >= fazAt - 20 ? (
          <Center top={880}>
            <div style={{ padding: "26px 70px", background: f >= click ? "#2d4a2a" : `linear-gradient(180deg, ${D.amber}, #a8671a)`, border: `3px solid ${f >= click ? D.green : D.amber}`, fontFamily: RD, fontWeight: 700, fontSize: 46, letterSpacing: 6, color: f >= click ? D.green : "#1a1006", opacity: ease(f, fazAt - 20, 8), transform: `scale(${f >= click && f < click + 4 ? 0.94 : 1})`, boxShadow: `0 0 40px ${D.amber}55` }}>
              FAZER NA RAÇA
            </div>
          </Center>
        ) : null}
        <Center top={1080}>
          <Stamp f={f} at={racaAt} text="NA RAÇA" c={D.amber} size={96} rot={-5} />
        </Center>
        {f >= fazAt - 26 ? <Cursor x={cur.x} y={cur.y} f={f} clicks={[click]} /> : null}
      </Cam>
      <Flash f={f} ts={[racaAt]} pk={0.14} c={D.amber} />
    </DlRoom>
  );
};

// ========== 9) aqui no Brasil tá quieto · responsabilidade minha · fazer barulho ==========
export const C9Brasil: React.FC<{ life: number; quietAt?: number; respAt?: number; barAt?: number }> = ({ life, quietAt = 75, respAt = 165, barAt = 289 }) => {
  const f = useCurrentFrame();
  const loud = ease(f, barAt, 6);
  const bars = Array.from({ length: 24 }).map((_, i) => {
    const q = 6 + Math.abs(Math.sin(f / 7 + i)) * 4;
    const l = 40 + Math.abs(Math.sin(f / 3 + i * 1.7)) * 330 * (0.55 + 0.45 * Math.abs(Math.sin(i * 0.9)));
    return q + (l - q) * loud;
  });
  const sh = shake(f, barAt, 18, 14, "c9b");
  return (
    <DlRoom glow="#16301c">
      <Cam f={f} rx={8} z={1 + punch(f, [barAt], 0.06, 12)} x={sh.x} y={sh.y}>
        <Center top={250}>
          <DlTitle f={f} at={0} size={110} c={D.green}>
            BRASIL
          </DlTitle>
        </Center>
        <Center top={400}>
          <Label f={f} at={8} size={30} c={D.dim}>
            CENÁRIO COMPETITIVO
          </Label>
        </Center>
        {/* medidor de barulho: chão quase parado → explode no "barulho" */}
        <div style={{ position: "absolute", left: 90, top: 520, width: 900, height: 400, display: "flex", alignItems: "flex-end", gap: 10, opacity: ease(f, 6, 10) }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, height: h, background: loud > 0.3 ? (h > 300 ? D.red : h > 200 ? D.amber : D.green) : D.line, boxShadow: loud > 0.3 ? `0 0 16px ${D.amber}66` : undefined }} />
          ))}
        </div>
        {f >= quietAt && f < barAt ? (
          <Center top={950}>
            <Label f={f} at={quietAt} size={40} c={D.dim}>
              TUDO MUITO QUIETO
            </Label>
          </Center>
        ) : null}
        {f >= respAt ? (
          <div style={{ position: "absolute", left: 90, top: 1090, display: "flex", alignItems: "center", gap: 26, opacity: ease(f, respAt, 10), transform: `translateX(${(1 - ease(f, respAt, 14)) * -80}px)` }}>
            <Img src={BLIES} style={{ width: 150, height: 150, borderRadius: "50%", objectFit: "cover", border: `4px solid ${D.amber}` }} />
            <div>
              <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: D.amber }}>RESPONSABILIDADE</div>
              <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 66, color: D.cream }}>MINHA</div>
            </div>
          </div>
        ) : null}
        {f >= barAt ? (
          <Center top={940}>
            <Stamp f={f} at={barAt} text="BARULHO" c={D.red} size={78} rot={-4} />
          </Center>
        ) : null}
      </Cam>
    </DlRoom>
  );
};

// ========== 10) o campeonato: criar · quem sabe esse mês · montar times · transmitir na live ==========
export const C9Champ: React.FC<{ life: number; campAt?: number; mesAt?: number; timesAt?: number; liveAt?: number }> = ({ life, campAt = 132, mesAt = 237, timesAt = 369, liveAt = 411 }) => {
  const f = useCurrentFrame();
  const Row: React.FC<{ at: number; k: string; children: React.ReactNode }> = ({ at, k, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "22px 0", borderTop: `1px solid ${D.line}`, opacity: ease(f, at, 10), transform: `translateX(${(1 - ease(f, at, 12)) * 60}px)` }}>
      <div style={{ width: 230, fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: D.dim }}>{k}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
  const nTimes = f < timesAt ? 0 : Math.min(8, 1 + Math.floor((f - timesAt) / 3));
  return (
    <DlRoom glow="#3a2a14">
      <Cam f={f} rx={8} z={1 + f * 0.0002}>
        <Center top={240}>
          <DlTitle f={f} at={campAt - 30} size={62} ls={0.04}>
            CRIAR CAMPEONATO
          </DlTitle>
        </Center>
        <Center top={380}>
          <DlPanel w={940} c={D.amber} style={{ padding: "16px 40px 24px", opacity: ease(f, campAt - 24, 10) }}>
            <Row at={campAt} k="JOGO">
              <Img src={MG("dl_logo.png")} style={{ height: 56 }} />
            </Row>
            <Row at={mesAt - 10} k="QUANDO">
              <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 54, color: D.cream }}>
                ESSE MÊS<span style={{ color: D.amber, opacity: Math.floor(f / 10) % 2 ? 0.4 : 1 }}>?</span>
              </div>
            </Row>
            <Row at={timesAt - 6} k="TIMES">
              <div style={{ display: "flex", gap: 10 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ width: 62, height: 62, border: `2px solid ${i < nTimes ? D.amber : D.line}`, background: i < nTimes ? "rgba(232,163,61,0.18)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RD, fontWeight: 700, fontSize: 26, color: i < nTimes ? D.amber : D.line }}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </Row>
            <Row at={liveAt - 6} k="TRANSMISSÃO">
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ padding: "6px 16px", background: "#fe2c55", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: 32, color: "#fff", borderRadius: 6, opacity: f >= liveAt ? 0.6 + 0.4 * Math.sin(f / 5) : 1 }}>LIVE</div>
                <Img src={BLIES} style={{ width: 70, height: 70, borderRadius: "50%", objectFit: "cover" }} />
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 48, color: D.cream }}>BLIES</div>
              </div>
            </Row>
          </DlPanel>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// ========== 11) procurando jogadores · quem se considera bom · vários times · treinar, montar time, evoluir ==========
export const C9Recruit: React.FC<{ life: number; bomAt?: number; variosAt?: number; treinarAt?: number; montarAt?: number; evoluirAt?: number }> = ({ life, bomAt = 66, variosAt = 141, treinarAt = 333, montarAt = 351, evoluirAt = 393 }) => {
  const f = useCurrentFrame();
  const rows = f < variosAt ? 1 : Math.min(3, 1 + Math.floor((f - variosAt) / 6));
  const listAt = treinarAt - 30;
  const up = ease(f, listAt, 14);
  const items: [string, number][] = [
    ["TREINAR", treinarAt],
    ["MONTAR UM TIME", montarAt],
    ["EVOLUIR DE VERDADE", evoluirAt],
  ];
  return (
    <DlRoom glow="#1d3a36">
      <Cam f={f} rx={8} z={1 + f * 0.0002}>
        <Center top={230}>
          <DlTitle f={f} at={0} size={56} c={D.soul} ls={0.03}>
            PROCURANDO JOGADORES
          </DlTitle>
        </Center>
        <div style={{ position: "absolute", left: 80, top: 380, width: 920, opacity: 1 - up * 0.75, transform: `scale(${1 - up * 0.2})`, transformOrigin: "50% 0" }}>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} style={{ display: "flex", gap: 14, marginBottom: 18, opacity: r === 0 ? ease(f, 6, 10) : ease(f, variosAt + (r - 1) * 6, 8) }}>
              <div style={{ width: 150, display: "flex", alignItems: "center", fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: D.dim }}>TIME {r + 1}</div>
              {Array.from({ length: 6 }).map((_, i) => {
                const on = r === 0 && f >= bomAt + i * 4;
                return (
                  <div key={i} style={{ flex: 1, height: 110, border: `2px solid ${on ? D.soul : D.line}`, background: on ? "rgba(10,40,36,0.9)" : "rgba(20,17,13,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RV, fontWeight: 700, fontSize: 56, color: on ? D.soul : D.line }}>
                    ?
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {f >= listAt ? (
          <Center top={760}>
            <DlPanel w={900} c={D.soul} style={{ padding: "18px 40px", opacity: up, transform: `translateY(${(1 - up) * 80}px)` }}>
              {items.map(([t, at]) => {
                const ok = ease(f, at, 6);
                return (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 26, padding: "18px 0" }}>
                    <div style={{ width: 66, height: 66, border: `3px solid ${ok > 0.5 ? D.soul : D.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {ok > 0 ? (
                        <svg width={46} height={46} viewBox="0 0 46 46">
                          <path d="M6 24 L18 36 L40 10" fill="none" stroke={D.soul} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ok} />
                        </svg>
                      ) : null}
                    </div>
                    <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 56, color: ok > 0.5 ? D.cream : D.dim }}>{t}</div>
                  </div>
                );
              })}
            </DlPanel>
          </Center>
        ) : null}
      </Cam>
    </DlRoom>
  );
};

// ========== 12) entra no Discord das Ratazanas pelo bio.blies.live · lá a gente monta os times e começa os treinos ==========
export const C9Discord: React.FC<{ life: number; discAt?: number; oficialAt?: number; timesAt?: number; treinosAt?: number }> = ({ life, discAt = 12, oficialAt = 93, timesAt = 252, treinosAt = 282 }) => {
  const f = useCurrentFrame();
  const click = oficialAt + 6;
  const inside = ease(f, click + 14, 12);
  const cur = path(f, [
    [discAt, 980, 1250],
    [click - 2, 820, 560],
    [click + 30, 860, 600],
  ]);
  const chans: [string, number][] = [
    ["geral", -1],
    ["montar-times", timesAt],
    ["treinos", treinosAt],
    ["campeonato", -1],
  ];
  return (
    <AbsoluteFill style={{ background: "#0c0d10", overflow: "hidden" }}>
      {/* 10/11: gameplay do Night Shift desfocado atrás (a tela do Discord sozinha ficava parada) */}
      <Sequence from={0} durationInFrames={Math.max(1, life)} layout="none">
        <AbsoluteFill style={{ filter: "blur(16px) brightness(0.32) saturate(1.2)", transform: `scale(${1.2 + f * 0.0008})` }}>
          <OffthreadVideo src={C9("ns_replay.mp4")} muted startFrom={60} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </Sequence>
      <Cam f={f} rx={6} z={1}>
        <Center top={300}>
          <div style={{ width: 920, padding: 40, borderRadius: 16, background: "#2b2d31", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", opacity: ease(f, discAt - 6, 10) * (1 - inside), transform: `translateY(${(1 - ease(f, discAt, 12)) * 80 - inside * 260}px)` }}>
            <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 26, color: "#b5bac1", letterSpacing: 1 }}>VOCÊ FOI CONVIDADO PARA UM SERVIDOR</div>
            <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 28 }}>
              <div style={{ width: 120, height: 120, borderRadius: 30, background: "#111214", overflow: "hidden" }}>
                <Img src={R("cl/ratazanas.png")} style={{ width: 120 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 44, color: "#f2f3f5", whiteSpace: "nowrap" }}>Ratazanas do Deadlock</div>
                <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 30, color: "#b5bac1", marginTop: 6 }}>Discord oficial do Blies</div>
              </div>
              <div style={{ padding: "22px 40px", borderRadius: 10, background: f >= click ? "#248046" : "#5865f2", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 36, color: "#fff", transform: `scale(${f >= click && f < click + 4 ? 0.95 : 1})` }}>{f >= click ? "Entrou" : "Entrar"}</div>
            </div>
          </div>
        </Center>
        {/* dentro do servidor: os canais que importam acendem */}
        {inside > 0 ? (
          <div style={{ position: "absolute", left: 90, top: 260, width: 900, opacity: inside, transform: `translateY(${(1 - inside) * 60}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 26 }}>
              <Img src={R("cl/ratazanas.png")} style={{ width: 96, height: 96, borderRadius: 24 }} />
              <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 46, color: "#f2f3f5" }}>Ratazanas do Deadlock</div>
            </div>
            {chans.map(([c, at]) => {
              const on = at > 0 && f >= at;
              return (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 22px", marginBottom: 8, borderRadius: 10, background: on ? "#404249" : "transparent", transform: `scale(${on ? 1 + punch(f, [at], 0.06, 8) : 1})`, transformOrigin: "0 50%" }}>
                  <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 50, color: on ? "#f2f3f5" : "#80848e" }}>#</div>
                  <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: on ? 700 : 400, fontSize: 44, color: on ? "#f2f3f5" : "#80848e" }}>{c}</div>
                </div>
              );
            })}
          </div>
        ) : null}
        {f >= discAt && f < click + 30 ? <Cursor x={cur.x} y={cur.y} f={f} clicks={[click]} /> : null}
      </Cam>
      <Vignette />
      <LinkBar f={f} at={0} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 13) manda pro amigo que se acha pro player · perdeu CS, LoL e Valorant · no Deadlock pode ser a chance ==========
export const C9Friend: React.FC<{ life: number; proAt?: number; csAt?: number; lolAt?: number; valAt?: number; dlAt?: number; nextAt?: number }> = ({ life, proAt = 72, csAt = 213, lolAt = 261, valAt = 279, dlAt = 318, nextAt = 447 }) => {
  const f = useCurrentFrame();
  const share = 1 - ease(f, csAt - 30, 12);
  const games = ease(f, csAt - 22, 12) * (1 - ease(f, nextAt - 24, 12));
  const strike = (at: number) => interpolate(f, [dlAt - 6, dlAt + 6], [0, 1], clamp) * (f >= at ? 1 : 0);
  return (
    <DlRoom glow="#2a1d10">
      <Cam f={f} rx={6} z={1 + f * 0.0002}>
        {/* 1) enviar pro amigo (a folha de compartilhar) */}
        {share > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: share }}>
            <Center top={330}>
              <div style={{ width: 920, padding: "34px 40px", borderRadius: 30, background: "#1f1f23", boxShadow: "0 30px 80px #000", opacity: ease(f, 0, 8), transform: `translateY(${(1 - ease(f, 0, 14)) * 120}px)` }}>
                <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 36, color: "#fff", textAlign: "center" }}>Enviar para</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 46, marginTop: 34 }}>
                  {["amigo", "seu duo", "aquele lá"].map((n, i) => (
                    <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 150, height: 150, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg, #2a4a6a, #142334)" : "linear-gradient(135deg, #3a3f4a, #20242b)", border: i === 0 && f >= 14 ? "5px solid #fe2c55" : "2px solid #4a505c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {i === 0 && f >= 14 ? (
                          <svg width={70} height={70} viewBox="0 0 46 46">
                            <path d="M6 24 L18 36 L40 10" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </div>
                      <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 30, color: "rgba(255,255,255,0.8)" }}>{n}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Center>
            <Center top={870}>
              <Stamp f={f} at={proAt} text="SE ACHA PRO PLAYER" c={D.amber} size={70} rot={-4} />
            </Center>
          </div>
        ) : null}
        {/* 2) as chances que passaram: CS, LoL, Valorant (riscadas) → Deadlock */}
        {games > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: games }}>
            <Center top={250}>
              <Label f={f} at={csAt - 20} size={34} c={D.dim}>
                A CHANCE QUE PASSOU
              </Label>
            </Center>
            <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 26 }}>
              <GameCard f={f} at={csAt} logo={MG("cs_logo.png")} name="CS" out={strike(csAt)} w={290} white />
              <GameCard f={f} at={lolAt} logo={MG("lol_logo.png")} name="LOL" out={strike(lolAt)} w={290} />
              <GameCard f={f} at={valAt} logo={C9("val_logo.png")} name="VALORANT" out={strike(valAt)} w={290} />
            </div>
            {f >= dlAt ? (
              <Center top={680}>
                <div style={{ opacity: ease(f, dlAt, 10), transform: `scale(${1.3 - 0.3 * ease(f, dlAt, 14)})`, filter: `drop-shadow(0 0 ${30 + 10 * Math.sin(f / 6)}px ${D.soul})` }}>
                  <Img src={MG("dl_logo.png")} style={{ width: 760 }} />
                </div>
              </Center>
            ) : null}
            {f >= dlAt + 30 ? (
              <Center top={960}>
                <Label f={f} at={dlAt + 30} size={40} c={D.soul}>
                  AMASSANDO AQUI
                </Label>
              </Center>
            ) : null}
          </div>
        ) : null}
        {/* 3) o próximo pro player */}
        {f >= nextAt - 24 ? (
          <div style={{ position: "absolute", inset: 0, opacity: ease(f, nextAt - 24, 12) }}>
            <Center top={330}>
              <DlPanel w={620} h={760} c={D.amber} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, boxShadow: `0 0 60px ${D.amber}44, 0 30px 80px #000`, transform: `rotateY(${(1 - ease(f, nextAt - 20, 20)) * 70}deg)` }}>
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: D.amber }}>PRÓXIMO PRO PLAYER</div>
                <div style={{ width: 300, height: 300, borderRadius: "50%", border: `4px solid ${D.amber}`, background: "radial-gradient(circle at 50% 40%, #3a2a14, #0b0a08)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RV, fontWeight: 700, fontSize: 180, color: D.amber }}>?</div>
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 72, color: D.cream }}>SEU AMIGO</div>
                <Img src={MG("dl_logo.png")} style={{ width: 300, opacity: 0.85 }} />
              </DlPanel>
            </Center>
          </div>
        ) : null}
      </Cam>
      <Flash f={f} ts={[dlAt]} pk={0.12} c={D.soul} />
    </DlRoom>
  );
};

// ========== 14) vamos fazer na raça · no Brasil · eu vou ser o pioneiro · bater nessa tecla (a tecla batendo) ==========
export const C9Pioneer: React.FC<{ life: number; racaAt?: number; brAt?: number; pioAt?: number; batAt?: number; teclaAt?: number; muitoAt?: number }> = ({ life, racaAt = 87, brAt = 123, pioAt = 158, batAt = 191, teclaAt = 207, muitoAt = 221 }) => {
  const f = useCurrentFrame();
  const hits = [batAt, teclaAt, muitoAt];
  const down = hits.some((h) => f >= h && f < h + 5);
  const z = 1 + punch(f, hits, 0.04, 8);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.2 + f * 0.0006})`, filter: "brightness(0.32)" }}>
        <Trailer ss={1000} life={life} />
      </AbsoluteFill>
      <Cam f={f} rx={6} z={z}>
        <Center top={280}>
          <DlTitle f={f} at={racaAt} size={120} c={D.amber}>
            NA RAÇA
          </DlTitle>
        </Center>
        <Center top={430}>
          <DlTitle f={f} at={brAt} size={96} c={D.green}>
            NO BRASIL
          </DlTitle>
        </Center>
        <Center top={570}>
          <Stamp f={f} at={pioAt} text="PIONEIRO" c={D.cream} size={84} rot={-3} />
        </Center>
        {f >= batAt - 16 ? (
          <Center top={830}>
            <div style={{ opacity: ease(f, batAt - 16, 8), perspective: 900 }}>
              <div style={{ width: 560, height: 230, borderRadius: 26, background: "linear-gradient(180deg, #2a241c, #14110d)", border: `4px solid ${down ? D.amber : D.line}`, boxShadow: down ? `0 6px 0 #000, 0 0 60px ${D.amber}88` : "0 22px 0 #000, 0 30px 60px #000", transform: `translateY(${down ? 16 : 0}px) rotateX(18deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 64, color: down ? D.amber : D.cream, letterSpacing: 4, whiteSpace: "nowrap" }}>DEADLOCK BR</div>
              </div>
            </div>
          </Center>
        ) : null}
      </Cam>
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};
