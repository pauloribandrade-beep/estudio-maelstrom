// edit.json: tudo o que o Paulo ajusta no editor, separado do código.
// TEMPOS em SEGUNDOS da EDIÇÃO (o relógio do vídeo final, 0 = primeiro frame).
// Dentro de `props` de uma cena, os tempos são RELATIVOS ao início da cena
// (chaves `at`, `...At`, `dur`), para a cena poder ser arrastada inteira.

export type SoundClip = {
  id: string;
  src: string; // caminho em public/, ex.: "sfx/pop_3.wav"
  start: number; // s
  vol: number; // 0 a 1
  dur?: number; // s tocados (padrão: o arquivo inteiro)
  trim?: number; // s cortados do começo do arquivo
  fadeIn?: number; // s
  fadeOut?: number; // s
  label?: string;
  scene?: string; // id da cena que gerou o som (só informativo)
  muted?: boolean;
  track?: string; // id da trilha de som (soundTracks)
  fx?: SoundFx; // efeitos do painel Som > Efeitos
  fxSrc?: string; // arquivo já processado com `fx` (sfx/_fx/...); toca no lugar de `src`
};

// reverb 0-100 (%), room = tamanho da sala em s (1, 2, 4, 8), lowcut/highcut em Hz (0 = desligado)
// speed = velocidade (0,25 a 4); keepPitch = mantém o tom (senão muda como fita);
// reverse = toca ao contrário; eqLow/eqMid/eqHigh = equalizador em dB (grave 120 Hz, médio 1 kHz, agudo 8 kHz)
export type SoundFx = { reverb?: number; room?: number; normalize?: boolean; lowcut?: number; highcut?: number; reverse?: boolean; eqLow?: number; eqMid?: number; eqHigh?: number; speed?: number; keepPitch?: boolean };

// Trilhas de som (como no CapCut): cada som mora numa trilha; a trilha tem nome, mudo e volume.
export type SoundTrack = { id: string; name: string; muted?: boolean; vol?: number };

export type Keyframe = { t: number; x?: number; y?: number; scale?: number; opacity?: number; ease?: [number, number, number, number] };

export type SceneClip = {
  id: string;
  type: string; // nome do componente (BigType, VectorFace, Stamp...)
  start: number;
  end: number;
  lane?: number; // 0 = cena principal, 1 = sobreposição (carimbo, cursor)
  label?: string;
  props: Record<string, unknown>;
  keys?: Keyframe[]; // etapa 3 (posição/escala/opacidade da cena inteira)
  enter?: "whip-left" | "whip-right" | "zoom" | "drop" | "flash"; // transição de entrada (varia o ritmo)
};

export type CapWord = { word: string; start: number; end: number; said?: string }; // said: palavra falada errada (a legenda risca e corrige)

export type ZoomSnap = { t: number; z: number };
export type ZoomPush = { t: number; z: number; up?: number; until: number | "end"; down?: number };

// Trilha de voz: efeitos aplicados no áudio da gravação (arquivo tratado em `src`,
// mesma linha do tempo da gravação) + ganho e fades do vídeo inteiro.
export type VoiceFx = { normalize?: boolean; denoise?: boolean; highpass?: boolean; compress?: boolean; reverb?: number; room?: number; breaths?: number; deess?: number };
export type VoiceTrack = { src?: string; fx?: VoiceFx; gain?: number; fadeIn?: number; fadeOut?: number; cont?: boolean; engine?: boolean }; // cont: só na prévia (voz contínua já cortada) · engine: a voz toca fora do Remotion (estudio/voiceEngine.ts)

// Marcador (tecla M no Estúdio): um ponto da edição com uma nota ("tirar o vá"). O Claude lê a lista.
export type Marker = { id: string; t: number; note: string; done?: boolean };

export type EditDoc = {
  version: 1;
  slug: string;
  comp?: string; // composição do Remotion que renderiza este edit.json (ex.: "PacienteEdit")
  // "wide": vídeo horizontal 1920x1080 só com a voz (projeto Half-Life 3). Sem apresentador, sem legenda,
  // cenas em tela cheia sobre o fundo do `hl3.tsx`. Sem o campo: Reels vertical de sempre.
  format?: "reel" | "wide";
  orient?: "vertical"; // formato wide em pé (1080x1920): vídeo só com voz em Reels (Motim, debate 23/10)
  space?: { freezeAt?: number; jumpAt?: number }; // formato wide: a viagem pelo espaço congela nesse segundo
  noSpace?: boolean; // formato wide horizontal SEM o fundo espacial do HL3 (Frank Ocean · Blonde)
  fps: number;
  duration: number; // s (vídeo inteiro, com o outro)
  video: { src: string; fit?: { scale: number; top: number }; handle?: string; preview?: string; cut?: string }; // preview: prévia do Estúdio · cut: vídeo contínuo de alta qualidade (render)
  captions: { y: number; size: number; groupSize?: number; hot: string[]; words: CapWord[] };
  zoom: { snaps: ZoomSnap[]; pushes: ZoomPush[] };
  scenes: SceneClip[];
  sounds: SoundClip[];
  soundTracks?: SoundTrack[];
  voice?: VoiceTrack;
  markers?: Marker[];
  // layout vivo (live-layout.tsx): trechos em que a tela sai do split; fora deles é split
  layouts?: { id?: string; start: number; end: number; mode: "full" | "pip" }[];
};
