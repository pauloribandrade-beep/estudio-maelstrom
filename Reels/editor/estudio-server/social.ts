// Estúdio: LEGENDA do Instagram por vídeo, CALENDÁRIO de postagem e LIMPEZA dos temporários do Remotion.
// Usado pelo plugin de API do vite.config.mts (rotas /api/caption, /api/calendar).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";

export type Caption = { text: string; source: "claude" | "claude-code" | "modelo"; model?: string; at: number; edited?: boolean };
export type CalItem = { slug: string; at: string }; // at = "AAAA-MM-DDTHH:MM" (horário local)
export type Urg = "hoje" | "48h" | "semana" | "atemporal";
export type Calendar = { items: CalItem[]; perDay: number; urgent: string[]; urgency: Record<string, Urg> };
const URGS: Urg[] = ["hoje", "48h", "semana", "atemporal"];

// PERFIL (src/lib/perfil.json): pilares, horários e contas da legenda. Lido a cada uso: mudar o perfil não reinicia o servidor.
type Conta = { id: string; detectar?: string; semIA?: "titulo"; hashtags: string; sistema: string[] };
type Pilar = { id: string; nome: string; cor?: string; urgencia?: Urg };
type Perfil = {
  estudio: string;
  pilares: { campo: string; itens: Pilar[] };
  horarios: { hoje: string[] } & Record<string, { semana: string[]; fimDeSemana: string[] }>;
  legenda: { contas: Conta[] };
};

