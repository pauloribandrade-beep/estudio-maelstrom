// =================================================================================================
// HL3 · o resto do elenco na linguagem pintada (31/10/2026): Varga, G-Man, Kleiner, Magnusson, Barney, o soldado Combine,
// o Vortigaunt, o headcrab e o antlion. Mesma construção da Alyx e do Eli (hl3chars): perfil para a direita, pés em (0,0),
// braços e mãos pelo SideArm. d = -1 vira.
// =================================================================================================
import React from "react";
import { pts, Pt } from "./hl3r27";
import { limb, SideArm } from "./hl3chars";
import { MONO } from "./overlays";

const L = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const Shadow: React.FC<{ rx: number }> = ({ rx }) => <ellipse cx={0} cy={2} rx={rx} ry={rx * 0.2} fill="#5d7a90" opacity={0.45} />;

// ---------------------------------------------------------------------------------------------- corpo humano de perfil
type Pal = {
  pa: string; paD: string; paL: string; shoe: string; // calça e sapato
  to: string; toD: string; toL: string; // tronco (jaqueta, jaleco, armadura)
  sl: string; slL: string; slD: string; cuff?: string; // manga
  sk: string; skD: string; skL: string; glove?: string;
};
type ArmPose = { el: Pt; wr: Pt; pose?: "open" | "fist"; fy?: number };
const Person: React.FC<{
  x: number; y: number; s: number; d?: number; ph?: number; amp?: number; pal: Pal; W?: number; coat?: number; belly?: number;
  front?: ArmPose; back?: ArmPose; chest?: React.ReactNode; head: React.ReactNode; held?: React.ReactNode; heldBack?: React.ReactNode; legX?: (k: number, hip: Pt, knee: Pt, ank: Pt) => React.ReactNode;
}> = ({ x, y, s, d = 1, ph = 0, amp = 0, pal: P, W = 1, coat = 0, belly = 0, front, back, chest, head, held, heldBack, legX }) => {
  const bob = -Math.abs(Math.sin(ph)) * 4 * amp, sw = Math.sin(ph) * amp;
  const B = (p: Pt): Pt => [p[0], p[1] + bob];
  const leg = (k: number) => {
    const q = ph + k * Math.PI, a = Math.sin(q) * 0.42 * amp;
    const hip: Pt = [k ? 5 : -2, -104 + bob];
    const knee: Pt = [hip[0] + Math.sin(a) * 44 + 4, -56 - Math.max(0, Math.cos(q)) * 5 * amp];
    const ank: Pt = [knee[0] + Math.sin(a * 0.5 - 0.1) * 32 - 2, -12];
    const c = k ? P.pa : P.paD;
    return (
      <g key={k}>
        <path d={limb(hip, knee, 12.5 * W, 9.5 * W)} fill={c} />
        <path d={limb(knee, ank, 9.5 * W, 7.5 * W)} fill={c} />
        {k ? <path d={`M ${hip[0] + 8 * W} ${hip[1] + 4} L ${knee[0] + 6 * W} ${knee[1]} L ${ank[0] + 4.5 * W} ${ank[1] - 6}`} fill="none" stroke={P.paL} strokeWidth={3 * W} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} /> : null}
        <path d={`M ${knee[0] - 5} ${knee[1] - 3} l 9 4`} stroke={P.paD} strokeWidth={1.6} opacity={0.6} />
        {legX ? legX(k, hip, knee, ank) : null}
        {/* sapato/bota */}
        <path d={`M ${ank[0] - 10 * W} ${ank[1] - 9} L ${ank[0] + 8 * W} ${ank[1] - 9} Q ${ank[0] + 12} ${ank[1] - 1} ${ank[0] + 24} ${ank[1] + 3} Q ${ank[0] + 29} ${ank[1] + 6} ${ank[0] + 28} ${ank[1] + 12} L ${ank[0] - 11 * W} ${ank[1] + 12} Z`} fill={k ? P.shoe : "#1e1a18"} />
        <rect x={ank[0] - 11 * W} y={ank[1] + 9.5} width={39 + 1 * W} height={3} rx={1} fill="#121010" />
      </g>
    );
  };
  const fa = front ?? { el: [4 + sw * 8, -136], wr: [7 + sw * 20, -104 + Math.abs(sw) * 3] };
  const ba = back ?? { el: [-3 - sw * 8, -136], wr: [-sw * 20, -104 + Math.abs(sw) * 3] };
  const by = -104 + coat;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * d} ${s})`} filter="url(#ink)">
      <Shadow rx={38 * W} />
      {leg(0)}
      {heldBack}
      {back || Math.abs(sw) > 0.2 ? <SideArm sh={B([-3, -168])} el={B(ba.el)} wr={B(ba.wr)} w={0.98 * W} c={P.slD} cl={P.sl} cd={P.toD} cuff={P.cuff} sk={P.skD} skD={P.skD} skL={P.sk} glove={P.glove} pose={ba.pose} fy={ba.fy} /> : null}
      {leg(1)}
      <g transform={`translate(0 ${bob})`}>
        {/* tronco */}
        <polygon points={pts([[-20 * W, by], [22 * W + (coat ? 3 : 0), by], [23 * W + belly, -128], [24 * W, -150], [20 * W, -172], [8, -182], [-10, -182], [-21 * W, -172]])} fill={P.to} />
        <polygon points={pts([[-20 * W, by], [-8 * W, by], [-6, -180], [-10, -182], [-21 * W, -172]])} fill={P.toD} />
        <polygon points={pts([[10 * W, by], [22 * W + (coat ? 3 : 0), by], [23 * W + belly, -128], [24 * W, -150], [15 * W, -150]])} fill={P.toL} opacity={0.55} />
        {chest}
        {/* pescoço */}
        <polygon points={pts([[-3, -197], [9, -194], [11, -180], [-1, -180]])} fill={P.sk} />
        <polygon points={pts([[-3, -197], [3, -195], [4, -180], [-1, -180]])} fill={P.skD} />
        {head}
      </g>
      <SideArm sh={B([4, -168])} el={B(fa.el)} wr={B(fa.wr)} w={1.02 * W} c={P.sl} cl={P.slL} cd={P.slD} cuff={P.cuff} sk={P.sk} skD={P.skD} skL={P.skL} glove={P.glove} pose={fa.pose} fy={fa.fy} />
      {held}
    </g>
  );
};

// cabeça masculina de perfil (pescoço em -180, olho em (17,-209)); o cabelo e o resto cada um põe por cima
const ManHead: React.FC<{ sk: string; skD: string; skL: string; brow: string; heavy?: number; jowl?: boolean; nose?: number }> = ({ sk, skD, skL, brow, heavy = 0, jowl, nose = 0 }) => (
  <g>
    <path d={`M -9 -197 C -18 -204 -18 -228 -4 -233 C 8 -237 18 -232 20 -224 L 21 -216 Q ${22.5 + heavy} -213.5 ${22.6 + heavy} -211.5 L 21.6 -209.5 L ${26.6 + nose} -201.4 Q ${27 + nose} -199.8 ${25.2 + nose} -199.4 L 22.8 -199 L 23.4 -196.6 L 22.4 -195.4 L 23 -193.8 L 21.8 -192.2 Q 23.2 -188.4 19.6 -187 Q 12 -186 6 -189.6 L 0 -194 Z`} fill={sk} />
    {jowl ? <path d="M 4 -192 Q 10 -184 18 -186.6 Q 12 -188 8 -192 Z" fill={skD} /> : <path d="M 0 -194 L 6 -189.6 Q 12 -186 19.6 -187 Q 13 -189 8 -193 Z" fill={skD} />}
    <path d="M 12 -229 q 6 3 7.5 10" fill="none" stroke={skL} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
    <path d="M 12.5 -204 q 3.4 -1.2 6.4 0.6 q -2.4 2.8 -6.4 1.4 z" fill={skL} opacity={0.4} />
    <path d={`M 22 -202.6 L ${26.4 + nose} -200 L 23.2 -199.4 Z`} fill={skD} />
    <path d="M 21.6 -199 q -2.6 2 -2.4 4.6" fill="none" stroke={skD} strokeWidth={0.8} opacity={0.7} />
    <path d="M 19.4 -195.6 L 23 -195.3" stroke="#5a2e26" strokeWidth={1} strokeLinecap="round" />
    <path d="M 14 -208.6 Q 16.8 -210.4 19.6 -208.8 Q 17 -207.4 14 -208.6 Z" fill="#f2ebe2" />
    <circle cx={17.4} cy={-208.7} r={1.3} fill="#2a1e16" />
    <path d="M 13.8 -208.8 Q 16.8 -211 19.8 -209" fill="none" stroke="#1a1210" strokeWidth={1} strokeLinecap="round" />
    <path d={`M 13 -${212.4 + heavy * 0.6} Q 17 -${214.4 + heavy * 0.6} 21.8 -${212.8 + heavy * 0.4}`} fill="none" stroke={brow} strokeWidth={1.8 + heavy * 0.9} strokeLinecap="round" />
    {heavy ? <path d="M 14 -215.6 q 4 -1.6 8 0" fill="none" stroke={skD} strokeWidth={0.9} opacity={0.7} /> : null}
    <path d="M 0.4 -209 q 4.4 -1.2 4.6 4.2 q 0 4.2 -3.8 4 q -1.8 -4 -0.8 -8.2 z" fill={skD} />
    <path d="M 1.6 -207.4 q 2 0.4 2 3" fill="none" stroke={sk} strokeWidth={0.8} opacity={0.7} />
  </g>
);

// ---------------------------------------------------------------------------------------------- Varga (personagem nosso)
// gorro de lã escuro dobrado, barba grisalha cheia, jaqueta militar oliva com bolsos e a braçadeira vermelha, calça de
// campanha, coturno; a pasta MOSSMAN na mão da frente
export const VargaSide: React.FC<{ x: number; y: number; s: number; d?: number; ph?: number; amp?: number; folder?: number; f: number }> = ({ x, y, s, d, ph = 0, amp = 0, folder = 1, f }) => {
  const P: Pal = { pa: "#4a4d3a", paD: "#36382a", paL: "#5c604a", shoe: "#2e241c", to: "#556042", toD: "#3f4832", toL: "#6b7652", sl: "#5a6546", slL: "#717d5a", slD: "#3f4832", cuff: "#3f4832", sk: "#c99a7a", skD: "#a47a5c", skL: "#ddb394" };
  const GR = "#c4beb4", GRD = "#9a948a";
  const fp = folder ? { el: [22, -140] as Pt, wr: [44, -146] as Pt, pose: "fist" as const, fy: -1 } : undefined;
  return (
    <Person x={x} y={y} s={s} d={d} ph={ph} amp={amp} pal={P} W={1.12} front={fp}
      chest={
        <g>
          {/* gola alta, zíper, bolsos com aba, o cinto de lona */}
          <polygon points={pts([[-12, -184], [10, -186], [16, -176], [-14, -174]])} fill="#6b7652" />
          <path d="M 22 -176 L 25 -112" stroke="#3a4230" strokeWidth={1.6} />
          <rect x={4} y={-166} width={16} height={16} rx={2} fill="#4a5438" />
          <rect x={3} y={-168} width={18} height={5} rx={2} fill="#6b7652" />
          <rect x={-2} y={-136} width={20} height={18} rx={2} fill="#4a5438" />
          <rect x={-3} y={-138} width={22} height={5} rx={2} fill="#6b7652" />
          <rect x={-24} y={-112} width={52} height={7} fill="#3a3a2c" />
          <rect x={14} y={-112} width={8} height={7} fill="#8a8668" />
        </g>
      }
      head={
        <g>
          <ManHead sk={P.sk} skD={P.skD} skL={P.skL} brow={GRD} heavy={0.6} />
          {/* barba cheia grisalha e o bigode */}
          <path d="M 0 -200 Q -1 -190 6 -186 Q 14 -182 21 -185 Q 25 -188 24 -193 L 22.4 -195.4 L 18.5 -195.8 Q 10 -194 6 -200 Q 4 -205 2 -206 Z" fill={GR} />
          <path d="M 18.6 -197.6 Q 22 -199.4 25 -197.4 Q 23 -195.6 19 -196 Z" fill={GR} />
          <path d="M 6 -192 q 6 4 13 2 M 4 -197 q 3 6 9 7" fill="none" stroke={GRD} strokeWidth={0.9} />
          {/* gorro com a barra dobrada */}
          <path d="M -15 -212 Q -18 -234 -2 -240 Q 12 -243 21 -231 L 21.5 -222 Q 4 -222 -15 -212 Z" fill="#36383e" />
          <path d="M -16 -214 Q 3 -225 22 -224 L 22 -217.5 Q 3 -218.5 -15.5 -207 Z" fill="#45474e" />
          {[-10, -4, 2, 8, 14].map((q) => <path key={q} d={`M ${q} ${-228 - (q < 0 ? 0 : 2)} l 0.6 -8`} stroke="#2a2c30" strokeWidth={1} />)}
          <path d="M -14 -211 Q 3 -221.5 21.6 -221" fill="none" stroke="#2a2c30" strokeWidth={1} />
        </g>
      }
      held={
        folder ? (
          <g transform={`rotate(${-10 + Math.sin(f / 30) * 2} 50 -150)`}>
            <rect x={36} y={-176} width={46} height={34} rx={1.5} fill="#d8b871" />
            <rect x={39} y={-180} width={38} height={6} fill="#f2efe6" />
            <rect x={42} y={-183} width={33} height={4} fill="#e6e2d6" />
            <rect x={39} y={-166} width={24} height={3} fill="#a8894a" />
            <text x={41} y={-150} fontFamily={MONO} fontSize={6.5} letterSpacing={1} fill="#6b5428">MOSSMAN</text>
          </g>
        ) : null
      }
    />
  );
};
// a braçadeira fica no braço da frente; desenhada à parte porque o braço muda de pose
export const VargaBand: React.FC<{ x: number; y: number; s: number; d?: number }> = ({ x, y, s, d = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * d} ${s})`}>
    {(() => {
      const a: Pt = L([4, -168], [22, -140], 0.3), b: Pt = L([4, -168], [22, -140], 0.52), n: Pt = [-0.84 * 9.6, 0.54 * 9.6];
      return (
        <g>
          <polygon points={pts([[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]])} fill="#c9452f" />
          <polygon points={pts([L([a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], 0.4), L([a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], 0.6), L([a[0] - n[0], a[1] - n[1]], [b[0] - n[0], b[1] - n[1]], 0.6), L([a[0] - n[0], a[1] - n[1]], [b[0] - n[0], b[1] - n[1]], 0.4)])} fill="#e8d8b0" opacity={0.7} />
        </g>
      );
    })()}
  </g>
);

