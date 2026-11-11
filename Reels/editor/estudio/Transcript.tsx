import React, { useEffect, useRef } from "react";
import { Scissors, X } from "lucide-react";
import type { CapWord } from "../src/lib/edit/types";
import { rangeOf, type TextSel } from "./util";

// EDITAR PELO TEXTO (como o Text-Based Editing do Premiere / Descript): a fala inteira como texto.
// Clique numa palavra = vai para ela. Arrastar ou Shift+clique = seleciona um trecho. Del = tira esse
// trecho do VÍDEO (com as pausas em volta) e o resto anda para trás.

export const Transcript: React.FC<{
  words: CapWord[];
  now: number;
  sel: TextSel;
  setSel: (s: TextSel) => void;
  seek: (t: number) => void;
  onCut: () => void;
  onClose: () => void;
}> = ({ words, now, sel, setSel, seek, onCut, onClose }) => {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);
  const cur = words.findIndex((w) => now >= w.start - 0.02 && now < w.end + 0.05);
  const lo = sel ? Math.min(sel.i0, sel.i1) : -1;
  const hi = sel ? Math.max(sel.i0, sel.i1) : -1;
  // a palavra que está tocando fica sempre à vista
  useEffect(() => {
    if (cur < 0 || !box.current) return;
    const el = box.current.querySelector(`[data-i="${cur}"]`) as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const b = box.current.getBoundingClientRect();
    if (r.top < b.top + 30 || r.bottom > b.bottom - 30) box.current.scrollTop += r.top - b.top - b.height / 3;
  }, [cur]);
  useEffect(() => {
    const up = () => (dragging.current = null);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);
  const range = sel ? rangeOf(words, sel) : null;
  return (
    <div className="drawer tdrawer">
      <div className="drawer-head">
        <span>Texto do vídeo</span>
        <button className="icon ghost" onClick={onClose} title="Fechar (T)">
          <X size={16} />
        </button>
      </div>
      <div className="thint">Clique vai para a palavra · arraste ou Shift+clique seleciona · Del tira do vídeo</div>
      <div className="tbody" ref={box}>
        {words.map((w, i) => {
          const brk = /[.?!]$/.test(w.word.trim());
          return (
            <React.Fragment key={i}>
              <span
                data-i={i}
                className={`tw ${i === cur ? "cur" : ""} ${i >= lo && i <= hi ? "sel" : ""}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (e.shiftKey && sel) setSel({ i0: sel.i0, i1: i });
                  else {
                    setSel({ i0: i, i1: i });
                    seek(w.start);
                  }
                  dragging.current = i;
                }}
                onPointerEnter={() => {
                  if (dragging.current !== null && sel) setSel({ i0: sel.i0, i1: i });
                }}
                title={`${w.start.toFixed(2)} s`}
              >
                {w.said ? <s className="tsaid">{w.said}</s> : null}
                {w.word}
              </span>{" "}
              {brk ? <br /> : null}
            </React.Fragment>
          );
        })}
      </div>
      {range ? (
        <div className="tfoot">
          <span>
            {range.n} palavra{range.n > 1 ? "s" : ""} · {(range.b - range.a).toFixed(2)} s
          </span>
          <button className="cutbtn" onClick={onCut} title="Tira do vídeo (Del)">
            <Scissors size={14} /> Tirar do vídeo
          </button>
          <button className="ghost" onClick={() => setSel(null)}>
            Limpar
          </button>
        </div>
      ) : null}
    </div>
  );
};
