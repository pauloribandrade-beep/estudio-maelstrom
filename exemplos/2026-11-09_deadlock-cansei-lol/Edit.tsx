import React from "react";
import spec from "./segments.json";
import doc0 from "./edit.json";
import { makeTimeline } from "../../lib/timeline";
import { EditRenderer } from "../../lib/edit/EditRenderer";
import { EditDoc } from "../../lib/edit/types";

// "Cansei do LoL" (09/11): só voz; cenas em CL.tsx + MGLogo/MGPunch do Magia.

const tl = makeTimeline(spec);
export const CL_EDIT_DURATION = tl.DURATION;
export const ClEdit: React.FC<{ doc?: EditDoc }> = ({ doc }) => <EditRenderer doc={doc ?? (doc0 as unknown as EditDoc)} tl={tl} />;
export const ClCollect: React.FC<{ doc?: EditDoc }> = ({ doc }) => <EditRenderer doc={doc ?? (doc0 as unknown as EditDoc)} tl={tl} mode="collect" />;