// ---------------------------------------------------------------------------------------------- Kleiner
// careca com a franja grisalha atrás, óculos de armação preta grossa e retangular, jaleco branco até o joelho, camisa azul
// clara, gravata escura, calça cinza-bege, sapato marrom. Baixinho e um pouco curvado.
export const KleinerSide: React.FC<{ x: number; y: number; s: number; d?: number; ph?: number; amp?: number; talk?: number; f: number }> = ({ x, y, s, d, ph = 0, amp = 0, talk = 0, f }) => {
  const P: Pal = { pa: "#8a8274", paD: "#6a6458", paL: "#a29a8a", shoe: "#4a2e1e", to: "#ecebe6", toD: "#c6c4bc", toL: "#ffffff", sl: "#e4e2dc", slL: "#fbfaf6", slD: "#bdbbb3", cuff: "#bcd2e6", sk: "#e6bf9e", skD: "#c49878", skL: "#f6d8bc" };
  const g = Math.sin(f / 5) * talk;
  return (
    <Person x={x} y={y} s={s * 0.95} d={d} ph={ph} amp={amp} pal={P} W={1.04} coat={44} belly={3}
      front={talk ? { el: [20, -142], wr: [38 + g * 4, -160 - g * 6], pose: "open", fy: -1 } : undefined}
      chest={
        <g>
          <polygon points={pts([[6, -184], [20, -178], [16, -150], [10, -150]])} fill="#bcd2e6" />
          <polygon points={pts([[14, -178], [18, -177], [17, -152], [15, -148], [13, -152]])} fill="#3a2a34" />
          {/* lapela do jaleco, bolso com canetas */}
          <polyline points={pts([[4, -184], [12, -150], [24, -142]])} fill="none" stroke={P.toD} strokeWidth={1.6} />
          <rect x={-2} y={-160} width={14} height={2} fill={P.toD} />
          <rect x={2} y={-168} width={1.6} height={9} fill="#2a4a8a" />
          <rect x={5} y={-167} width={1.6} height={8} fill="#a02a2a" />
          <rect x={-4} y={-108} width={18} height={2} fill={P.toD} />
          <path d={`M 24 -142 L 26 -60`} stroke={P.toD} strokeWidth={1.4} />
        </g>
      }
      head={
        <g>
          <ManHead sk={P.sk} skD={P.skD} skL={P.skL} brow="#7a6a5a" nose={0.6} />
          {/* a careca brilhando e a franja grisalha */}
          <ellipse cx={4} cy={-229} rx={9} ry={3} fill="#fff4e6" opacity={0.45} transform="rotate(-12 4 -229)" />
          <path d="M -15 -203 Q -19 -216 -12 -224 Q -8 -219 -6 -213 Q -2 -212 1 -210 Q -2 -206 -5 -199 Z" fill="#a8a296" />
          <path d="M -13 -218 q -2 6 0 12 M -9 -216 q -1 5 1 10" fill="none" stroke="#8a8478" strokeWidth={0.8} />
          {/* óculos de armação grossa */}
          <rect x={14.2} y={-212} width={8} height={6.6} rx={1.2} fill="#cfe3ec" opacity={0.35} stroke="#121212" strokeWidth={1.9} />
          <path d="M 14.2 -209.6 L 3 -207.8" stroke="#121212" strokeWidth={1.7} />
          <path d="M 15.4 -211 l 3 0" stroke="#ffffff" strokeWidth={0.8} opacity={0.7} />
        </g>
      }
    />
  );
};

