// GERADO por tools/gen_preload.py — não editar à mão.
// <image> dentro de SVG (crachás, silhuetas, larva, logos) não segura o quadro no Remotion: no render elas podiam sair
// PRETAS. Aqui cada imagem entra como <Img> invisível na raiz do vídeo: o quadro só é capturado com todas carregadas e
// decodificadas, e a <image> do SVG usa a mesma do cache.
import React from "react";
import { Img, staticFile } from "remotion";
export const SVG_IMAGES: string[] = [
 "hl3silh/alyx_badge.jpg",
 "hl3silh/alyx_rosto.jpg",
 "hl3silh/antlion_silh.png",
 "hl3silh/aperture_func.svg",
 "hl3silh/barney_badge.jpg",
 "hl3silh/bm_logo.svg",
 "hl3silh/bullsquid_silh.png",
 "hl3silh/caderno_barnacle_cor.png",
 "hl3silh/caderno_barnacle_linha.png",
 "hl3silh/caderno_bullsquid_cor.png",
 "hl3silh/caderno_bullsquid_linha.png",
 "hl3silh/caderno_houndeye_cor.png",
 "hl3silh/caderno_houndeye_linha.png",
 "hl3silh/carta_relevo.jpg",
 "hl3silh/cave_retrato.png",
 "hl3silh/cidada_badge.jpg",
 "hl3silh/combine_badge.jpg",
 "hl3silh/dog_badge.jpg",
 "hl3silh/eli_retrato.png",
 "hl3silh/empe.png",
 "hl3silh/empe2.png",
 "hl3silh/encolhido.png",
 "hl3silh/farda.png",
 "hl3silh/gman_silh.png",
 "hl3silh/gordon_peca.png",
 "hl3silh/gordon_retrato.png",
 "hl3silh/headcrab_silh.png",
 "hl3silh/hev.png",
 "hl3silh/houndeye_silh.png",
 "hl3silh/hunter_peca.png",
 "hl3silh/kleiner_retrato.png",
 "hl3silh/larva_holo.png",
 "hl3silh/larva_ref.png",
 "hl3silh/magnusson_badge.jpg",
 "hl3silh/mossman_badge.jpg",
 "hl3silh/rebelde.png",
 "hl3silh/rebelde2_badge.jpg",
 "hl3silh/rebelde3_badge.jpg",
 "hl3silh/rebelde7_badge.jpg",
 "hl3silh/rebelde8_badge.jpg",
 "hl3silh/rebelde_badge.jpg",
 "hl3silh/sentado.png",
 "hl3silh/silh_contraluz.png",
 "hl3silh/strider_icone.png",
 "hl3silh/strider_peca.png",
 "hl3silh/varga.png",
 "hl3silh/varga_retrato.png",
 "hl3silh/vort.png",
 "hl3silh/vort_icone.png",
 "hl3silh/vort_silh.png",
 "hl3silh/xen_ceu.jpg",
 "hl3/dither.png",
 "hl3/ember_glow.png",
 "hl3/nebula_1.png",
 "hl3/nebula_2.png",
 "hl3/nebula_3.png"
];
export const SvgImagePreload: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
    {SVG_IMAGES.map((s) => (
      <Img key={s} src={staticFile(s)} style={{ width: 1, height: 1 }} />
    ))}
  </div>
);
