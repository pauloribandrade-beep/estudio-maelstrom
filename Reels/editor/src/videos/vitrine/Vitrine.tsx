import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import { BadgePercent, CalendarCheck, ClipboardList, HeartHandshake, MessageCircle, RefreshCcw, Stethoscope, Syringe, UserCheck } from "lucide-react";
import { AgendaWeek, Cursor, Dashboard, Funnel, OrbitCards, PhoneChat, PhotoScene, Proposal, TimelineDots } from "../../lib/palco-ui";
import { ProtocolStack } from "../../lib/clinica/palco-ui";
import { BigType, KeywordPill, FollowCard, PalcoLayout, Stamp, Versus } from "../../lib/palco";

// Vitrine da biblioteca do palco: cada cena por ~3 s. Números e nomes são
// ilustrativos, só para mostrar o componente.
const S = 96; // frames por cena
const scenes: { name: string; el: (life: number) => React.ReactNode }[] = [
  {
    name: "celular",
    el: (l) => (
      <PhoneChat
        life={l}
        contact="Paciente"
        typingAt={4}
        messages={[
          { from: "paciente", text: "Quanto é o botox?", at: 34 },
          { from: "clinica", text: "R$ X a unidade 🙂", at: 58, seen: true },
        ]}
      />
    ),
  },
  { name: "agenda", el: (l) => <AgendaWeek life={l} slots={[["Ana", null, "Bia", null, null, "Cris"], [null, null, "Duda", null, null, null], ["Eva", "Fê", null, null, "Gabi", null], [null, null, null, "Helô", null, null], ["Iris", null, null, null, null, "Ju"]]} emptyFlashAt={50} /> },
  { name: "painel", el: (l) => <Dashboard life={l} kpis={[{ label: "contatos", value: 42 }, { label: "avaliações", value: 18 }, { label: "fecharam", value: 6 }]} bars={[{ label: "seg", value: 4 }, { label: "ter", value: 7 }, { label: "qua", value: 3 }, { label: "qui", value: 8 }, { label: "sex", value: 5 }]} highlight={3} /> },
  { name: "funil", el: (l) => <Funnel life={l} stages={[{ label: "chamaram no direct", at: 4 }, { label: "agendaram", at: 12 }, { label: "vieram", at: 20 }, { label: "fecharam", at: 28 }]} leakAt={50} leakIndex={1} /> },
  {
    name: "protocolo",
    el: (l) => (
      <ProtocolStack
        life={l}
        name="Face · plano de 6 meses"
        layers={[
          { icon: Stethoscope, text: "avaliação e plano", at: 10 },
          { icon: Syringe, text: "cuidado principal", at: 20 },
          { icon: ClipboardList, text: "orientação em casa", at: 30 },
          { icon: CalendarCheck, text: "retornos definidos", at: 40 },
          { icon: RefreshCcw, text: "reavaliação", at: 50 },
        ]}
      />
    ),
  },
  { name: "proposta", el: (l) => <Proposal life={l} title="Plano Face" items={["avaliação individual", "3 sessões", "retornos 30 e 90 dias"]} table="valor de tabela" condition="condição do plano" anchorAt={36} ctaAt={66} /> },
  { name: "retornos", el: (l) => <TimelineDots life={l} title="o paciente volta quando alguém chama" points={[{ label: "30 dias", sub: "retorno", at: 8 }, { label: "90 dias", sub: "manutenção", at: 22 }, { label: "180 dias", sub: "reavaliação", at: 36 }]} /> },
  {
    name: "órbita",
    el: (l) => (
      <OrbitCards
        life={l}
        center="protocolo"
        nodes={[
          { icon: MessageCircle, label: "direct", at: 8 },
          { icon: CalendarCheck, label: "agenda", at: 16 },
          { icon: Stethoscope, label: "consulta", at: 24 },
          { icon: BadgePercent, label: "preço", at: 32 },
          { icon: UserCheck, label: "retorno", at: 40 },
          { icon: HeartHandshake, label: "indicação", at: 48 },
        ]}
      />
    ),
  },
  { name: "versus", el: (l) => <Versus life={l} left={{ title: "avulso", lines: ["paga por ml", "some depois"] }} right={{ title: "protocolo", lines: ["plano com etapas", "volta no retorno"] }} rightAt={24} /> },
  {
    name: "palavra + carimbo",
    el: (l) => (
      <>
        <BigType life={l} title="desconto" sub="não é estratégia" />
        <Sequence from={40} layout="none">
          <Stamp life={l - 40} text="pânico" />
        </Sequence>
      </>
    ),
  },
  {
    name: "foto",
    el: (l) => (
      <PhotoScene
        life={l}
        srcs={[
          { src: "videos/teste/img/elizabeth-ii-of-uk-1943.jpg", at: 0 },
          { src: "videos/teste/img/hm-queen-elizabeth-ii.jpg", at: 48 },
        ]}
        caption="Elizabeth II"
        credit="fotos: Yousuf Karsh (domínio público) · Presidencia de la República Mexicana (CC BY 2.0)"
      />
    ),
  },
  { name: "cta", el: (l) => <KeywordPill life={l} keyword="PROTOCOLO" sub="que eu te mando o modelo" /> },
  { name: "seguir", el: (l) => <FollowCard life={l} handle="@opaulosandrade" clickAt={30} /> },
];
export const VITRINE_DURATION = scenes.length * S;

export const Vitrine: React.FC = () => (
  <AbsoluteFill>
    <PalcoLayout handle="@opaulosandrade" me={<OffthreadVideo src={staticFile("videos/teste/ig1080.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 28%" }} />}>
      {scenes.map((s, i) => (
        <Sequence key={s.name} from={i * S} durationInFrames={S} name={s.name} layout="none">
          {s.el(S)}
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={S} layout="none">
        <Cursor path={[[900, 820], [640, 560]]} at={60} dur={16} click={false} />
      </Sequence>
      <Sequence from={5 * S} durationInFrames={S} layout="none">
        <Cursor path={[[960, 900], [540, 760]]} at={46} dur={18} />
      </Sequence>
    </PalcoLayout>
  </AbsoluteFill>
);
