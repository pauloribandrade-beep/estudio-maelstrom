import React from "react";
import { RRBg, RRReddit, RRShot, RRSticker, RRSpinTrans } from "../../videos/2026-10-28_deadlock-rei-dos-ratos/RatoRei";
import { HWBg, HWDate, HWOdds, HWShot, HWStamp, HWStun, HWTitle } from "../../videos/2026-10-31_deadlock-halloween/Halloween";
import { PCAbility, PCBoard, PCCooldown, PCHealbane, PCHero, PCShot, PCStamp, PCStat, PCSwap, PCTag, PCTitle, PCTurn } from "../../videos/2026-11-05_deadlock-patch-celeste/Patch";
import { DLBoard, DLHero, DLIntro, DLItem, DLMe, DLMeme, DLSwap, DLTip } from "../../videos/2026-11-05_deadlock-patch-celeste/DL";
import { MGCal2, MGHL3Wait, MGNetEase, MGNext2, MGOwner2, MGPoll2, MGPS5, MGSoulBoard, MGSteamBi, MGSurrender } from "../../videos/2026-11-06_deadlock-magia/MG3";
import { MGBig, MGCal, MGClock, MGDrop, MGHook, MGMeme, MGMix, MGNews, MGNext, MGOwner, MGPoll, MGRecord, MGSheet, MGShop, MGShot, MGSouls, MGSteam, MGWait } from "../../videos/2026-11-06_deadlock-magia/Magia";
import { MGArticle, MGChart2, MGFuse, MGHomework, MGHook2, MGItems, MGLocked, MGLogo, MGMagic, MGMixEq, MGMod, MGPunch, MGSteam2, MGSticker } from "../../videos/2026-11-06_deadlock-magia/MG2";
import { RKHook, RKRat, RKSeason, RKSlam, RKPai, RKUp, RKPrint, RKTop, RKLetter, RKNotMe, RKTec, RKPlayer, RKBracket, RKComment, RKPoint, RKCrowd, RKShuffle, RKIgualAMim, RKRules, RKGraph, RKBet, RKFeed, RKShields, RKTopo, RKBans, RKPoints, RKMath, RKFollow, RKSeries, RKBrasil, RKEnd, RKMeme, RKMemeFoto } from "../../videos/2026-11-06_deadlock-ranked/RK";
import { OBHook, OBLogo, OBPatrons, OBRitual, OBPunch } from "../../videos/2026-11-07_deadlock-objetivos/OB";
import { DLMapa } from "../dlmapa";
import { NDHook, NDAsk, NDVs, NDPaths, NDBio, NDLive, NDKing, NDChance, NDCta, NDCommunity, NDComment, NDUrl } from "../../videos/2026-11-08_deadlock-nao-desista/ND";
import { FMHook2, FMBoons2, FMShare2, FMOrb2, FMSeries2, FMTwo2, FMWeak2, FMDeny2, FMRules2, FMHaunted2, FMSecure2, FMDeath2, FMLevel2, FMShop2, FMUrnRules2, FMComeback2, FMPriority2, FMRecap2, FMNext2 } from "../../videos/2026-11-09_deadlock-farm/FM2";
import { CLHook, CLAccept, CLShaco, CLClock, CLElo, CLRobot, CLYears, CLChain, CLSearch, CLLosses, CLChat, CLMigrate, CLMajor, CLEngage, CLInvite, CLMe } from "../../videos/2026-11-09_deadlock-cansei-lol/CL";
import { CLClient, CLReady, CLPick, CLSurrender } from "../../videos/2026-11-09_deadlock-cansei-lol/CL2";
import { CLGrind, CLHistory, CLLocks, CLScore, CLSteam, CLStreak, CLChats, CLParty, CLBracket, CLGraph, CLJoin, CLProfile } from "../../videos/2026-11-09_deadlock-cansei-lol/CL3";
import { LAHook, LAKill, LANot, LALane, LAList, LAWait, LAPick, LASpam, LACalma, LAFight, LAScore, LASouls, LARat, LABuild, LADeath, LAChair, LAUlt } from "../../videos/2026-11-10_deadlock-lash-atrevido/LA";
import { LAOpen, LAKill2, LANot2, LALane2, LAMontage, LASpam2 } from "../../videos/2026-11-10_deadlock-lash-atrevido/LA0";
import { C9Tape, C9Museum, C9Hand, C9Pro, C9Fora, C9Quiet, C9Me, C9Noise, C9Ideia, C9Trofeu, C9Mes, C9Times, C9Live, C9Wanted, C9Path, C9Amigo, C9Perdeu, C9Next, C9Pioneer2 } from "../../videos/2026-11-10_deadlock-cloud9/C9B";
import { C9Open, C9Post, C9Trailer, C9Sign, C9Streak, C9Roster, C9Beta, C9Raca, C9Brasil, C9Champ, C9Recruit, C9Discord, C9Friend, C9Pioneer } from "../../videos/2026-11-10_deadlock-cloud9/C9";
import { FMHook, FMSeries, FMTwo, FMBoons, FMWeak, FMOrb, FMDeny, FMRules, FMShare, FMHaunted, FMSecure, FMDeath, FMLevel, FMShop, FMUrnRules, FMComeback, FMPriority, FMRecap, FMNext } from "../../videos/2026-11-09_deadlock-farm/FM";
import { icons } from "lucide-react";
import { NUCLEO } from "./registry-nucleo";
import { CLINICA } from "./registry-clinica";