// ---------------------------------------------------------------------------------------------- Magnusson
// cabelo grisalho farto penteado para trás, testa pesada, cara fechada, papada; jaleco azul-claro, camisa branca, gravata
// rosa-avermelhada, barriga. Mãos para trás, impaciente.
export const MagnussonSide: React.FC<{ x: number; y: number; s: number; d?: number; ph?: number; amp?: number; f: number }> = ({ x, y, s, d, ph = 0, amp = 0 }) => {
  const P: Pal = { pa: "#4a4e56", paD: "#363a40", paL: "#5c616a", shoe: "#1e1a18", to: "#c4d6e0", toD: "#9fb4c0", toL: "#e2eef4", sl: "#bcd0da", slL: "#dae8ee", slD: "#94a8b4", cuff: "#f0f0ec", sk: "#e0b294", skD: "#bb8a6c", skL: "#f2cfb4" };
  return (
    <Person x={x} y={y} s={s * 1.02} d={d} ph={ph} amp={amp} pal={P} W={1.14} coat={40} belly={9}
      chest={
        <g>
          <polygon points={pts([[6, -184], [22, -178], [26, -146], [12, -150]])} fill="#f4f2ee" />
          <polygon points={pts([[16, -178], [20, -177], [24, -150], [21, -145], [18, -150]])} fill="#c4566a" />
          <polyline points={pts([[4, -184], [14, -148], [30, -136]])} fill="none" stroke={P.toD} strokeWidth={1.6} />
          <path d="M 30 -136 L 29 -64" stroke={P.toD} strokeWidth={1.4} />
          <circle cx={27} cy={-126} r={1.6} fill={P.toD} />
          <circle cx={28} cy={-104} r={1.6} fill={P.toD} />
        </g>
      }
      head={
        <g>
          <ManHead sk={P.sk} skD={P.skD} skL={P.skL} brow="#cfcac2" heavy={1.6} jowl nose={1} />
          {/* boca para baixo, ruga de bravo */}
          <path d="M 19.2 -195.2 Q 21 -196 23 -194.6" fill="none" stroke="#5a2e26" strokeWidth={1.1} />
          <path d="M 20.4 -191 q 1.6 -1 2.6 0" fill="none" stroke={P.skD} strokeWidth={0.9} />
          {/* cabelo farto grisalho penteado para trás */}
          <path d="M -12 -200 Q -22 -214 -12 -232 Q 0 -244 16 -236 Q 22 -232 21 -226 Q 14 -230 6 -228 Q 0 -226 -2 -220 Q -4 -212 -3 -202 Z" fill="#dcd8d0" />
          <path d="M 18 -232 Q 6 -236 -6 -230 M 14 -228 Q 2 -230 -8 -222 M 8 -226 Q -2 -224 -10 -212" fill="none" stroke="#aaa59c" strokeWidth={1} />
          <path d="M -12 -200 Q -15 -196 -10 -192" fill="none" stroke="#dcd8d0" strokeWidth={3} />
        </g>
      }
    />
  );
};

// ---------------------------------------------------------------------------------------------- Barney
// cabelo escuro curtinho, jaqueta escura acolchoada de gola alta (Ep1), calça jeans escura, coturno; alto
export const BarneySide: React.FC<{ x: number; y: number; s: number; d?: number; ph?: number; amp?: number; wave?: number; f: number }> = ({ x, y, s, d, ph = 0, amp = 0, wave = 0, f }) => {
  const P: Pal = { pa: "#3c4a5c", paD: "#2c3644", paL: "#52627a", shoe: "#2a221c", to: "#3a4048", toD: "#2a2e34", toL: "#525a64", sl: "#3e444c", slL: "#565e68", slD: "#2a2e34", cuff: "#24282e", sk: "#e0b090", skD: "#bc8a6a", skL: "#f2cbaa" };
  const w = Math.sin(f / 4) * wave;
  return (
    <Person x={x} y={y} s={s * 1.06} d={d} ph={ph} amp={amp} pal={P} W={1.1}
      front={wave ? { el: [22, -176], wr: [30 + w * 6, -210], pose: "open", fy: -1 } : undefined}
      chest={
        <g>
          {/* o acolchoado em gomos e a gola alta */}
          {[0, 1, 2, 3, 4].map((j) => <path key={j} d={`M ${-21} ${-124 - j * 12} Q 2 ${-120 - j * 12} 24 ${-125 - j * 12}`} fill="none" stroke="#24282e" strokeWidth={1.6} />)}
          <path d="M 22 -178 L 25 -106" stroke="#1e2226" strokeWidth={1.8} />
          <polygon points={pts([[-13, -190], [9, -192], [14, -178], [-14, -176]])} fill="#464d56" />
          <rect x={-22} y={-108} width={48} height={5} fill="#24282e" />
        </g>
      }
      head={
        <g>
          <ManHead sk={P.sk} skD={P.skD} skL={P.skL} brow="#3a2a20" />
          <path d="M -12 -204 Q -19 -222 -8 -233 Q 4 -239 16 -234 Q 21 -231 20.5 -225 Q 14 -228 8 -227 Q 3 -224 1.6 -219 Q 0 -212 -1 -206 Z" fill="#3a2a20" />
          <path d="M -10 -224 q 8 -6 20 -5 M -12 -214 q 4 -7 12 -8" fill="none" stroke="#24180f" strokeWidth={0.9} />
          <path d="M 3 -200 q 0 4 3 7" fill="none" stroke={P.skD} strokeWidth={1.4} opacity={0.6} />
        </g>
      }
    />
  );
};

