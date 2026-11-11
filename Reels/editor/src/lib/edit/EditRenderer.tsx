import React from "react";
import { AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, Video, interpolate, staticFile, useCurrentFrame } from "remotion";
import { PalcoLayout, SeamCaptions } from "../palco";
import { LiveLayout, useCaptionY } from "../live-layout";
import { AdCaptions } from "../legenda-anuncio";
import { EditCaptions } from "../cenas-edit";
import { PixelCaptions } from "../pixel-captions";
import { LaestroCaptions } from "../laestro-captions";
import { LiteCtx, SfxCtx } from "../sfx-ctx";
import { MUTE_VOICE, TakesVideo, Timeline } from "../timeline";
import { SCENES, toComponentProps } from "./registry";
import { HLSpace } from "../hl3";
import { EditDoc, SceneClip, SoundClip, VoiceTrack, ZoomPush, ZoomSnap } from "./types";

// Monta o vídeo inteiro a partir do edit.json. Os sons embutidos nas cenas ficam
// MUDOS: todo som vem da trilha `sounds` (o que o Paulo vê e mexe no editor).
// `tl` vem do segments.json do vídeo (os takes da gravação), que não muda aqui.

const fr = (t: number, fps: number) => Math.round(t * fps);

const useZoomDoc = (snaps: ZoomSnap[], pushes: ZoomPush[], fps: number, duration: number) => {
  const f = useCurrentFrame();
  const ease = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
    easing: Easing.inOut(Easing.cubic),
  };
  let base = 1;
  let prev = 1;
  for (const s of [...snaps].sort((a, b) => a.t - b.t)) {
    const a = fr(s.t, fps);
    if (f < a) break;
    base = prev + (s.z - prev) * interpolate(f, [a, a + 9], [0, 1], ease);
    prev = s.z;
  }
  let push = 1;
  for (const p of pushes) {
    const a = fr(p.t, fps);
    const b = p.until === "end" ? fr(duration, fps) : fr(p.until, fps);
    const up = p.up ?? 14;
    const down = p.until === "end" ? 0 : (p.down ?? 14);
    if (f < a || f >= b + down) continue;
    const rise = interpolate(f, [a, a + up], [0, 1], ease);
    const fall = down > 0 ? interpolate(f, [b, b + down], [1, 0], ease) : 1;
    push *= 1 + (p.z - 1) * rise * fall;
  }
  return base * push;
};

