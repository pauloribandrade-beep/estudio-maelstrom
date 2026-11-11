import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Bust } from "../../lib/clinica/personagens";

// só para conferir o desenho dos personagens (composição de teste)
export const PersonagensTeste: React.FC = () => {
  const t = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#141414", display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Bust who="paciente" pose={{ t, smile: 0.9, blush: 0.6 }} size={330} />
      <Bust who="paciente" pose={{ t, smile: -0.2, lookX: 0.8, lookY: -0.8, brow: 0.6, tilt: -6 }} size={330} />
      <Bust who="amiga" pose={{ t, smile: 0.5, open: 0.5 }} size={330} />
      <Bust who="medica" coat pose={{ t, smile: 0.6 }} size={330} />
    </AbsoluteFill>
  );
};
