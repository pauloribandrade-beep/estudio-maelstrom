import React, { useEffect, useState } from "react";
import { CalendarDays, Check, FileText, Lightbulb, Clapperboard, Clock, Copy, Download, Film, FolderOpen, LayoutGrid, Loader2, Plus } from "lucide-react";
import { Calendar } from "./Calendar";
import { Roteiros } from "./Roteiros";
import { Ideias } from "./Ideias";
import { copyText } from "./util";
import { ESTUDIO } from "./perfil";

// Tela inicial do Estúdio: os projetos salvos (cada vídeo com edit.json vira um projeto).
type Proj = { slug: string; title: string; date: string; duration: number | null; scenes: number; mtime: number; render: { file: string; mtime: number; stale?: boolean } | null; caption: string | null; tacoh?: string };

const ago = (ms: number) => {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return "agora há pouco";
  if (s < 3600) return `há ${Math.round(s / 60)} min`;
  if (s < 86400) return `há ${Math.round(s / 3600)} h`;
  return new Date(ms).toLocaleDateString("pt-BR");
};
const mmss = (t: number | null) => (t ? `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}` : "");

export const Home: React.FC<{ onOpen: (slug: string) => void }> = ({ onOpen }) => {
  const [list, setList] = useState<Proj[] | null>(null);
  const [newInfo, setNewInfo] = useState(false);
  const [tab, setTab] = useState<"projetos" | "calendario" | "roteiros" | "ideias">(() => (location.hash === "#calendario" ? "calendario" : location.hash === "#roteiros" ? "roteiros" : location.hash === "#ideias" ? "ideias" : "projetos"));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // atualização do Estúdio pelo GitHub (só aparece nas máquinas que clonaram o repositório)
  const [upd, setUpd] = useState<{ git: boolean; behind?: number; log?: string[] } | null>(null);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    fetch("/api/update")
      .then((r) => r.json())
      .then(setUpd)
      .catch(() => {});
  }, []);
  const doUpdate = async () => {
    setUpdating(true);
    const r = await (await fetch("/api/update", { method: "POST" })).json().catch(() => ({ ok: false, log: "sem resposta do servidor" }));
    if (!r.ok) {
      setUpdating(false);
      setMsg(`Não deu para atualizar: ${r.log}`);
      return;
    }
    setMsg("Estúdio atualizado. Recarregando...");
    setTimeout(() => location.reload(), 5000); // o servidor reinicia sozinho se o código dele mudou
  };
  const load = () =>
    fetch("/api/videos")
      .then((r) => r.json())
      .then(setList);
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    history.replaceState(null, "", tab === "projetos" ? location.pathname : `#${tab}`);
  }, [tab]);
  useEffect(() => {
    // o endereço manda na aba (ex.: voltar do editor direto para /#calendario)
    const on = () => setTab(location.hash === "#calendario" ? "calendario" : location.hash === "#roteiros" ? "roteiros" : location.hash === "#ideias" ? "ideias" : "projetos");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(""), 4500);
    return () => clearTimeout(id);
  }, [msg]);
  // copiar legenda direto do card: se ainda não existe, gera e copia
  const copyCaption = async (p: Proj) => {
    let text = p.caption;
    if (!text) {
      setBusy(p.slug);
      const r = await (await fetch(`/api/caption/${p.slug}`, { method: "POST" })).json().catch(() => ({}));
      setBusy(null);
      text = r.caption?.text ?? null;
      if (r.note) setMsg(r.note);
      load();
    }
    if (text && (await copyText(text))) {
      setCopied(p.slug);
      setTimeout(() => setCopied((c) => (c === p.slug ? null : c)), 1800);
    }
  };
  return (
    <div className="home">
      <div className="top">
        <div className="brand">
          <span className="mark">
            <Clapperboard size={14} />
          </span>
          Estúdio <b>{ESTUDIO}</b>
        </div>
        <div className="seg hometabs">
          <button className={tab === "projetos" ? "on" : ""} onClick={() => setTab("projetos")}>
            <LayoutGrid size={14} /> Projetos
          </button>
          <button className={tab === "calendario" ? "on" : ""} onClick={() => setTab("calendario")}>
            <CalendarDays size={14} /> Calendário
          </button>
          <button className={tab === "roteiros" ? "on" : ""} onClick={() => setTab("roteiros")}>
            <FileText size={14} /> Roteiros
          </button>
          <button className={tab === "ideias" ? "on" : ""} onClick={() => setTab("ideias")}>
            <Lightbulb size={14} /> Ideias
          </button>
        </div>
        <div className="spacer" />
        <button className="primary" onClick={() => setNewInfo((v) => !v)}>
          <Plus size={15} /> Novo projeto
        </button>
      </div>
      {msg ? <div className="toast">{msg}</div> : null}
      {upd?.git && upd.behind ? (
        <div className="updbar">
          <b>Versão nova do Estúdio disponível</b>
          <span>{upd.log?.slice(0, 3).join(" · ")}</span>
          <div className="spacer" />
          <button className="primary" onClick={doUpdate} disabled={updating}>
            {updating ? <Loader2 size={14} className="spin" /> : null} {updating ? "Atualizando..." : "Atualizar agora"}
          </button>
        </div>
      ) : null}
      {tab === "ideias" ? (
        <div className="home-body cal-body">
          <Ideias toast={setMsg} />
        </div>
      ) : tab === "roteiros" ? (
        <div className="home-body cal-body">
          <Roteiros onOpen={onOpen} toast={setMsg} />
        </div>
      ) : tab === "calendario" ? (
        <div className="home-body cal-body">{list ? <Calendar projects={list} onOpen={onOpen} toast={setMsg} /> : <div className="status">carregando...</div>}</div>
      ) : (
      <div className="home-body">
        <h1>Projetos</h1>
        <p className="home-sub">Tudo salva sozinho. Clique num projeto para continuar a edição.</p>
        {newInfo ? (
          <div className="card" style={{ maxWidth: 560, marginBottom: 18 }}>
            <b>Como criar um projeto novo</b>
            <div className="hint" style={{ marginTop: 6 }}>
              Por enquanto, mande a gravação para o Claude no chat (ex.: "edita esse vídeo" + o arquivo). Ele corta, monta as cenas e o projeto aparece aqui, pronto para você
              ajustar. Mande o arquivo original do celular (não pelo WhatsApp, que diminui a qualidade).
            </div>
          </div>
        ) : null}
        {!list ? <div className="status">carregando...</div> : null}
        {list && !list.length ? <div className="status">Nenhum projeto ainda.</div> : null}
        <div className="grid">
          {list?.map((p) => (
            <div key={p.slug} className="pcard" onClick={() => onOpen(p.slug)}>
              <div className="pthumb">
                <img src={`/api/thumb/${p.slug}?t=${Math.round((p.render?.mtime ?? p.mtime) / 1000)}`} alt="" loading="lazy" />
                {p.duration ? <span className="pdur">{mmss(p.duration)}</span> : null}
              </div>
              <div className="pinfo">
                <div className="ptitle">{p.title}</div>
                <div className="pmeta">
                  <Clock size={12} /> editado {ago(p.mtime)} · {p.scenes} cenas
                </div>
                <div className="pact">
                  <button className="chip" onClick={(e) => (e.stopPropagation(), onOpen(p.slug))}>
                    <FolderOpen size={13} /> Abrir
                  </button>
                  <button className={`chip cap ${copied === p.slug ? "ok" : ""}`} title={p.caption ? "Copiar a legenda do Instagram" : "Gerar e copiar a legenda do Instagram"} onClick={(e) => (e.stopPropagation(), copyCaption(p))}>
                    {busy === p.slug ? <Loader2 size={13} className="spin" /> : copied === p.slug ? <Check size={13} /> : <Copy size={13} />}
                    {busy === p.slug ? "Gerando..." : copied === p.slug ? "Copiada" : p.caption ? "Copiar legenda" : "Gerar legenda"}
                  </button>
                  {p.render ? (
                    <a
                      className={`chip dl ${p.render.stale ? "stale" : ""}`}
                      href={`/api/file?p=${encodeURIComponent(p.render.file)}&download=1&v=${Math.round(p.render.mtime)}`}
                      title={p.render.stale ? "Render de ANTES da última edição: abra e renderize de novo" : "Baixar o vídeo"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={13} /> {p.render.stale ? "Desatualizado" : "Baixar vídeo"}
                    </a>
                  ) : null}
                  {p.render ? (
                    <button
                      className="chip folder"
                      title="Abrir a pasta do vídeo no Explorer"
                      onClick={(e) => (e.stopPropagation(), fetch(`/api/reveal?p=${encodeURIComponent(p.render!.file)}`))}
                    >
                      <FolderOpen size={13} /> Pasta
                    </button>
                  ) : (
                    <span className="pnone">
                      <Film size={12} /> ainda sem render
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