// Transições de entrada (cena.enter), por cima da entrada própria de cada cena:
// whip = chega de lado rápido com rastro; zoom = vem de perto desfocada; drop = cai com quique;
// flash = clarão branco curto no palco.
const TransitionIn: React.FC<{
  kind?: SceneClip["enter"];
  children: React.ReactNode;
}> = ({ kind, children }) => {
  const f = useCurrentFrame();
  if (!kind) return <>{children}</>;
  const e = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
    easing: Easing.out(Easing.cubic),
  };
  let style: React.CSSProperties = {};
  if (kind === "whip-left" || kind === "whip-right") {
    const d = kind === "whip-left" ? 1 : -1;
    const x = interpolate(f, [0, 9], [520 * d, 0], e);
    const blur = interpolate(f, [0, 9], [18, 0], e);
    style = {
      transform: `translateX(${x}px) skewX(${(-x / 520) * 8}deg)`,
      filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
    };
  } else if (kind === "zoom") {
    const z = interpolate(f, [0, 10], [1.35, 1], e);
    const blur = interpolate(f, [0, 10], [14, 0], e);
    style = {
      transform: `scale(${z})`,
      filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      transformOrigin: "50% 40%",
    };
  } else if (kind === "drop") {
    const y = f < 14 ? interpolate(f, [0, 8, 11, 14], [-420, 18, -6, 0]) : 0;
    style = { transform: `translateY(${y}px)` };
  }
  const flash =
    kind === "flash"
      ? interpolate(f, [0, 2, 9], [0, 0.85, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  return (
    <>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
    </>
  );
};

export const SceneView: React.FC<{ scene: SceneClip; fps: number }> = ({ scene, fps }) => {
  const C = SCENES[scene.type];
  if (!C) throw new Error(`cena "${scene.type}" não está no registry`);
  const life = Math.max(1, fr(scene.end, fps) - fr(scene.start, fps));
  const props = toComponentProps(scene.props, fps) as Record<string, unknown>;
  return (
    <TransitionIn kind={scene.enter}>
      <C life={life} {...props} />
    </TransitionIn>
  );
};

export const SoundView: React.FC<{
  s: SoundClip;
  fps: number;
  total: number;
}> = ({ s, fps, total }) => {
  const from = fr(s.start, fps);
  const dur = Math.max(1, Math.min(s.dur !== undefined ? fr(s.dur, fps) : 180, total - from));
  const fi = fr(s.fadeIn ?? 0, fps);
  const fo = fr(s.fadeOut ?? 0, fps);
  const trim = fr(s.trim ?? 0, fps);
  return (
    <Sequence from={from} durationInFrames={dur} name={s.label ?? s.src} premountFor={15}>
      <Audio
        src={staticFile(s.fxSrc ?? s.src)}
        startFrom={trim}
        endAt={trim + dur}
        // volume acima de 100% (até +12 dB) precisa do Web Audio no navegador; no render o ffmpeg aplica direto
        useWebAudioApi={s.vol > 1}
        volume={(f) => {
          const a =
            fi > 0
              ? interpolate(f, [0, fi], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1;
          const b =
            fo > 0
              ? interpolate(f, [dur - fo, dur], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1;
          return s.vol * a * b;
        }}
      />
    </Sequence>
  );
};

// Voz tratada: um <Audio> por take, cortado nos mesmos pontos da gravação e com os
// mesmos fades curtos do TakesVideo; ganho (dB) e fade de entrada/saída do vídeo.
const VoiceView: React.FC<{
  v: VoiceTrack;
  tl: Timeline;
  fps: number;
  fallback: string;
  lite?: boolean;
}> = ({ v, tl, fps, fallback, lite = false }) => {
  const src = v.src ?? fallback;
  const g = Math.pow(10, (v.gain ?? 0) / 20);
  const fi = fr(v.fadeIn ?? 0, fps);
  const fo = fr(v.fadeOut ?? 0, fps);
  const speech = tl.SPEECH_FRAMES;
  if (MUTE_VOICE) return null;
  // prévia do Estúdio com o motor de voz próprio (Web Audio, fora do Remotion): aqui não toca nada
  if (v.engine) return null;
  if (v.cont) {
    // prévia com a voz contínua (já cortada na ordem da timeline): um <audio> só, do começo ao fim
    return (
      <Sequence from={0} durationInFrames={Math.max(1, speech)} name="voz (contínua)">
        <Audio
          src={staticFile(src)}
          acceptableTimeShiftInSeconds={lite ? 0.8 : undefined}
          volume={(f) => {
            const a = fi > 0 ? interpolate(f, [0, fi], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
            const b = fo > 0 ? interpolate(f, [speech - fo, speech], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
            return g * a * b;
          }}
        />
      </Sequence>
    );
  }
  return (
    <>
      {tl.SEGS.map((s, i) => {
        const from = Math.round(s.a * fps);
        const at0 = tl.segStart(i);
        const inA = 1; // fade de 1 quadro (o mínimo no render): 2 quadros comiam o ataque das palavras nas emendas justas
        return (
          <Sequence key={i} from={at0} durationInFrames={s.frames} name={`voz ${i + 1}`} premountFor={60}>
            <Audio
              src={staticFile(src)}
              startFrom={from}
              endAt={from + s.frames}
              // prévia: só ressincroniza a voz se escorregar mais de 0,8 s (cena pesada atrasando um quadro fazia o
              // áudio voltar e a mesma frase "repetir" várias vezes); no render não muda nada
              acceptableTimeShiftInSeconds={lite ? 0.8 : undefined}
              volume={(f) => {
                const take = interpolate(f, [0, inA, Math.max(inA + 1, s.frames - 2), Math.max(inA + 2, s.frames - 1)], [0, 1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const t = at0 + f;
                const a =
                  fi > 0
                    ? interpolate(t, [0, fi], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 1;
                const b =
                  fo > 0
                    ? interpolate(t, [speech - fo, speech], [1, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 1;
                return Math.min(1, g * take * a * b);
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};

// `lite`: prévia do Estúdio. Tira a cópia desfocada do vídeo no fundo (desfocar vídeo ao vivo
// derrubava o Player para ~16 quadros/s e o áudio "repetia" ao ressincronizar). Render: sem lite.
// Prévia do Estúdio: UM vídeo contínuo (cortes e voz já aplicados pelo servidor). Sem troca
// de mídia nos cortes, o Player não precisa ressincronizar e nada "repete".
// Também serve para o RENDER: `video.cut` = o mesmo arquivo contínuo em alta qualidade (1080, do master),
// montado pelo render.py antes. Ler um arquivo só, em sequência, é bem mais rápido que pular de take em take.
const ContinuousVideo: React.FC<{
  doc: EditDoc;
  fps: number;
  speech: number;
  src: string;
  offthread?: boolean;
}> = ({ doc, fps, speech, src, offthread }) => {
  const v = doc.voice ?? {};
  const g = Math.pow(10, (v.gain ?? 0) / 20);
  const fi = fr(v.fadeIn ?? 0, fps);
  const fo = fr(v.fadeOut ?? 0, fps);
  const volume = (t: number) => {
    const a =
      fi > 0
        ? interpolate(t, [0, fi], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 1;
    const b =
      fo > 0
        ? interpolate(t, [speech - fo, speech], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 1;
    return MUTE_VOICE ? 0 : Math.min(1, g * a * b);
  };
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };
  // prévia: tolera 1 s de desvio antes de ressincronizar (cada ressincronização = a fala "repete")
  return offthread ? <OffthreadVideo src={staticFile(src)} style={style} volume={volume} muted={MUTE_VOICE} /> : <Video src={staticFile(src)} style={style} volume={volume} acceptableTimeShiftInSeconds={1} />;
};

export const EditRenderer: React.FC<{
  doc: EditDoc;
  tl: Timeline;
  mode?: "play" | "collect";
  lite?: boolean;
}> = ({ doc, tl, mode = "play", lite = false }) => {
  const fps = doc.fps;
  const zoom = useZoomDoc(doc.zoom.snaps, doc.zoom.pushes, fps, doc.duration);
  const total = tl.DURATION;
  const scenes = [...doc.scenes].sort((a, b) => (a.lane ?? 0) - (b.lane ?? 0));
  const capY = useCaptionY(doc.layouts, fps, doc.video.fit?.top ?? 0, doc.captions.y);
  // layout vivo: com `layouts` no edit.json a tela alterna split / tela cheia / bolha; sem, é o Palco de sempre
  const live = !!doc.layouts?.length;
  if (mode === "collect") {
    // extração dos sons: todas as cenas montadas de uma vez, cada uma com o seu frame inicial
    return (
      <AbsoluteFill>
        {scenes.map((s) => (
          <SfxCtx.Provider key={s.id} value={{ mode: "collect", offset: fr(s.start, fps), scene: s.id }}>
            <SceneView scene={s} fps={fps} />
          </SfxCtx.Provider>
        ))}
      </AbsoluteFill>
    );
  }
  if (doc.format === "wide") return <WideRenderer doc={doc} tl={tl} lite={lite} scenes={scenes} total={total} />;
  // corte SECO entre takes (xfade 0): a fusão de 0,2 s mostrava dois rostos sobrepostos quando a cabeça mudava
  // de posição. O salto grande é disfarçado pela troca de enquadramento (zoom.snaps) só nesses cortes.
  const me =
    lite && doc.video.preview ? (
      <ContinuousVideo doc={doc} fps={fps} speech={tl.SPEECH_FRAMES} src={doc.video.preview} />
    ) : doc.video.cut ? (
      <ContinuousVideo doc={doc} fps={fps} speech={tl.SPEECH_FRAMES} src={doc.video.cut} offthread />
    ) : (
      <TakesVideo tl={tl} src={doc.video.src} muted={!!doc.voice} xfade={0} />
    );
  const meBg = lite ? (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 60% at 50% 40%, #3a3530 0%, #151412 100%)" }} />
  ) : (
    <TakesVideo tl={tl} src={doc.video.src} muted xfade={0} />
  );
  const sceneEls = scenes.map((s) => {
    const from = fr(s.start, fps);
    const life = Math.max(1, fr(s.end, fps) - from);
    return (
      <Sequence key={s.id} from={from} durationInFrames={Math.min(life, total - from)} layout="none" name={s.label ?? `${s.type} · ${s.id}`}>
        <SceneView scene={s} fps={fps} />
      </Sequence>
    );
  });
  return (
    <LiteCtx.Provider value={lite}>
    <AbsoluteFill>
      <SfxCtx.Provider value={{ mode: "mute", offset: 0 }}>
        {live ? (
          <LiveLayout layouts={doc.layouts} fps={fps} handle={doc.video.handle} zoom={zoom} fit={doc.video.fit} me={me}>
            {sceneEls}
          </LiveLayout>
        ) : (
          <PalcoLayout handle={doc.video.handle} zoom={zoom} fit={doc.video.fit} me={me} meBg={meBg}>
            {sceneEls}
          </PalcoLayout>
        )}
      </SfxCtx.Provider>
      {doc.voice && !(lite && doc.video.preview) && !doc.video.cut ? <VoiceView v={doc.voice} tl={tl} fps={fps} fallback={doc.video.src} /> : null}
      {doc.sounds
        .filter((s) => !s.muted && !doc.soundTracks?.find((t) => t.id === s.track)?.muted)
        .map((s) => {
          const tv = doc.soundTracks?.find((t) => t.id === s.track)?.vol ?? 1;
          return <SoundView key={s.id} s={tv === 1 ? s : { ...s, vol: s.vol * tv }} fps={fps} total={total} />;
        })}
      {/* zIndex: no layout vivo o apresentador tem zIndex 1 e cobria a legenda */}
      <AbsoluteFill style={{ zIndex: 20, pointerEvents: "none" }}>
        {(doc.captions as { style?: string }).style === "pixel" ? (
          <PixelCaptions words={doc.captions.words} hot={doc.captions.hot} y={doc.captions.y} size={doc.captions.size} />
        ) : (doc.captions as { style?: string }).style === "edit" ? (
          <EditCaptions words={doc.captions.words} hot={doc.captions.hot} y={doc.captions.y} size={doc.captions.size} />
        ) : (doc.captions as { style?: string }).style === "ad" ? (
          <AdCaptions words={doc.captions.words} hot={doc.captions.hot} y={doc.captions.y} size={doc.captions.size} groupSize={doc.captions.groupSize} fps={fps} variant={(doc.captions as { variant?: string }).variant} />
        ) : (
          <SeamCaptions words={doc.captions.words} hot={doc.captions.hot} y={capY} size={doc.captions.size} groupSize={doc.captions.groupSize} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
    </LiteCtx.Provider>
  );
};

// Formato "wide" (projeto Half-Life 3): 1920x1080, só a voz. A gravação é um áudio; o "vídeo" do
// slug é um portador preto que nunca aparece (serve para o Estúdio reaproveitar cortes, voz e prévia).
// A voz toca pelo arquivo contínuo (prévia ou render) ou take a take; as cenas ocupam a tela inteira.
// PRÉVIA: só monta o que está perto do cursor (o que já toca + os próximos ~3 s, para dar tempo de carregar). Com
// ~470 sons e ~100 cenas, cada <Sequence> era conferida a cada quadro e o player não passava de ~24 q/s.
type NearItem = { from: number; to: number; el: React.ReactNode };
// PRÉVIA (06/11/2026): cenas que cobrem a tela inteira com fundo opaco. No meio delas (1 s de folga em cada ponta, por
// causa das entradas e saídas) o espaço do fundo não é desenhado. O render não usa isso: lá o fundo sai sempre.
const OPAQUE = new Set(["HLCombineTV", "HL15Woman"]);
const coveredAt = (scenes: SceneClip[], fps: number) => {
  const iv = scenes.filter((s) => OPAQUE.has(s.type)).map((s) => [fr(s.start, fps) + fps, fr(s.end, fps) - fps] as const);
  return (f: number) => iv.some(([a, b]) => f >= a && f < b);
};
const Near: React.FC<{ items: NearItem[]; ahead: number }> = ({ items, ahead }) => {
  const f = useCurrentFrame();
  return <>{items.filter((i) => f >= i.from - ahead && f <= i.to + 2).map((i) => i.el)}</>;
};

const WideRenderer: React.FC<{
  doc: EditDoc;
  tl: Timeline;
  lite: boolean;
  scenes: SceneClip[];
  total: number;
}> = ({ doc, tl, lite, scenes, total }) => {
  const fps = doc.fps;
  // formato só voz: na prévia (lite) a voz toca take a take direto da gravação — muda na hora a cada corte,
  // sem esperar o servidor montar um arquivo contínuo. O render usa o arquivo contínuo (cut).
  const cont = lite ? undefined : doc.video.cut;
  const v = doc.voice ?? {};
  const g = Math.pow(10, (v.gain ?? 0) / 20);
  const fi = fr(v.fadeIn ?? 0, fps);
  const fo = fr(v.fadeOut ?? 0, fps);
  const speech = tl.SPEECH_FRAMES;
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  const vol = (t: number) =>
    MUTE_VOICE
      ? 0
      : Math.min(1, g * (fi > 0 ? interpolate(t, [0, fi], [0, 1], clamp) : 1) * (fo > 0 ? interpolate(t, [speech - fo, speech], [1, 0], clamp) : 1));
  return (
    <LiteCtx.Provider value={lite}>
      <AbsoluteFill style={{ background: "#07060c" }}>
        {doc.orient === "vertical" || doc.noSpace ? null : <HLSpace freezeAt={doc.space?.freezeAt} jumpAt={doc.space?.jumpAt} covered={lite ? coveredAt(scenes, fps) : undefined} />}
        <SfxCtx.Provider value={{ mode: "mute", offset: 0 }}>
          {(() => {
            const items: NearItem[] = scenes.map((s) => {
              const from = fr(s.start, fps);
              const life = Math.max(1, fr(s.end, fps) - from);
              const dur = Math.max(1, Math.min(life, total - from));
              return {
                from,
                to: from + dur,
                el: (
                  <Sequence key={s.id} from={from} durationInFrames={dur} premountFor={30} name={s.label ?? `${s.type} · ${s.id}`}>
                    <SceneView scene={s} fps={fps} />
                  </Sequence>
                ),
              };
            });
            return lite ? <Near items={items} ahead={45} /> : items.map((i) => i.el);
          })()}
        </SfxCtx.Provider>
        {cont ? (
          <Audio src={staticFile(cont)} volume={vol} />
        ) : (
          <VoiceView v={doc.voice ?? {}} tl={tl} fps={fps} fallback={doc.video.src} lite={lite} />
        )}
        {(() => {
          const items: NearItem[] = doc.sounds
            .filter((s) => !s.muted && !doc.soundTracks?.find((t) => t.id === s.track)?.muted)
            .map((s) => {
              const tv = doc.soundTracks?.find((t) => t.id === s.track)?.vol ?? 1;
              const from = fr(s.start, fps);
              return { from, to: from + fr(s.dur ?? 6, fps), el: <SoundView key={s.id} s={tv === 1 ? s : { ...s, vol: s.vol * tv }} fps={fps} total={total} /> };
            });
          return lite ? <Near items={items} ahead={90} /> : items.map((i) => i.el);
        })()}
        {/* só a legenda pixelada (curiosidades 3D); os outros projetos "wide" desenham o texto dentro das cenas */}
        {(doc.captions as { style?: string } | undefined)?.style === "pixel" ? (
          <AbsoluteFill style={{ zIndex: 20, pointerEvents: "none" }}>
            <PixelCaptions words={doc.captions.words} hot={doc.captions.hot} y={doc.captions.y} size={doc.captions.size} />
          </AbsoluteFill>
        ) : (doc.captions as { style?: string } | undefined)?.style === "laestro" ? (
          // legenda amarela dos Shorts de meme (estilo Laestro)
          <AbsoluteFill style={{ zIndex: 20, pointerEvents: "none" }}>
            <LaestroCaptions {...(doc.captions as unknown as React.ComponentProps<typeof LaestroCaptions>)} />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    </LiteCtx.Provider>
  );
};
