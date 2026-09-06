// Adapted from the user-owned MizuTopia project (NatureSimTopy/MizuTopia/src).
// Keep the shared surf model and Cygnus animation in sync when updating the source.
/** One incoming surf train drives water displacement, breaking foam and wet sand. */
export const SHORE_SURF_PERIOD = 8.4;
export const SHORE_MAX_RUNUP = 8;
export const SHORE_BLEND_START = 90;
export const SHORE_BLEND_END = 200;

const OMEGA = Math.PI * 2 / SHORE_SURF_PERIOD;
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const smoothDerivative = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return 6 * t * (1 - t) / (b - a);
};

export interface ShoreSurfaceSample { height: number; dx: number; dz: number; }
export interface ShoreFoamSample { breaker: number; swashFront: number; residualFoam: number; phase: number; }

export function shorePhase(x: number, z: number, time: number): number {
  // Wavelength shortens in shallow water. Positive time carries crests toward -X.
  return 0.14 * x + 2.4 * Math.atan(x / 32) + OMEGA * time + 0.008 * z
    + 0.19 * Math.sin(z * 0.025) + 0.16 * Math.sin(z * 0.32) + 0.055 * Math.sin(z * 0.91);
}

export function sampleShoreSurface(x: number, z: number, time: number, waveHeight: number): ShoreSurfaceSample {
  if (waveHeight <= 0 || x <= -12) return { height: 0, dx: 0, dz: 0 };
  const landFade = smooth(-12, -8, x);
  const landFadeDx = smoothDerivative(-12, -8, x);
  const runup = 0.245 * (1 - Math.exp(-waveHeight * 0.7));
  const growth = smooth(0, 6, x);
  const capacity = runup + Math.max(0, x) * 0.006 * growth;
  const capacityDx = x > 0 ? 0.006 * (growth + x * smoothDerivative(0, 6, x)) : 0;
  const requested = waveHeight * 0.60;
  const limit = Math.sqrt(capacity * capacity + requested * requested);
  const amplitude = capacity * requested / limit;
  const amplitudeDx = requested ** 3 * capacityDx / limit ** 3;
  const groupPhase = z * 0.018 + time * OMEGA * 0.25 + 0.8;
  const group = 0.88 + 0.12 * Math.sin(groupPhase);
  const groupDz = 0.00216 * Math.cos(groupPhase);
  const phase = shorePhase(x, z, time);
  const wave = Math.cos(phase) + 0.18 * Math.cos(2 * phase) + 0.10 * Math.sin(2 * phase);
  const waveDerivative = -Math.sin(phase) - 0.36 * Math.sin(2 * phase) + 0.20 * Math.cos(2 * phase);
  const phaseDx = 0.14 + 0.075 / (1 + (x / 32) ** 2);
  const phaseDz = 0.008 + 0.00475 * Math.cos(z * 0.025)
    + 0.0512 * Math.cos(z * 0.32) + 0.05005 * Math.cos(z * 0.91);
  let height = amplitude * group * wave * landFade;
  let dx = group * ((amplitudeDx * landFade + amplitude * landFadeDx) * wave + amplitude * landFade * waveDerivative * phaseDx);
  let dz = amplitude * landFade * (groupDz * wave + group * waveDerivative * phaseDz);
  // A breaking wave cannot excavate a deep trough through the shallow shelf.
  // This C1 depth limit retains a connected water column instead of leaving
  // isolated shoreward crests whose clipped mesh becomes a detached triangle.
  if (x > 4 && height < 0) {
    const depthLimit = x * (2.2 / 160) * 0.72;
    const radius = Math.sqrt(height * height + depthLimit * depthLimit);
    const heightGain = (depthLimit / radius) ** 3;
    const depthGain = (height / radius) ** 3;
    dx = heightGain * dx + depthGain * (2.2 / 160) * 0.72;
    dz *= heightGain;
    height *= depthLimit / radius;
  }
  // The final shallow wash is a connected sheet of water. It arrives after the
  // breaking front and drains more slowly than it advances (about 5s / 3.4s).
  // Only its physical intersection with the sloping sand controls the wet edge.
  const arrivalPhase = shorePhase(0, z, time) - 1.45;
  const swashPhase = arrivalPhase + 0.30 * Math.cos(arrivalPhase);
  const wash = 0.5 + 0.5 * Math.cos(swashPhase);
  const washDerivative = -0.5 * Math.sin(swashPhase) * (1 - 0.30 * Math.sin(arrivalPhase));
  const sheetProfile = 1.18 * wash - 0.06;
  const sheetHeight = runup * group * sheetProfile * landFade;
  const sheetDx = runup * group * sheetProfile * landFadeDx;
  const sheetDz = runup * (groupDz * sheetProfile + group * 1.18 * washDerivative * phaseDz) * landFade;
  const blend = smooth(4, 24, x);
  const blendDx = smoothDerivative(4, 24, x);
  return {
    height: sheetHeight + (height - sheetHeight) * blend,
    dx: sheetDx * (1 - blend) + dx * blend + (height - sheetHeight) * blendDx,
    dz: sheetDz * (1 - blend) + dz * blend,
  };
}

