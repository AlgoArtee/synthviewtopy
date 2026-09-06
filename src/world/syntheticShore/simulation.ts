// Adapted from the user-owned MizuTopia project (NatureSimTopy/MizuTopia/src).
// Keep the shared surf model and Cygnus animation in sync when updating the source.
import type { MillerPhase, MillerWaveState, StageDefinition, StageId, WeatherId } from './types';
import { SHORE_BLEND_END, SHORE_BLEND_START, sampleShoreSurface, shoreGLSL, type ShoreSurfaceSample } from './shore';

export const STAGES: Record<StageId, StageDefinition> = {
  beach: {
    id: 'beach',
    name: 'Littoral Edge',
    shortName: 'BEACH',
    position: { x: 130, y: 0.8, z: 0 },
    yaw: -Math.PI / 2,
    nominalFloorDepth: 2,
  },
  shelf: {
    id: 'shelf',
    name: 'Continental Shelf',
    shortName: 'SHELF',
    position: { x: 820, y: 0.5, z: 60 },
    yaw: -Math.PI / 2 - 0.12,
    nominalFloorDepth: 35,
  },
  openOcean: {
    id: 'openOcean',
    name: 'Open Ocean',
    shortName: 'PELAGIC',
    position: { x: 2780, y: 0.5, z: -120 },
    yaw: -Math.PI / 2 + 0.08,
    nominalFloorDepth: 250,
  },
  abyss: {
    id: 'abyss',
    name: 'The Abyss',
    shortName: 'MIDNIGHT',
    position: { x: 6420, y: 0.5, z: 80 },
    yaw: -Math.PI / 2 - 0.18,
    nominalFloorDepth: 1500,
  },
};

export const WEATHER_LABELS: Record<WeatherId, string> = {
  clear: 'CLEAR',
  overcast: 'OVERCAST',
  rain: 'RAIN',
  storm: 'STORM',
};

const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const interpolateDepth = (x: number, ax: number, ad: number, bx: number, bd: number): number => {
  const t = smoothstep(ax, bx, x);
  return ad + (bd - ad) * t;
};

export function bathymetryDepth(x: number, z = 0): number {
  // Above the tideline this value is terrain elevation, preserving the public
  // depth API. The signed floor function below is continuous through x = 0.
  if (x < 0) return Math.min(90, -x * 0.04);

  let depth: number;
  if (x < 160) depth = x * (2.2 / 160);
  else if (x < 850) depth = interpolateDepth(x, 160, 2.2, 850, 35);
  else if (x < 2800) depth = interpolateDepth(x, 850, 35, 2800, 250);
  else if (x < 6500) depth = interpolateDepth(x, 2800, 250, 6500, 1500);
  else depth = 1500 + Math.min(180, (x - 6500) * 0.025);

  const reliefScale = smoothstep(300, 1400, x);
  const relief = (Math.sin(x * 0.007 + z * 0.011) * 3.6 + Math.sin(z * 0.026) * 1.7) * reliefScale;
  return Math.max(0, depth + relief);
}

export function seafloorHeight(x: number, z = 0): number {
  const depth = bathymetryDepth(x, z);
  return x < 0 ? depth : -depth;
}

// The CPU buoyancy sampler and both GPU stages use one wave spectrum. Smaller
// capillary waves affect shading only; they cannot make the swimmer bob apart
// from the displaced mesh. Coordinates are radians/metre and radians/second.
const WAVE_SPECTRUM = [
  { x: 0.045, z: 0.018, speed: 1.1, phase: 0, weight: 0.42 },
  { x: -0.085, z: 0.052, speed: 1.55, phase: 1.8, weight: 0.26 },
  { x: 0.160, z: -0.095, speed: 2.1, phase: 3.7, weight: 0.16 },
  { x: 0.320, z: 0.210, speed: 2.85, phase: 2.1, weight: 0.10 },
  { x: -0.580, z: 0.440, speed: 3.7, phase: 5.2, weight: 0.06 },
] as const;

export function normalWaveAmplitude(x: number, z: number, waveHeight: number): number {
  if (waveHeight <= 0) return 0;
  const depth = -seafloorHeight(x, z);
  const shoaling = 1 + 0.22 * Math.exp(-Math.pow((depth - 4) / 5, 2));
  const runup = 0.16 * (1 - Math.exp(-waveHeight * 0.5));
  const depthLimit = Math.max(0, depth) * 0.38 + runup;
  return Math.min(waveHeight * 0.5 * shoaling, depthLimit) * smoothstep(-0.8, 0, depth);
}

