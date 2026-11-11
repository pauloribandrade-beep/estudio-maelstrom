import React from "react";
import { ClinicNote, EyeCloseUp, ProtocolStack, VectorFace } from "../clinica/palco-ui";
import { LipsShrink, SwellFace } from "../clinica/cenas-extra";
import { ClinicStreet, ConsultQuestion, SyringeSpot } from "../clinica/cenas-metafora";
import { PatientFiles } from "../clinica/cenas-retorno";
import { EyeChart, EyesAlign, RottenSausage, ThreeVials, VialLabel } from "../clinica/cenas-botox";
import { ClinicInbox, ConsultPhoto } from "../clinica/cenas-dinamicas";
import { AdCalendar, AdCash, AdChips, AdConsultFlow, AdCta, AdDecisionMeter, AdEnd, AdIceberg, AdLeads, AdMonths, AdNinety, AdNoCourse, AdPill, AdTicket, AdTitle, AdTraffic, AdWhats, IgQuestion } from "../cenas-anuncio";
import { BridgeGroup, ClaroForget, ContactScroll, ContextCard, CrowdFocus, DissolveAsk, ElevatorForget, EmptyThought, FaultSameWay, GenericFade, GuidedMoment, InboxCounts, LoveNoReferral, LuckTarget, MirrorMoment, MomentTimeline, RightNever, SameAskQueue, ThoughtContact } from "../clinica/cenas-indica";
import { ConductClock, ElevatorScene, LoveMeters, MirrorStory, SameWayStreet, ThinkNoOne } from "../clinica/cenas-historia";

// CLÍNICA: cenas feitas para o nicho de clínica/estética da ZALE (paciente, médica, seringa, consulta, anúncio da
// ZALE). Ficam fora do pacote público, ou entram depois como pacote de exemplo, com os textos reescritos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CLINICA: Record<string, React.FC<any>> = {
  AdTitle,
  AdChips,
  AdCalendar,
  AdNinety,
  AdCash,
  AdCta,
  AdPill,
  AdMonths,
  AdTraffic,
  AdEnd,
  AdLeads,
  AdIceberg,
  AdWhats,
  AdNoCourse,
  AdConsultFlow,
  AdTicket,
  AdDecisionMeter,
  IgQuestion,
  ClinicNote,
  EyeCloseUp,
  ProtocolStack,
  VectorFace,
  SwellFace,
  LipsShrink,
  ConsultQuestion,
  SyringeSpot,
  ClinicStreet,
  PatientFiles,
  RottenSausage,
  EyeChart,
  EyesAlign,
  VialLabel,
  ThreeVials,
  ClinicInbox,
  ConsultPhoto,
  LoveNoReferral,
  SameAskQueue,
  DissolveAsk,
  ElevatorForget,
  EmptyThought,
  MomentTimeline,
  MirrorMoment,
  CrowdFocus,
  ThoughtContact,
  BridgeGroup,
  ContextCard,
  LuckTarget,
  ThinkNoOne,
  ElevatorScene,
  LoveMeters,
  SameWayStreet,
  ConductClock,
  MirrorStory,
  FaultSameWay,
  GenericFade,
  ClaroForget,
  ContactScroll,
  GuidedMoment,
  RightNever,
  InboxCounts,
};