// This local slope is identical to the continuous bathymetry inside the surf band.
const shoreFloor = (x: number): number => x < 0 ? -x * 0.04 : -x * (2.2 / 160);

export function sampleShoreFoam(x: number, z: number, time: number, waveHeight: number): ShoreFoamSample {
  const phase = shorePhase(x, z, time);
  if (waveHeight <= 0 || x <= -12 || x >= 120) return { breaker: 0, swashFront: 0, residualFoam: 0, phase };
  const surfaceDepth = sampleShoreSurface(x, z, time, waveHeight).height - shoreFloor(x);
  const activity = smooth(0, 0.8, waveHeight);
  const water = smooth(0.008, 0.035, surfaceDepth);
  const breakerBand = smooth(3, 12, x) * (1 - smooth(65, 105, x));
  const crest = smooth(0.35, 0.94, Math.cos(phase));
  const front = 0.50 + 0.50 * smooth(-0.15, 0.65, -Math.sin(phase));
  const swashDistance = (surfaceDepth - 0.045) / 0.075;
  const wake = smooth(0.02, 0.70, Math.sin(phase)) * smooth(-0.65, 0.8, Math.cos(phase));
  return {
    breaker: breakerBand * crest * front * water * activity,
    swashFront: Math.exp(-swashDistance * swashDistance) * (1 - smooth(6, 18, x)) * water * activity,
    residualFoam: wake * smooth(-8, 0, x) * (1 - smooth(60, 120, x)) * water * activity * 0.55,
    phase,
  };
}

/** A fading water film follows recent wash, rather than an unrelated wet-line sine. */
export function sampleShoreWetness(x: number, z: number, time: number, waveHeight: number): number {
  const floor = shoreFloor(x);
  if (waveHeight <= 0) return 1 - smooth(-0.015, 0.035, floor);
  if (x >= 18) return 1;
  if (x <= -12) return 0;
  const wetAt = (lag: number): number => smooth(-0.018, 0.04,
    sampleShoreSurface(x, z, time - lag, waveHeight).height - floor);
  return Math.max(wetAt(0), wetAt(0.55) * 0.86, wetAt(1.5) * 0.64, wetAt(3.2) * 0.34);
}