export function sampleNormalWave(x: number, z: number, time: number, waveHeight: number): number {
  return sampleNormalWaveSurface(x, z, time, waveHeight).height;
}

/** Shared displaced surface and slopes, including the transition out of surf. */
export function sampleNormalWaveSurface(x: number, z: number, time: number, waveHeight: number): ShoreSurfaceSample {
  if (waveHeight <= 0) return { height: 0, dx: 0, dz: 0 };
  const shore = x < SHORE_BLEND_END ? sampleShoreSurface(x, z, time, waveHeight) : { height: 0, dx: 0, dz: 0 };
  if (x <= SHORE_BLEND_START) return shore;
  const amplitude = normalWaveAmplitude(x, z, waveHeight);
  let displacement = 0, dx = 0, dz = 0;
  for (const wave of WAVE_SPECTRUM) {
    const phase = x * wave.x + z * wave.z + time * wave.speed + wave.phase;
    const s = Math.sin(phase);
    // Second-order crest sharpening; the time average remains zero.
    displacement += wave.weight * (s + 0.14 * (2 * s * s - 1));
    const derivative = wave.weight * Math.cos(phase) * (1 + 0.56 * s);
    dx += derivative * wave.x;
    dz += derivative * wave.z;
  }
  // The smooth depth limiter varies in both axes over the continental shelf.
  const amplitudeDx = (normalWaveAmplitude(x + 0.05, z, waveHeight) - normalWaveAmplitude(x - 0.05, z, waveHeight)) / 0.1;
  const amplitudeDz = (normalWaveAmplitude(x, z + 0.05, waveHeight) - normalWaveAmplitude(x, z - 0.05, waveHeight)) / 0.1;
  const blend = smoothstep(SHORE_BLEND_START, SHORE_BLEND_END, x);
  const blendT = Math.max(0, Math.min(1, (x - SHORE_BLEND_START) / (SHORE_BLEND_END - SHORE_BLEND_START)));
  const blendDx = 6 * blendT * (1 - blendT) / (SHORE_BLEND_END - SHORE_BLEND_START);
  const height = amplitude * displacement;
  return {
    height: shore.height + (height - shore.height) * blend,
    dx: shore.dx * (1 - blend) + (amplitude * dx + amplitudeDx * displacement) * blend + (height - shore.height) * blendDx,
    dz: shore.dz * (1 - blend) + (amplitude * dz + amplitudeDz * displacement) * blend,
  };
}

/** Shared signed seabed function for water displacement and shoreline shading. */
export const oceanBathymetryGLSL = /* glsl */`
  float seafloorHeightGLSL(float x, float z) {
    if (x < 0.0) return min(90.0, -x * 0.04);
    float depth;
    if (x < 160.0) depth = x * (2.2 / 160.0);
    else if (x < 850.0) depth = mix(2.2, 35.0, smoothstep(160.0, 850.0, x));
    else if (x < 2800.0) depth = mix(35.0, 250.0, smoothstep(850.0, 2800.0, x));
    else if (x < 6500.0) depth = mix(250.0, 1500.0, smoothstep(2800.0, 6500.0, x));
    else depth = 1500.0 + min(180.0, (x - 6500.0) * 0.025);
    float relief = (sin(x * 0.007 + z * 0.011) * 3.6 + sin(z * 0.026) * 1.7)
      * smoothstep(300.0, 1400.0, x);
    return -max(0.0, depth + relief);
  }
`;

const glslFloat = (value: number): string => Number.isInteger(value) ? `${value}.0` : `${value}`;

