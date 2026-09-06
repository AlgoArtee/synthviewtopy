// Adapted from the user-owned MizuTopia project (NatureSimTopy/MizuTopia/src).
// Keep the shared surf model and Cygnus animation in sync when updating the source.
export type StageId = 'beach' | 'shelf' | 'openOcean' | 'abyss';
export type WeatherId = 'clear' | 'overcast' | 'rain' | 'storm';
export type TimeOfDayId = 'noon' | 'sunset' | 'twilight' | 'night';
export type QualityId = 'low' | 'balanced' | 'cinematic';
export type SkySystemId = 'gargantua' | 'cygnusX1';
export type MillerPhase = 'inactive' | 'approaching' | 'impact' | 'receding' | 'recovering';

export interface Vec3Data {
  x: number;
  y: number;
  z: number;
}

export interface StageDefinition {
  id: StageId;
  name: string;
  shortName: string;
  position: Vec3Data;
  yaw: number;
  nominalFloorDepth: number;
}

export interface OceanSettings {
  waveHeight: number;
  weather: WeatherId;
  timeOfDay: TimeOfDayId;
  quality: QualityId;
  skySystem: SkySystemId;
  flashlight: boolean;
  metallicBeach: boolean;
}

export interface PlayerState {
  position: Vec3Data;
  velocity: Vec3Data;
  yaw: number;
  pitch: number;
  underwater: boolean;
  stage: StageId;
  recovering: boolean;
}

export interface MillerWaveState {
  phase: MillerPhase;
  active: boolean;
  time: number;
  crestX: number;
  originX: number;
  distanceToPlayer: number;
  impactStrength: number;
  recoveryProgress: number;
  recoveryY: number;
}

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => void;
  }
}
