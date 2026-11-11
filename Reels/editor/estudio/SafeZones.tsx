import React from "react";

// Faixas por cima da prévia mostrando onde a interface do Instagram Reels cobre o vídeo (1080x1920):
// topo ~250 px (câmera, "Reels"), base ~450 px (nome, legenda do post, áudio) e a coluna da direita
// (curtir, comentar, compartilhar) de y 1000 até a base. Tecla G liga/desliga.
const pctX = (px: number) => `${(px / 1080) * 100}%`;
const pctY = (px: number) => `${(px / 1920) * 100}%`;

const Zone: React.FC<{ style: React.CSSProperties; label: string; vertical?: boolean }> = ({ style, label, vertical }) => (
  <div className={`sz-zone ${vertical ? "vert" : ""}`} style={style}>
    <span>{label}</span>
  </div>
);

export const SafeZones: React.FC<{ seam?: number }> = ({ seam }) => (
  <div className="safez">
    <Zone style={{ left: 0, top: 0, width: "100%", height: pctY(250) }} label="topo do Instagram" />
    <Zone style={{ left: 0, bottom: 0, width: "100%", height: pctY(450) }} label="nome, legenda do post e áudio" />
    <Zone style={{ right: 0, top: pctY(1000), width: pctX(130), height: pctY(1920 - 1000 - 450) }} label="curtir · comentar · enviar" vertical />
    {seam ? <div className="sz-seam" style={{ top: pctY(seam) }} /> : null}
  </div>
);