/** Requires uWaveHeight/uTime and oceanBathymetryGLSL in the consuming shader. */
export const oceanWaveGLSL = /* glsl */`
  ${shoreGLSL}
  float normalWaveAmplitudeGLSL(vec2 p) {
    float depth = -seafloorHeightGLSL(p.x, p.y);
    float shoalDistance = (depth - 4.0) / 5.0;
    float shoaling = 1.0 + 0.22 * exp(-shoalDistance * shoalDistance);
    float runup = 0.16 * (1.0 - exp(-max(0.0, uWaveHeight) * 0.5));
    float depthLimit = max(0.0, depth) * 0.38 + runup;
    return min(max(0.0, uWaveHeight) * 0.5 * shoaling, depthLimit) * smoothstep(-0.8, 0.0, depth);
  }
  // x = unit height; yz = analytic gradient of the same crest-sharpened waves.
  vec3 waveSpectrumGLSL(vec2 p) {
    vec3 result = vec3(0.0);
    float phase;
    float s;
    float derivative;
    ${WAVE_SPECTRUM.map((wave) => `
    phase = dot(p, vec2(${glslFloat(wave.x)}, ${glslFloat(wave.z)})) + uTime * ${glslFloat(wave.speed)} + ${glslFloat(wave.phase)};
    s = sin(phase);
    derivative = cos(phase) * (1.0 + 0.56 * s) * ${glslFloat(wave.weight)};
    result += vec3(${glslFloat(wave.weight)} * (s + 0.14 * (2.0 * s * s - 1.0)), derivative * ${glslFloat(wave.x)}, derivative * ${glslFloat(wave.z)});
    `).join('')}
    return result;
  }
  vec3 normalWaveSurfaceGLSL(vec2 p) {
    if (uWaveHeight <= 0.0) return vec3(0.0);
    vec3 shore = p.x < ${glslFloat(SHORE_BLEND_END)} ? shoreSurfaceGLSL(p) : vec3(0.0);
    if (p.x <= ${glslFloat(SHORE_BLEND_START)}) return shore;
    vec3 spectrum = waveSpectrumGLSL(p);
    float amplitude = normalWaveAmplitudeGLSL(p);
    vec2 amplitudeGradient = vec2(
      normalWaveAmplitudeGLSL(p + vec2(0.05, 0.0)) - normalWaveAmplitudeGLSL(p - vec2(0.05, 0.0)),
      normalWaveAmplitudeGLSL(p + vec2(0.0, 0.05)) - normalWaveAmplitudeGLSL(p - vec2(0.0, 0.05))) / 0.1;
    vec3 offshore = vec3(amplitude * spectrum.x, amplitude * spectrum.yz + amplitudeGradient * spectrum.x);
    float blend = smoothstep(${glslFloat(SHORE_BLEND_START)}, ${glslFloat(SHORE_BLEND_END)}, p.x);
    float blendDx = shoreSmoothDerivative(${glslFloat(SHORE_BLEND_START)}, ${glslFloat(SHORE_BLEND_END)}, p.x);
    vec3 result = mix(shore, offshore, blend);
    result.y += (offshore.x - shore.x) * blendDx;
    return result;
  }
  float regularWave(vec2 p) {
    return normalWaveSurfaceGLSL(p).x;
  }
`;

export const MILLER_WAVE_SPEED = 50;
export const MILLER_START_DISTANCE = 2600;
export const MILLER_CREST_HEIGHT = 1050;
export const MILLER_MAX_DURATION = 180;
const MILLER_TIMED_RECOVERY_START = MILLER_MAX_DURATION - 20;
const MILLER_PROFILE = {
  leadingWidth: 420,
  trailingWidth: 820,
  widthTransition: 300,
  troughOffset: 800,
  troughWidth: 550,
  troughDepth: 90,
  ridgeWaves: [
    { amplitude: 24, z: 0.0075, time: -0.13 },
    { amplitude: 10, z: 0.017, time: 0.09 },
  ],
  heightWaves: [
    { amplitude: 0.03, z: 0.006, time: 0.055 },
    { amplitude: 0.012, z: 0.014, time: -0.085 },
  ],
} as const;

export interface MillerSurfaceSample {
  height: number;
  dx: number;
  dz: number;
}

/** Fade the same displaced surface on the CPU and GPU during recovery. */
export function millerWaveEnvelope(state: MillerWaveState): number {
  return state.active ? 1 - smoothstep(0, 1, state.recoveryProgress) : 0;
}

/**
 * A continuous asymmetric swell with slowly varying crest position and height.
 * Both spatial derivatives are analytic, including the varying profile width.
 */