export const makeSocial = (ROOT: string) => {
  const perfil = (): Perfil => JSON.parse(fs.readFileSync(path.join(ROOT, "src", "lib", "perfil.json"), "utf-8"));
  const VIDEOS = path.join(ROOT, "src", "videos");
  const ROTEIROS = path.join(ROOT, "..", "roteiros");
  const CAL = path.join(ROOT, "..", "calendario.json");
  const capFile = (slug: string) => path.join(VIDEOS, slug, "caption.json");

  // ---------------------------------------------------------------- contexto do vídeo
  const roteiro = (slug: string) => {
    const f = path.join(ROTEIROS, `${slug}.md`);
    return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : "";
  };
  const section = (md: string, title: string) => {
    const m = new RegExp(`^##\\s+${title}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))`, "mi").exec(md);
    return m ? m[1].trim() : "";
  };
  const spoken = (slug: string) => {
    try {
      const words = JSON.parse(fs.readFileSync(path.join(VIDEOS, slug, "words.json"), "utf-8")) as { word: string }[];
      return words.map((w) => w.word.trim()).join(" ").replace(/\s+([,.?!])/g, "$1");
    } catch {
      return "";
    }
  };
  const titleOf = (slug: string) => /^#\s+(.+)$/m.exec(roteiro(slug))?.[1].trim() ?? slug.replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/-/g, " ");
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /** pilar do roteiro, pelo campo do perfil ("**TACOH:** O/C" -> "O"). O nome tacohOf ficou pelo vite.config. */
  const tacohOf = (slug: string) => {
    const { campo, itens } = perfil().pilares;
    const ids = [...itens].sort((a, b) => b.id.length - a.id.length).map((p) => esc(p.id)).join("|");
    const got = new RegExp(`\\*\\*${esc(campo)}:\\*\\*\\s*(${ids})`, "i").exec(roteiro(slug))?.[1] ?? "";
    return itens.find((p) => p.id.toLowerCase() === got.toLowerCase())?.id ?? "";
  };
  /** urgência escrita no roteiro ("**Urgência:** hoje | 48h | semana | atemporal") e data do fato ("**Fato em:** AAAA-MM-DD") */
  const roteiroUrg = (slug: string): Urg | null => {
    const m = /\*\*Urg[êe]ncia:\*\*\s*([^·\n*]+)/i.exec(roteiro(slug))?.[1].toLowerCase() ?? "";
    if (!m) return null;
    if (/hoje|mesmo dia|agora/.test(m)) return "hoje";
    if (/48|2 ?a ?3|dois|tr[êe]s dias|2-3/.test(m)) return "48h";
    if (/semana|7 dias/.test(m)) return "semana";
    return "atemporal";
  };
  const factOf = (slug: string) => /\*\*Fato em:\*\*\s*(\d{4}-\d{2}-\d{2})/i.exec(roteiro(slug))?.[1] ?? "";

  const readCaption = (slug: string): Caption | null => {
    try {
      return JSON.parse(fs.readFileSync(capFile(slug), "utf-8"));
    } catch {
      return null;
    }
  };
  const saveCaption = (slug: string, c: Caption) => fs.writeFileSync(capFile(slug), JSON.stringify(c, null, 2));

  // ---------------------------------------------------------------- geração
  // Regras de 2026 (pesquisa de 2026-09-28): no máximo 5 hashtags (limite do Instagram desde dez/2025), de tópico,
  // nada de #reels/#viral/#explorar; a legenda é o "SEO" do Reels (palavra-chave na 1ª linha, termos de busca
  // naturais no texto, coerente com a fala); 2.200 caracteres no máximo. O texto de cada conta (quem fala, público,
  // regras do nicho) fica no perfil, em legenda.contas.
  /** conta do vídeo: a primeira cujo `detectar` aparece no roteiro ou como palavra na fala; senão a primeira sem `detectar` */
  const contaOf = (slug: string): Conta => {
    const contas = perfil().legenda.contas;
    const hit = contas.find((c) => c.detectar && (new RegExp(esc(c.detectar), "i").test(roteiro(slug)) || new RegExp(`\\b${esc(c.detectar)}\\b`, "i").test(spoken(slug))));
    return hit ?? contas.find((c) => !c.detectar) ?? contas[0];
  };
  /** hashtags escolhidas no roteiro ("**Hashtags:** #a #b") */
  const tagsOf = (slug: string) => (/\*\*Hashtags:\*\*\s*(.+)/i.exec(roteiro(slug))?.[1].match(/#[\p{L}\p{N}_]+/gu) ?? []).slice(0, 5);
  const systemOf = (slug: string) => contaOf(slug).sistema.join("\n");

  const userPrompt = (slug: string) => {
    const md = roteiro(slug);
    return [
      tagsOf(slug).length ? `Hashtags escolhidas para este vídeo (use estas): ${tagsOf(slug).join(" ")}` : "",
      `Título do vídeo: ${titleOf(slug)}`,
      md ? `Cabeçalho do roteiro: ${md.split("\n").slice(2, 4).join(" ").trim()}` : "",
      section(md, "CTA") ? `CTA definida no roteiro:\n${section(md, "CTA")}` : "",
      section(md, "Legenda do post") ? `Rascunho de legenda que veio com o roteiro (melhore, não copie):\n${section(md, "Legenda do post")}` : "",
      `O que é FALADO no vídeo final (transcrição):\n${spoken(slug) || section(md, "Roteiro em bloco")}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const clean = (t: string) => {
    let s = t.trim().replace(/^```[a-z]*\n?|```$/g, "").replace(/\s*[—–]\s*/g, ", ").trim();
    // no máximo 5 hashtags (limite do Instagram)
    let n = 0;
    s = s.replace(/#[\p{L}\p{N}_]+/gu, (h) => (++n <= 5 ? h : "")).replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ");
    return s.replace(/\n{3,}/g, "\n\n").slice(0, 2200).trim();
  };

  const viaApi = async (slug: string): Promise<Caption> => {
    const client = new Anthropic(); // ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN ou perfil do `ant auth login`
    const model = "claude-opus-5";
    const res = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // se o modelo recusar, o próprio servidor tenta outro modelo
      output_config: { effort: "medium" },
      system: systemOf(slug),
      messages: [{ role: "user", content: userPrompt(slug) }],
    });
    if (res.stop_reason === "refusal") throw new Error("o modelo recusou a legenda");
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    if (!text) throw new Error("resposta vazia");
    return { text: clean(text), source: "claude", model: res.model, at: Date.now() };
  };

  /** Claude Code que vem com o app (precisa de login feito uma vez no terminal: claude.exe /login) */
  // O app da loja (MSIX) guarda em %LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude-code\<versão>\<hash>\claude.exe
  const claudeExe = () => {
    const roaming = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    const local = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    const bases = [path.join(roaming, "Claude", "claude-code")];
    const pk = path.join(local, "Packages");
    if (fs.existsSync(pk))
      for (const d of fs.readdirSync(pk).filter((d) => /^Claude_/i.test(d))) bases.push(path.join(pk, d, "LocalCache", "Roaming", "Claude", "claude-code"));
    const found: [string, string][] = [];
    for (const base of bases) {
      if (!fs.existsSync(base)) continue;
      for (const v of fs.readdirSync(base)) {
        const dir = path.join(base, v);
        if (fs.existsSync(path.join(dir, "claude.exe"))) found.push([v, path.join(dir, "claude.exe")]);
        else if (fs.statSync(dir).isDirectory())
          for (const h of fs.readdirSync(dir)) if (fs.existsSync(path.join(dir, h, "claude.exe"))) found.push([v, path.join(dir, h, "claude.exe")]);
      }
    }
    found.sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
    return found.length ? found[found.length - 1][1] : null;
  };
  const viaCli = (slug: string): Caption => {
    const exe = claudeExe();
    if (!exe) throw new Error("Claude Code não encontrado");
    const r = spawnSync(exe, ["-p", `${systemOf(slug)}\n\n${userPrompt(slug)}`, "--output-format", "text"], { encoding: "utf-8", timeout: 180000, cwd: os.tmpdir() });
    const out = (r.stdout ?? "").trim();
    if (r.status !== 0 || !out || /Failed to authenticate|not logged in|Invalid API key/i.test(out)) throw new Error((out || r.stderr || "falhou").slice(0, 200));
    return { text: clean(out), source: "claude-code", at: Date.now() };
  };

  /** sem IA: rascunho do roteiro (ou a fala) + CTA + hashtags do tema */
  const viaModelo = (slug: string): Caption => {
    const md = roteiro(slug);
    let body = section(md, "Legenda do post");
    const conta = contaOf(slug);
    // conta com semIA "titulo" (ex.: Motim): legenda é complemento, nunca a narração colada
    if (!body && conta.semIA === "titulo") body = titleOf(slug);
    if (!body) {
      const fala = spoken(slug).split(/(?<=[.?!])\s+/);
      body = `${titleOf(slug)}\n\n${fala.slice(0, 4).join(" ")}\n\n${fala.slice(4, 8).join(" ")}`.trim();
    }
    const cta = /\*\*[^*]+:\*\*\s*(.+)/.exec(section(md, "CTA"))?.[1].trim();
    if (cta && !body.includes(cta.slice(0, 30))) body = /\n#/.test(body) ? body.replace(/(\n#)/, `\n\n${cta}\n$1`) : `${body}\n\n${cta}`;
    if (!/#\w/.test(body))
      body += "\n\n" + (tagsOf(slug).length ? tagsOf(slug).join(" ") : conta.hashtags);
    return { text: clean(body), source: "modelo", at: Date.now() };
  };

  const generate = async (slug: string): Promise<{ caption: Caption; note?: string }> => {
    const notes: string[] = [];
    try {
      const c = await viaApi(slug);
      saveCaption(slug, c);
      return { caption: c };
    } catch (e) {
      notes.push(`API: ${(e as Error).message.slice(0, 120)}`);
    }
    try {
      const c = viaCli(slug);
      saveCaption(slug, c);
      return { caption: c, note: notes.join(" · ") };
    } catch (e) {
      notes.push(`Claude Code: ${(e as Error).message.slice(0, 120)}`);
    }
    const c = viaModelo(slug);
    saveCaption(slug, c);
    return { caption: c, note: `gerada sem IA (${notes.join(" · ")})` };
  };

  // ---------------------------------------------------------------- calendário
  // Reels/calendario.json: { items, perDay, urgent, urgency }. O SERVIDOR é a fonte da verdade (a tela recebe o calendário
  // inteiro de volta): a sugestão feita em cima de uma tela desatualizada duplicava eventos (2026-09-28).
  const dedupe = (items: CalItem[]) => {
    const m = new Map<string, CalItem>();
    for (const i of items) if (i && i.slug && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(i.at)) m.set(i.slug, i); // um evento por vídeo (o último vale)
    return [...m.values()].sort((x, y) => x.at.localeCompare(y.at));
  };
  const readCal = (): Calendar => {
    try {
      const c = JSON.parse(fs.readFileSync(CAL, "utf-8")) as Calendar;
      return {
        items: dedupe((c.items ?? []).filter((i) => fs.existsSync(path.join(VIDEOS, i.slug)))),
        perDay: Math.min(3, Math.max(1, Number(c.perDay) || 2)),
        urgent: (c.urgent ?? []).filter((u) => fs.existsSync(path.join(VIDEOS, u))),
        urgency: Object.fromEntries(Object.entries(c.urgency ?? {}).filter(([k, v]) => URGS.includes(v) && fs.existsSync(path.join(VIDEOS, k)))),
      };
    } catch {
      return { items: [], perDay: 2, urgent: [], urgency: {} };
    }
  };
  const writeCal = (c: Partial<Calendar>) => {
    const cur = readCal();
    const next: Calendar = {
      items: dedupe(c.items ?? cur.items),
      perDay: Math.min(3, Math.max(1, Number(c.perDay ?? cur.perDay) || 2)),
      urgent: [...new Set(c.urgent ?? cur.urgent)],
      urgency: { ...cur.urgency, ...(c.urgency ?? {}) },
    };
    fs.writeFileSync(CAL, JSON.stringify(next, null, 2));
    return next;
  };

  // Sugestão. Pedido do Paulo (2026-09-28, corrigindo o "2 por semana"): VÍDEO TODO DIA, até N por dia (padrão 2),
  // sábado e domingo valem; hoje só entra o que for urgente para hoje. Ordem pela urgência do tema (nasce no
  // roteiro): hoje > 48h > semana > atemporal; na mesma urgência, fato mais recente e renderizado primeiro; sem dois do
  // mesmo pilar seguidos. Horários do público no perfil (horarios): na ZALE, dia útil 12h15 (almoço entre pacientes)
  // e 19h30 (depois do consultório); fim de semana 10h e 18h30.
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  /** urgência final: a escolhida na tela > a do roteiro > marcado urgente (= hoje) > a do pilar no perfil (hype = 48h) > atemporal */
  const urgencyOf = (slug: string, cal: Calendar): Urg => {
    const pil = perfil().pilares.itens.find((p) => p.id === tacohOf(slug));
    return cal.urgency[slug] ?? roteiroUrg(slug) ?? (cal.urgent.includes(slug) ? "hoje" : pil?.urgencia && URGS.includes(pil.urgencia) ? pil.urgencia : "atemporal");
  };
  const suggest = (vids: { slug: string; ready: boolean }[]) => {
    const cal = readCal();
    const hor = perfil().horarios;
    const keep = cal.items;
    const out: CalItem[] = [];
    const now = new Date();
    const all = () => [...keep, ...out];
    const perDayOf = (k: string) => all().filter((i) => i.at.slice(0, 10) === k).length;
    const order: Record<Urg, number> = { hoje: 0, "48h": 1, semana: 2, atemporal: 3 };
    const pending = vids.filter((v) => !keep.some((k) => k.slug === v.slug));
    pending.sort((x, y) => order[urgencyOf(x.slug, cal)] - order[urgencyOf(y.slug, cal)] || factOf(y.slug).localeCompare(factOf(x.slug)) || Number(y.ready) - Number(x.ready) || y.slug.localeCompare(x.slug));

    // horários livres a partir de `fromDay` (0 = hoje): no dia, até perDay vídeos, horário ainda não usado, > agora + 30 min
    const freeSlots = function* (fromDay: number, toDay: number, todayToo: boolean) {
      for (let dd = fromDay; dd <= toDay; dd++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dd);
        const k = key(d);
        if (dd === 0 && !todayToo) continue;
        const wkend = d.getDay() === 0 || d.getDay() === 6;
        const times = dd === 0 ? hor.hoje : hor[String(cal.perDay)][wkend ? "fimDeSemana" : "semana"];
        for (const t of times) {
          if (perDayOf(k) >= (dd === 0 ? 1 : cal.perDay)) break; // hoje: só um (pedido do Paulo)
          if (all().some((i) => i.at === `${k}T${t}`)) continue;
          const [h, m] = t.split(":").map(Number);
          if (new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime() - now.getTime() < 30 * 60 * 1000) continue;
          yield `${k}T${t}`;
        }
      }
    };
    const first = (a: number, b: number, today: boolean) => freeSlots(a, b, today).next().value ?? null;

    // 1) urgentes nas suas janelas (hoje = hoje ou amanhã; 48h = até 2 dias; semana = até 7 dias)
    for (const v of [...pending]) {
      const u = urgencyOf(v.slug, cal);
      const win: Record<Urg, [number, number] | null> = { hoje: [0, 1], "48h": [1, 2], semana: [1, 7], atemporal: null };
      if (!win[u]) continue;
      const [a, b] = win[u] as [number, number];
      const slot = first(a, b, u === "hoje") ?? first(1, 60, false);
      if (slot) {
        out.push({ slug: v.slug, at: slot });
        pending.splice(pending.indexOf(v), 1);
      }
    }
    // 2) o resto em sequência, todo dia, sem repetir o pilar do vídeo anterior
    let last = "";
    for (const slot of freeSlots(1, 365, false)) {
      if (!pending.length) break;
      let i = pending.findIndex((p) => !last || tacohOf(p.slug) !== last);
      if (i < 0) i = 0;
      const [p] = pending.splice(i, 1);
      out.push({ slug: p.slug, at: slot });
      last = tacohOf(p.slug);
    }
    return writeCal({ items: all() });
  };

  // ---------------------------------------------------------------- roteiros (aba Roteiros do Estúdio)
  // Os roteiros saem do chat (skill reels-zale) em Reels/roteiros/<slug>.md. Status automático: sem projeto = pendente,
  // projeto sem render = em edição, com render = pronto; "postado" (ou forçar outro) o Paulo marca na tela e fica em
  // Reels/roteiros/status.json.
  const STATUS = path.join(ROTEIROS, "status.json");
  const readStatus = (): Record<string, string> => {
    try {
      return JSON.parse(fs.readFileSync(STATUS, "utf-8"));
    } catch {
      return {};
    }
  };
  const field = (md: string, name: string) => new RegExp(`\\*\\*${name}:\\*\\*\\s*([^·\\n]+)`, "i").exec(md)?.[1].replace(/\*\*/g, "").trim() ?? "";
  const listRoteiros = (hasRender: (slug: string) => boolean) => {
    if (!fs.existsSync(ROTEIROS)) return [];
    const manual = readStatus();
    const cal = readCal();
    return fs
      .readdirSync(ROTEIROS)
      .filter((f) => /^\d{4}-\d{2}-\d{2}_.+\.md$/.test(f))
      .map((f) => {
        const slug = f.slice(0, -3);
        const md = fs.readFileSync(path.join(ROTEIROS, f), "utf-8");
        const proj = fs.existsSync(path.join(VIDEOS, slug));
        const auto = !proj ? "pendente" : hasRender(slug) ? "pronto" : "edicao";
        return {
          slug,
          title: /^#\s+(.+)$/m.exec(md)?.[1].trim() ?? slug,
          date: slug.slice(0, 10),
          formato: field(md, "Formato"),
          tacoh: tacohOf(slug),
          urgency: urgencyOf(slug, cal),
          duracao: field(md, "Duração estimada"),
          status: manual[slug] ?? auto,
          auto,
          project: proj && fs.existsSync(path.join(VIDEOS, slug, "edit.json")),
          scheduled: cal.items.find((i) => i.slug === slug)?.at ?? null,
          mtime: fs.statSync(path.join(ROTEIROS, f)).mtimeMs,
        };
      });
  };
  const readRoteiro = (slug: string) => {
    const f = path.join(ROTEIROS, `${slug}.md`);
    return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : null;
  };
  const setStatus = (slug: string, st: string | null) => {
    const m = readStatus();
    if (st) m[slug] = st;
    else delete m[slug];
    fs.writeFileSync(STATUS, JSON.stringify(m, null, 2));
  };

  return { readCaption, saveCaption, generate, readCal, writeCal, suggest, tacohOf, titleOf, urgencyOf, factOf, listRoteiros, readRoteiro, setStatus };
};

// ---------------------------------------------------------------- limpeza dos temporários
// Cada montagem do Remotion (conferir quadros, coletar sons, renderizar) cria uma pasta de 1 a 3,6 GB em %TEMP%
// (remotion-webpack-bundle-*, remotion-*) e perfis do Chrome (puppeteer_dev_chrome_profile-*). Nada disso é apagado
// sozinho: em 2026-09-28 eram 259 GB e o C: encheu (2ª vez que o Paulo apagou à mão). Esta limpeza roda ao abrir o
// Estúdio e a cada 30 min, apagando o que tem mais de 2 h (nunca o que está em uso por um render/conferência agora).
const TEMP_PATTERNS = [/^remotion-/, /^puppeteer_dev_chrome_profile-/, /^react-motion-render/];
export const cleanTemp = (dirs: string[], maxAgeMs = 2 * 3600 * 1000) => {
  let freed = 0;
  let count = 0;
  const now = Date.now();
  const size = (p: string): number => {
    try {
      const st = fs.lstatSync(p);
      if (!st.isDirectory()) return st.size;
      return fs.readdirSync(p).reduce((a, f) => a + size(path.join(p, f)), 0);
    } catch {
      return 0;
    }
  };
  for (const dir of dirs) {
    if (!dir || !fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!TEMP_PATTERNS.some((re) => re.test(name))) continue;
      const p = path.join(dir, name);
      try {
        if (now - fs.statSync(p).mtimeMs < maxAgeMs) continue;
        const s = size(p);
        fs.rmSync(p, { recursive: true, force: true });
        freed += s;
        count++;
      } catch {
        /* em uso: fica para a próxima */
      }
    }
  }
  return { count, freedGB: +(freed / 1e9).toFixed(2) };
};

// ---------------------------------------------------------------- atualização pelo GitHub (máquinas dos colegas)
// O repositório estudio-zale é clonado inteiro; o Estúdio confere se há versão nova (git fetch, no máximo a cada
// 10 min) e atualiza com um clique (git pull --ff-only + npm install / pip se as dependências mudaram).
// Na máquina do Paulo (pasta de trabalho, não é clone) responde git: false e nada aparece.
import { spawnSync as _run } from "node:child_process";
let _upd: { at: number; data: unknown } | null = null;
const git = (cwd: string, ...args: string[]) => _run("git", args, { cwd, encoding: "utf-8", timeout: 60000 });
export const makeUpdater = (ROOT: string) => {
  const top = () => {
    const r = git(ROOT, "rev-parse", "--show-toplevel");
    const t = r.status === 0 ? r.stdout.trim() : "";
    // só vale se o topo do git for o repositório do Estúdio (tem o instalar.bat na raiz)
    return t && fs.existsSync(path.join(t, "instalar.bat")) ? t : "";
  };
  const status = (force = false) => {
    if (!force && _upd && Date.now() - _upd.at < 10 * 60 * 1000) return _upd.data;
    const repo = top();
    if (!repo) return (_upd = { at: Date.now(), data: { git: false } }).data;
    git(repo, "fetch", "--quiet", "origin");
    const behind = Number(git(repo, "rev-list", "--count", "HEAD..@{u}").stdout.trim() || 0);
    const log = behind ? git(repo, "log", "--format=%s", "HEAD..@{u}").stdout.trim().split("\n").filter(Boolean).slice(0, 8) : [];
    const data = { git: true, behind, log, version: git(repo, "log", "-1", "--format=%cd", "--date=format:%d/%m/%Y %H:%M").stdout.trim() };
    _upd = { at: Date.now(), data };
    return data;
  };
  const update = () => {
    const repo = top();
    if (!repo) return { ok: false, log: "esta pasta não é um clone do estudio-zale" };
    const before = git(repo, "rev-parse", "HEAD").stdout.trim();
    const pull = git(repo, "pull", "--ff-only");
    if (pull.status !== 0) return { ok: false, log: (pull.stderr || pull.stdout).trim() };
    const changed = git(repo, "diff", "--name-only", before, "HEAD").stdout;
    const out = [pull.stdout.trim()];
    if (/Reels\/editor\/package(-lock)?\.json/.test(changed)) {
      const npm = _run(process.platform === "win32" ? "npm.cmd" : "npm", ["install"], { cwd: path.join(repo, "Reels", "editor"), encoding: "utf-8", shell: true, timeout: 600000 });
      out.push(npm.status === 0 ? "dependências do Node atualizadas" : `npm install falhou: ${(npm.stderr || "").slice(-300)}`);
    }
    if (/requirements\.txt/.test(changed)) {
      const pip = _run("python", ["-m", "pip", "install", "-r", path.join(repo, "requirements.txt")], { encoding: "utf-8", timeout: 900000 });
      out.push(pip.status === 0 ? "dependências do Python atualizadas" : `pip falhou: ${(pip.stderr || "").slice(-300)}`);
    }
    _upd = null;
    return { ok: true, log: out.join("\n") };
  };
  return { status, update };
};