// ---------------------------------------------------------------------------------------------- soldado Combine (Overwatch)
// capacete e máscara de gás, o olho redondo azul aceso, filtro na boca com a mangueira, armadura azul-acinzentada com a
// placa do peito, cinto de cargas, joelheira, luvas e coturno pretos, a SMG nas duas mãos
export const CombineSide: React.FC<{ x: number; y: number; s: number; d?: number; ph?: number; amp?: number; aim?: number; eye?: string; f: number }> = ({ x, y, s, d, ph = 0, amp = 0, aim = 0, eye = "#5fd4ff", f }) => {
  const P: Pal = { pa: "#34404e", paD: "#252e3a", paL: "#4a5868", shoe: "#16191e", to: "#3e4c5e", toD: "#2a3442", toL: "#5a6c80", sl: "#323e4c", slL: "#4a5a6c", slD: "#222a34", sk: "#16191e", skD: "#0e1012", skL: "#2a2e34", glove: "#16191e" };
  const gy = -142 - aim * 22;
  const blink = 0.8 + 0.2 * Math.sin(f / 7);
  return (
    <Person x={x} y={y} s={s * 1.06} d={d} ph={ph} amp={amp} pal={P} W={1.14}
      front={{ el: [20, -136 - aim * 8], wr: [34, gy + 4], pose: "fist", fy: -1 }} back={{ el: [14, -142 - aim * 10], wr: [54, gy - 2], pose: "fist", fy: -1 }}
      legX={(k, hip, knee) => (
        <g>
          <ellipse cx={knee[0] + 4} cy={knee[1]} rx={8} ry={9} fill={k ? "#1e242c" : "#151a20"} />
          <path d={limb([hip[0] + 2, hip[1] + 12], [hip[0] + 4, hip[1] + 26], 9, 9)} fill={k ? "#2a323e" : "#1e242c"} />
        </g>
      )}
      chest={
        <g>
          <polygon points={pts([[-6, -176], [20, -172], [26, -146], [22, -128], [-2, -126]])} fill="#4c5e74" />
          <polygon points={pts([[8, -170], [20, -168], [25, -146], [12, -146]])} fill="#6a7e94" opacity={0.6} />
          <rect x={-22} y={-112} width={50} height={9} rx={2} fill="#1e242c" />
          {[-16, -4, 8].map((q) => <rect key={q} x={q} y={-124} width={10} height={13} rx={2} fill="#2a323e" />)}
          <path d="M -18 -182 Q 2 -188 14 -184" fill="none" stroke="#1e242c" strokeWidth={4} />
        </g>
      }
      head={
        <g>
          {/* protetor do pescoço */}
          <path d="M -10 -196 Q 2 -201 13 -194 L 12 -181 L -8 -181 Z" fill="#232a34" />
          {[0, 1, 2].map((j) => <path key={j} d={`M -8 ${-192 + j * 4} Q 2 ${-196 + j * 4} 12 ${-191 + j * 4}`} fill="none" stroke="#141a20" strokeWidth={0.9} />)}
          {/* capacete com a aba e o rádio do lado */}
          <path d="M -15 -200 Q -21 -226 -6 -238 Q 10 -246 22 -232 Q 26 -224 25 -216 L 8 -214 L -2 -198 Z" fill="#3a485a" />
          <path d="M -12 -226 Q -4 -238 12 -238" fill="none" stroke="#5e7086" strokeWidth={3} strokeLinecap="round" />
          <path d="M -16 -212 Q 4 -221 25.4 -217" fill="none" stroke="#222a34" strokeWidth={2.2} />
          <path d="M -6 -236 L -2 -242 L 6 -243" fill="none" stroke="#2a3644" strokeWidth={2} />
          <rect x={-5} y={-212} width={9} height={13} rx={2.4} fill="#2a323e" />
          <circle cx={-0.6} cy={-205.6} r={2.2} fill="#3e4a58" />
          <circle cx={-0.6} cy={-205.6} r={0.9} fill={eye} opacity={0.8} />
          {/* máscara de gás */}
          <path d="M 6 -216 Q 18 -219.6 26 -212 Q 29.4 -204 27.4 -196 Q 25 -190 18 -188 L 6 -188 Q 0 -200 6 -216 Z" fill="#1c2128" />
          <path d="M 8 -214 Q 18 -217 24.6 -211" fill="none" stroke="#3a4450" strokeWidth={1.4} />
          {/* a lente redonda com aro de metal */}
          <circle cx={18.6} cy={-205.6} r={5.8} fill="#5a6470" />
          <circle cx={18.6} cy={-205.6} r={4.6} fill="#0a0c0e" />
          <circle cx={19} cy={-205.6} r={3.4} fill={eye} opacity={blink} />
          <circle cx={19.4} cy={-205.6} r={1.4} fill="#e8fbff" opacity={0.9 * blink} />
          <circle cx={20.6} cy={-207.4} r={0.9} fill="#ffffff" opacity={0.9} />
          <circle cx={19} cy={-205.6} r={10} fill={eye} opacity={0.16 * blink} />
          {/* o respirador saliente com a grade */}
          <path d="M 17 -197 L 29 -195.6 Q 33 -191 30 -186 L 17 -186 Q 15 -191 17 -197 Z" fill="#2c343e" />
          {[21, 24, 27].map((gx) => <path key={gx} d={`M ${gx} -195 L ${gx} -187`} stroke="#151a20" strokeWidth={1.1} />)}
          <path d="M 18 -196 L 29 -194.8" stroke="#46525e" strokeWidth={1} />
          {/* a mangueira sanfonada até as costas */}
          <path d="M 19 -187 Q 16 -178 6 -176 Q -2 -175 -8 -180" fill="none" stroke="#151a20" strokeWidth={4} strokeLinecap="round" />
          <path d="M 19 -187 Q 16 -178 6 -176 Q -2 -175 -8 -180" fill="none" stroke="#2e3742" strokeWidth={4} strokeDasharray="1.3 1.5" />
        </g>
      }
      held={
        <g transform={`rotate(${-aim * 8} 40 ${gy})`}>
          {/* a SMG */}
          <rect x={22} y={gy - 8} width={46} height={10} rx={2} fill="#1a1e24" />
          <rect x={66} y={gy - 6} width={14} height={4} fill="#2a2e34" />
          <rect x={30} y={gy + 2} width={7} height={14} rx={1.5} fill="#1a1e24" transform={`rotate(12 33 ${gy + 2})`} />
          <rect x={46} y={gy + 2} width={6} height={12} fill="#24282e" />
          <rect x={8} y={gy - 6} width={16} height={6} rx={2} fill="#24282e" />
          <rect x={30} y={gy - 12} width={14} height={4} fill="#2a2e34" />
          <rect x={24} y={gy - 7} width={42} height={1.6} fill="#4a525c" />
        </g>
      }
    />
  );
};

