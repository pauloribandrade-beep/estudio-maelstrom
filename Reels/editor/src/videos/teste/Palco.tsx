import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { BadgePercent, MessageCircleQuestion } from "lucide-react";
import spec from "./segments.json";
import wordsRaw from "./words.json";
import { Word } from "../../lib/overlays";
import { TakesVideo, makeAt, makeTimeline, useZoom } from "../../lib/timeline";
import { BigType, ChatMock, FollowCard, IconBadge, KeywordPill, PalcoLayout, SeamCaptions, Snd, Stamp, TypeWindow, Versus } from "../../lib/palco";

// TESTE do modo Palco (modelo para os vídeos reais). Tempos = segundos da
// gravação original. Um elemento por vez no palco; legenda na emenda.
const tl = makeTimeline(spec);
export const PALCO_DURATION = tl.DURATION;
const At = makeAt(tl);
const SRC = "videos/teste/ig1080.mp4";
const HANDLE = "@opaulosandrade";

const SNAPS: [number, number][] = [[11.82, 1.0], [18.7, 1.08], [25.46, 1.0], [30.0, 1.08], [37.28, 1.0], [41.6, 1.08], [51.04, 1.0], [53.44, 1.1], [55.5, 1.0]];

export const PalcoTeste: React.FC = () => {
  const zoom = useZoom(tl, SNAPS, [{ at: 54.0, z: 1.1, up: 12, until: 55.4, down: 8 }]);
  return (
    <AbsoluteFill>
      <PalcoLayout handle={HANDLE} zoom={zoom} me={<TakesVideo tl={tl} src={SRC} style={{ objectPosition: "50% 28%" }} />}>
        {/* 1. a cena: paciente diz "vou pensar", clínica responde "fica à vontade", visualizado, sumiu */}
        <At from={11.82} to={21.7} name="chat">
          <ChatMock
            life={tl.life(11.82, 21.7)}
            title="Paciente · avaliação"
            messages={[
              { from: "paciente", text: "Vou pensar, doutora.", at: tl.rel(12.0, 11.82) },
              { from: "clinica", text: "Claro, fica à vontade!", at: tl.rel(16.52, 11.82), seen: true },
            ]}
          />
        </At>
        <At from={20.56} to={21.7} name="carimbo">
          <Stamp life={tl.life(20.56, 21.7)} text="não volta" />
        </At>

        {/* 2. a virada */}
        <At from={25.46} to={29.9} name="não é não">
          <BigType life={tl.life(25.46, 29.9)} title="“vou pensar”" sub="muitas vezes não é um não" size={130} />
        </At>
        <At from={30.0} to={32.5} name="dúvida">
          <IconBadge life={tl.life(30.0, 32.5)} icon={MessageCircleQuestion} label="é uma dúvida que ela não falou" />
        </At>

        {/* 3. situação 1: valor */}
        <At from={37.28} to={41.4} name="desconto">
          <IconBadge life={tl.life(37.28, 41.4)} icon={BadgePercent} tone="white" label="dúvida no valor" />
        </At>
        <At from={39.14} to={41.4} name="carimbo desconto">
          <Stamp life={tl.life(39.14, 41.4)} text="sem desconto" />
        </At>
        <At from={41.6} to={46.82} name="pergunta">
          <TypeWindow life={tl.life(41.6, 46.82)} title="pergunte assim" text="O que te deixou em dúvida: o investimento ou o plano?" startAt={tl.rel(42.4, 41.6)} cps={24} />
        </At>

        {/* 4. condução */}
        <At from={51.04} to={55.5} name="versus">
          <Versus
            life={tl.life(51.04, 55.5)}
            left={{ title: "pressão", lines: ["desconto na hora", "insistir"] }}
            right={{ title: "condução", lines: ["próximo passo com data", "ela decide com você"] }}
            rightAt={tl.rel(54.06, 51.04)}
          />
        </At>

        {/* 5. CTA e seguir no outro */}
        <At from={55.58} to={59.4} name="cta">
          <KeywordPill life={tl.life(55.58, 59.4)} keyword="PENSAR" sub="e receba as 3 frases no direct" />
        </At>
        <Sequence from={tl.SPEECH_FRAMES} durationInFrames={tl.OUTRO_FRAMES} layout="none" name="seguir">
          <FollowCard life={tl.OUTRO_FRAMES} handle={HANDLE} clickAt={22} />
        </Sequence>
      </PalcoLayout>
      {SNAPS.slice(1).map(([t]) => (
        <Snd key={t} at={tl.E(t)} name="tap" vol={0.1} />
      ))}
      <SeamCaptions words={wordsRaw as Word[]} hot={["não", "condução", "PENSAR"]} />
    </AbsoluteFill>
  );
};
