import React from "react";
import PERFIL from "../src/lib/perfil.json";

// Perfil do Estúdio (src/lib/perfil.json): nome, pilares de conteúdo e as cores deles.
export const ESTUDIO = PERFIL.estudio;
export const PILAR_CAMPO = PERFIL.pilares.campo;
const PILARES: Record<string, { nome: string; cor?: string }> = Object.fromEntries(PERFIL.pilares.itens.map((p) => [p.id, p]));
export const pilarNome = (id: string) => PILARES[id]?.nome ?? id;

/** etiqueta do pilar (a cor vem do perfil; a classe t-<id> fica para pilares sem cor) */
export const PilarTag: React.FC<{ id: string }> = ({ id }) => (
  <span className={`tac t-${id}`} style={PILARES[id]?.cor ? { background: PILARES[id].cor } : undefined} title={pilarNome(id)}>
    {id}
  </span>
);
