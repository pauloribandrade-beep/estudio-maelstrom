// =================================================================================================
// HL3 · personagens da ilustração chapada (v2, 31/10/2026). O Paulo achou a v1 tosca ("o Dog tá muito mal feito, a Alyx
// tosca"): aqui com proporção, luz e sombra em facetas, rosto de perfil e contorno escuro (filtro "ink" do Defs).
// Todos de perfil para a direita; d = -1 vira. Pés em (0,0).
// =================================================================================================
import React from "react";
import { pts, Pt } from "./hl3r27";

const L = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const Shadow: React.FC<{ rx: number }> = ({ rx }) => <ellipse cx={0} cy={2} rx={rx} ry={rx * 0.2} fill="#5d7a90" opacity={0.45} />;

// membro que afina: cápsula de a (meia-largura w0) até b (meia-largura w1)
export const limb = (a: Pt, b: Pt, w0: number, w1: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  return `M ${a[0] + nx * w0} ${a[1] + ny * w0} L ${b[0] + nx * w1} ${b[1] + ny * w1} A ${w1} ${w1} 0 0 0 ${b[0] - nx * w1} ${b[1] - ny * w1} L ${a[0] - nx * w0} ${a[1] - ny * w0} A ${w0} ${w0} 0 0 0 ${a[0] + nx * w0} ${a[1] + ny * w0} Z`;
};
const ang = (a: Pt, b: Pt) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