/** Requires uTime/uWaveHeight. No external shader helpers or texture state. */
export const shoreGLSL = /* glsl */`
  float shoreSmoothDerivative(float a, float b, float x) {
    float t = clamp((x - a) / (b - a), 0.0, 1.0);
    return 6.0 * t * (1.0 - t) / (b - a);
  }
  float shorePhaseGLSL(vec2 p, float time) {
    return p.x * 0.14 + 2.4 * atan(p.x / 32.0) + time * ${OMEGA}
      + p.y * 0.008 + 0.19 * sin(p.y * 0.025)
      + 0.16 * sin(p.y * 0.32) + 0.055 * sin(p.y * 0.91);
  }
  vec3 shoreSurfaceAtTimeGLSL(vec2 p, float time) {
    if (uWaveHeight <= 0.0 || p.x <= -12.0) return vec3(0.0);
    float landFade = smoothstep(-12.0, -8.0, p.x);
    float landFadeDx = shoreSmoothDerivative(-12.0, -8.0, p.x);
    float runup = 0.245 * (1.0 - exp(-uWaveHeight * 0.7));
    float growth = smoothstep(0.0, 6.0, p.x);
    float capacity = runup + max(0.0, p.x) * 0.006 * growth;
    float capacityDx = p.x > 0.0 ? 0.006 * (growth + p.x * shoreSmoothDerivative(0.0, 6.0, p.x)) : 0.0;
    float requested = uWaveHeight * 0.60;
    float limit = sqrt(capacity * capacity + requested * requested);
    float amplitude = capacity * requested / limit;
    float amplitudeDx = requested * requested * requested * capacityDx / (limit * limit * limit);
    float groupPhase = p.y * 0.018 + time * ${OMEGA * 0.25} + 0.8;
    float group = 0.88 + 0.12 * sin(groupPhase);
    float groupDz = 0.00216 * cos(groupPhase);
    float phase = shorePhaseGLSL(p, time);
    float wave = cos(phase) + 0.18 * cos(2.0 * phase) + 0.10 * sin(2.0 * phase);
    float derivative = -sin(phase) - 0.36 * sin(2.0 * phase) + 0.20 * cos(2.0 * phase);
    float phaseDx = 0.14 + 0.075 / (1.0 + (p.x / 32.0) * (p.x / 32.0));
    float phaseDz = 0.008 + 0.00475 * cos(p.y * 0.025)
      + 0.0512 * cos(p.y * 0.32) + 0.05005 * cos(p.y * 0.91);
    vec3 ocean = vec3(amplitude * group * wave * landFade,
      group * ((amplitudeDx * landFade + amplitude * landFadeDx) * wave + amplitude * landFade * derivative * phaseDx),
      amplitude * landFade * (groupDz * wave + group * derivative * phaseDz));
    if (p.x > 4.0 && ocean.x < 0.0) {
      float depthLimit = p.x * (2.2 / 160.0) * 0.72;
      float radius = sqrt(ocean.x * ocean.x + depthLimit * depthLimit);
      float heightRatio = depthLimit / radius, depthRatio = ocean.x / radius;
      float heightGain = heightRatio * heightRatio * heightRatio;
      float depthGain = depthRatio * depthRatio * depthRatio;
      ocean.y = heightGain * ocean.y + depthGain * (2.2 / 160.0) * 0.72;
      ocean.z *= heightGain;
      ocean.x *= heightRatio;
    }
    float arrivalPhase = shorePhaseGLSL(vec2(0.0, p.y), time) - 1.45;
    float swashPhase = arrivalPhase + 0.30 * cos(arrivalPhase);
    float wash = 0.5 + 0.5 * cos(swashPhase);
    float washDerivative = -0.5 * sin(swashPhase) * (1.0 - 0.30 * sin(arrivalPhase));
    float sheetProfile = 1.18 * wash - 0.06;
    vec3 sheet = vec3(runup * group * sheetProfile * landFade,
      runup * group * sheetProfile * landFadeDx,
      runup * (groupDz * sheetProfile + group * 1.18 * washDerivative * phaseDz) * landFade);
    float blend = smoothstep(4.0, 24.0, p.x);
    vec3 result = mix(sheet, ocean, blend);
    result.y += (ocean.x - sheet.x) * shoreSmoothDerivative(4.0, 24.0, p.x);
    return result;
  }
  vec3 shoreSurfaceGLSL(vec2 p) { return shoreSurfaceAtTimeGLSL(p, uTime); }
  float shoreFloorGLSL(float x) { return x < 0.0 ? -x * 0.04 : -x * (2.2 / 160.0); }
  // x = breaking crest; y = advancing foam edge; z = trailing foam; w = phase.
  vec4 shoreFoamState(vec2 p) {
    float phase = shorePhaseGLSL(p, uTime);
    if (uWaveHeight <= 0.0 || p.x <= -12.0 || p.x >= 120.0) return vec4(0.0, 0.0, 0.0, phase);
    float depth = shoreSurfaceGLSL(p).x - shoreFloorGLSL(p.x);
    float activity = smoothstep(0.0, 0.8, uWaveHeight);
    float water = smoothstep(0.008, 0.035, depth);
    float breakerBand = smoothstep(3.0, 12.0, p.x) * (1.0 - smoothstep(65.0, 105.0, p.x));
    float crest = smoothstep(0.35, 0.94, cos(phase));
    float front = 0.50 + 0.50 * smoothstep(-0.15, 0.65, -sin(phase));
    float swashDistance = (depth - 0.045) / 0.075;
    float wake = smoothstep(0.02, 0.70, sin(phase)) * smoothstep(-0.65, 0.8, cos(phase));
    return vec4(vec3(breakerBand * crest * front,
      exp(-swashDistance * swashDistance) * (1.0 - smoothstep(6.0, 18.0, p.x)),
      wake * smoothstep(-8.0, 0.0, p.x) * (1.0 - smoothstep(60.0, 120.0, p.x)) * 0.55) * water * activity, phase);
  }
  float shoreWetnessAtTimeGLSL(vec2 p, float lag) {
    return smoothstep(-0.018, 0.04, shoreSurfaceAtTimeGLSL(p, uTime - lag).x - shoreFloorGLSL(p.x));
  }
  float shoreWetnessGLSL(vec2 p) {
    if (uWaveHeight <= 0.0) return 1.0 - smoothstep(-0.015, 0.035, shoreFloorGLSL(p.x));
    if (p.x >= 18.0) return 1.0;
    if (p.x <= -12.0) return 0.0;
    return max(max(shoreWetnessAtTimeGLSL(p, 0.0), shoreWetnessAtTimeGLSL(p, 0.55) * 0.86),
      max(shoreWetnessAtTimeGLSL(p, 1.5) * 0.64, shoreWetnessAtTimeGLSL(p, 3.2) * 0.34));
  }
`;
