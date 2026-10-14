import * as THREE from 'three';
import type { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import type { CityTimeOfDay } from './osCityWeather';

// Cyan remains the main city color. Sparse warmer and violet emitters give
// individual districts their own identity without coloring entire buildings.
export const CITY_DISTANT_NEON_PALETTE = [
  { name: 'ice cyan', color: '#60dff5', intensity: 2.70 },
  { name: 'electric blue', color: '#639eff', intensity: 2.45 },
  { name: 'orchid', color: '#e377c5', intensity: 2.35 },
  { name: 'violet', color: '#b89aff', intensity: 2.40 },
  { name: 'mint', color: '#70e1bf', intensity: 2.35 },
  { name: 'amber', color: '#ffc47a', intensity: 2.25 },
  { name: 'coral', color: '#f89088', intensity: 2.20 },
] as const;

const fraction = (seed: number) => {
  let value = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
};

export const CITY_FLICKER_PROFILES = {
  night: { periodMin: 4.5, periodSpread: 6, depthMin: .83, depthSpread: .13 },
  evening: { periodMin: 5, periodSpread: 7, depthMin: .80, depthSpread: .14 },
  morning: { periodMin: 6, periodSpread: 8, depthMin: .73, depthSpread: .17 },
  day: { periodMin: 15, periodSpread: 18, depthMin: .25, depthSpread: .17 },
} as const;

/** Independent short dropouts and recoveries. Day has both fewer events and
 * shallower dips; brighter times never turn this into a shared city-wide pulse.
 * Absolute time and seeded offsets preserve animation across weather changes. */
export function sampleCityDistantNeonPulse(seed: number, elapsed: number, reducedMotion = false, timeOfDay: CityTimeOfDay = 'night') {
  if (reducedMotion) return 1;
  const profile = CITY_FLICKER_PROFILES[timeOfDay];
  const period = profile.periodMin + fraction(seed + 37) * profile.periodSpread;
  const age = Math.max(0, elapsed) + fraction(seed + 113) * period;
  const cycle = Math.floor(age / period), phase = age % period;
  // Readable short outages survive normal-size viewing and tone mapping.
  // Independent phases prevent a city-wide flash, and the recovery stays smooth.
  const firstDuration = .64 + fraction(seed + 211) * .28;
  const secondStart = firstDuration + .18, secondDuration = .66 + fraction(seed + 317) * .28;
  const depth = profile.depthMin + fraction(seed + cycle * 271 + 419) * profile.depthSpread;
  const dip = (value: number) => value > 0 && value < 1 ? Math.sin(Math.PI * value) ** 2 : 0;
  return 1 - depth * dip(phase / firstDuration) - depth * .69 * dip((phase - secondStart) / secondDuration);
}

/** Shared steady palette plus a bounded number of independently animated
 * signs/strips. Each animated material belongs to one local architectural accent.
 * All geometry and maps remain static; only emission scalars change per frame. */
export function createCityDistantNeon(
  atmosphere: ReturnType<typeof createCityNeonAtmosphere>,
  label: string,
  maxAnimated: number,
) {
  const steady = new Map<number, THREE.MeshStandardMaterial>();
  const animated: { material: THREE.MeshStandardMaterial; seed: number; name: string; pulse: number }[] = [];
  let elapsed = 0, reducedMotion = false, timeOfDay:CityTimeOfDay = 'day';
  function material(index: number) {
    const key = ((index % CITY_DISTANT_NEON_PALETTE.length) + CITY_DISTANT_NEON_PALETTE.length) % CITY_DISTANT_NEON_PALETTE.length;
    const existing = steady.get(key);
    if (existing) return existing;
    const palette = CITY_DISTANT_NEON_PALETTE[key];
    const result = new THREE.MeshStandardMaterial({ color: palette.color, emissive: palette.color, emissiveIntensity: palette.intensity, roughness: .36, metalness: .12 });
    result.name = `${label} · ${palette.name} architectural neon`;
    atmosphere.register(result, 'neon', result.name);steady.set(key, result);
    return result;
  }
  function localized(index: number, seed: number, name: string, source?: THREE.MeshStandardMaterial) {
    const base = source ?? material(index);
    if (animated.length >= maxAnimated) return base;
    const result = base.clone();
    result.name = `${label} · ${name}`;
    const paletteSize = CITY_DISTANT_NEON_PALETTE.length;
    result.emissiveIntensity = (source?.emissiveIntensity ?? CITY_DISTANT_NEON_PALETTE[((index % paletteSize) + paletteSize) % paletteSize].intensity) * (.91 + fraction(seed + 67) * .20);
    atmosphere.register(result, 'neon', result.name);
    animated.push({ material: result, seed, name, pulse: 1 });
    return result;
  }
  function update(time: number, reduced: boolean, selectedTime:CityTimeOfDay = 'night') {
    elapsed = time;reducedMotion = reduced;timeOfDay = selectedTime;
    for (const entry of animated) {
      const pulse = sampleCityDistantNeonPulse(entry.seed, time, reduced, timeOfDay);
      if (pulse !== entry.pulse) { entry.pulse = pulse;atmosphere.setPulse(entry.material, pulse); }
    }
  }
  function snapshot() {
    return {
      palette: CITY_DISTANT_NEON_PALETTE.map(entry => ({ ...entry })),
      animatedEmitterCount: animated.length, maxAnimated, elapsed, reducedMotion, timeOfDay,
      cadence: { ...CITY_FLICKER_PROFILES[timeOfDay] },
      animation: 'Independent local flicker; active at night/evening/morning, rarer and gentler by day',
      staticGeometry: true, animatedTextures: false,
      emitters: animated.map(entry => ({ name: entry.name, seed: entry.seed, color: `#${entry.material.emissive.getHexString()}`, emission: entry.material.emissiveIntensity, pulse: entry.pulse })),
    };
  }
  return { material, localized, update, snapshot };
}