// mão de perfil. Coordenadas locais: x ao longo do antebraço, a palma e o polegar para -y (a frente do corpo quando o braço pende).
// pose "open" = solta com os dedos meio dobrados; "fist" = fechada. glove: cor da luva; fingerless deixa os dedos de fora.
export const SideHand: React.FC<{ at: Pt; a: number; u: number; sk: string; skD: string; skL: string; pose?: "open" | "fist"; glove?: string; fingerless?: boolean; fy?: number }> = ({ at, a, u, sk, skD, skL, pose = "open", glove, fingerless, fy = 1 }) => {
  const full = glove && !fingerless;
  const c = full ? glove! : sk, cd = full ? "#0e1012" : skD;
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${a}) scale(${u} ${u * fy})`}>
      {pose === "open" ? (
        <g>
          <path d="M 0 4.6 C 4 5.6 8 5.9 11 5.3 Q 15.6 4.7 17 1.6 Q 17.8 -1.8 14.6 -2.7 Q 11.6 -3.1 9.6 -2.5 L 6 -4.7 Q 2.5 -5.7 0 -4.6 Z" fill={c} />
          <path d="M 11.2 5 Q 13.2 2.8 13 0 M 14.2 4 Q 15.3 2 15.2 -0.6" fill="none" stroke={cd} strokeWidth={0.7} strokeLinecap="round" />
          <path d="M 2.5 4.8 Q 7 5.8 10.8 5" fill="none" stroke={full ? "#3a3e44" : skL} strokeWidth={0.9} strokeLinecap="round" opacity={0.8} />
          {glove && fingerless ? <path d="M 0 4.6 C 4 5.6 8 5.9 10.7 5.4 L 9.8 -2.4 L 6 -4.7 Q 2.5 -5.7 0 -4.6 Z" fill={glove} /> : null}
          <path d="M 3 -4.6 Q 7 -8.6 11.2 -6.6 Q 12.2 -5 9.8 -4 Q 6.6 -3.3 4.4 -3.5 Z" fill={glove && fingerless ? sk : c} />
          {glove && fingerless ? <path d="M 3 -4.6 Q 5.6 -7.4 8.2 -7.2 L 7.6 -3.6 Q 5.6 -3.4 4.4 -3.5 Z" fill={glove} /> : null}
          <path d="M 4 -3.6 Q 7 -4.6 10 -4.4" fill="none" stroke={cd} strokeWidth={0.6} opacity={0.8} />
        </g>
      ) : (
        <g>
          <path d="M 0 5 L 8.5 5.6 Q 13.6 5.8 14.6 1.4 L 14.2 -3.8 Q 12.4 -6.6 8 -6.2 L 2 -5.2 Q 0 -5 0 -4.4 Z" fill={c} />
          {glove && fingerless ? <path d="M 0 5 L 8.5 5.6 L 8 -6.2 L 2 -5.2 Q 0 -5 0 -4.4 Z" fill={glove} /> : null}
          <path d="M 11 5.4 L 11 -5.6 M 13.4 3.6 L 13.4 -4.4" fill="none" stroke={cd} strokeWidth={0.6} opacity={0.8} />
          <path d="M 4.6 -6 Q 10 -7.8 12.8 -5" fill="none" stroke={glove && fingerless ? sk : c} strokeWidth={3.2} strokeLinecap="round" />
          <path d="M 2.5 5 Q 7 6 10.5 5.4" fill="none" stroke={full ? "#3a3e44" : skL} strokeWidth={0.9} strokeLinecap="round" opacity={0.8} />
        </g>
      )}
    </g>
  );
};

// braço de perfil: ombro, cotovelo, pulso. Manga cheia no ombro, afinando até o punho, dobra no cotovelo, punho da manga, mão.
export const SideArm: React.FC<{ sh: Pt; el: Pt; wr: Pt; w: number; c: string; cl: string; cd: string; cuff?: string; sk: string; skD: string; skL: string; pose?: "open" | "fist"; glove?: string; fingerless?: boolean; fy?: number }> = (p) => {
  const { sh, el, wr, w, c, cl, cd } = p;
  const dx = el[0] - sh[0], dy = el[1] - sh[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const cf: Pt = L(el, wr, 0.8);
  return (
    <g>
      {/* a sombra que o braço joga no corpo, separando a manga do tronco */}
      <path d={limb([sh[0] - 2.5 * w, sh[1] + 2 * w], [el[0] - 2.5 * w, el[1] + 1.5 * w], 8.6 * w, 6.8 * w)} fill="#000" opacity={0.28} />
      <path d={limb([el[0] - 2.5 * w, el[1] + 1.5 * w], [L(el, wr, 0.8)[0] - 2.5 * w, L(el, wr, 0.8)[1]], 6.8 * w, 5.4 * w)} fill="#000" opacity={0.22} />
      <path d={limb(sh, el, 8.6 * w, 6.8 * w)} fill={c} />
      <path d={limb(el, wr, 6.8 * w, 5 * w)} fill={c} />
      {/* luz na frente do braço e a dobra do cotovelo */}
      <path d={`M ${sh[0] - nx * 5 * w} ${sh[1] - ny * 5 * w} L ${el[0] - nx * 4 * w} ${el[1] - ny * 4 * w}`} stroke={cl} strokeWidth={2.6 * w} strokeLinecap="round" opacity={0.75} />
      <path d={`M ${el[0] + nx * 4 * w} ${el[1] + ny * 4 * w} q ${-nx * 3 * w + dx * 0.05} ${-ny * 3 * w + dy * 0.05} ${-nx * 6 * w} ${-ny * 6 * w + 3 * w}`} fill="none" stroke={cd} strokeWidth={1.4 * w} strokeLinecap="round" opacity={0.8} />
      <path d={`M ${L(sh, el, 0.55)[0] + nx * 6 * w} ${L(sh, el, 0.55)[1] + ny * 6 * w} l ${-nx * 4 * w} ${-ny * 4 * w}`} stroke={cd} strokeWidth={1.1 * w} strokeLinecap="round" opacity={0.6} />
      {p.cuff ? <path d={limb(cf, wr, 5.6 * w, 5.4 * w)} fill={p.cuff} /> : null}
      <SideHand at={wr} a={ang(el, wr)} u={w * 1.05} sk={p.sk} skD={p.skD} skL={p.skL} pose={p.pose} glove={p.glove} fingerless={p.fingerless} fy={p.fy} />
    </g>
  );
};


// contorno escuro dos personagens (colocar dentro de um <defs>)
export const InkFilter: React.FC = () => (
  <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
    <feMorphology in="SourceAlpha" operator="dilate" radius={2.2} result="d" />
    <feFlood floodColor="#151b26" />
    <feComposite in2="d" operator="in" result="o" />
    <feMerge>
      <feMergeNode in="o" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

// ---------------------------------------------------------------------------------------------- Alyx
// Referência: Alyx no HL2/Ep2. Cabelo escuro preso com o rabo atrás, a faixa larga marrom-avermelhada, moletom cinza-azulado
// com o capuz caído nas costas, jaqueta curta de couro marrom com a gola de lã creme, jeans, botas, luvas sem dedo.
// arm: 0 solto, 1 segurando o aparelho à frente, 2 abraçando
export const AlyxSide: React.FC<{ x: number; y: number; s: number; d?: number; ph?: number; amp?: number; arm?: number; dev?: number; f: number }> = ({ x, y, s, d = 1, ph = 0, amp = 0, arm = 0, dev = 0, f }) => {
  const JK = "#5c3a28", JKL = "#7c5238", JKD = "#3e271b", FL = "#e8dcc4", FLD = "#c8b898", HD = "#9ca7b2", HDD = "#77828e";
  const JE = "#46668e", JEL = "#5a7ca4", JED = "#30496a", SK = "#b8805e", SKL = "#cc9474", SKD = "#93603f", HR = "#1b1411", HB = "#5e2a22";
  const bob = -Math.abs(Math.sin(ph)) * 4 * amp;
  const leg = (k: number) => {
    const q = ph + k * Math.PI, sw = Math.sin(q) * 0.42 * amp;
    const hip: Pt = [k ? 5 : -2, -104 + bob];
    const knee: Pt = [hip[0] + Math.sin(sw) * 44 + 4, -56 - Math.max(0, Math.cos(q)) * 5 * amp];
    const ank: Pt = [knee[0] + Math.sin(sw * 0.5 - 0.1) * 32 - 2, -12 + Math.max(0, -Math.sin(q + 0.6)) * -4 * amp];
    const c = k ? JE : JED, cl = k ? JEL : JE;
    return (
      <g key={k}>
        <polygon points={pts([[hip[0] - 12, hip[1]], [hip[0] + 12, hip[1]], [knee[0] + 9, knee[1]], [knee[0] - 9, knee[1]]])} fill={c} />
        <polygon points={pts([[hip[0] + 4, hip[1]], [hip[0] + 12, hip[1]], [knee[0] + 9, knee[1]], [knee[0] + 3, knee[1]]])} fill={cl} />
        <polygon points={pts([[knee[0] - 9, knee[1]], [knee[0] + 9, knee[1]], [ank[0] + 8, ank[1]], [ank[0] - 8, ank[1]]])} fill={c} />
        <polyline points={pts([[knee[0] - 4, knee[1] - 4], [knee[0] + 6, knee[1] + 2]])} stroke={JED} strokeWidth={2} opacity={0.7} />
        {/* bota */}
        <polygon points={pts([[ank[0] - 10, ank[1] - 12], [ank[0] + 9, ank[1] - 12], [ank[0] + 11, ank[1] - 2], [ank[0] + 26, ank[1] + 4], [ank[0] + 27, ank[1] + 12], [ank[0] - 11, ank[1] + 12]])} fill={k ? "#4a3226" : "#33231a"} />
        <rect x={ank[0] - 11} y={ank[1] + 9} width={38} height={4} fill="#1a1310" />
        <polyline points={pts([[ank[0] + 2, ank[1] - 8], [ank[0] + 12, ank[1]]])} stroke="#7a5a44" strokeWidth={2} />
      </g>
    );
  };
  const sw = Math.sin(ph) * amp;
  const hand: Pt = arm === 1 ? [46, -146] : arm === 2 ? [50, -160] : [7 + sw * 20, -104 + Math.abs(sw) * 3];
  const elb: Pt = arm === 1 ? [20, -138] : arm === 2 ? [24, -150] : [4 + sw * 8, -136];
  const sh: Pt = [4, -168];
  return (
    <g transform={`translate(${x} ${y}) scale(${s * d} ${s})`} filter="url(#ink)">
      <Shadow rx={36} />
      {leg(0)}
      {/* braço de trás */}
      {Math.abs(sw) > 0.2 || arm === 2 ? <SideArm sh={[-2, -168 + bob]} el={[-3 - sw * 8, -136 + bob]} wr={[0 - sw * 20, -104 + bob + Math.abs(sw) * 3]} w={0.95} c={JKD} cl={JK} cd="#2a1a12" cuff={HDD} sk={SKD} skD="#6e4a30" skL={SK} glove="#1c1714" fingerless /> : null}
      {leg(1)}
      <g transform={`translate(0 ${bob})`}>
        {/* barra do moletom e o cinto */}
        <polygon points={pts([[-18, -100], [18, -100], [20, -114], [-19, -114]])} fill={HDD} />
        <rect x={-19} y={-108} width={39} height={6} fill="#2a2020" />
        <rect x={8} y={-108} width={7} height={6} fill="#b0a878" />
        {/* jaqueta de couro */}
        <polygon points={pts([[-19, -112], [21, -112], [24, -150], [20, -172], [6, -182], [-10, -182], [-21, -172]])} fill={JK} />
        <polygon points={pts([[-19, -112], [-7, -112], [-5, -180], [-10, -182], [-21, -172]])} fill={JKD} />
        <polygon points={pts([[12, -112], [21, -112], [24, -150], [16, -150]])} fill={JKL} opacity={0.75} />
        <polyline points={pts([[-12, -150], [6, -146], [22, -150]])} fill="none" stroke={JKD} strokeWidth={2.5} />
        <rect x={-14} y={-134} width={16} height={3} fill={JKD} />
        {/* gola de lã creme virada sobre o peito */}
        <polygon points={pts([[4, -184], [20, -178], [24, -162], [14, -150], [10, -166]])} fill={FL} />
        <polygon points={pts([[14, -150], [24, -162], [22, -152]])} fill={FLD} />
        <polygon points={pts([[-12, -184], [4, -186], [6, -178], [-14, -176]])} fill={FL} />
        {/* o capuz do moletom caído nas costas */}
        <path d="M-26 -176 q -6 -14 6 -20 q 12 -4 20 4 l -2 14 q -12 4 -24 2 z" fill={HD} />
        <path d="M-24 -178 q 2 -10 12 -12" fill="none" stroke={HDD} strokeWidth={3} />
        {/* pescoço */}
        <polygon points={pts([[-3, -197], [9, -194], [11, -180], [-1, -180]])} fill={SK} />
        <polygon points={pts([[-3, -197], [3, -195], [4, -180], [-1, -180]])} fill={SKD} />
        <path d="M2 -194 q 4 3 9 2" fill="none" stroke={SKD} strokeWidth={1.4} opacity={0.7} />
        <circle cx={13} cy={-177} r={2.2} fill="#c9c2b0" />
        <path d="M6 -183 q 4 4 7 6" fill="none" stroke="#2a2420" strokeWidth={0.9} />
        {/* cabeça: um só perfil, testa inclinada, sobrancelha, nariz reto, lábios, queixo pequeno */}
        <path d="M-7 -199 C -15 -205 -15 -224 -3 -229 C 7 -232 15 -228 17.5 -222 L 18.6 -215.5 Q 19.8 -213.6 20.3 -212 L 19.4 -209.6 L 24 -202.6 Q 24.3 -201.4 23 -201.2 L 20.8 -200.6 L 21.6 -198.6 L 20.6 -197.4 L 21.4 -196 L 19.8 -194.4 Q 21 -191.4 17.6 -190.2 Q 12 -189.6 7 -192.4 L 1.5 -196 Z" fill={SK} />
        {/* luz na testa e na maçã do rosto, sombra sob a mandíbula */}
        <path d="M11 -224 q 5 2 6.6 8" fill="none" stroke={SKL} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M11.5 -205 q 3 -1 5.5 0.6 q -2 2.6 -5.5 1.2 z" fill={SKL} opacity={0.45} />
        <path d="M1.5 -196 L 7 -192.4 Q 12 -189.6 17.6 -190.2 Q 12 -192 8 -195 Z" fill={SKD} />
        <path d="M19.5 -203 L 23 -201.4 L 21 -201 Z" fill={SKD} />
        <circle cx={20.6} cy={-201.6} r={0.8} fill="#6a3a28" />
        {/* olho amendoado, pálpebra, cílio, sobrancelha */}
        <path d="M12.4 -208.6 Q 15 -210.6 18 -208.8 Q 15.4 -207 12.4 -208.6 Z" fill="#f4ece4" />
        <circle cx={16} cy={-208.7} r={1.35} fill="#3a2414" />
        <circle cx={16.3} cy={-209.1} r={0.4} fill="#fff" />
        <path d="M12.2 -208.8 Q 15 -211.2 18.4 -209" fill="none" stroke="#1a1210" strokeWidth={1.1} strokeLinecap="round" />
        <path d="M18.2 -209.1 l 1.2 -0.9" stroke="#1a1210" strokeWidth={0.8} strokeLinecap="round" />
        <path d="M13 -210.8 q 3 -0.8 5 0" fill="none" stroke={SKD} strokeWidth={0.7} opacity={0.8} />
        <path d="M11.4 -212.6 Q 15 -214.6 19.4 -213" fill="none" stroke={HR} strokeWidth={1.7} strokeLinecap="round" />
        {/* lábios */}
        <path d="M19.6 -198.6 Q 20.8 -198.2 21.4 -198.4 L 20.6 -197.4 Z" fill="#8a3a32" />
        <path d="M20.6 -197.4 L 21.3 -196.1 Q 20.4 -195.4 19.4 -195.9 Z" fill="#9c4a40" />
        <path d="M17.6 -197.4 L 20.6 -197.4" stroke="#6a2e26" strokeWidth={0.7} />
        {/* orelha */}
        <path d="M0.4 -207.6 q 3.6 -1 3.8 3.6 q 0 3.6 -3.2 3.4 q -1.6 -3.4 -0.6 -7 z" fill={SKD} />
        <path d="M1.4 -206 q 1.8 0.4 1.6 2.6" fill="none" stroke="#7a4a32" strokeWidth={0.8} />
        {/* cabelo puxado para trás: linha do cabelo na testa, mecha solta na têmpora, rabo de cavalo */}
        <path d="M-7 -199 C -15 -205 -15 -224 -3 -229.6 C 6 -233 14 -229.4 17 -223.6 Q 12 -223 8 -220.6 Q 6 -216.6 6.4 -211 Q 3.6 -213.6 1.6 -212.6 Q -1 -208 -2.6 -201 Z" fill={HR} />
        <path d="M8.4 -219.6 q -1.4 5 0.2 10" fill="none" stroke={HR} strokeWidth={0.8} strokeLinecap="round" />
        <path d="M-1 -227 q 6 -3 13 -1 M-6 -222 q 6 -4 13 -3 M-9 -214 q 4 -5 10 -5" fill="none" stroke="#3a2c26" strokeWidth={0.9} opacity={0.75} />
        {/* o elástico e o rabo descendo pela nuca */}
        <path d="M-11 -217 q -9 3 -11 13 q -1.6 9 2.4 17 q 0.6 -7 3.8 -11 q 2.6 -8 7 -13 z" fill={HR} />
        <path d="M-17 -204 q -1.6 7 1 13" fill="none" stroke="#3a2a24" strokeWidth={1} />
        <rect x={-13.6} y={-217.6} width={4} height={3.2} rx={1} fill={HB} transform="rotate(-30 -11.6 -216)" />
        {/* a faixa larga, por cima da cabeça atrás da linha do cabelo */}
        <path d="M-9 -220.6 Q 1 -232.6 15.4 -226.4 L 13.6 -222.4 Q 1 -227.6 -6.6 -216.6 Z" fill={HB} />
        <path d="M-7.6 -219 Q 1 -229.8 14.4 -224.4" fill="none" stroke="#86423a" strokeWidth={1.1} />
      </g>
      {/* braço da frente: manga de couro, o punho cinza do moletom, a luva sem dedo */}
      <SideArm sh={[sh[0], sh[1] + bob]} el={[elb[0], elb[1] + bob]} wr={[hand[0], hand[1] + bob]} w={1} c="#6e4730" cl="#8e6040" cd={JKD} cuff={HD} sk={SK} skD={SKD} skL={SKL} glove="#221c18" fingerless pose={arm === 1 ? "fist" : "open"} fy={arm ? -1 : 1} />
      {arm === 1 ? (
        <g transform={`translate(${hand[0]} ${hand[1] + bob})`}>
          <rect x={-2} y={-13} width={30} height={20} rx={4} fill="#2c3138" />
          <rect x={2} y={-9} width={12} height={6} fill="#4a5560" />
          <rect x={4} y={-1} width={8} height={3} fill="#e07a2c" />
          <rect x={22} y={-10} width={9} height={14} rx={2} fill={dev > 0 ? "#cfefff" : "#55606a"} />
          {dev > 0 ? <circle cx={28} cy={-3} r={11 + 4 * Math.sin(f / 3)} fill="#bfe8ff" opacity={0.45 * dev} /> : null}
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- Eli
// Referência: Eli no HL2/Ep2. Cabelo grisalho curto (não é careca, sem óculos), barba grisalha curta, colete acolchoado
// verde-oliva com bolsos e a gola vermelha por dentro, camisa bege de manga comprida, calça cáqui, botas.
// A perna de trás é a prótese abaixo do joelho. hug: 0 braços soltos → 1 fechados para a frente
export const EliSide: React.FC<{ x: number; y: number; s: number; d?: number; hug?: number; f: number }> = ({ x, y, s, d = 1, hug = 0, f }) => {
  const VE = "#5e6a3a", VEL = "#76824c", VED = "#454e2a", SH = "#cfc4ac", SHD = "#ada288", PA = "#8a7d62", PAL = "#9e9276", PAD = "#6e6248";
  const SK = "#6a4532", SKL = "#80573f", SKD = "#4e3324", GRY = "#d2cdc4", GRYD = "#aaa59c";
  const br = Math.sin(f / 24) * 1.2;
  const reach = (k: number) => {
    const sh: Pt = [k ? 2 : -8, -182 + br];
    const el: Pt = [sh[0] + 3 + hug * 22, -144 + hug * 2];
    const hd: Pt = [sh[0] + 7 + hug * 44 - k * hug * 8, -110 - hug * 38];
    return (
      <g key={k}>
        <SideArm sh={sh} el={el} wr={hd} w={1.12} c={k ? SH : SHD} cl={k ? "#e4dcc6" : SH} cd={k ? SHD : "#8a806a"} cuff={k ? SHD : "#948a72"} sk={k ? SK : SKD} skD={k ? SKD : "#3a2418"} skL={k ? SKL : SK} fy={hug > 0.5 ? -1 : 1} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s * d} ${s})`} filter="url(#ink)">
      <Shadow rx={42} />
      {/* perna de trás: coxa de calça e a prótese abaixo do joelho */}
      <polygon points={pts([[-20, -112], [2, -112], [-2, -62], [-18, -62]])} fill={PAD} />
      <circle cx={-10} cy={-58} r={10} fill="#7c838a" />
      <circle cx={-10} cy={-58} r={4.5} fill="#3a3f45" />
      <polyline points={pts([[-10, -52], [-12, -16]])} stroke="#3a3f45" strokeWidth={11} strokeLinecap="round" />
      <polyline points={pts([[-9, -50], [-11, -16]])} stroke="#b4bac0" strokeWidth={5} strokeLinecap="round" />
      <rect x={-17} y={-36} width={12} height={6} rx={2} fill="#5c636b" />
      <polygon points={pts([[-24, -16], [4, -16], [14, -6], [14, 2], [-24, 2]])} fill="#2c2a28" />
      {/* perna da frente */}
      <polygon points={pts([[-2, -112], [22, -112], [20, -60], [2, -60]])} fill={PA} />
      <polygon points={pts([[12, -112], [22, -112], [20, -60], [14, -60]])} fill={PAL} />
      <polygon points={pts([[2, -60], [20, -60], [18, -16], [4, -16]])} fill={PA} />
      <rect x={-1} y={-96} width={14} height={14} rx={2} fill={PAD} />
      <polygon points={pts([[0, -18], [22, -18], [36, -8], [36, 2], [0, 2]])} fill="#3a2a1e" />
      <rect x={0} y={-1} width={36} height={4} fill="#1e1612" />
      {hug > 0.3 ? reach(0) : null}
      <g transform={`translate(0 ${br})`}>
        {/* camisa por baixo, aparecendo na frente */}
        <polygon points={pts([[8, -112], [28, -112], [32, -150], [26, -186], [10, -192]])} fill={SH} />
        {[0, 1, 2].map((j) => <circle key={j} cx={22} cy={-176 + j * 18} r={1.6} fill={SHD} />)}
        <rect x={-24} y={-120} width={52} height={9} fill="#3a2e22" />
        {/* colete acolchoado */}
        <polygon points={pts([[-26, -110], [18, -110], [20, -150], [14, -188], [4, -198], [-14, -198], [-24, -186]])} fill={VE} />
        <polygon points={pts([[-26, -110], [-10, -110], [-8, -196], [-14, -198], [-24, -186]])} fill={VED} />
        {[0, 1, 2, 3, 4].map((j) => <polyline key={j} points={pts([[-24, -122 - j * 15], [18, -124 - j * 15]])} stroke={VED} strokeWidth={2.2} />)}
        <polygon points={pts([[6, -110], [18, -110], [20, -150], [10, -150]])} fill={VEL} opacity={0.7} />
        {/* bolsos com aba */}
        <rect x={-4} y={-170} width={18} height={18} rx={2} fill={VED} />
        <rect x={-5} y={-172} width={20} height={6} rx={2} fill={VEL} />
        <rect x={-6} y={-138} width={20} height={20} rx={2} fill={VED} />
        <rect x={-7} y={-140} width={22} height={6} rx={2} fill={VEL} />
        {/* gola com o forro vermelho */}
        <polygon points={pts([[-14, -198], [6, -200], [12, -192], [-10, -190]])} fill={VEL} />
        <polygon points={pts([[6, -200], [14, -194], [12, -184], [8, -192]])} fill="#8a3a2a" />
        {/* pescoço e cabeça (perfil) */}
        <polygon points={pts([[-2, -214], [14, -214], [16, -196], [0, -196]])} fill={SKD} />
        <ellipse cx={6} cy={-230} rx={18} ry={22} fill={SK} />
        <path d="M17 -246 q 12 5 11 19 l 5 8 l -6 2 l 0 9 q -10 7 -18 1 z" fill={SK} />
        <path d="M18 -244 q 7 3 9 10" fill="none" stroke={SKL} strokeWidth={3} strokeLinecap="round" />
        <path d="M27 -230 q 7 4 6 11 q -4 1 -7 -1" fill={SKD} />
        <path d="M24 -214 q 4 1 8 -1" fill="none" stroke="#3a2018" strokeWidth={2.4} strokeLinecap="round" />
        {/* olho, sobrancelha grisalha, rugas */}
        <path d="M17 -233 q 4 -2.5 8 0 q -4 2 -8 0 z" fill="#efe6dc" />
        <circle cx={21.5} cy={-233} r={1.7} fill="#1a1110" />
        <path d="M15 -238 q 6 -3 12 -1" fill="none" stroke={GRYD} strokeWidth={3} strokeLinecap="round" />
        <path d="M14 -244 q 6 -2 10 0 M15 -248 q 5 -2 9 0" fill="none" stroke={SKD} strokeWidth={1.3} />
        <ellipse cx={-2} cy={-228} rx={4.5} ry={6.5} fill={SKD} />
        {/* cabelo grisalho curto */}
        <path d="M-12.5 -224 Q -15 -250 4 -254 Q 19 -256 25 -246 Q 18 -248 12 -246.5 Q 4 -246 -2 -244 Q -8 -238 -8 -226 Z" fill={GRY} />
        <path d="M-12.5 -224 q 0 8 3 12 l 2 -2 q -2 -6 -1 -12 z" fill={GRYD} />
        {[0, 1, 2, 3, 4].map((j) => <circle key={j} cx={-8 + j * 6} cy={-249 + (j % 2) * 2} r={1.1} fill={GRYD} />)}
        <path d="M5 -236 q -1 9 1 17" fill="none" stroke={GRYD} strokeWidth={5.5} strokeLinecap="round" />
        {/* barba curta e bigode */}
        <path d="M3 -219 q 4 17 18 17 q 9 -1 11 -9 q -4 2 -8 -1 q -9 1 -21 -7 z" fill={GRY} />
        <path d="M22 -219 q 6 -2 11 1" fill="none" stroke={GRY} strokeWidth={4} strokeLinecap="round" />
        <path d="M6 -208 q 6 6 14 6" fill="none" stroke={GRYD} strokeWidth={1.4} />
      </g>
      {reach(1)}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- Dog
