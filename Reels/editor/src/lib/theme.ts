import BRAND from "./brand.json";

// Identidade nos vídeos: branco + preto + uma cor de destaque, com moderação. As cores vêm de brand.json
// (na ZALE, o vermelho #D82810). O destaque é acento (palavra atual da legenda, palavra-chave, sublinhado
// do título), nunca fundo de tela inteira.
const C = BRAND.cores;
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");

export const THEME = {
  red: C.destaque,
  redBright: C.destaqueClaro, // só para texto de destaque sobre preto, quando o destaque ficar escuro demais
  redRgb: rgb(C.destaque), // "216,40,16": para rgba() com transparência
  ink: C.tinta,
  paper: C.papel,
  white: "#FFFFFF",
  mute: "rgba(255,255,255,0.62)",
  cardDark: `rgba(${rgb(C.tinta)},0.94)`,
};
/** nome antigo do tema, usado pelas cenas já feitas */
export const ZALE = THEME;

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// Zonas seguras do Instagram Reels (1080x1920): o topo ~250 px, a base ~450 px
// e a faixa direita ~130 px a partir de y 1000 ficam cobertos pela interface.
export const SAFE = { top: 250, bottom: 450, right: 130, x0: 60, x1: 930 };

// Primeira letra maiúscula em títulos e rótulos (regra do usuário). Não mexe em
// texto que começa com símbolo (ex.: "/dashboard", "R$", "“").
export const cap = (s?: string) => (s ? s.charAt(0).toLocaleUpperCase("pt-BR") + s.slice(1) : s ?? "");