// ---------------------------------------------------------------------------------------------- G-Man (de frente)
// terno azul-marinho, camisa branca, gravata marinho, cabelo escuro penteado para trás com entradas, rosto magro e
// encovado, olhos fundos, a maleta na mão esquerda. tie: ajeita a gravata. solid: silhueta numa cor só (as cópias da falha)
export const GManFront: React.FC<{ x: number; y: number; s: number; tie: number; solid?: string; op?: number }> = ({ x, y, s, tie, solid, op = 1 }) => {
  const c = (v: string) => solid ?? v;
  const SU = "#2c3850", SUL = "#3e4c68", SUD = "#1e2638", SK = "#d6c2a8", SKD = "#b09a80", SKL = "#e8d8c2";
  const hx = 34 - tie * 30, hy = -104 - tie * 74;
  const ex = 40 - tie * 4, ey = -144 - tie * 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op} filter={solid ? undefined : "url(#ink)"}>
      {!solid ? <ellipse cx={0} cy={2} rx={42} ry={8} fill="#5d7a90" opacity={0.45} /> : null}
      {/* pernas e sapatos */}
      <path d={limb([-11, -108], [-10, -10], 11, 8.5)} fill={c(SU)} />
      <path d={limb([11, -108], [10, -10], 11, 8.5)} fill={c(SUD)} />
      <path d="M -4 -104 L -6 -14" stroke={c(SUL)} strokeWidth={2} opacity={0.6} />
      <path d="M -22 -2 Q -22 -12 -10 -13 Q 0 -12 0 -4 L 0 1 L -22 1 Z" fill={c("#0f0f12")} />
      <path d="M 22 -2 Q 22 -12 10 -13 Q 0 -12 0 -4 L 0 1 L 22 1 Z" fill={c("#0f0f12")} />
      {/* braço esquerdo dele (à nossa direita... aqui à esquerda) com a maleta */}
      <path d={limb([-32, -186], [-38, -144], 9.5, 8)} fill={c(SU)} />
      <path d={limb([-38, -144], [-38, -104], 8, 6.5)} fill={c(SU)} />
      <path d={limb([-38, -112], [-38, -102], 6.6, 6.4)} fill={c("#eef0f2")} />
      <path d="M -44 -102 Q -46 -92 -40 -88 Q -32 -88 -32 -96 L -32 -102 Z" fill={c(SK)} />
      <rect x={-62} y={-92} width={46} height={34} rx={3} fill={c("#2e2218")} />
      <rect x={-62} y={-92} width={46} height={5} rx={2} fill={c("#40301f")} />
      <path d="M -47 -92 q 0 -7 8 -7 q 8 0 8 7" fill="none" stroke={c("#1a120c")} strokeWidth={3} />
      <rect x={-58} y={-84} width={4} height={6} fill={c("#b8a070")} />
      <rect x={-24} y={-84} width={4} height={6} fill={c("#b8a070")} />
      {/* paletó */}
      <polygon points={pts([[-30, -98], [30, -98], [34, -150], [36, -190], [22, -200], [-22, -200], [-36, -190], [-34, -150]])} fill={c(SU)} />
      <polygon points={pts([[8, -98], [30, -98], [34, -150], [36, -190], [22, -200], [12, -200]])} fill={c(SUD)} />
      <polygon points={pts([[-30, -98], [-20, -98], [-22, -150], [-34, -150]])} fill={c(SUL)} opacity={0.6} />
      {/* camisa, gravata, lapelas */}
      <polygon points={pts([[-11, -200], [11, -200], [3, -138], [-3, -138]])} fill={c("#eceef0")} />
      <polygon points={pts([[-2.6, -196], [2.6, -196], [4.4, -146], [0, -138], [-4.4, -146]])} fill={c("#1a2234")} />
      <polygon points={pts([[-2.6, -196], [2.6, -196], [2, -190], [-2, -190]])} fill={c("#26304a")} />
      <polygon points={pts([[-11, -200], [-2, -146], [-17, -168], [-14, -184]])} fill={c(SUL)} />
      <polygon points={pts([[11, -200], [2, -146], [17, -168], [14, -184]])} fill={c("#202a40")} />
      <rect x={-16} y={-158} width={9} height={2} fill={c("#e8eaec")} />
      <circle cx={0} cy={-122} r={2.4} fill={c("#11151e")} />
      <circle cx={0} cy={-108} r={2.4} fill={c("#11151e")} />
      <path d="M -26 -116 L -12 -116 M 14 -116 L 26 -116" stroke={c(SUD)} strokeWidth={1.6} />
      {/* cabeça: rosto magro, maçãs fundas, olhos fundos, entradas no cabelo */}
      <rect x={-7} y={-212} width={14} height={14} fill={c(SKD)} />
      <path d="M -15 -232 Q -16 -250 0 -252 Q 16 -250 15 -232 Q 15 -218 10 -210 Q 5 -204 0 -204 Q -5 -204 -10 -210 Q -15 -218 -15 -232 Z" fill={c(SK)} />
      {!solid ? (
        <g>
          <path d="M -14 -224 Q -10 -214 -6 -212 Q -9 -220 -10 -226 Z" fill={SKD} opacity={0.75} />
          <path d="M 14 -224 Q 10 -214 6 -212 Q 9 -220 10 -226 Z" fill={SKD} opacity={0.75} />
          <ellipse cx={-6} cy={-230} rx={4.6} ry={3} fill={SKD} />
          <ellipse cx={6} cy={-230} rx={4.6} ry={3} fill={SKD} />
          <path d="M -9 -230 q 3 -1.8 6 0 q -3 1.4 -6 0 z M 3 -230 q 3 -1.8 6 0 q -3 1.4 -6 0 z" fill="#efe8dc" />
          <circle cx={-6} cy={-230} r={1.3} fill="#2a3a2a" />
          <circle cx={6} cy={-230} r={1.3} fill="#2a3a2a" />
          <path d="M -10.6 -234 q 4.6 -2 9 0 M 1.6 -234 q 4.6 -2 9 0" fill="none" stroke="#3a2a20" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M -0.6 -229 L -1.6 -218 Q 0 -216.6 1.8 -218" fill="none" stroke={SKD} strokeWidth={1.1} />
          <path d="M -4.6 -211.6 Q 0 -212.6 4.6 -211.6" fill="none" stroke="#7a5a4a" strokeWidth={1.2} strokeLinecap="round" />
          <path d="M -7 -214 q -1 -3 0 -5 M 7 -214 q 1 -3 0 -5" fill="none" stroke={SKD} strokeWidth={0.8} />
          <path d="M -12 -246 q 12 -5 24 0" fill="none" stroke={SKL} strokeWidth={2} opacity={0.6} />
          <ellipse cx={-16} cy={-228} rx={2.6} ry={5} fill={SKD} />
          <ellipse cx={16} cy={-228} rx={2.6} ry={5} fill={SKD} />
        </g>
      ) : null}
      <path d="M -16 -230 Q -18 -252 -4 -256 Q 10 -258 17 -248 Q 18 -240 16 -232 Q 14 -244 8 -246 Q 4 -242 0 -248 Q -6 -244 -10 -246 Q -14 -242 -16 -230 Z" fill={c("#2e241c")} />
      <path d="M -10 -252 q 8 -3 16 0" fill="none" stroke={c("#4a3a2c")} strokeWidth={1} />
      {/* braço direito: ajeita a gravata */}
      <path d={limb([32, -186], [ex, ey], 9.5, 8)} fill={c(SUD)} />
      <path d={limb([ex, ey], [hx + 6, hy + 4], 8, 6.5)} fill={c(SUD)} />
      <path d={limb(L([ex, ey], [hx + 6, hy + 4], 0.82), [hx + 6, hy + 4], 6.6, 6.4)} fill={c("#eef0f2")} />
      <path d={`M ${hx + 6} ${hy - 2} Q ${hx - 4} ${hy - 4} ${hx - 6} ${hy + 4} Q ${hx - 4} ${hy + 10} ${hx + 6} ${hy + 10} Z`} fill={c(SK)} />
      <path d={`M ${hx - 2} ${hy - 2} l -4 -5`} stroke={c(SK)} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- Vortigaunt