// Referência: o modelo do HL2. Robô de sucata montado pelo Eli, postura de gorila. O corpo é uma cúpula amarelo-areia
// rebitada e gasta; embaixo, na frente, o "rosto": um leque de placas cor de areia/ferrugem em volta do olho vermelho.
// Braço de perto: a placa longa curva cor de ferrugem do ombro, antebraço ferrugem com a faixa areia, punho de blocos.
// Braço de longe: aço, mangueiras azul e amarela, o cabo preto. Pernas hidráulicas azul-acinzentadas, pés em bloco.
// lie: 0 em pé → 1 deitado ao lado deles
const DG = { sand: "#d9b45a", sandL: "#ecd28c", sandD: "#a8823a", rust: "#c0602a", rustL: "#dc8a4a", rustD: "#7e3a1c", steel: "#8a9198", steelD: "#5c636b", steelL: "#b4bac0", hyd: "#4d5d7c", hydL: "#6e7f9e", hydD: "#323e56", bk: "#1e2126", red: "#d0362a" };
export const DogBot: React.FC<{ x: number; y: number; s: number; d?: number; lie?: number; f: number }> = ({ x, y, s, d = 1, lie = 0, f }) => {
  const C = DG;
  const k = lie;
  const br = Math.sin(f / 18) * 1.5 * (1 - k);
  // o centro da cúpula desce e avança quando ele deita
  const cx = -6 + k * 10, cy = -176 + k * 96 + br;
  const H: Pt = [cx - 22, cy + 62 - k * 30]; // quadril
  const legs = (dx: number, near: boolean) => {
    const knee: Pt = L([H[0] + dx - 22, H[1] + 44], [H[0] + dx + 40, H[1] + 22], k);
    const ank: Pt = L([H[0] + dx + 4, -18], [H[0] + dx + 70, -14], k);
    const c = near ? C.hyd : C.hydD, cl = near ? C.hydL : C.hyd;
    return (
      <g>
        {/* pistões duplos: coxa e canela */}
        <polyline points={pts([[H[0] + dx, H[1]], knee])} stroke={c} strokeWidth={20} strokeLinecap="round" />
        <polyline points={pts([[H[0] + dx + 6, H[1] - 2], [knee[0] + 6, knee[1] - 2]])} stroke={cl} strokeWidth={6} strokeLinecap="round" />
        <polyline points={pts([knee, ank])} stroke={c} strokeWidth={16} strokeLinecap="round" />
        <polyline points={pts([[knee[0] + 9, knee[1] + 2], [ank[0] + 9, ank[1] - 6]])} stroke={C.steelD} strokeWidth={7} strokeLinecap="round" />
        <circle cx={knee[0]} cy={knee[1]} r={14} fill={near ? C.steel : C.steelD} />
        <circle cx={knee[0]} cy={knee[1]} r={6} fill={C.bk} />
        {/* pé em bloco cor de areia gasto */}
        <polygon points={pts([[ank[0] - 22, ank[1] - 4], [ank[0] + 16, ank[1] - 8], [ank[0] + 30, ank[1] + 6], [ank[0] + 30, ank[1] + 18], [ank[0] - 24, ank[1] + 18]])} fill={near ? C.sandD : "#8a6a30"} />
        <polygon points={pts([[ank[0] - 22, ank[1] - 4], [ank[0] + 16, ank[1] - 8], [ank[0] + 20, ank[1] - 2], [ank[0] - 20, ank[1] + 2]])} fill={near ? C.sand : C.sandD} />
        <rect x={ank[0] - 24} y={ank[1] + 14} width={54} height={4} fill={C.bk} />
      </g>
    );
  };
  // ombros e mãos (os braços longos apoiados nos nós dos dedos)
  const S: Pt = [cx + 12, cy - 26];
  const armFar = () => {
    const sh: Pt = [S[0] - 26, S[1] - 6];
    const el: Pt = L([sh[0] + 4, sh[1] + 78], [sh[0] + 30, sh[1] + 50], k);
    const hd: Pt = L([sh[0] + 40, -30], [sh[0] + 116, -22], k);
    return (
      <g>
        <polyline points={pts([sh, el])} stroke={C.steelD} strokeWidth={28} strokeLinecap="round" />
        <polygon points={pts([[el[0] - 13, el[1]], [el[0] + 13, el[1]], [hd[0] + 22, hd[1] - 12], [hd[0] - 22, hd[1] - 12]])} fill="#6a3a1e" />
        {/* as mangueiras azul e amarela e o cabo */}
        <polyline points={pts([[sh[0] - 6, sh[1] + 10], [el[0] - 10, el[1]], [hd[0] - 10, hd[1] - 10]])} fill="none" stroke="#3d6fb0" strokeWidth={5} strokeLinejoin="round" />
        <polyline points={pts([[sh[0] - 2, sh[1] + 14], [el[0] - 4, el[1] + 4], [hd[0] - 4, hd[1] - 8]])} fill="none" stroke="#e0c040" strokeWidth={4} strokeLinejoin="round" />
        <circle cx={el[0]} cy={el[1]} r={13} fill={C.steel} />
        <polygon points={pts([[hd[0] - 28, hd[1] - 14], [hd[0] + 26, hd[1] - 14], [hd[0] + 30, hd[1] + 22], [hd[0] - 30, hd[1] + 22]])} fill="#5a3018" />
        {[-18, 0, 18].map((q, j) => <rect key={j} x={hd[0] + q - 8} y={hd[1] + 10} width={16} height={18} rx={4} fill="#4a2814" />)}
      </g>
    );
  };
  const armNear = () => {
    const sh: Pt = [S[0] + 4, S[1] + 4];
    const el: Pt = L([sh[0] + 14, sh[1] + 74], [sh[0] + 40, sh[1] + 50], k);
    const hd: Pt = L([sh[0] + 62, -30], [sh[0] + 140, -24], k);
    // a placa longa curva cor de ferrugem que sai do ombro e passa por cima da cúpula
    // ela acompanha o contorno da cúpula, do ombro até as costas
    const plate = `M ${sh[0] - 14} ${sh[1] + 4} Q ${cx + 22} ${cy - 104} ${cx - 66} ${cy - 76} L ${cx - 58} ${cy - 60} Q ${cx + 8} ${cy - 82} ${sh[0] + 14} ${sh[1] - 2} Z`;
    return (
      <g>
        <path d={plate} fill={C.rust} />
        <path d={`M ${sh[0] - 4} ${sh[1] - 4} Q ${cx + 18} ${cy - 96} ${cx - 62} ${cy - 70}`} fill="none" stroke={C.rustL} strokeWidth={4} />
        {[0.25, 0.5, 0.75].map((t) => {
          const a: Pt = L(L([sh[0], sh[1]], [cx + 16, cy - 94], t), L([cx + 16, cy - 94], [cx - 62, cy - 68], t), t);
          return <circle key={t} cx={a[0]} cy={a[1]} r={2.4} fill={C.rustD} />;
        })}
        <polyline points={pts([sh, el])} stroke={C.steel} strokeWidth={32} strokeLinecap="round" />
        <polyline points={pts([[sh[0] + 6, sh[1] + 2], [el[0] + 6, el[1] - 2]])} stroke={C.steelL} strokeWidth={5} strokeLinecap="round" />
        {/* o cabo preto do ombro ao antebraço */}
        <polyline points={pts([[sh[0] + 10, sh[1] - 10], [L(el, hd, 0.35)[0] + 14, L(el, hd, 0.35)[1]]])} stroke={C.bk} strokeWidth={3} />
        {/* antebraço grosso cor de ferrugem com a faixa areia */}
        <polygon points={pts([[el[0] - 15, el[1] - 4], [el[0] + 15, el[1] + 4], [hd[0] + 28, hd[1] - 12], [hd[0] - 28, hd[1] - 12]])} fill={C.rust} />
        <polygon points={pts([[el[0] + 4, el[1]], [el[0] + 15, el[1] + 4], [hd[0] + 28, hd[1] - 12], [hd[0] + 10, hd[1] - 12]])} fill={C.rustL} />
        <polygon points={pts([L([el[0] - 14, el[1]], [hd[0] - 22, hd[1] - 12], 0.62), L([el[0] + 14, el[1]], [hd[0] + 22, hd[1] - 12], 0.62), L([el[0] + 14, el[1]], [hd[0] + 22, hd[1] - 12], 0.8), L([el[0] - 14, el[1]], [hd[0] - 22, hd[1] - 12], 0.8)])} fill={C.sand} />
        <circle cx={el[0]} cy={el[1]} r={15} fill={C.steelD} />
        <circle cx={el[0]} cy={el[1]} r={6} fill={C.bk} />
        {/* o punho de blocos: três dedos grossos fechados no chão */}
        <polygon points={pts([[hd[0] - 32, hd[1] - 16], [hd[0] + 32, hd[1] - 16], [hd[0] + 36, hd[1] + 12], [hd[0] - 34, hd[1] + 12]])} fill={C.rustD} />
        {[-21, 0, 21].map((q, j) => (
          <g key={j}>
            <rect x={hd[0] + q - 10} y={hd[1] + 4} width={20} height={24} rx={5} fill={j === 1 ? C.rust : "#8a4a24"} />
            <rect x={hd[0] + q - 10} y={hd[1] + 4} width={20} height={5} rx={2} fill={C.rustL} />
            <rect x={hd[0] + q - 10} y={hd[1] + 15} width={20} height={2} fill={C.rustD} />
          </g>
        ))}
        {/* o polegar por trás, apoiado */}
        <rect x={hd[0] - 44} y={hd[1] + 2} width={16} height={22} rx={5} fill="#6a3418" />
        <circle cx={sh[0]} cy={sh[1]} r={20} fill={C.steel} />
        <circle cx={sh[0]} cy={sh[1]} r={12} fill={C.steelD} />
        <circle cx={sh[0] - 4} cy={sh[1] - 4} r={4} fill={C.steelL} />
      </g>
    );
  };
  const eye = 0.75 + 0.25 * Math.sin(f / 9);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * d} ${s})`} filter="url(#ink)">
      <Shadow rx={100 + k * 30} />
      {legs(-14, false)}
      {armFar()}
      {legs(10, true)}
      {/* a cúpula do corpo */}
      <ellipse cx={cx} cy={cy} rx={72} ry={64} fill={C.sand} />
      <path d={`M ${cx - 72} ${cy} A 72 64 0 0 1 ${cx + 40} ${cy - 54} L ${cx + 20} ${cy - 30} A 56 48 0 0 0 ${cx - 56} ${cy + 6} Z`} fill={C.sandL} opacity={0.7} />
      <path d={`M ${cx - 70} ${cy + 18} A 72 64 0 0 0 ${cx + 30} ${cy + 58} L ${cx + 22} ${cy + 44} A 60 50 0 0 1 ${cx - 56} ${cy + 16} Z`} fill={C.sandD} />
      {/* faixas de metal e rebites */}
      <path d={`M ${cx - 8} ${cy - 64} Q ${cx + 10} ${cy} ${cx - 6} ${cy + 64}`} fill="none" stroke={C.steelD} strokeWidth={10} />
      <path d={`M ${cx - 8} ${cy - 64} Q ${cx + 10} ${cy} ${cx - 6} ${cy + 64}`} fill="none" stroke={C.steel} strokeWidth={4} />
      {[-48, -24, 0, 24, 48].map((q) => <circle key={q} cx={cx + 6 - Math.abs(q) * 0.12} cy={cy + q} r={2.6} fill={C.bk} />)}
      <path d={`M ${cx - 64} ${cy - 22} Q ${cx - 30} ${cy - 40} ${cx - 6} ${cy - 34}`} fill="none" stroke={C.sandD} strokeWidth={3} />
      {/* ferrugem e desgaste */}
      {[[-40, -20, 12], [-20, 30, 9], [30, -38, 8], [-52, 20, 7]].map(([ox, oy, r], j) => (
        <ellipse key={j} cx={cx + ox} cy={cy + oy} rx={r} ry={r * 0.6} fill="#8a5a2a" opacity={0.45} />
      ))}
      {/* a caixinha escura em cima da frente */}
      <rect x={cx + 30} y={cy - 70} width={28} height={18} rx={3} fill={C.steelD} transform={`rotate(24 ${cx + 44} ${cy - 61})`} />
      {/* o rosto: o leque de placas em volta do olho, embaixo na frente */}
      <ellipse cx={cx + 54} cy={cy + 4} rx={30} ry={32} fill={C.steelD} />
      <ellipse cx={cx + 50} cy={cy - 6} rx={20} ry={16} fill={C.steel} opacity={0.6} />
      <g transform={`translate(${cx + 74} ${cy + 6})`}>
        {Array.from({ length: 9 }).map((_, j) => {
          const a0 = -2.3 + j * 0.52, a1 = a0 + 0.42;
          return <polygon key={j} points={pts([[Math.cos(a0) * 14, Math.sin(a0) * 14], [Math.cos(a0) * 46, Math.sin(a0) * 46], [Math.cos(a1) * 44, Math.sin(a1) * 44], [Math.cos(a1) * 14, Math.sin(a1) * 14]])} fill={j % 3 === 0 ? C.rust : j % 2 ? C.sandD : "#b07a4a"} />;
        })}
        <circle cx={0} cy={0} r={17} fill={C.steelD} />
        <circle cx={0} cy={0} r={12} fill={C.bk} />
        <circle cx={0} cy={0} r={8} fill={C.red} opacity={eye} />
        <circle cx={-2} cy={-2} r={2} fill="#ffd8cc" />
        <circle cx={0} cy={0} r={22} fill={C.red} opacity={0.14 * eye} />
      </g>
      {armNear()}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- Gordon (HEV Mark V, de costas)
// Referência: o traje do HL2. Ombreira e braços cinza-chumbo, placas laranja nas costas dos dois lados da coluna, abdômen
// segmentado escuro, coxas com a faixa laranja de fora, joelheira cinza, caneleira laranja com a tira cinza, bota escura.
// Andando PARA LONGE: a perna que vai à frente sobe na tela e encurta; a de trás levanta o calcanhar e mostra a sola.
// O pé de cabra na mão direita, o punho fechado POR CIMA da haste, a garra para baixo. Nunca o rosto.
const HEV = { or: "#e2782a", orL: "#f39a4a", orD: "#b25a1c", gr: "#666d75", grL: "#8a929a", grD: "#474d54", un: "#2a2e33", unL: "#383d43", bk: "#1d2024", ol: "#4a5046" };
export const GordonBack: React.FC<{ x: number; y: number; s: number; ph: number; amp: number }> = ({ x, y, s, ph, amp }) => {
  const H = HEV;
  const a = Math.min(1.4, amp);
  const bob = -Math.abs(Math.cos(ph)) * 4 * a;
  const leg = (k: number) => {
    const q = ph + k * Math.PI;
    const dz = -Math.cos(q) * a; // 1 = lá na frente (longe), -1 = atrás (perto da câmera)
    const lift = Math.max(0, Math.sin(q)) * 4 * a; // balanço (pouco: de costas o pé quase não sobe)
    const side = k ? 1 : -1, hx = side * 15;
    const fy = -Math.max(0, dz) * 9 - lift; // o pé de quem vai na frente sobe na tela
    const heel = Math.max(0, -dz) * 12; // o de trás mostra a sola
    const kx = hx + side * 1, ky = -60 + fy * 0.45 + bob * 0.5;
    const ax = hx + side * 1, ay = -14 + fy;
    return {
      dz,
      el: (
        <g key={k}>
          {/* coxa: o macacão escuro, a faixa laranja do lado de fora */}
          <polygon points={pts([[hx - 14, -114 + bob], [hx + 14, -114 + bob], [kx + 12, ky], [kx - 12, ky]])} fill={H.un} />
          <polygon points={pts([[hx + side * 6, -112 + bob], [hx + side * 14, -112 + bob], [kx + side * 12, ky - 2], [kx + side * 5, ky - 2]])} fill={H.or} />
          <polygon points={pts([[hx + side * 11, -112 + bob], [hx + side * 14, -112 + bob], [kx + side * 12, ky - 2], [kx + side * 10, ky - 2]])} fill={H.orD} />
          {/* joelheira (de costas aparece a borda dela dos lados) e a dobra do joelho */}
          <rect x={kx - 13} y={ky - 6} width={26} height={12} rx={4} fill={H.unL} />
          <rect x={kx + side * 8 - 4} y={ky - 8} width={8} height={16} rx={3} fill={H.gr} />
          {/* canela: caneleira laranja de trás com a tira cinza */}
          <polygon points={pts([[kx - 12, ky + 4], [kx + 12, ky + 4], [ax + 11, ay - 4 - heel], [ax - 11, ay - 4 - heel]])} fill={H.or} />
          <polygon points={pts([[kx + side * 4, ky + 4], [kx + side * 12, ky + 4], [ax + side * 11, ay - 4 - heel], [ax + side * 5, ay - 4 - heel]])} fill={H.orD} />
          <rect x={ax - 12} y={(ky + ay) / 2 - 3} width={24} height={7} fill={H.gr} />
          <rect x={ax - 12} y={(ky + ay) / 2 - 3} width={24} height={2} fill={H.grL} />
          {/* bota: de trás, o calcanhar; levantado mostra a sola */}
          <polygon points={pts([[ax - 12, ay - 8 - heel], [ax + 12, ay - 8 - heel], [ax + 13, ay + 6 - heel * 0.4], [ax - 13, ay + 6 - heel * 0.4]])} fill={H.bk} />
          {heel > 1 ? <polygon points={pts([[ax - 13, ay + 6 - heel * 0.4], [ax + 13, ay + 6 - heel * 0.4], [ax + 11, ay + 8 + heel * 0.3], [ax - 11, ay + 8 + heel * 0.3]])} fill="#5a5048" /> : <rect x={ax - 13} y={ay + 4} width={26} height={4} fill="#3a3e44" />}
        </g>
      ),
    };
  };
  const arm = (k: number) => {
    const side = k ? 1 : -1;
    const q = ph + (k ? Math.PI : 0); // o braço vai com a perna do outro lado
    const dz = -Math.cos(q) * a; // 1 = braço para a frente (longe), -1 = para trás (perto)
    const sx = side * 40, sy = -192 + bob;
    const ex = side * 47, ey = sy + 44 - Math.max(0, dz) * 6;
    const hx = side * 50 + side * Math.max(0, -dz) * 4, hy = ey + 40 - Math.max(0, dz) * 16 + Math.max(0, -dz) * 4;
    const fs = 1 + Math.max(0, -dz) * 0.08; // a mão de trás fica um pouco maior
    return (
      <g key={"a" + k}>
        {/* braço: o macacão escuro, a placa cinza do braço, o cotovelo, o antebraço com a guarda */}
        <path d={limb([sx, sy], [ex, ey], 11.5, 9.5)} fill={H.un} />
        <path d={limb([sx + side * 2, sy + 3], [ex + side * 1, ey - 9], 8.5, 7)} fill={H.gr} />
        <path d={`M ${sx + side * 6} ${sy + 4} L ${ex + side * 5} ${ey - 8}`} stroke={H.grL} strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={ex} cy={ey} rx={9.5} ry={8} fill={H.bk} />
        <path d={limb([ex, ey], [hx, hy - 8], 9.5, 7.5)} fill={H.un} />
        {/* a guarda do antebraço */}
        <path d={limb(L([ex, ey], [hx, hy - 8], 0.2), L([ex, ey], [hx, hy - 8], 0.85), 8.5, 7)} fill={H.grD} />
        <path d={`M ${L([ex, ey], [hx, hy], 0.25)[0] + side * 5} ${L([ex, ey], [hx, hy], 0.25)[1]} L ${L([ex, ey], [hx, hy], 0.8)[0] + side * 4} ${L([ex, ey], [hx, hy], 0.8)[1] - 6}`} stroke={H.gr} strokeWidth={2.5} strokeLinecap="round" />
        {k ? (
          // o pé de cabra atrás dos dedos, o punho por cima
          <g transform={`rotate(${dz * 8} ${hx} ${hy})`}>
            <path d={`M ${hx - 3} ${hy - 26} L ${hx + 3} ${hy + 62} q 1 11 -10 12 q -6 0 -8 -5`} fill="none" stroke="#4a100c" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M ${hx - 3} ${hy - 26} L ${hx + 3} ${hy + 62} q 1 11 -10 12 q -6 0 -8 -5`} fill="none" stroke="#c4392c" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M ${hx - 2} ${hy - 6} L ${hx + 2} ${hy + 58}`} stroke="#e0584a" strokeWidth={2} opacity={0.7} />
            <path d={`M ${hx - 3} ${hy - 26} l 1 9`} stroke="#9aa0a6" strokeWidth={7} strokeLinecap="round" />
            <path d={`M ${hx - 15} ${hy + 69} l 3 3`} stroke="#9aa0a6" strokeWidth={6} strokeLinecap="round" />
            {/* punho fechado na haste, visto de trás: o dorso da luva e os nós dos dedos por cima */}
            <g transform={`translate(${hx} ${hy}) scale(${fs})`}>
              <path d="M -9 -9 Q -10.5 0 -9 8 Q -2 12.5 8.5 9.5 Q 10.5 0 9 -9 Q 0 -12 -9 -9 Z" fill={H.bk} />
              <path d="M -8 3 Q 0 6 8.5 3" fill="none" stroke="#3a3e44" strokeWidth={1.6} />
              <path d="M -3 4.5 L -3 9.5 M 3 4.5 L 3 9.5" stroke="#3a3e44" strokeWidth={1.1} />
              <path d="M -6 -7 Q 0 -9 6 -7" fill="none" stroke="#3a3e44" strokeWidth={1.4} />
            </g>
          </g>
        ) : (
          <g>
            {/* mão aberta, vista de trás: dorso, quatro dedos meio dobrados, o polegar para dentro */}
            <g transform={`translate(${hx} ${hy}) scale(${fs * -side} ${fs})`}>
              <path d="M -8 -9 Q -9.5 0 -8.5 7 L -8 14 Q -6 17 -3.5 15.5 L 2 17 Q 5 17 6 14 L 8 9 L 9 -9 Q 0 -11.5 -8 -9 Z" fill={H.bk} />
              <path d="M 7.5 -2 Q 12.5 2 11.5 8 Q 10 10 8.5 8 Z" fill={H.bk} />
              <path d="M -4.5 7 L -4.5 15 M -0.5 7.5 L -0.6 16 M 3.2 7.5 L 3 15.5" stroke="#3a3e44" strokeWidth={1} />
              <path d="M -7 4 Q 0 6.5 7.5 4" fill="none" stroke="#3a3e44" strokeWidth={1.4} />
            </g>
          </g>
        )}
      </g>
    );
  };
  const L0 = leg(0), L1 = leg(1);
  const legs = [L0, L1].sort((p, q) => q.dz - p.dz); // o que está mais longe primeiro
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#ink)">
      <ellipse cx={0} cy={2} rx={48} ry={9} fill="#5d7a90" opacity={0.45} />
      {legs.map((l) => l.el)}
      <g transform={`translate(0 ${bob})`}>
        {/* quadril e cinto */}
        <polygon points={pts([[-31, -104], [31, -104], [33, -122], [-33, -122]])} fill={H.un} />
        <rect x={-34} y={-124} width={68} height={10} rx={3} fill={H.bk} />
        {[-24, -8, 8, 24].map((bx) => <rect key={bx} x={bx - 5} y={-123} width={10} height={8} rx={2} fill={H.grD} />)}
        {/* abdômen segmentado (oliva escuro) */}
        <polygon points={pts([[-32, -122], [32, -122], [36, -146], [-36, -146]])} fill={H.ol} />
        {[0, 1, 2].map((j) => <rect key={j} x={-34 + j * 0} y={-130 - j * 7} width={68} height={2.5} fill={H.un} />)}
        {/* costas: placas laranja dos lados da coluna */}
        <polygon points={pts([[-38, -146], [38, -146], [44, -190], [-44, -190]])} fill={H.un} />
        <polygon points={pts([[-36, -148], [-7, -148], [-7, -188], [-42, -188]])} fill={H.or} />
        <polygon points={pts([[7, -148], [36, -148], [42, -188], [7, -188]])} fill={H.or} />
        <polygon points={pts([[-36, -148], [-27, -148], [-32, -188], [-42, -188]])} fill={H.orD} />
        <polygon points={pts([[27, -148], [36, -148], [42, -188], [32, -188]])} fill={H.orD} />
        <rect x={-20} y={-182} width={9} height={30} rx={2} fill={H.orL} opacity={0.55} />
        <rect x={11} y={-182} width={9} height={30} rx={2} fill={H.orL} opacity={0.55} />
        {/* a coluna com as vértebras e a caixinha da bateria */}
        <rect x={-6} y={-188} width={12} height={42} fill={H.bk} />
        {[0, 1, 2, 3].map((j) => <rect key={j} x={-5} y={-184 + j * 10} width={10} height={6} rx={2} fill={H.grD} />)}
        <rect x={-12} y={-176} width={24} height={14} rx={3} fill={H.grD} />
        <rect x={-12} y={-176} width={24} height={3} fill={H.grL} />
        <circle cx={7} cy={-168} r={2.2} fill="#ffb14a" />
        {/* ombreira cinza (o "jugo") com os rebites */}
        <polygon points={pts([[-48, -184], [48, -184], [44, -198], [26, -208], [-26, -208], [-44, -198]])} fill={H.gr} />
        <polygon points={pts([[-44, -198], [-26, -208], [26, -208], [44, -198], [40, -196], [-40, -196]])} fill={H.grL} />
        <polygon points={pts([[-48, -184], [48, -184], [46, -188], [-46, -188]])} fill={H.grD} />
        {[-36, -18, 18, 36].map((rx) => <circle key={rx} cx={rx} cy={-190} r={2.2} fill={H.grD} />)}
        {/* gola */}
        <rect x={-14} y={-216} width={28} height={12} rx={4} fill={H.bk} />
        <rect x={-14} y={-216} width={28} height={3} fill={H.unL} />
        {/* cabeça de costas: cabelo castanho curto, orelhas, as hastes dos óculos */}
        <rect x={-8} y={-222} width={16} height={8} fill="#c9946f" />
        <ellipse cx={-16} cy={-236} rx={4.5} ry={7.5} fill="#d9a37f" />
        <ellipse cx={16} cy={-236} rx={4.5} ry={7.5} fill="#d9a37f" />
        <ellipse cx={0} cy={-240} rx={17} ry={20} fill="#4a2e1c" />
        <path d="M-15 -232 q 15 8 30 0 l 0 6 q -15 6 -30 0 z" fill="#3a2414" />
        <path d="M-12 -254 q 12 -8 24 0" fill="none" stroke="#6a4630" strokeWidth={4} strokeLinecap="round" />
        <path d="M-10 -246 q 4 -6 2 -12 M-2 -244 q 3 -7 1 -14 M7 -245 q 3 -6 0 -12" fill="none" stroke="#5e3c26" strokeWidth={2.5} strokeLinecap="round" />
        <rect x={-21} y={-239} width={7} height={2.5} fill="#151515" />
        <rect x={14} y={-239} width={7} height={2.5} fill="#151515" />
      </g>
      {arm(0)}
      {arm(1)}
    </g>
  );
};

// o Gordon sentado, de costas (as pernas para fora da pedra, fora de vista); k sobe de 0 a 1 quando ele senta
export const GordonSitBack: React.FC<{ x: number; y: number; s: number; k: number }> = ({ x, y, s, k }) => {
  const H = HEV;
  const sink = (1 - k) * -60;
  return (
    <g transform={`translate(${x} ${y + sink}) scale(${s})`} filter="url(#ink)">
      {/* as coxas saindo para a frente, vistas por trás: só a faixa laranja de fora */}
      <polygon points={pts([[-36, 0], [-14, 0], [-14, -14], [-36, -14]])} fill={H.or} />
      <polygon points={pts([[14, 0], [36, 0], [36, -14], [14, -14]])} fill={H.or} />
      <polygon points={pts([[-33, -4], [33, -4], [33, -22], [-33, -22]])} fill={H.un} />
      <rect x={-34} y={-24} width={68} height={10} rx={3} fill={H.bk} />
      <polygon points={pts([[-32, -24], [32, -24], [36, -48], [-36, -48]])} fill={H.ol} />
      <polygon points={pts([[-38, -48], [38, -48], [44, -92], [-44, -92]])} fill={H.un} />
      <polygon points={pts([[-36, -50], [-7, -50], [-7, -90], [-42, -90]])} fill={H.or} />
      <polygon points={pts([[7, -50], [36, -50], [42, -90], [7, -90]])} fill={H.or} />
      <polygon points={pts([[-36, -50], [-27, -50], [-32, -90], [-42, -90]])} fill={H.orD} />
      <polygon points={pts([[27, -50], [36, -50], [42, -90], [32, -90]])} fill={H.orD} />
      <rect x={-6} y={-90} width={12} height={42} fill={H.bk} />
      <rect x={-12} y={-78} width={24} height={14} rx={3} fill={H.grD} />
      <circle cx={7} cy={-70} r={2.2} fill="#ffb14a" />
      <polygon points={pts([[-48, -86], [48, -86], [44, -100], [26, -110], [-26, -110], [-44, -100]])} fill={H.gr} />
      <polygon points={pts([[-44, -100], [-26, -110], [26, -110], [44, -100], [40, -98], [-40, -98]])} fill={H.grL} />
      {/* os braços apoiados nos joelhos */}
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <path d={limb([sd * 40, -92], [sd * 49, -52], 11, 9)} fill={H.un} />
          <path d={limb([sd * 41, -90], [sd * 48, -58], 8, 6.5)} fill={H.gr} />
          <ellipse cx={sd * 49} cy={-52} rx={9} ry={8} fill={H.bk} />
          <path d={limb([sd * 49, -52], [sd * 41, -20], 9, 7.5)} fill={H.grD} />
          <path d="M -8 -9 Q -9.5 0 -8.5 7 Q -2 11 8.5 7 L 9 -9 Q 0 -11.5 -8 -9 Z" fill={H.bk} transform={`translate(${sd * 40} -12)`} />
        </g>
      ))}
      <rect x={-14} y={-118} width={28} height={12} rx={4} fill={H.bk} />
      <ellipse cx={-16} cy={-138} rx={4.5} ry={7.5} fill="#d9a37f" />
      <ellipse cx={16} cy={-138} rx={4.5} ry={7.5} fill="#d9a37f" />
      <ellipse cx={0} cy={-142} rx={17} ry={20} fill="#4a2e1c" />
      <path d="M-15 -134 q 15 8 30 0 l 0 6 q -15 6 -30 0 z" fill="#3a2414" />
      <rect x={-21} y={-141} width={7} height={2.5} fill="#151515" />
      <rect x={14} y={-141} width={7} height={2.5} fill="#151515" />
    </g>
  );
};