import { HLCombineTV, HLDuo, HLFootage, HLHud, HLTitle, HLYear } from "../hl3";
import { HL14Radio } from "../hl3radio";
import { HL15Bye } from "../hl3bye";
import { HL15IronyB } from "../hl3fim";
import { HL15WomanTV } from "../hl3woman";
import { HLUpdateTag } from "../hl3tag";
import { HL15Chapters } from "../hl3chap";
import { HLJump, HLBigText, HLChecklist, HLLambda, HLNotebook, HLPanes, HLPattern, HLProgress, HLStrikeQ, HLTeamMove, HLThree, HLWindowClose, HLYearJump } from "../hl3d";
import { HLCrowbar3D } from "../hl3e3d";
import { HLDarkHit, HLFreezeWait, HLRiftHit, HLSketchbook } from "../hl3e2";
import { HLRiftGman, HLTitleDecode } from "../hl3e4";
import { HLGmanRift3D } from "../hl3e5";
import { HLRiftCollapse, HLTitleSlam } from "../hl3e6";
import { HLHevBoot } from "../hl3e7";
import { HLDarkNebula, HLEmberBeat } from "../hl3e8";
import { WFCrabs, WFNavMesh, WFPhysicsRules, WFShrink, WFTactics, WFWarpPart, WFWorldPull } from "../hl3h";
import { HL25D, HLCombineFeed, HLFly } from "../hl3j";
import { HLHevStatus, HLOverwatchMap, HLRaceMap, HLRuleCard, HLTerminal } from "../hl3k";
import { HLModelTest } from "../hl3m";
import { HLCamp3D } from "../hl3n";
import { HLCamp25D } from "../hl3o";
import { HLPixelCamp } from "../hl3p";
import { HLIsoCamp } from "../hl3q";
import { HLIsoCampHD } from "../hl3r_iso";
import { HLRMemoryFile, HLRThreeDays, HLRQuestions } from "../hl3r";
import { HLRThreeDaysV3, HLRThreeDaysV4, HLRQuestionsParallax } from "../hl3rv";
import { HLRStation } from "../hl3rs";
import { HLRFlickerRoom, HLRFlickerAnchor } from "../hl3rf";
import { HLRAttackReplay } from "../hl3rm";
import { HLRMossman, HLRReport } from "../hl3rmo";
import { HLRHypothesis, HLRCloseData } from "../hl3rh";
import { HLRDesync } from "../hl3rd";
import { HLRForecast, HLRWait } from "../hl3rp";
import { HLRArrive, HLRShipEnter, HLRMaze, HLRObjectives } from "../hl3rb";
import { HLRPhaseRooms, HLRSectorBoard, HLRPhaseMech, HLRXenDoor, HLRRadio, HLRAlyxGuide } from "../hl3rc";
import { HLRProtoAI, HLRCaveTapes, HLRArchMatch, HLRFutureNotes, HLRLapses } from "../hl3re";
import { HLRBigJump, HLRAfterJump } from "../hl3rj";
import { HLRAlyxBetter, HLRStuckBase, HLRBreenPod, HLRHiveMind, HLRHostBodies, HLRBreenRecord, HLRLineage, HLRIrony, HLRBreenLast } from "../hl3r6a";
import { HLRContinueVsSurvive, HLRChoiceUI, HLRAfterBreenCopy, HLRPerpetuityList, HLRCopyRace, HLRAmbushMap, HLRRupture, HLRAftermathCards } from "../hl3r6b";
import { HLRLeakedCoords, HLRAlyxAdvisorRoom, HLRXenRootsParallax, HLRXenFieldGuide, HLRHiveBossFight, HLRObservatory3D } from "../hl3r7a";
import { HLRUniverseTime, HLRVersionsCarve, HLRXenLeakDiagram, HLRCoastTerminal, HLRBarneyBlock, HLRGestureScale, HLRFleetRoute, HLRMaskSlider } from "../hl3r7b";
import { HLRCorruptGrid, HLRCatalystLog, HLRRealTargetCross, HLRBlueprintIncomplete, HLRArcticRaceMap } from "../hl3r8";
import { HL9WarTable, HL9Convoy, HL7KleinerFiles, HL7Leak, HL9Predicted, HL9Overwatch, HL9Radio, HL9SyncPrint, HL9KnowsThem, HL9Orders, HL9ThreeReads, HL9Procedure, HL9Tower, HL9Lab, HL9Signature, HL9Anchor, HL9Replay, HL9Target, HL9Barrage, HL9Silent, HL9UnionNet, HL9SlowRoute, HL10Invasion, HL10EraFlip, HL10Glass, HL10EliPlea, HL10Fight, HL10FightMap, HL10Hand, HL10Agent, HL10Block, HL10Lines, HL10Three, HL10Rhythm, HL10CoreRun, HL11Deep, HL11State, HL11Board, HL11Choice, HL11Align, HL12Weapon, HL12Holds, HL12Varga, HL12Door, HL12Employers, HL12Conv, HL12Mist, HL12Price, HL12Room, HL12Last, HL13Call, HL13Redirect, HL13Removal, HL13Free, HL13Victory, HL13Shot, HL13Freeze, HL13Board, HL13Future, HL13Ladder, HL13Union, HL13Ascend, HL13Leave, HL14Collapse, HL14Escape, HL14Arctic, HL14Varga, HL14Advisors, HL14Glitch, HL14Snow, HL14VortWorld, HL15Ideas, HL15Woman, HL15Irony, HL15Wish, HL15Outro, HL4WoundField, HL4Visions, HL4Lapses, HL4VortSight } from "../hl3r9";
import { HLAPhaseRooms, HLATestChamber, HLACaveVideo, HLAArchCompare, HLAAlyxAfter, HLAHostBodies, HLABreenRecord, HLACaveRecall, HLAGladosPlan, HLAPerpPod, HLAAmbush, HLACoastArrive } from "../hl3ap";
import { HLXFootage, HLXChoice, HLXPod, HLXControlRoom, HLXXenFall, HLXHive, HLXObservatory, HLXLapseJump, HLXRiftRuins, HLXCoastTerminal, HLXCellBlock, HLXInterrogation, HLXXenRift, HLXBreenLast, HLXCaveLab, HLXObjective, HLXPhaseMech, HLXIrony, HLXUplink } from "../hl3rx";
import { HLWGuide, HLWStuckBase, HLWCaveFiles, HLWArchSplit, HLWAlyxBetter, HLWShu, HLWBreenRecord, HLWPerpPoster, HLWFieldGuide, HLWLeak, HLWFleetRun, HLWMask, HLWKleinerCrt, HLWCatalyst, HLWBlueprint, HLWArcticRace, HLWAftermath, HLWLeakCoords, HLWPerpetuity } from "../hl3rw";
import { HLSpriteLab } from "../hl3s";
import { HL9Barrage3D, HL9Silent3D } from "../hl3r9s";
import { HLAdvisorProbe, HLCorrProbe, HLArmProbe, HLModelSnap, HLStriderProbe, HLVortProbe } from "../hl3r11";
import { HL10AgentRun, HL10BlockRun, HL10LinesRun, HL10ThreeRun } from "../hl3r12";
import { HL14VortScan } from "../hl3r15";
import { HL10Pattern } from "../hl3r16";
import { HL13FutureScan } from "../hl3r17";
import { HL13FutureWorld } from "../hl3r18";
import { HL13Continuity, HLUnionContact } from "../hl3r19";
import { HL13Parallel } from "../hl3r21";
import { HL13LeaveCity } from "../hl3r22";
import { HL14ArcticFlat } from "../hl3r27";
import { HL14VargaFlat, HL14GlitchFlat } from "../hl3r28";
import { HL14SnowFlat } from "../hl3r29";
import { HL14VortWorldFlat } from "../hl3r30";
import { HLRWaitFlat, HLRArriveFlat } from "../hl3r31";
import { HL14ArcticShots, HL13BoardX, HL13Future3D, HL15WishS, HL9Tower3D, HL13Leave3D, HL14Arctic3D, HL14Varga3D, HL14Snow3D, HL14VortWorld3D } from "../hl3r14";
import { HL11BoardS, HL11ChoiceS, HL12WeaponS, HL12HoldsS, HL12VargaS, HL12DoorS, HL12EmployersS, HL12ConvS, HL12MistS, HL12PriceS, HL12RoomS, HL12LastS } from "../hl3r13";
import { HL9SlowRoute3D, HL10Invasion3D } from "../hl3r10c";
import { HLVortLab } from "../hl3v";
import { HLArchive, HLHevScan, HLThermalAlyx, HLThermalCamp, HLThermalPatrol } from "../hl3t";
import { HLHunterLab, HLWarTable } from "../hl3w";
import { HLBadgeBench, HLWarMap2D } from "../hl3x";
import { HLAlyxTelemetry, HLMemoryGap, HLRadioCode, HLReunion, HLSeaRoute, HLMemoryTape, HLAlyxSigns, HLReunionReal, HLReunionHev, HLHeliRoute, HLMineSection, HLWoundScan, HLVisions, HLLapses, HLFogAhead, HLTwoProblems, HLTwoClocks, HLGmanTrade, HLWoundField, HLVortSight, HLTwoSignals } from "../hl3y";
import { HLStationScan, HLFlickerFirst, HLFlickerAnchor, HLAttackReplay, HLMossmanFound, HLShortManifest, HLCloseData, HLOverlap, HLSameShip, HLForecast, HLBorealisArrive, HLMemoryChain, HLQuestionShift, HLEchoHypothesis, HLTimeDesync, HLBorealisEnter, HLAlyxKnows, HLObjectiveShift, HLPhaseRooms, HLSectorEras, HLPhaseMechanics, HLXenDoor, HLRadioDesync, HLAlyxRecognizes, HLGladosProto, HLCaveFiles, HLArchMatch, HLFutureNotes, HLLapseLoop, HLBigJump, HLAfterJump, HLAlyxBetter, HLCombineBase, HLBreenPod, HLPerpetuity, HLDataCopy, HLAmbush, HLRupture2, HLAftermath, HLLeakedCoords, HLAlyxAdvisor, HLXenRoots, HLXenBestiary, HLHiveBoss, HLObservatory, HLUniverseVsTime, HLVersionsWall, HLXenLeak, HLCoastOrders, HLBarneyCell, HLGesture, HLFleetFiles, HLMemoryOrbit, HLStuckBase, HLBreenRemains, HLBreenLast, HLBreenChoice, HLCorruptFiles, HLCatalystWord, HLRealTarget, HLBlueprint, HLArcticRace, HLManifestPath, HLConvoy, HLPredicted, HLInterceptAlyx, HLAlyxTimeline, HLKnowsThem, HLStrangeOrders, HLThreeReads, HLProcedureLoop, HLTowerAssault, HLTemporalScans, HLSignatureMatch, HLCoreAnchor, HLRewind, HLTargetCore, HLBarrage, HLSilentDays, HLStateBack, HLSlowRoute, HLBreengrub, HLHiveMind, HLHostBodies, HLBreenRecord, HLCaveLineage, HLIrony, HLContinueVsSurvive, HLAfterBreen, HLMaskGlue, HLInvasion, HLEraFlip, HLAlteredSeq, HLCaught, HLEliPlea, HLAdvisorFight, HLHandOffer, HLAgentInside, HLBlockBreak, HLLinesTraversal, HLThreeConverge, HLRhythm, HLCoreRun, HLUnionNet, HLDeepCore, HLCatalystState, HLTimeBoard, HLChoiceExists, HLAlignStart, HLWeaponReveal, HLWhoHolds, HLVargaQ, HLBeliefDoor, HLEmployers, HLConvergence, HLMistLimit, HLNobodyKnows, HLPrice, HLChoiceRoom, HLCommentCall, HLFinalTitle, HLMemeCut, HLRedirect, HLRemoval, HLFreeEarth, HLVictoryWalk, HLVargaShot, HLGmanFreeze, HLParticipants, HLFutureRun, HLContinuityLadder, HLNewUnion, HLAscension, HLParallelLines, HLTramEnding, HLLastStep, HLCoreCollapse, HLObjectivesFail, HLArcticUnravel, HLVargaSnow, HLAdvisorsStop, HLBlackSwan, HLGmanGlitch, HLRadioGoodbye, HLPortalReunion, HLVortWorld, HLSimpleIdeas, HLMysteryWoman, HLMirrorIrony, HLWishList, HLOutroComment } from "../hl3z";
import { HLWindow } from "../hl3u";
import { HLAdvantage, HLCombineScan, HLCountdown, HLDossierVarga, HLManifest, HLQuote, HLRace, HLTopoRoute, HLTundra, HLWound } from "../hl3l";
import { HLFundamentos, HLTitleBuild, WFBorealisRules, WFDock, WFDoorStates, WFMerge, WFMorphWalk, WFParadox, WFPillars, WFShipRoom } from "../hl3i";
import { HLNoChoice, WFConsequence, WFLivingRoom, WFLoop, WFManyWays, WFMarks, WFMemory, WFOldWay, WFRoomSystem, WFRules, WFThreeSystems, WFTrails, WFTwoStates } from "../hl3g";
import { HLDossiers, HLLaterCards, WFHands, WFGamepad, WFHeadset, WFInside, WFPhysics, WFTwoThree, WFVerbs, WFWarpRoom } from "../hl3f";
import { HLBuildHit, HLSlamWord, HLChatWhy, HLDiary, HLDoors, HLLambdaOut, HLSameQuestion, HLSplitVersions } from "../hl3e";
import { HLImpact, HLDayCounter, HLDecrypt, HLHopium2, HLNada, HLQuestionsHud, HLSplitEli, HLSteamMachine2, HLTimelineHLX } from "../hl3c";
import { HLBackWords, HLBorn, HLClock, HLCode, HLCompare, HLConverge, HLHopium, HLIcons, HLPrints, HLQuestions, HLRepeat, HLShatter, HLSteamMachine, HLTimeBack, HLVariable } from "../hl3b";
// Cenas que o edit.json pode usar, pelo nome. Cena genérica nova: registry-nucleo.tsx; do nicho clínica:
// registry-clinica.tsx; de um vídeo ou projeto só (HL3, GTA, Jones…): aqui.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCENES: Record<string, React.FC<any>> = {
  ...NUCLEO, // biblioteca genérica (registry-nucleo.tsx)
  ...CLINICA, // cenas do nicho clínica (registry-clinica.tsx)
  // Motim · tipografia cinética + mockups (GTA 6, 26/10)
  // Motim · série GTA 6, ep. 1: detalhes do trailer (26/10)
  // Motim · série GTA 6, ep. 2: Miami vira Vice City (27/10)
  // Motim · série GTA 6, ep. 3: quanto a Rockstar paga (28/10)
  // Motim · série GTA 6, ep. 5: jeito de jogar (30/10)
  // Motim · série GTA 6, ep. 4: cervejas do jogo (29/10)
  // Motim · curiosidade: paralisia do sono (28/10)
  RRBg, RRShot, RRReddit, RRSticker, RRSpinTrans, // Short de meme Deadlock: Rei dos Ratos, estilo Laestro (28/10)
  HWBg, HWShot, HWTitle, HWOdds, HWDate, HWStamp, HWStun, // Short de meme Deadlock: atualização de Halloween, estilo Laestro (31/10)
  CLHook, CLAccept, CLShaco, CLClock, CLElo, CLRobot, CLYears, CLChain, CLSearch, CLLosses, CLChat, CLMigrate, CLMajor, CLEngage, CLInvite, CLMe, CLGrind, CLHistory, CLLocks, CLScore, CLSteam, CLStreak, CLChats, CLParty, CLBracket, CLGraph, CLJoin, CLProfile, // Deadlock · Cansei do LoL
  LAHook, LAKill, LANot, LALane, LAList, LAWait, LAPick, LASpam, LACalma, LAFight, LAScore, LASouls, LARat, LABuild, LADeath, LAChair, LAUlt, LAOpen, LAKill2, LANot2, LALane2, LAMontage, LASpam2, // Deadlock · Lash atrevido
  // GTA 6 no PC (= v2 trash/memes/UI do GTA)
  C9Open, C9Post, C9Trailer, C9Sign, C9Streak, C9Roster, C9Beta, C9Raca, C9Brasil, C9Champ, C9Recruit, C9Discord, C9Friend, C9Pioneer, // Deadlock · Cloud9
  C9Tape, C9Museum, C9Hand, C9Pro, C9Fora, C9Quiet, C9Me, C9Noise, C9Ideia, C9Trofeu, C9Mes, C9Times, C9Live, C9Wanted, C9Path, C9Amigo, C9Perdeu, C9Next, C9Pioneer2, // Cloud9 2ª metade (10/11)
  CLClient, CLReady, CLPick, CLSurrender, // Cansei do LoL v2 (cliente do LoL)
  PCShot, PCTitle, PCHero, PCAbility, PCStat, PCStamp, PCSwap, PCCooldown, PCHealbane, PCBoard, PCTurn, PCTag, DLTip, DLSwap, DLItem, DLHero, DLBoard, DLMeme, DLIntro, DLMe, MGShot, MGMeme, MGHook, MGSteam, MGRecord, MGShop, MGDrop, MGNews, MGMix, MGSheet, MGClock, MGSouls, MGOwner, MGBig, MGCal, MGWait, MGNext, MGPoll, MGHomework, MGSurrender, MGSoulBoard, MGOwner2, MGPS5, MGSteamBi, MGCal2, MGNetEase, MGHL3Wait, MGNext2, MGPoll2, MGPunch, MGLogo, MGHook2, MGSteam2, MGChart2, MGSticker, MGLocked, MGMod, MGArticle, MGMagic, MGFuse, MGItems, MGMixEq, RKHook, RKRat, RKSeason, RKSlam, RKPai, RKUp, RKPrint, RKTop, RKLetter, RKNotMe, RKTec, RKPlayer, RKBracket, RKComment, RKPoint, RKCrowd, RKShuffle, RKIgualAMim, RKRules, RKGraph, RKBet, RKFeed, RKShields, RKTopo, RKBans, RKPoints, RKMath, RKFollow, RKSeries, RKBrasil, RKEnd, RKMeme, RKMemeFoto, OBHook, OBLogo, OBPatrons, OBRitual, OBPunch, DLMapa, NDHook, NDAsk, NDVs, NDPaths, NDBio, NDLive, NDKing, NDChance, NDCta, NDCommunity, NDComment, NDUrl, FMHook, FMSeries, FMTwo, FMBoons, FMWeak, FMOrb, FMDeny, FMRules, FMShare, FMHaunted, FMSecure, FMDeath, FMLevel, FMShop, FMUrnRules, FMComeback, FMPriority, FMRecap, FMNext, FMHook2, FMBoons2, FMShare2, FMOrb2, FMSeries2, FMTwo2, FMWeak2, FMDeny2, FMRules2, FMHaunted2, FMSecure2, FMDeath2, FMLevel2, FMShop2, FMUrnRules2, FMComeback2, FMPriority2, FMRecap2, FMNext2, // Deadlock: patch 11-04, bronca na Celeste (05/11)
  // Motim · line motion roxo (quarto mandato, 26/10)
  // edit de música Lula + Jones Manoel (colagem da referência, 26/10)
  // edit "Ele avisou" (Jones Manoel, 26/10)
  // edit "2030" (Jones Manoel, 26/10)
  // corte Fome de Futuro 2030 (Jones, 27/10)
  // edit "Jones x Nikolas" (26/10)
  // Motim · debate com checagem (23/10)
  // HL3 · promos verticais (08/11)
  // HL3 · promo 2
  // HL3 · promo 3
  // HL3 · promo 4
  // HL3 · promo 5
  // Frank Ocean · Blonde (guache)
  HLHud,
  HLYear,
  HLFootage,
  HLCombineTV,
  HL14Radio, // 05/11: as despedidas pelo rádio (no lugar da TV)
  HL15Bye, // 05/11: a despedida gravada, na nebulosa roxa
  HLDuo,
  HLBackWords,
  HLDayCounter,
  HLImpact,
  HLBigText,
  HLJump,
  HLChecklist,
  HLLambda,
  HLNotebook,
  HLPanes,
  HLPattern,
  HLProgress,
  HLStrikeQ,
  HLTeamMove,
  HLThree,
  HLWindowClose,
  HLYearJump,
  HLDecrypt,
  HLHopium2,
  HLNada,
  HLQuestionsHud,
  HLSplitEli,
  HLSteamMachine2,
  HLTimelineHLX,
  HLLambdaOut,
  HLBuildHit,
  HLCrowbar3D,
  HLSlamWord,
  HLSketchbook,
  HLFreezeWait,
  HLDarkHit,
  HLRiftHit,
  HLRiftGman,
  HLTitleDecode,
  HLGmanRift3D,
  HLRiftCollapse,
  HLTitleSlam,
  HLHevBoot,
  HLEmberBeat,
  HLDarkNebula,
  WFGamepad,
  WFInside,
  WFPhysics,
  WFHeadset,
  WFVerbs,
  WFHands,
  WFTwoThree,
  HLLaterCards,
  HLDossiers,
  WFRoomSystem,
  WFOldWay,
  WFManyWays,
  WFRules,
  WFMemory,
  HLNoChoice,
  WFConsequence,
  WFTrails,
  WFLivingRoom,
  WFTwoStates,
  WFLoop,
  WFMarks,
  WFThreeSystems,
  WFNavMesh,
  WFTactics,
  WFCrabs,
  WFPhysicsRules,
  WFWarpPart,
  WFWorldPull,
  WFShrink,
  WFDock,
  WFShipRoom,
  WFDoorStates,
  WFMorphWalk,
  WFMerge,
  WFPillars,
  WFParadox,
  WFBorealisRules,
  HLFundamentos,
  HLTitleBuild,
  HL25D,
  HLCombineFeed,
  HLFly,
  HLHevStatus,
  HLOverwatchMap,
  HLTerminal,
  HLRuleCard,
  HLCountdown,
  HLModelTest,
  HLCamp3D,
  HLCamp25D,
  HLPixelCamp,
  HLIsoCamp,
  HLIsoCampHD,
  HLRMemoryFile,
  HLRThreeDaysV3,
  HLRThreeDaysV4,
  HLRThreeDays,
  HLRQuestions,
  HLSpriteLab,
  HLVortLab,
  HLThermalCamp,
  HLThermalPatrol,
  HLArchive,
  HLHevScan,
  HLWarTable,
  HLWarMap2D,
  HLReunion,
  HLMemoryGap,
  HLRadioCode,
  HLAlyxTelemetry,
  HLSeaRoute,
  HLMemoryTape,
  HLAlyxSigns,
  HLReunionReal,
  HLReunionHev,
  HLHeliRoute,
  HLMineSection,
  HLWoundScan,
  HLVisions: HL4Visions,
  HLLapses: HL4Lapses,
  HLAPhaseRooms,
  HLACoastArrive,
  HLAAmbush,
  HLAPerpPod,
  HLAGladosPlan,
  HLACaveRecall,
  HLABreenRecord,
  HLAHostBodies,
  HLAAlyxAfter,
  HLAArchCompare,
  HLACaveVideo,
  HLATestChamber,
  HLFogAhead,
  HLTwoProblems,
  HLTwoClocks,
  HLGmanTrade,
  HLWoundField: HL4WoundField,
  HLVortSight: HL4VortSight,
  HLTwoSignals,
  HLStationScan,
  HLFlickerFirst,
  HLFlickerAnchor,
  HLAttackReplay,
  HLMossmanFound,
  HLShortManifest,
  HLCloseData,
  HLOverlap,
  HLSameShip,
  HLForecast,
  HLBorealisArrive,
  HLMemoryChain,
  HLQuestionShift,
  HLRQuestionsParallax,
  HLRStation,
  HLRFlickerRoom,
  HLRFlickerAnchor,
  HLRAttackReplay,
  HLRMossman,
  HLRReport,
  HLRHypothesis,
  HLRCloseData,
  HLRDesync,
  HLRForecast,
  HLRWait: HLRWaitFlat,
  HLRArrive: HLRArriveFlat,
  HLRShipEnter,
  HLRMaze,
  HLRObjectives,
  HLRPhaseRooms,
  HLRSectorBoard,
  HLRPhaseMech,
  HLRXenDoor,
  HLRRadio,
  HLRAlyxGuide,
  HLRProtoAI,
  HLRCaveTapes,
  HLRArchMatch,
  HLRFutureNotes,
  HLRLapses,
  HLRBigJump,
  HLRAfterJump,
  HLRAlyxBetter,
  HLRStuckBase,
  HLRBreenPod,
  HLRHiveMind,
  HLRHostBodies,
  HLRBreenRecord,
  HLRLineage,
  HLRIrony,
  HLRBreenLast,
  HLRContinueVsSurvive,
  HLRChoiceUI,
  HLRAfterBreenCopy,
  HLRPerpetuityList,
  HLRCopyRace,
  HLRAmbushMap,
  HLRRupture,
  HLRAftermathCards,
  HLRLeakedCoords,
  HLRAlyxAdvisorRoom,
  HLRXenRootsParallax,
  HLRXenFieldGuide,
  HLRHiveBossFight,
  HLRObservatory3D,
  HLRUniverseTime,
  HLRVersionsCarve,
  HLRXenLeakDiagram,
  HLRCoastTerminal,
  HLRBarneyBlock,
  HLRGestureScale,
  HLRFleetRoute,
  HLRMaskSlider,
  HLRCorruptGrid,
  HLRCatalystLog,
  HLRRealTargetCross,
  HLRBlueprintIncomplete,
  HLRArcticRaceMap,
  HLXFootage,
  HLXRiftRuins,
  HLXCoastTerminal,
  HLXCellBlock,
  HLXInterrogation,
  HLXXenRift,
  HLXBreenLast,
  HL9WarTable,
  HL9Convoy,
  HL7KleinerFiles,
  HL7Leak,
  HL9Predicted,
  HL9Overwatch,
  HL9Radio,
  HL9SyncPrint,
  HL9KnowsThem,
  HL9Orders,
  HL9ThreeReads,
  HL9Procedure,
  HL9Tower: HL9Tower3D,
  HL9Lab,
  HL9Signature,
  HL9Anchor,
  HL9Replay,
  HL9Target,
  // 10/10: o ataque e a volta do Borealis em 3D de verdade (three.js); os antigos em SVG ficam no hl3r9
  HLAdvisorProbe,
  HLCorrProbe,
  HLArmProbe,
  HLModelSnap,
  HLStriderProbe,
  HLVortProbe,
  HL9Barrage: HL9Barrage3D,
  HL9Silent: HL9Silent3D,
  HL9UnionNet,
  HL9SlowRoute: HL9SlowRoute3D,
  HL10Invasion: HL10Invasion3D,
  HL10EraFlip,
  HL10Glass: HL10Pattern,
  HL10EliPlea,
  HL10Fight: HL10FightMap,
  HL10Hand,
  // 12/10: 1:12:36 → 1:15:16 reformulado — a corrida com as telas de parede (hl3r12); os antigos ficam no hl3r9
  HL10Agent: HL10AgentRun,
  HL10Block: HL10BlockRun,
  HL10Lines: HL10LinesRun,
  HL10Three: HL10ThreeRun,
  HL10Rhythm,
  HL10CoreRun,
  HL11Deep,
  HL11State,
  HL11Board: HL11BoardS,
  HL11Choice: HL11ChoiceS,
  HL11Align,
  HL12Weapon: HL12WeaponS,
  HL12Holds: HL12HoldsS,
  HL12Varga: HL12VargaS,
  HL12Door: HL12DoorS,
  HL12Employers: HL12EmployersS,
  HL12Conv: HL12ConvS,
  HL12Mist: HL12MistS,
  HL12Price: HL12PriceS,
  HL12Room: HL12RoomS,
  HL12Last: HL12LastS,
  HL13Call,
  HL13Redirect,
  HL13Removal,
  HL13Free,
  HL13Victory,
  HL13Shot,
  HL13Freeze,
  HL13Board: HL13BoardX,
  // 30/10: o POV parado olhando uma região só (o vale andando saiu; HL13FutureScan fica de reserva)
  HL13Future: HL13FutureWorld,
  HL13FutureScanOld: HL13FutureScan,
  // 30/10: a busca pela continuidade sem a cápsula/larva (o HL13Ladder antigo fica de reserva)
  HL13Ladder: HL13Continuity,
  HLUnionContact,
  HL13Parallel,
  HL13LadderOld: HL13Ladder,
  HL13Union,
  HL13Ascend,
  HL13Leave: HL13LeaveCity,
  HL13Leave3DOld: HL13Leave3D,
  HL14Collapse,
  HL14Escape,
  HL14Arctic: HL14ArcticFlat,
  HL14Varga: HL14VargaFlat,
  HL14Advisors,
  HL14Glitch: HL14GlitchFlat,
  HL14Snow: HL14SnowFlat,
  HL14VortWorld: HL14VortWorldFlat,
  HL15Ideas,
  HL15Woman: HL15WomanTV, // 05/11: a cena real de HL:Alyx na TV de tubo 3D
  HL15Irony: HL15IronyB, // 05/11: o espelho (refeito)
  HL15Wish: HL15Chapters, // 05/11: o final digno como seleção de capítulos (antes HL15WishS)
  HL15Outro,
  HLXCaveLab,
  HLXObjective,
  HLXPhaseMech,
  HLXIrony,
  HLXUplink,
  HLWAftermath,
  HLWLeakCoords,
  HLWPerpetuity,
  HLWFleetRun,
  HLWMask,
  HLWKleinerCrt,
  HLWCatalyst,
  HLWBlueprint,
  HLWArcticRace,
  HLXLapseJump,
  HLWGuide,
  HLWStuckBase,
  HLWCaveFiles,
  HLWArchSplit,
  HLWAlyxBetter,
  HLWShu,
  HLWBreenRecord,
  HLWPerpPoster,
  HLWFieldGuide,
  HLWLeak,
  HLXObservatory,
  HLXHive,
  HLXXenFall,
  HLXControlRoom,
  HLXPod,
  HLXChoice,
  HLEchoHypothesis,
  HLTimeDesync,
  HLBorealisEnter,
  HLAlyxKnows,
  HLObjectiveShift,
  HLPhaseRooms,
  HLSectorEras,
  HLPhaseMechanics,
  HLXenDoor,
  HLRadioDesync,
  HLAlyxRecognizes,
  HLGladosProto,
  HLCaveFiles,
  HLArchMatch,
  HLFutureNotes,
  HLLapseLoop,
  HLBigJump,
  HLAfterJump,
  HLAlyxBetter,
  HLCombineBase,
  HLBreenPod,
  HLStuckBase,
  HLBreenRemains,
  HLBreenLast,
  HLBreenChoice,
  HLCorruptFiles,
  HLCatalystWord,
  HLRealTarget,
  HLBlueprint,
  HLArcticRace,
  HLManifestPath,
  HLConvoy,
  HLPredicted,
  HLInterceptAlyx,
  HLAlyxTimeline,
  HLKnowsThem,
  HLStrangeOrders,
  HLThreeReads,
  HLProcedureLoop,
  HLTowerAssault,
  HLTemporalScans,
  HLSignatureMatch,
  HLCoreAnchor,
  HLRewind,
  HLTargetCore,
  HLBarrage,
  HLSilentDays,
  HLStateBack,
  HLSlowRoute,
  HLBreengrub,
  HLHiveMind,
  HLHostBodies,
  HLBreenRecord,
  HLCaveLineage,
  HLIrony,
  HLContinueVsSurvive,
  HLAfterBreen,
  HLMaskGlue,
  HLInvasion,
  HLEraFlip,
  HLAlteredSeq,
  HLCaught,
  HLEliPlea,
  HLAdvisorFight,
  HLHandOffer,
  HLAgentInside,
  HLBlockBreak,
  HLLinesTraversal,
  HLThreeConverge,
  HLRhythm,
  HLCoreRun,
  HLUnionNet,
  HLDeepCore,
  HLCatalystState,
  HLTimeBoard,
  HLChoiceExists,
  HLAlignStart,
  HLWeaponReveal,
  HLWhoHolds,
  HLVargaQ,
  HLBeliefDoor,
  HLEmployers,
  HLConvergence,
  HLMistLimit,
  HLNobodyKnows,
  HLPrice,
  HLChoiceRoom,
  HLCommentCall,
  HLFinalTitle,
  HLMemeCut,
  HLRedirect,
  HLRemoval,
  HLFreeEarth,
  HLVictoryWalk,
  HLVargaShot,
  HLGmanFreeze,
  HLParticipants,
  HLFutureRun,
  HLContinuityLadder,
  HLNewUnion,
  HLAscension,
  HLParallelLines,
  HLTramEnding,
  HLLastStep,
  HLCoreCollapse,
  HLObjectivesFail,
  HLArcticUnravel,
  HLVargaSnow,
  HLAdvisorsStop,
  HLBlackSwan,
  HLGmanGlitch,
  HLRadioGoodbye,
  HLPortalReunion,
  HLVortWorld,
  HLSimpleIdeas,
  HLMysteryWoman,
  HLMirrorIrony,
  HLWishList,
  HLOutroComment,
  HLPerpetuity,
  HLDataCopy,
  HLAmbush,
  HLRupture2,
  HLAftermath,
  HLLeakedCoords,
  HLAlyxAdvisor,
  HLXenRoots,
  HLXenBestiary,
  HLHiveBoss,
  HLObservatory,
  HLUniverseVsTime,
  HLVersionsWall,
  HLXenLeak,
  HLCoastOrders,
  HLBarneyCell,
  HLGesture,
  HLFleetFiles,
  HLMemoryOrbit,
  HLThermalAlyx,
  HLBadgeBench,
  HLHunterLab,
  HLWindow,
  HLRaceMap,
  HLTopoRoute,
  HLManifest,
  HLDossierVarga,
  HLQuote,
  HLWound,
  HLCombineScan,
  HLAdvantage,
  HLRace,
  HLTundra,
  WFWarpRoom,
  HLChatWhy,
  HLSplitVersions,
  HLDoors,
  HLDiary,
  HLSameQuestion,
  HLBorn,
  HLClock,
  HLCode,
  HLCompare,
  HLConverge,
  HLHopium,
  HLIcons,
  HLPrints,
  HLQuestions,
  HLRepeat,
  HLShatter,
  HLSteamMachine,
  HLTimeBack,
  HLVariable,
  HLTitle,
  HLUpdateTag, // 06/11: tag de correção por cima da cena ("já saiu")
};

// tempo em segundos no edit.json: `at`, `at1`, `...At`, `...At2` e `dur` (o `dropAt2` e o `at1` ficavam em quadros)
const isTimeKey = (k: string) => /^at\d*$/.test(k) || /At\d*$/.test(k) || k === "dur";

// Converte as props do edit.json (segundos relativos, ícone por nome) para o que
// os componentes esperam (frames relativos, componente lucide).
export const toComponentProps = (v: unknown, fps: number, key = ""): unknown => {
  if (Array.isArray(v)) return v.map((x) => toComponentProps(x, fps));
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = toComponentProps(x, fps, k);
    return o;
  }
  if (typeof v === "number" && isTimeKey(key)) return Math.round(v * fps);
  if (typeof v === "string" && key === "icon") {
    const I = (icons as Record<string, unknown>)[v];
    if (!I) throw new Error(`ícone "${v}" não existe no lucide-react`);
    return I;
  }
  return v;
};