export function sampleMillerSurface(x: number, z: number, state: MillerWaveState): MillerSurfaceSample {
  const envelope = millerWaveEnvelope(state);
  if (envelope === 0) return { height: 0, dx: 0, dz: 0 };
  let ridge = 0;
  let ridgeZ = 0;
  let amplitude = 1;
  let amplitudeZ = 0;
  for (const wave of MILLER_PROFILE.ridgeWaves) {
    const phase = z * wave.z + state.time * wave.time;
    ridge += wave.amplitude * Math.sin(phase);
    ridgeZ += wave.amplitude * wave.z * Math.cos(phase);
  }
  for (const wave of MILLER_PROFILE.heightWaves) {
    const phase = z * wave.z + state.time * wave.time;
    amplitude += wave.amplitude * Math.sin(phase);
    amplitudeZ += wave.amplitude * wave.z * Math.cos(phase);
  }
  const d = x - state.crestX - ridge;
  const midWidth = (MILLER_PROFILE.leadingWidth + MILLER_PROFILE.trailingWidth) * 0.5;
  const halfWidth = (MILLER_PROFILE.trailingWidth - MILLER_PROFILE.leadingWidth) * 0.5;
  const transitionSquared = MILLER_PROFILE.widthTransition ** 2;
  const radius = Math.sqrt(d * d + transitionSquared);
  const width = midWidth + halfWidth * d / radius;
  const widthDerivative = halfWidth * transitionSquared / (radius * radius * radius);
  const crestCoordinate = d / width;
  const crest = Math.exp(-0.5 * crestCoordinate * crestCoordinate);
  const crestDerivative = -crest * crestCoordinate * (1 / width - d * widthDerivative / (width * width));
  const troughDistance = d - MILLER_PROFILE.troughOffset;
  const troughWidthSquared = MILLER_PROFILE.troughWidth ** 2;
  const trough = Math.exp(-0.5 * troughDistance * troughDistance / troughWidthSquared);
  const profile = MILLER_CREST_HEIGHT * crest - MILLER_PROFILE.troughDepth * trough;
  const derivative = MILLER_CREST_HEIGHT * crestDerivative
    + MILLER_PROFILE.troughDepth * trough * troughDistance / troughWidthSquared;
  return {
    height: envelope * amplitude * profile,
    dx: envelope * amplitude * derivative,
    dz: envelope * (amplitudeZ * profile - amplitude * derivative * ridgeZ),
  };
}

/**
 * Requires uMillerX, uMillerTime (event time), and uMillerActive set to
 * millerWaveEnvelope(state). Return layout: height, dHeight/dX, dHeight/dZ.
 */
export const millerWaveGLSL = /* glsl */`
  // Crest offset, its Z derivative, amplitude, and its Z derivative.
  vec4 millerVariation(float z) {
    vec4 variation = vec4(0.0, 0.0, 1.0, 0.0);
    float phase;
    ${MILLER_PROFILE.ridgeWaves.map(wave => `
    phase = z * ${glslFloat(wave.z)} + uMillerTime * ${glslFloat(wave.time)};
    variation.x += ${glslFloat(wave.amplitude)} * sin(phase);
    variation.y += ${glslFloat(wave.amplitude * wave.z)} * cos(phase);
    `).join('')}
    ${MILLER_PROFILE.heightWaves.map(wave => `
    phase = z * ${glslFloat(wave.z)} + uMillerTime * ${glslFloat(wave.time)};
    variation.z += ${glslFloat(wave.amplitude)} * sin(phase);
    variation.w += ${glslFloat(wave.amplitude * wave.z)} * cos(phase);
    `).join('')}
    return variation;
  }
  float millerCrestHeight(float z) {
    return uMillerActive * ${glslFloat(MILLER_CREST_HEIGHT)} * millerVariation(z).z;
  }
  vec3 millerWave(vec2 p) {
    if (uMillerActive <= 0.0) return vec3(0.0);
    vec4 variation = millerVariation(p.y);
    float d = p.x - uMillerX - variation.x;
    float radius = sqrt(d * d + ${glslFloat(MILLER_PROFILE.widthTransition ** 2)});
    float width = ${glslFloat((MILLER_PROFILE.leadingWidth + MILLER_PROFILE.trailingWidth) * 0.5)}
      + ${glslFloat((MILLER_PROFILE.trailingWidth - MILLER_PROFILE.leadingWidth) * 0.5)} * d / radius;
    float widthDerivative = ${glslFloat((MILLER_PROFILE.trailingWidth - MILLER_PROFILE.leadingWidth) * 0.5 * MILLER_PROFILE.widthTransition ** 2)}
      / (radius * radius * radius);
    float crestCoordinate = d / width;
    float crest = exp(-0.5 * crestCoordinate * crestCoordinate);
    float crestDerivative = -crest * crestCoordinate * (1.0 / width - d * widthDerivative / (width * width));
    float troughDistance = d - ${glslFloat(MILLER_PROFILE.troughOffset)};
    float trough = exp(-0.5 * troughDistance * troughDistance / ${glslFloat(MILLER_PROFILE.troughWidth ** 2)});
    float profile = ${glslFloat(MILLER_CREST_HEIGHT)} * crest - ${glslFloat(MILLER_PROFILE.troughDepth)} * trough;
    float derivative = ${glslFloat(MILLER_CREST_HEIGHT)} * crestDerivative
      + ${glslFloat(MILLER_PROFILE.troughDepth)} * trough * troughDistance / ${glslFloat(MILLER_PROFILE.troughWidth ** 2)};
    return uMillerActive * vec3(variation.z * profile, variation.z * derivative,
      variation.w * profile - variation.z * derivative * variation.y);
  }
`;