// Referência: HL2/Ep2/Alyx. Pele marrom-acinzentada (bege-oliva sujo, com manchas mais escuras e tons rosados nas juntas),
// NÃO é verde. Corpo magro, costelas aparecendo, corcunda; a cabeça sai direto dos ombros, crânio alongado para trás, o
// olho vermelho grande na frente com os tubos do "nariz" dos lados, a boca de dentes embaixo e o queixo caído. O bracinho
// do peito sob a cabeça. Braços longos e finos até o joelho, mão de dois dedos em garra e o polegar. Pernas finas de
// joelho para trás e o pé de casco escuro.
type VPose = "walk" | "work" | "talk" | "offer" | "carry" | "stand";
export const VortSide: React.FC<{ x: number; y: number; s: number; d?: number; pose?: VPose; ph?: number; f: number; old?: boolean; off?: number }> = ({ x, y, s, d = 1, pose = "stand", ph = 0, f, old, off = 0 }) => {
  const c = old
    ? { b: "#8c867a", d: "#68625a", l: "#aaa498", bl: "#bab4a6", sp: "#5a554c", pk: "#a0786e" }
    : { b: "#857a62", d: "#5e5444", l: "#a39880", bl: "#b4a88c", sp: "#4e4434", pk: "#a8665a" };
  const amp = pose === "walk" || pose === "carry" ? 1 : 0;
  const bob = -Math.abs(Math.sin(ph)) * 3 * amp;
  const leg = (k: number) => {
    const sw = Math.sin(ph + k * Math.PI) * 0.4 * amp;
    const hip: Pt = [k ? 4 : -4, -86 + bob];
    const knee: Pt = [hip[0] + 18 + sw * 24, -58];
    const hock: Pt = [hip[0] - 12 + sw * 36, -36];
    const toe: Pt = [hock[0] + 16, -6];
    const cc = k ? c.b : c.d;
    return (
      <g key={k}>
        <path d={limb(hip, knee, 10, 6.5)} fill={cc} />
        <path d={limb(knee, hock, 5.5, 4)} fill={cc} />
        <path d={limb(hock, toe, 4.2, 3.4)} fill={cc} />
        <circle cx={knee[0]} cy={knee[1]} r={6} fill={k ? c.l : c.d} opacity={0.7} />
        <circle cx={hock[0]} cy={hock[1]} r={4.2} fill={c.pk} opacity={0.55} />
        {/* o casco escuro, pontudo */}
        <path d={`M ${toe[0] - 7} ${toe[1] - 2} Q ${toe[0] + 2} ${toe[1] - 6} ${toe[0] + 10} ${toe[1] + 1} L ${toe[0] + 16} ${toe[1] + 7} L ${toe[0] - 8} ${toe[1] + 7} Z`} fill={k ? "#3a2e26" : "#2a221c"} />
        <path d={`M ${toe[0] - 4} ${toe[1] + 2} Q ${toe[0] + 4} ${toe[1]} ${toe[0] + 10} ${toe[1] + 4}`} fill="none" stroke="#6a5a4a" strokeWidth={1} />
        {k ? <path d={`M ${hip[0] + 5} ${hip[1] + 4} L ${knee[0] + 3} ${knee[1] - 3}`} stroke={c.l} strokeWidth={2.6} strokeLinecap="round" opacity={0.6} /> : null}
      </g>
    );
  };
  const swg = Math.sin(ph) * 0.5 * amp;
  const sh: Pt = [18, -150 + bob];
  const wr: Pt = pose === "work" ? [46, -44 + Math.sin(f / 7) * 10] : pose === "talk" ? [62, -150 + Math.sin(f / 6) * 10] : pose === "offer" ? [56 + off * 30, -118] : pose === "carry" ? [44, -112] : [30 + swg * 30, -76];
  const el: Pt = pose === "talk" ? [44, -118] : pose === "offer" ? [36 + off * 12, -114] : pose === "work" ? [34, -96] : pose === "carry" ? [34, -120] : [24 + swg * 14, -112];
  // mão: dois dedos longos em garra e o polegar
  const hand = (p: Pt, from: Pt, k: number) => {
    const a = (Math.atan2(p[1] - from[1], p[0] - from[0]) * 180) / Math.PI;
    const cc = k ? c.b : c.d;
    return (
      <g transform={`translate(${p[0]} ${p[1]}) rotate(${a})`}>
        <path d="M 0 -4 Q 5 -5 8 -3.4 L 8 3.4 Q 4 5 0 4 Z" fill={cc} />
        <path d={limb([7, -1.6], [17, -4.6], 2.4, 1.8)} fill={cc} />
        <path d={limb([17, -4.6], [24, -1.6], 1.8, 1)} fill={cc} />
        <path d={limb([7, 2], [16, 3.6], 2.4, 1.8)} fill={cc} />
        <path d={limb([16, 3.6], [22, 7.4], 1.8, 1)} fill={cc} />
        <path d={limb([3, -4], [8, -8], 1.8, 1.2)} fill={cc} />
        <path d="M 24 -1.6 l 2 2 M 22 7.4 l 1.4 2.4 M 8 -8 l 2 -0.6" stroke="#2a221a" strokeWidth={1.4} strokeLinecap="round" />
        <circle cx={7.6} cy={-1.4} r={1.2} fill={c.pk} opacity={0.6} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s * d} ${s})`} filter="url(#ink)">
      <Shadow rx={34} />
      {leg(0)}
      {/* braço de trás (só aparece andando) */}
      {amp ? (
        <g>
          <path d={limb([-2, -154 + bob], [-6 - swg * 14, -116 + bob], 6, 4.6)} fill={c.d} />
          <path d={limb([-6 - swg * 14, -116 + bob], [-2 - swg * 30, -80 + bob], 4.6, 3.4)} fill={c.d} />
          {hand([-2 - swg * 30, -80 + bob], [-6 - swg * 14, -116 + bob], 0)}
        </g>
      ) : null}
      {leg(1)}
      <g transform={`translate(0 ${bob})`}>
        {/* bacia */}
        <path d="M -16 -80 Q -20 -94 -10 -102 L 8 -100 Q 14 -90 8 -78 Q -4 -74 -16 -80 Z" fill={c.b} />
        {/* tronco curvado para a frente: a corcunda dos ombros é o ponto mais alto */}
        <path d="M -12 -90 Q -22 -116 -14 -144 Q -4 -166 12 -168 Q 26 -166 30 -152 Q 30 -138 22 -122 Q 14 -104 8 -92 Z" fill={c.b} />
        <path d="M -12 -90 Q -22 -116 -14 -144 Q -4 -166 12 -168 Q -4 -150 -6 -124 Q -6 -104 0 -92 Z" fill={c.d} />
        {/* barriga mais clara, costelas, manchas */}
        <path d="M 28 -148 Q 28 -134 20 -120 Q 14 -106 8 -94 Q 4 -98 8 -110 Q 16 -128 28 -148 Z" fill={c.bl} opacity={0.85} />
        {[0, 1, 2, 3, 4].map((j) => <path key={j} d={`M ${-2 + j * 1.6} ${-146 + j * 8} Q ${10 + j * 0.6} ${-148 + j * 8} ${24 - j * 2.4} ${-140 + j * 7.6}`} fill="none" stroke={c.d} strokeWidth={1.2} opacity={0.7} />)}
        {[[-10, -128, 2.8], [-4, -152, 2.6], [-12, -108, 2.4], [6, -160, 2], [2, -118, 1.8]].map(([sx, sy, r], j) => <ellipse key={j} cx={sx} cy={sy} rx={r} ry={r * 0.7} fill={c.sp} opacity={0.7} />)}
        <path d="M -12 -142 Q -2 -164 14 -166" fill="none" stroke={c.l} strokeWidth={3} strokeLinecap="round" opacity={0.65} />
        {/* o bracinho do peito, pendurado */}
        <path d={limb([22, -128], [28, -118], 2.6, 2)} fill={c.d} />
        <path d={limb([28, -118], [28, -108], 2, 1.5)} fill={c.d} />
        <path d="M 28 -108 l -2 4 M 28 -108 l 2.4 3.4" stroke={c.d} strokeWidth={1.3} strokeLinecap="round" />
        <g transform="translate(20 -148) scale(1.22) translate(-20 148)">
        {/* a cabeça sai para a frente na altura do peito, como um focinho; crânio em cúpula em cima, o olho na ponta */}
        <path d="M 18 -146 Q 18 -162 30 -168 Q 44 -172 54 -164 Q 62 -158 63 -150 Q 63 -144 60 -140 L 44 -138 Q 30 -136 22 -140 Z" fill={c.b} />
        <path d="M 20 -150 Q 20 -162 30 -167 Q 44 -171 54 -163 Q 58 -159 59 -156 Q 44 -160 30 -156 Q 22 -152 20 -150 Z" fill={c.l} opacity={0.45} />
        <path d="M 22 -160 Q 34 -170 50 -166" fill="none" stroke={c.l} strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
        <path d="M 28 -166 Q 32 -174 40 -171" fill="none" stroke={c.d} strokeWidth={1.8} strokeLinecap="round" />
        {[0, 1, 2].map((j) => <path key={j} d={`M ${30 + j * 5} ${-162 + j * 0.6} q 3 4 0 8`} fill="none" stroke={c.d} strokeWidth={0.9} opacity={0.6} />)}
        <path d="M 19 -150 Q 21 -140 32 -137" fill="none" stroke={c.sp} strokeWidth={3.6} strokeLinecap="round" />
        {/* mandíbula pendurada embaixo, a boca de dentes */}
        <path d="M 34 -140 Q 48 -142 60 -141 Q 60 -132 52 -128 Q 42 -126 36 -132 Z" fill={c.d} />
        <path d="M 36 -139 Q 48 -141 60 -140" fill="none" stroke="#2a1a14" strokeWidth={1.4} />
        {[0, 1, 2, 3, 4].map((j) => <path key={j} d={`M ${40 + j * 4} -140.4 l 0.8 2.6`} stroke="#e8dcc4" strokeWidth={1} />)}
        <path d="M 40 -130 q 5 3 10 1" fill="none" stroke={c.sp} strokeWidth={1} />
        {/* o tubo do "nariz" do lado do olho */}
        <path d={limb([42, -153], [53, -153], 2.8, 2.8)} fill={c.d} />
        <circle cx={42} cy={-153} r={2.6} fill={c.sp} />
        <circle cx={42} cy={-153} r={1.2} fill="#1a1410" />
        {/* o olho grande na ponta, visto de lado */}
        <ellipse cx={59} cy={-152} rx={5} ry={8.4} fill="#3a1410" />
        <ellipse cx={60.4} cy={-152} rx={3.6} ry={7} fill="#c02a1e" />
        <ellipse cx={61.6} cy={-152} rx={1.6} ry={3.2} fill="#e8b030" />
        <circle cx={62} cy={-152} r={0.9} fill="#2a0a06" />
        <circle cx={61.4} cy={-156} r={0.9} fill="#ffe0d0" opacity={0.9} />
        <path d="M 54 -161 Q 60 -162 63 -156" fill="none" stroke={c.b} strokeWidth={2.6} strokeLinecap="round" />
        {/* os olhinhos em volta */}
        {[[52, -164, 1.4], [57, -162.6, 1.2], [56, -142.6, 1.1]].map(([ex, ey, r], j) => (
          <g key={j}>
            <circle cx={ex} cy={ey} r={r + 0.7} fill="#2a0c08" />
            <circle cx={ex} cy={ey} r={r} fill="#b83a26" />
          </g>
        ))}
        </g>
      </g>
      {/* braço da frente, longo e fino */}
      <path d={limb(sh, el, 6.6, 4.8)} fill={c.b} />
      <path d={limb(el, wr, 4.8, 3.6)} fill={c.b} />
      <circle cx={el[0]} cy={el[1]} r={4.6} fill={c.l} opacity={0.6} />
      <path d={`M ${sh[0] + 3} ${sh[1] + 4} L ${el[0] + 2} ${el[1] - 4}`} stroke={c.l} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      {hand(wr, el, 1)}
      {pose === "offer" ? (
        <g>
          <path d={`M ${wr[0] + 4} ${wr[1] - 12} q 16 16 32 0 z`} fill="#8a5a2e" />
          <ellipse cx={wr[0] + 20} cy={wr[1] - 12} rx={16} ry={4} fill="#c8a04a" />
          {[0, 1, 2].map((j) => <circle key={j} cx={wr[0] + 12 + j * 7} cy={wr[1] - 14} r={3} fill={["#d0602a", "#e0b040", "#8aa040"][j]} />)}
        </g>
      ) : null}
      {pose === "work" ? <path d={`M ${wr[0] - 20} ${wr[1] - 30} L ${wr[0] + 14} ${wr[1] + 34} M ${wr[0] + 10} ${wr[1] + 30} l 14 -4`} stroke="#6a4a2a" strokeWidth={4} strokeLinecap="round" /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- headcrab
// carapaça achatada cor de areia com o bico e a barriga rosada por baixo, quatro pernas: as duas da frente grandes, de garra.
// jump: 0 parado → 1 no ar com as garras abertas
export const Headcrab: React.FC<{ x: number; y: number; s: number; d?: number; jump?: number; f: number }> = ({ x, y, s, d = 1, jump = 0, f }) => {
  const C = { b: "#d6c39a", bD: "#a8946a", bL: "#ece0c0", u: "#b85a50", uD: "#8a3a36", leg: "#c8a48a", legD: "#9a7a62", cl: "#2a1e18" };
  const br = Math.sin(f / 4) * 1.2 * (1 - jump);
  const lift = jump * 46, rot = -jump * 24;
  const lg = (hip: Pt, knee: Pt, foot: Pt, near: boolean, w: number) => (
    <g>
      <path d={limb(hip, knee, 4.4 * w, 3.6 * w)} fill={near ? C.leg : C.legD} />
      <path d={limb(knee, foot, 3.6 * w, 1.6 * w)} fill={near ? C.leg : C.legD} />
      <path d={`M ${foot[0]} ${foot[1]} l ${3 * w} ${2 * w}`} stroke={C.cl} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
  const fr = jump ? ([[44, -34], [64, -30]] as Pt[]) : ([[38, -30], [48, -2]] as Pt[]);
  return (
    <g transform={`translate(${x} ${y - lift}) scale(${s * d} ${s})`} filter="url(#ink)">
      <ellipse cx={0} cy={2 + lift / s} rx={34} ry={6} fill="#5d7a90" opacity={0.4 * (1 - jump * 0.6)} />
      <g transform={`rotate(${rot} 0 -20)`}>
        {lg([-14, -14], [-30, -24], [-40, -2], false, 0.9)}
        {lg([16, -16], [fr[0][0] - 4, fr[0][1] - 4], [fr[1][0] - 6, fr[1][1]], false, 1.1)}
        {/* barriga rosada e o bico */}
        <path d="M -30 -12 Q 0 -2 34 -14 Q 28 -4 0 -3 Q -24 -4 -30 -12 Z" fill={C.u} />
        <path d="M 24 -12 L 34 -8 L 26 -6 Z" fill={C.uD} />
        <path d="M 26 -11 l 6 2 M 26 -8 l 5 0" stroke="#f0d8c8" strokeWidth={0.9} />
        {/* carapaça */}
        <path d={`M -34 -10 Q -32 ${-40 + br} 0 ${-42 + br} Q 30 ${-40 + br} 38 -14 Q 20 -8 0 -8 Q -20 -8 -34 -10 Z`} fill={C.b} />
        <path d={`M -28 -16 Q -22 ${-36 + br} 0 ${-38 + br} Q 18 ${-36 + br} 28 -22`} fill="none" stroke={C.bL} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
        <path d="M -34 -10 Q -20 -8 0 -8 Q 20 -8 38 -14 Q 20 -13 0 -13 Q -20 -13 -32 -14 Z" fill={C.bD} />
        {[[-14, -26, 4], [4, -30, 3.4], [18, -24, 3], [-24, -18, 2.6], [8, -18, 2.4]].map(([bx, by, r], j) => <ellipse key={j} cx={bx} cy={by + br * 0.5} rx={r} ry={r * 0.7} fill={C.bD} opacity={0.6} />)}
        {lg([-10, -12], [-24, -26], [-30, -1], true, 1)}
        {lg([20, -14], fr[0], fr[1], true, 1.25)}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- antlion
// inseto grande: cabeça com mandíbulas em gancho, tórax, abdômen segmentado erguido, as asas-élitro sobre as costas, seis
// pernas finas de joelho alto (as da frente mais longas). Carapaça laranja-areia.
export const Antlion: React.FC<{ x: number; y: number; s: number; d?: number; ph?: number; amp?: number; wing?: number; f: number }> = ({ x, y, s, d = 1, ph = 0, amp = 0, wing = 0, f }) => {
  const C = { b: "#c49a52", bD: "#8a6630", bL: "#e2c07a", u: "#9a7a3e", leg: "#b08a48", legD: "#7a5a2a", w: "#d8d0a0" };
  const bob = -Math.abs(Math.sin(ph * 2)) * 3 * amp;
  const lg = (k: number, near: boolean) => {
    const q = ph + k * 2.1 + (near ? 0 : Math.PI), sw = Math.sin(q) * 10 * amp, up = Math.max(0, Math.cos(q)) * 8 * amp;
    const hip: Pt = [[30, 10, -8][k], -76 + bob];
    const knee: Pt = [hip[0] + [58, 24, -40][k] + sw * 0.5, [-150, -156, -146][k] + bob];
    const foot: Pt = [hip[0] + [88, 36, -56][k] + sw, -up];
    return (
      <g key={k + (near ? "n" : "f")}>
        <path d={limb(hip, knee, 5.4, 4)} fill={near ? C.leg : C.legD} />
        <path d={limb(knee, foot, 4, 1.2)} fill={near ? C.leg : C.legD} />
        <path d={`M ${L(knee, foot, 0.1)[0] + 2} ${L(knee, foot, 0.1)[1]} L ${L(knee, foot, 0.7)[0] + 1.4} ${L(knee, foot, 0.7)[1]}`} stroke={C.bL} strokeWidth={1.2} opacity={near ? 0.8 : 0} />
        <circle cx={knee[0]} cy={knee[1]} r={4} fill={near ? C.bD : "#5a4020"} />
      </g>
    );
  };
  const fl = Math.sin(f * 1.8) * wing;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * d} ${s})`} filter="url(#ink)">
      <Shadow rx={70} />
      {[0, 1, 2].map((k) => lg(k, false))}
      <g transform={`translate(0 ${bob - 16})`}>
        {/* abdômen segmentado */}
        <path d="M 0 -70 Q -30 -96 -70 -88 Q -96 -78 -92 -60 Q -80 -50 -50 -54 Q -20 -56 0 -60 Z" fill={C.b} />
        <path d="M -92 -60 Q -80 -50 -50 -54 Q -20 -56 0 -60 L 0 -64 Q -40 -62 -88 -66 Z" fill={C.u} />
        {[0, 1, 2, 3, 4].map((j) => <path key={j} d={`M ${-14 - j * 15} ${-58 - (j > 2 ? 0 : 1)} Q ${-20 - j * 15} ${-76 - j * 2} ${-14 - j * 15} ${-90 + j * 1}`} fill="none" stroke={C.bD} strokeWidth={1.8} />)}
        <path d="M -20 -88 Q -54 -96 -84 -80" fill="none" stroke={C.bL} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        {/* tórax */}
        <path d="M -4 -62 Q -6 -96 22 -100 Q 46 -100 50 -78 Q 50 -60 30 -56 Q 10 -54 -4 -62 Z" fill={C.b} />
        <path d="M 2 -94 Q 22 -104 44 -92" fill="none" stroke={C.bL} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        <path d="M 8 -98 L 12 -108 L 18 -99 M 26 -100 L 32 -110 L 36 -98" fill={C.bD} />
        {/* élitros (asas) */}
        <g transform={`rotate(${-8 - fl * 30} 20 -96)`}>
          <path d="M 22 -98 Q -10 -118 -66 -96 Q -40 -84 -4 -86 Q 14 -88 22 -98 Z" fill={C.w} opacity={0.85} />
          <path d="M 18 -96 Q -20 -106 -60 -96 M 10 -92 Q -24 -98 -50 -92" fill="none" stroke="#a8a070" strokeWidth={0.9} />
        </g>
        {/* cabeça e mandíbulas */}
        <path d="M 44 -86 Q 56 -100 76 -94 Q 90 -86 86 -72 Q 80 -62 64 -64 Q 48 -68 44 -86 Z" fill={C.b} />
        <path d="M 50 -92 Q 64 -100 80 -92" fill="none" stroke={C.bL} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={72} cy={-84} r={3.2} fill="#1a120a" />
        <circle cx={73} cy={-85} r={1} fill="#d8c8a0" />
        <path d="M 82 -74 Q 104 -78 108 -62 Q 104 -66 96 -66 Q 92 -64 84 -66 Z" fill={C.bD} />
        <path d="M 78 -66 Q 98 -60 98 -46 Q 94 -52 88 -54 Q 82 -56 76 -62 Z" fill="#6a4a20" />
        <path d="M 86 -84 Q 96 -96 104 -98 M 84 -88 Q 90 -102 96 -108" fill="none" stroke={C.bD} strokeWidth={1.4} strokeLinecap="round" />
      </g>
      {[0, 1, 2].map((k) => lg(k, true))}
    </g>
  );
};
