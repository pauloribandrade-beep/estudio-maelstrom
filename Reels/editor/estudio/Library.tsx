import React, { useEffect, useMemo, useRef, useState } from "react";

export type SfxItem = { src: string; name: string; dur: number };
export type MusicItem = { id: string; title: string; author: string; tags: string[]; rank: number; dur: number };

// Estilos que costumam funcionar de fundo em Reels (filtro rápido da aba Músicas).
const MOODS = ["lo-fi-beats", "chillout", "corporate-music", "hip-hop", "pop", "ambient", "minimalism", "underscore", "downtempo", "electronic", "house", "trap", "motivational", "background", "upbeat", "confident"];
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// Biblioteca: aba Sons (public/sfx) e aba Músicas (acervo Mixkit baixado por fetch_music.py).
// Clique = ouvir; "+" = pôr no cursor (a música vai para a trilha "Música", bem baixa, com fade no fim);
// som escolhido + duplo clique na trilha de sons = pôr ali; ou ARRASTAR o som e soltar na trilha, no ponto exato.
export const SFX_DRAG = "application/x-estudio-sfx";
export const Library: React.FC<{
  items: SfxItem[];
  sel: string;
  onSel: (src: string) => void;
  onAdd: (src: string) => void;
  onAddMusic: (m: MusicItem) => void;
}> = ({ items, sel, onSel, onAdd, onAddMusic }) => {
  const [tab, setTab] = useState<"sons" | "musicas">("sons");
  const [q, setQ] = useState("");
  const [mood, setMood] = useState("");
  const [music, setMusic] = useState<MusicItem[] | null>(null);
  const [playing, setPlaying] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (tab === "musicas" && music === null) fetch("/api/music").then((r) => r.json()).then(setMusic);
  }, [tab, music]);
  useEffect(() => () => audio.current?.pause(), []);
  const groups = useMemo(() => {
    const g: Record<string, SfxItem[]> = {};
    for (const it of items) {
      if (q && !it.name.includes(q.toLowerCase())) continue;
      const fam = it.name.split("_")[0];
      (g[fam] ??= []).push(it);
    }
    return g;
  }, [items, q]);
  const mlist = useMemo(() => {
    const qq = q.toLowerCase();
    return (music ?? []).filter((m) => (!mood || m.tags.includes(mood)) && (!qq || m.title.toLowerCase().includes(qq) || m.tags.some((t) => t.includes(qq)))).slice(0, 300);
  }, [music, q, mood]);
  const play = (url: string, key: string, vol = 0.8) => {
    audio.current?.pause();
    if (playing === key) {
      setPlaying("");
      return;
    }
    audio.current = new Audio(url);
    audio.current.volume = vol;
    audio.current.play();
    audio.current.onended = () => setPlaying("");
    setPlaying(key);
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button className={tab === "sons" ? "on" : ""} onClick={() => setTab("sons")}>
          Sons
        </button>
        <button className={tab === "musicas" ? "on" : ""} onClick={() => setTab("musicas")}>
          Músicas
        </button>
      </div>
      <input placeholder={tab === "sons" ? "buscar (pop, tick, riser...)" : "buscar (nome ou estilo)"} value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
      {tab === "sons" ? (
        <>
          {Object.entries(groups).map(([fam, list]) => (
            <div key={fam} style={{ marginTop: 10 }}>
              <div style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{fam}</div>
              {list.map((it) => (
                <div
                  key={it.src}
                  className={`lib-item ${sel === it.src ? "on" : ""}`}
                  draggable
                  title="arraste para a trilha de sons para pôr naquele ponto"
                  onDragStart={(e) => {
                    e.dataTransfer.setData(SFX_DRAG, it.src);
                    e.dataTransfer.setData("text/plain", it.src);
                    e.dataTransfer.effectAllowed = "copy";
                    onSel(it.src);
                  }}
                  onClick={() => {
                    onSel(it.src);
                    play(`/${it.src}`, it.src);
                  }}
                >
                  <span>▶ {it.name}</span>
                  <span className="d">{it.dur.toFixed(2)}s</span>
                  <button
                    title="pôr no cursor"
                    style={{ padding: "0 7px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(it.src);
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ))}
          <div className="hint">
            Clique para ouvir. <b>Arraste</b> o som e solte na trilha de sons, no ponto exato. <b>+</b> põe no cursor. Clique fora (ou Esc) fecha.
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "8px 0" }}>
            {MOODS.map((m) => (
              <button key={m} className={mood === m ? "on" : ""} style={{ padding: "2px 7px", fontSize: 11 }} onClick={() => setMood(mood === m ? "" : m)}>
                {m.replace(/-/g, " ")}
              </button>
            ))}
          </div>
          {music === null ? <div className="hint">carregando…</div> : null}
          {music !== null && music.length === 0 ? <div className="hint">A biblioteca ainda está sendo baixada (scripts/fetch_music.py).</div> : null}
          {mlist.map((m) => (
            <div key={m.id} className={`lib-item ${playing === m.id ? "on" : ""}`} onClick={() => play(`/api/musicfile?id=${m.id}`, m.id, 0.6)} title={m.tags.join(", ")}>
              <span style={{ minWidth: 0, overflow: "hidden" }}>
                <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {playing === m.id ? "■" : "▶"} {m.title}
                </span>
                <span style={{ display: "block", color: "var(--faint)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.tags.slice(0, 3).join(" · ")}</span>
              </span>
              <span className="d">{mmss(m.dur)}</span>
              <button
                title="pôr no cursor (trilha Música)"
                style={{ padding: "0 7px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddMusic(m);
                }}
              >
                +
              </button>
            </div>
          ))}
          <div className="hint">
            Mixkit (licença livre, uso comercial sem crédito). As mais populares primeiro. Clique para ouvir; <b>+</b> põe a música no cursor, na trilha Música, bem abaixo da voz.
          </div>
        </>
      )}
    </div>
  );
};
