import React from "react";
import spec from "./segments.json";
import doc0 from "./edit.json";
import { makeTimeline } from "../../lib/timeline";
import { EditRenderer } from "../../lib/edit/EditRenderer";
import { EditDoc } from "../../lib/edit/types";

// "Lash atrevido" (10/11): só voz; cenas em LA.tsx (UI do Deadlock, estilo Cansei do LoL v2) + DLMapa + CLProfile.

const tl = makeTimeline(spec);
export const LA_EDIT_DURATION = tl.DURATION;
export const LaEdit: React.FC<{ doc?: EditDoc }> = ({ doc }) => <EditRenderer doc={doc ?? (doc0 as unknown as EditDoc)} tl={tl} />;
export const LaCollect: React.FC<{ doc?: EditDoc }> = ({ doc }) => <EditRenderer doc={doc ?? (doc0 as unknown as EditDoc)} tl={tl} mode="collect" />;
