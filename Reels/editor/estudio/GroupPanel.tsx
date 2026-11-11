import React, { useEffect, useMemo, useRef, useState } from "react";
import { Layers, Trash2, Volume2, VolumeX } from "lucide-react";
import { EditDoc } from "../src/lib/edit/types";

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const idOf = (k: string) => k.slice(k.indexOf(":") + 1);
const MAXVOL = 4; // 400% = +12 dB acima do arquivo (o som pode passar de 100%)

// Painel da SELEÇÃO MÚLTIPLA. Volume em conjunto: o ganho (dB) vale a partir dos volumes do momento em que o grupo
// foi selecionado, então as diferenças entre eles ficam (o arco das moedas continua arco). Arrastar é um passo só
// no Ctrl+Z (checkpoint no início do arraste, `live` durante).
export const GroupPanel: React.FC<{
  doc: EditDoc;
  multi: string[];
  commit: (fn: (d: EditDoc) => void) => void;
  live: (fn: (d: EditDoc) => void) => void;
  checkpoint: () => void;
  onDelete: () => void;
}> = ({ doc, multi, commit, live, checkpoint, onDelete }) => {
  const soundIds = useMemo(() => multi.filter((k) => k.startsWith("sound:")).map(idOf), [multi]);
  const nScenes = multi.length - soundIds.length;
  const sounds = doc.sounds.filter((s) => soundIds.includes(s.id));
  // volumes de partida: refeitos quando a seleção muda (não a cada arraste)
  const base = useRef<Record<string, number>>({});
  const key = soundIds.join(",");
  const [, setTick] = useState(0);
  useEffect(() => {
    base.current = Object.fromEntries(doc.sounds.filter((s) => soundIds.includes(s.id)).map((s) => [s.id, s.vol]));
    setTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // ganho atual LIDO dos volumes (mediana de vol/base): bate com a timeline mesmo depois de Ctrl+Z
  const ratios = sounds.filter((s) => (base.current[s.id] ?? 0) > 0 && s.vol > 0).map((s) => 20 * Math.log10(s.vol / base.current[s.id])).sort((a, b) => a - b);
  const gain = ratios.length ? Math.round(ratios[Math.floor(ratios.length / 2)] * 2) / 2 : 0;
  const apply = (g: number, fn: (f: (d: EditDoc) => void) => void) => {
    const k = Math.pow(10, g / 20);
    fn((d) => {
      for (const s of d.sounds) if (s.id in base.current) s.vol = r3(Math.min(MAXVOL, Math.max(0, base.current[s.id] * k)));
    });
  };
  const allMuted = sounds.length > 0 && sounds.every((s) => s.muted);
  const vols = sounds.map((s) => s.vol);
  return (
    <div className="side right">
      <div className="phead">
        <Layers size={16} /> {multi.length} itens selecionados
        <span className="tag">
          {soundIds.length} sons · {nScenes} cenas
        </span>
      </div>
      {sounds.length ? (
        <div className="card">
          <h4>Volume do grupo</h4>
          <div className="valline">
            <span>Ganho em todos os sons</span>
            <b>{gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)} dB</b>
          </div>
          <input type="range" min={-24} max={12} step={0.5} value={gain} onPointerDown={() => checkpoint()} onChange={(e) => apply(+e.target.value, live)} />
          <div className="row" style={{ marginTop: 8, gap: 6 }}>
            <button onClick={() => apply(gain - 3, commit)}>−3 dB</button>
            <button onClick={() => apply(gain - 1, commit)}>−1 dB</button>
            <button onClick={() => apply(gain + 1, commit)}>+1 dB</button>
            <button onClick={() => apply(gain + 3, commit)}>+3 dB</button>
          </div>
          <div className="hint" style={{ marginTop: 8 }}>
            Todos sobem ou descem juntos e mantêm a diferença entre eles. Agora: de {Math.round(Math.min(...vols) * 100)}% a {Math.round(Math.max(...vols) * 100)}%.
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input type="checkbox" checked={allMuted} onChange={(e) => commit((d) => d.sounds.forEach((s) => soundIds.includes(s.id) && (s.muted = e.target.checked)))} />
            {allMuted ? <VolumeX size={14} /> : <Volume2 size={14} />} Mudos (ficam na trilha, não tocam)
          </label>
        </div>
      ) : (
        <div className="card">
          <div className="hint">Nenhum som no grupo: arraste para mover tudo junto.</div>
        </div>
      )}
      <div className="card">
        <div className="hint">Arrastar um item move o grupo · Alt + setas empurra · Esc limpa a seleção.</div>
        <button style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }} onClick={onDelete}>
          <Trash2 size={14} /> Apagar {multi.length} itens
        </button>
      </div>
    </div>
  );
};