export function createMillerWave(playerX: number, recoveryY: number): MillerWaveState {
  const originX = playerX + MILLER_START_DISTANCE;
  return {
    phase: 'approaching',
    active: true,
    time: 0,
    crestX: originX,
    originX,
    distanceToPlayer: MILLER_START_DISTANCE,
    impactStrength: 0,
    recoveryProgress: 0,
    recoveryY,
  };
}

export function createInactiveMillerWave(): MillerWaveState {
  return {
    phase: 'inactive',
    active: false,
    time: 0,
    crestX: -100000,
    originX: -100000,
    distanceToPlayer: Infinity,
    impactStrength: 0,
    recoveryProgress: 0,
    recoveryY: 0,
  };
}

export function updateMillerWave(state: MillerWaveState, dt: number, playerX: number): MillerWaveState {
  if (!state.active) return state;

  const time = state.time + Math.max(0, dt);
  const crestX = state.originX - time * MILLER_WAVE_SPEED;
  const distanceToPlayer = crestX - playerX;
  let phase: MillerPhase = 'approaching';
  const distanceRecovery = Math.max(0, Math.min(1, (-distanceToPlayer - 2100) / 900));
  const timedRecovery = Math.max(0, Math.min(1, (time - MILLER_TIMED_RECOVERY_START)
    / (MILLER_MAX_DURATION - MILLER_TIMED_RECOVERY_START)));
  // Once recovery starts it cannot reverse if a swimmer changes direction.
  const recoveryProgress = Math.max(state.recoveryProgress, distanceRecovery, timedRecovery);
  const active = recoveryProgress < 1 && time < MILLER_MAX_DURATION;
  if (!active) phase = 'inactive';
  else if (recoveryProgress > 0 || distanceToPlayer <= -2100 || time >= MILLER_TIMED_RECOVERY_START) {
    phase = 'recovering';
  } else if (distanceToPlayer <= -520) phase = 'receding';
  else if (distanceToPlayer <= 430) phase = 'impact';
  const impactStrength = Math.exp(-(distanceToPlayer * distanceToPlayer) / (2 * 250 * 250))
    * (active ? 1 - smoothstep(0, 1, recoveryProgress) : 0);

  return { ...state, active, phase, time, crestX, distanceToPlayer, impactStrength, recoveryProgress };
}

export function sampleMillerDisplacement(x: number, state: MillerWaveState, z = 0): number {
  return sampleMillerSurface(x, z, state).height;
}

export function nearestStage(x: number): StageId {
  const entries = Object.values(STAGES);
  let nearest = entries[0];
  for (const stage of entries.slice(1)) {
    if (Math.abs(stage.position.x - x) < Math.abs(nearest.position.x - x)) nearest = stage;
  }
  return nearest.id;
}

export function clampPlayerAboveFloor(x: number, y: number, z: number, clearance = 1.35): number {
  return Math.max(y, seafloorHeight(x, z) + clearance);
}
